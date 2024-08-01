import express from 'express';
import { check, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { encrypt } from '../Helper/myCrypto.js';
import { emitToUser } from '../Sockets/index.js';
import {
    getUserDevices,
    getDeviceLogs,
    getLastDeviceLog,
    getFactoryDevice,
    addUserDevice,
    updateDeviceWifi,
    updateDeviceAuto,
    getThingFactoryDevice,
    getDevice,
} from '../MySQL/database.js';

const dashboardRouter = express.Router();

const validateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(422).json({ message: 'Please provide the token' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET_KEY, (err, authorizedData) => {
        if (err) {
            return res.status(422).json({ message: 'Please provide a valid token' });
        }
        req.user = authorizedData;
        next();
    });
};

const validateRequest = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ message: errors.array() });
        }
        next();
    };
};

const deviceLogsValidation = [
    check('cat_num', 'Catalog number is required').not().isEmpty()
];

const addDeviceValidation = [
    check('cat_num', 'Catalog number is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('wifi_ssid', 'Wifi_ssid is required').not().isEmpty(),
    check('wifi_password', 'Wifi_password is required').not().isEmpty(),
];

const updateWifiValidation = [
    check('device_id', 'Device_id number is required').not().isEmpty(),
    check('wifi_ssid', 'Wifi_ssid is required').not().isEmpty(),
    check('wifi_password', 'Wifi_password is required').not().isEmpty(),
];

const updateAutoValidation = [
    check('device_id', 'Device_id number is required').not().isEmpty(),
    check('automate', 'Automate is required').not().isEmpty(),
];

const shadowUpdateValidation = [
    check('thingName', 'ThingName is required').not().isEmpty(),
    check('shadowConnection', 'ShadowConnection is required').not().isEmpty(),
    check('x-api-key')
        .custom((value, { req }) => {
            if (value !== process.env.API_KEY) {
                throw new Error('Invalid API key');
            }
            return true;
        })
        .withMessage('Forbidden')
];

dashboardRouter.get('/userDevices', validateToken, async (req, res) => {
    try {
        const devices = await getUserDevices(req.user.user_id);
        return res.send({ error: false, devices: devices || [], message: 'Fetch Successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching user devices' });
    }
});

dashboardRouter.get('/deviceLogs', validateToken, validateRequest(deviceLogsValidation), async (req, res) => {
    const cat_num = req.query.cat_num;

    try {
        const deviceLogs = await getDeviceLogs(cat_num);
        const lastLog = await getLastDeviceLog(cat_num);
        return res.send({
            error: false,
            deviceLogs: deviceLogs || [],
            lastLog: lastLog,
            cat_num: cat_num,
            message: 'Fetch Successfully.',
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching device logs' });
    }
});

dashboardRouter.post('/addDevice', validateToken, validateRequest(addDeviceValidation), async (req, res) => {
    const { location, cat_num, wifi_ssid, wifi_password } = req.body;

    try {
        const factoryDevices = await getFactoryDevice(cat_num);
        if (!factoryDevices) {
            return res.status(422).json({ message: 'PlantPal Asset Number does not exist.' });
        }

        const hashWifi = encrypt(wifi_password);
        const newDevice = await addUserDevice(cat_num, req.user.user_id, wifi_ssid, hashWifi.content, hashWifi.iv, false, false, location);
        if (!newDevice) {
            return res.status(400).json({ message: 'Error creating new device' });
        }

        return res.status(201).json({ message: 'The device has been registered with us!', newDevice: newDevice });
    } catch (error) {
        return res.status(500).json({ message: 'Error adding device' });
    }
});

dashboardRouter.post('/updateWifi', validateToken, validateRequest(updateWifiValidation), async (req, res) => {
    const { device_id, wifi_ssid, wifi_password } = req.body;

    try {
        const hashWifi = encrypt(wifi_password);
        const updatedDevice = await updateDeviceWifi(device_id, wifi_ssid, hashWifi.content, hashWifi.iv);
        if (!updatedDevice || updatedDevice.wifi_password !== hashWifi.content) {
            return res.status(400).json({ message: 'Error updating device network' });
        }

        return res.status(201).json({ message: 'The device network has been updated!' });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating device network' });
    }
});

dashboardRouter.post('/updateAuto', validateToken, validateRequest(updateAutoValidation), async (req, res) => {
    const { device_id, automate } = req.body;

    try {
        const updatedDevice = await updateDeviceAuto(device_id, automate);
        if (!updatedDevice) {
            return res.status(400).json({ message: 'Error updating device auto' });
        }

        return res.status(201).json({ message: 'The device auto has been updated!' });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating device auto' });
    }
});

dashboardRouter.post('/shadowUpdate', validateRequest(shadowUpdateValidation), async (req, res) => {
    const { thingName, shadowConnection } = req.body;

    try {
        const factoryDevice = await getThingFactoryDevice(thingName);
        if (!factoryDevice) {
            return res.status(500).json({ message: 'Error finding device thing' });
        }

        const userDevice = await getDevice(factoryDevice.cat_num);
        if (!userDevice) {
            return res.status(500).json({ message: 'Error finding user device' });
        }
        
        emitToUser(userDevice.user_id, 'shadowUpdate', { device: userDevice, factoryDevice: factoryDevice, thing_name: thingName, shadow_connection: shadowConnection });
        return res.status(201).json({ message: 'Shadow update received' });
    } catch (error) {
        return res.status(500).json({ message: 'No socket connection', error: error.message });
    }
});

export { dashboardRouter };
