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
    getDeviceThing,
    getUserDevice,
    updatePresenceConnection,
} from '../MySQL/database.js';
import AWS from 'aws-sdk';

const dashboardRouter = express.Router();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const iotData = new AWS.IotData({ endpoint: process.env.AWS_IOT_ENDPOINT });

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

const presenceUpdateConnectionValidation = [
    check('thingName', 'ThingName is required').not().isEmpty(),
    check('presenceConnection', 'presenceConnection is required').not().isEmpty(),
    check('x-api-key')
        .custom((value, { req }) => {
            if (value !== process.env.API_KEY) {
                throw new Error('Invalid API key');
            }
            return true;
        })
        .withMessage('Forbidden')
];

const shadowUpdateAutoValidation = [
    check('thingName', 'ThingName is required').not().isEmpty(),
    check('shadowAuto', 'shadowAuto is required').not().isEmpty(),
    check('x-api-key')
        .custom((value, { req }) => {
            if (value !== process.env.API_KEY) {
                throw new Error('Invalid API key');
            }
            return true;
        })
        .withMessage('Forbidden')
];

const updatePumpWaterValidation = [
    check('device_id', 'Device_id number is required').not().isEmpty(),
    check('pump_water', 'Pump_water is required').not().isEmpty(),
];

const shadowUpdatePumpWaterValidation = [
    check('thingName', 'ThingName is required').not().isEmpty(),
    check('shadowPump', 'shadowPump is required').not().isEmpty(),
    check('x-api-key')
        .custom((value, { req }) => {
            if (value !== process.env.API_KEY) {
                throw new Error('Invalid API key');
            }
            return true;
        })
        .withMessage('Forbidden')
];

const deviceShadowValidation = [
    check('thingName', 'Thing name is required').not().isEmpty(),
];

const handleErrors = (res, err, msg) => res.status(500).json({ message: msg, error: err.message });

const updateDeviceShadow = async (thingName,desiredState) => {
    const params = {
        thingName: thingName,
        payload: JSON.stringify({
            state: {
            desired: desiredState
            }
        })
    };

    try {
        const response = await iotData.updateThingShadow(params).promise();
        const data = JSON.parse(response.payload); 
        return data.payload;
      } catch (error) {
        throw error;
      }
};

const getDeviceShadow = async (thingName) => {
    const params = {
        thingName: thingName
    };

    try {
        const data = await iotData.getThingShadow(params).promise();
        return data.payload;
    } catch(error){
        throw error;
    }
}

dashboardRouter.get('/userDevices', validateToken, async (req, res) => {
    try {
        const devices = await getUserDevices(req.user.user_id);
        return res.send({ error: false, devices: devices || [], message: 'Fetch Successfully.' });
    } catch (error) {
        handleErrors(res, error, 'Error fetching user devices');
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
        handleErrors(res, error, 'Error fetching device logs');
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
        const newDevice = await addUserDevice(cat_num, req.user.user_id, wifi_ssid, hashWifi.content, hashWifi.iv, false, location, factoryDevices.thing_name);
        if (!newDevice) {
            return res.status(400).json({ message: 'Error creating new device' });
        }

        return res.status(201).json({ message: 'The device has been registered with us!', newDevice: newDevice });
    } catch (error) {
        handleErrors(res, error, 'Error adding device');
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
        handleErrors(res, error, 'Error updating device network');
    }
});

dashboardRouter.post('/updateAuto', validateToken, validateRequest(updateAutoValidation), async (req, res) => {
    const { device_id, automate } = req.body;

    const desiredState = {
        auto: automate,
    };

    try {
        
        const device = await getUserDevice(device_id);

        if (!device) {
            return res.status(400).json({ message: 'Error getting device info' });
        }

        await updateDeviceShadow(device.thing_name,desiredState);

        return res.status(201).json({ message: 'The device auto has been updated!' });

    } catch (error) {
        handleErrors(res, error, 'Error updating device auto');
    }
});

dashboardRouter.post('/shadowUpdateAuto', validateRequest(shadowUpdateAutoValidation), async (req, res) => {
    const { thingName, shadowAuto } = req.body;

    try {

        const userDevice = await getDeviceThing(thingName);

        if (!userDevice) {
            return res.status(500).json({ message: 'Error finding user device' });
        }
        
        emitToUser(userDevice.user_id, 'shadowUpdateAuto', { device: userDevice, thing_name: thingName, shadow_auto: shadowAuto });
        return res.status(201).json({ message: 'Shadow auto update received' });
    } catch (error) {
        handleErrors(res, error, 'No socket connection to send auto shadow to');
    }
});

dashboardRouter.post('/presenceUpdateConnection', validateRequest(presenceUpdateConnectionValidation), async (req, res) => {
    const { thingName, presenceConnection } = req.body;

    try {

        const userDevice = await getDeviceThing(thingName);

        if (!userDevice) {
            return res.status(500).json({ message: 'Error finding user device' });
        }

        const updatedDevice = await updatePresenceConnection(userDevice.device_id,presenceConnection);

        if (!updatedDevice || Boolean(updatedDevice.presence_connection) !== presenceConnection) {
            return res.status(400).json({ message: 'Error updating device presence connection' });
        }
        
        emitToUser(userDevice.user_id, 'presenceUpdateConnection', { device: updatedDevice, thing_name: thingName, presence_connection: presenceConnection });
        return res.status(201).json({ message: 'Shadow connection update received' });
    } catch (error) {
        handleErrors(res, error, 'No socket connection to send connection shadow to');
    }
});

dashboardRouter.post('/updatePumpWater', validateRequest(updatePumpWaterValidation), async (req, res) => {
    
    const { device_id, pump_water } = req.body;

    const desiredState = {
        pump: pump_water,
    };

    try {
        const device = await getUserDevice(device_id);

        if (!device) {
            return res.status(400).json({ message: 'Error getting device info' });
        }

        await updateDeviceShadow(device.thing_name,desiredState);

        return res.status(201).json({ message: 'The device auto has been updated!' });

    } catch (error) {
        handleErrors(res, error, 'Error updating device auto');
    }
});


dashboardRouter.post('/shadowUpdatePumpWater', validateRequest(shadowUpdatePumpWaterValidation), async (req, res) => {
    const { thingName, shadowPump } = req.body;

    try {

        const userDevice = await getDeviceThing(thingName);

        if (!userDevice) {
            return res.status(500).json({ message: 'Error finding user device' });
        }
        
        emitToUser(userDevice.user_id, 'shadowUpdatePumpWater', { device: userDevice, thing_name: thingName, shadow_pump: shadowPump });
        return res.status(201).json({ message: 'Shadow pump water update received' });
    } catch (error) {
        handleErrors(res, error, 'No socket connection to send pump water shadow update to');
    }
});

dashboardRouter.get('/deviceShadow', validateToken, validateRequest(deviceShadowValidation), async (req, res) => {
    const thingName = req.query.thingName;

    try {
        const deviceShadow = await getDeviceShadow(thingName);

        return res.send({ error: false, deviceShadow: deviceShadow, message: 'Fetched Shadow Successfully.' });
    } catch (error) {
        handleErrors(res, error, 'Error fetching device shadow');
    }
});

export { dashboardRouter };
