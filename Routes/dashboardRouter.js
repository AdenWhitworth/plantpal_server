import express from 'express';
const dashboardRouter = express.Router();
import { check } from 'express-validator';
import { encrypt } from '../Helper/myCrypto.js';
import jwt from 'jsonwebtoken';
import { emitToUser } from '../Sockets/index.js';

import { getUserDevices, getDeviceLogs, getLastDeviceLog, getFactoryDevice, addUserDevice, updateDeviceWifi, updateDeviceAuto, getThingDevice } from '../MySQL/database.js';

const deviceValidation = [
    check('cat_num', 'Catalog number is requied').not().isEmpty()
];

dashboardRouter.get('/userDevices', async (req, res, next) => {

    if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') ||!req.headers.authorization.split(' ')[1]){
        return res.status(422).json({
            message: "Please provide the token",
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];

    jwt.verify(theToken, process.env.SECRET_KEY, async (err, authorizedData) =>{
        if (err){
            return res.status(422).json({
                message: "Please provide the token",
            });
        }

        const devices = await getUserDevices(authorizedData.user_id);

        if (devices == null){
            return res.send({ error: false, devices: [], message: 'Fetch Successfully.' });
        }

        return res.send({ error: false, devices: devices, message: 'Fetch Successfully.' });
        
    });

});

dashboardRouter.get('/deviceLogs', deviceValidation, async (req, res, next) => {
    
    const cat_num = req.query.cat_num;

    if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') ||!req.headers.authorization.split(' ')[1]){
        return res.status(422).json({
            message: "Please provide the token",
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];

    jwt.verify(theToken, process.env.SECRET_KEY, async (err, authorizedData) =>{
        if (err){
            return res.status(422).json({
                message: "Please provide the token",
            });
        }

        const deviceLogs = await getDeviceLogs(cat_num);

        const lastLog = await getLastDeviceLog(cat_num);

        if (deviceLogs == null){
            return res.send({ error: false, deviceLogs: [], lastLog: lastLog, cat_num: cat_num, message: 'Fetch Successfully.' });
        }

        return res.send({ error: false, deviceLogs: deviceLogs, lastLog: lastLog, cat_num: cat_num, message: 'Fetch Successfully.' });
        
    });

});

dashboardRouter.post('/addDevice', async (req, res, next) => {
    
    const location = req.body.location;
    const cat_num = req.body.cat_num;
    const wifi_ssid = req.body.wifi_ssid;
    const wifi_password = req.body.wifi_password;

    if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') ||!req.headers.authorization.split(' ')[1]){
        return res.status(422).json({
            message: "Please provide the token",
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];

    jwt.verify(theToken, process.env.SECRET_KEY, async (err, authorizedData) =>{
        if (err){
            return res.status(422).json({
                message: "Please provide the token",
            });
        }

        const user_id = authorizedData.user_id

        const factoryDevices = await getFactoryDevice(cat_num);

        if (factoryDevices == null){
            return res.status(422).json({
                message: "PlantPal Asset Number does not exist.",
            });
        }

        const hashWifi = encrypt(wifi_password);

        const newDevice = await addUserDevice(cat_num, user_id, wifi_ssid, hashWifi.content, hashWifi.iv, false, false, location);

        if (newDevice == null){
            return res.status(400).send({
                msg: 'Error creating new device'
            });
        } else {
            return res.status(201).send({
                msg: 'The device has been registerd with us!',
                newDevice: newDevice
            });
        }
        
    });

});

dashboardRouter.post('/updateWifi', async (req, res, next) => {
    
    const device_id = req.body.device_id;
    const wifi_ssid = req.body.wifi_ssid;
    const wifi_password = req.body.wifi_password;

    if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') ||!req.headers.authorization.split(' ')[1]){
        return res.status(422).json({
            message: "Please provide the token",
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];

    jwt.verify(theToken, process.env.SECRET_KEY, async (err, authorizedData) =>{
        if (err){
            return res.status(422).json({
                message: "Please provide the token",
            });
        }

        const hashWifi = encrypt(wifi_password);
        
        const updatedDevice = await updateDeviceWifi(device_id, wifi_ssid, hashWifi.content, hashWifi.iv);

        if (updatedDevice == null){
            return res.status(400).send({
                msg: 'Error updating device network'
            });
        } else if (updatedDevice.wifi_password != hashWifi.content) {
            return res.status(400).send({
                msg: 'Error updating device network'
            });
        } else {
            return res.status(201).send({
                msg: 'The device network has been updated!'
            });
        }
    });

});

dashboardRouter.post('/updateAuto', async (req, res, next) => {
    
    const device_id = req.body.device_id;
    const automate = req.body.automate;

    if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') ||!req.headers.authorization.split(' ')[1]){
        return res.status(422).json({
            message: "Please provide the token",
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];

    jwt.verify(theToken, process.env.SECRET_KEY, async (err, authorizedData) =>{
        if (err){
            return res.status(422).json({
                message: "Please provide the token",
            });
        }

        
        const updatedDevice = await updateDeviceAuto(device_id, automate);

        if (updatedDevice == null){
            return res.status(400).send({
                msg: 'Error updating device auto'
            });
        } else {
            return res.status(201).send({
                msg: 'The device auto has been updated!'
            });
        }
    });

});

dashboardRouter.post('/shadowUpdate', async (req, res, next) => {
    
    const apiKey = req.headers['x-api-key'];
    const thing_name = req.body.thingName;
    const shadow_connection = req.body.shadowConnection;
    
    if (apiKey !== process.env.API_KEY) {
        return res.status(403).send({ message: 'Forbidden' });
    }

    const device = await getThingDevice(thing_name);

    if (device == null){
        return res.status(500).send({
            msg: 'Error find device thing'
        });
    } 
    
    try {
        
        emitToUser(userId,'shadowUpdate',{
            device: device,
            thing_name: thing_name,
            shadow_connection: shadow_connection
        })
            
        return res.status(201).send({
            msg: 'shadow update recieved'
        });
    } catch (error) {
        res.status(500).send({ message: 'No socket connection' });
    }
    
});

export {dashboardRouter};