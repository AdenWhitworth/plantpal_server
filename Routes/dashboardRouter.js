import express from 'express';
const dashboardRouter = express.Router();
import { check } from 'express-validator';
import { encrypt } from '../Helper/myCrypto.js';
import jwt from 'jsonwebtoken';

import { getUserDevices, getDeviceLogs, getLastDeviceLog } from '../database.js';

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

    jwt.verify(theToken, 'the-super-strong-secrect', async (err, authorizedData) =>{
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

    jwt.verify(theToken, 'the-super-strong-secrect', async (err, authorizedData) =>{
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

    console.log(location, cat_num, wifi_ssid, wifi_password);

    if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') ||!req.headers.authorization.split(' ')[1]){
        return res.status(422).json({
            message: "Please provide the token",
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];

    jwt.verify(theToken, 'the-super-strong-secrect', async (err, authorizedData) =>{
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
                msg: 'The device has been registerd with us!'
            });
        }
        
    });

});

export {dashboardRouter};