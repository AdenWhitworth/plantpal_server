import express, { Request, Response, NextFunction } from 'express';
import { check, ValidationChain } from 'express-validator';
import { encrypt } from '../Helper/myCrypto';
import { emitToUser } from '../sockets/index';
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
} from '../MySQL/database';
import AWS from 'aws-sdk';
import { errorHandler, CustomError } from '../Helper/errorManager';
import { successHandler } from '../Helper/successManager';
import { validateAccessToken, validateRequest } from './authRouter';

const dashboardRouter = express.Router();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  region: process.env.AWS_REGION as string
});

const iotData = new AWS.IotData({ endpoint: process.env.AWS_IOT_ENDPOINT as string });

interface AccessTokenRequest extends Request {
    user_id?: number;
}

const apiKeyValidation = check('x-api-key')
    .custom((value, { req }) => {
        if (value !== process.env.API_CLIENT_KEY) {
            throw new Error('Invalid API key');
        }
        return true;
    });

const deviceLogsValidation: ValidationChain[] = [
    check('cat_num', 'Catalog number is required').not().isEmpty()
];

const addDeviceValidation: ValidationChain[] = [
    check('cat_num', 'Catalog number is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('wifi_ssid', 'Wifi_ssid is required').not().isEmpty(),
    check('wifi_password', 'Wifi_password is required').not().isEmpty(),
];

const updateWifiValidation: ValidationChain[] = [
    check('device_id', 'Device_id number is required').not().isEmpty(),
    check('wifi_ssid', 'Wifi_ssid is required').not().isEmpty(),
    check('wifi_password', 'Wifi_password is required').not().isEmpty(),
];

const updateAutoValidation: ValidationChain[] = [
    check('device_id', 'Device_id number is required').not().isEmpty(),
    check('automate', 'Automate is required').not().isEmpty(),
];

const presenceUpdateConnectionValidation: ValidationChain[] = [
    check('thingName', 'ThingName is required').not().isEmpty(),
    check('presenceConnection', 'presenceConnection is required').not().isEmpty(),
    apiKeyValidation
];

const shadowUpdateAutoValidation: ValidationChain[] = [
    check('thingName', 'ThingName is required').not().isEmpty(),
    check('shadowAuto', 'shadowAuto is required').not().isEmpty(),
    apiKeyValidation
];

const updatePumpWaterValidation: ValidationChain[] = [
    check('device_id', 'Device_id number is required').not().isEmpty(),
    check('pump_water', 'Pump_water is required').not().isEmpty(),
];

const shadowUpdatePumpWaterValidation: ValidationChain[] = [
    check('thingName', 'ThingName is required').not().isEmpty(),
    check('shadowPump', 'shadowPump is required').not().isEmpty(),
    apiKeyValidation
];

const deviceShadowValidation: ValidationChain[] = [
    check('thingName', 'Thing name is required').not().isEmpty(),
];

interface State {
    desired: DesiredState;
    reported?: ReportedState
}

interface DesiredState {
    pump?: boolean;
    auto?: boolean;
}

interface ReportedState {
    pump?: boolean;
    auto?: boolean;
}

const updateDeviceShadow = async (thingName: string, desiredState: DesiredState, reportedState?: ReportedState): Promise<any> => {
    const state: State = {
        desired: desiredState
    };

    if (reportedState !== undefined) {
        state.reported = reportedState;
    }

    
    const params = {
        thingName: thingName,
        payload: JSON.stringify({
            state: state
        })
    };

    try {
        const response = await iotData.updateThingShadow(params).promise();
        const data = JSON.parse(response.payload as string); 
        return data;
      } catch (error) {
        throw new Error('Failed to update device shadow.');
      }
};

const getDeviceShadow = async (thingName: string): Promise<any> => {
    const params = {
        thingName: thingName
    };

    try {
        const response = await iotData.getThingShadow(params).promise();
        const data = JSON.parse(response.payload as string); 
        return data;
    } catch(error){
        throw new Error('Failed to get device shadow.');
    }
}

dashboardRouter.get('/userDevices', validateAccessToken, async (req: AccessTokenRequest, res: Response) => {
    try {
        if (!req.user_id){
            throw new CustomError('Error fetching user devices.', 401);
        }

        const devices = await getUserDevices(req.user_id);
        successHandler("Fetch Successfully.", 200, res, undefined, devices);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

dashboardRouter.get('/deviceLogs', validateAccessToken, validateRequest(deviceLogsValidation), async (req: Request, res: Response) => {
    const cat_num = req.query.cat_num as string;

    try {
        const deviceLogs = await getDeviceLogs(cat_num);
        const lastLog = await getLastDeviceLog(cat_num);
        successHandler("Fetch Successfully.", 200, res, undefined, undefined, deviceLogs || [], lastLog);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

dashboardRouter.post('/addDevice', validateAccessToken, validateRequest(addDeviceValidation), async (req: AccessTokenRequest, res: Response) => {
    const { location, cat_num, wifi_ssid, wifi_password } = req.body;

    try {
        if (!req.user_id){
            throw new CustomError('Error fetching user devices.', 401);
        }

        const factoryDevices = await getFactoryDevice(cat_num);
        if (!factoryDevices) {
            throw new CustomError('PlantPal Asset Number does not exist.', 401);
        }

        const hashWifi = encrypt(wifi_password);
        const newDevice = await addUserDevice(cat_num, req.user_id, wifi_ssid, hashWifi.content, hashWifi.iv, false, location, factoryDevices.thing_name);
        if (!newDevice) {
            throw new CustomError('Error creating new device.', 401);
        }

        successHandler("The device has been registered with us!", 201, res, undefined, undefined, undefined, undefined, newDevice);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

dashboardRouter.post('/updateWifi', validateAccessToken, validateRequest(updateWifiValidation), async (req: Request, res: Response) => {
    const { device_id, wifi_ssid, wifi_password } = req.body;

    try {
        const hashWifi = encrypt(wifi_password);
        const updatedDevice = await updateDeviceWifi(device_id, wifi_ssid, hashWifi.content, hashWifi.iv);
        if (!updatedDevice || updatedDevice.wifi_password !== hashWifi.content) {
            throw new CustomError('Error updating device network.', 400);
        }

        successHandler("The device network has been updated!", 201, res);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

dashboardRouter.post('/updateAuto', validateAccessToken, validateRequest(updateAutoValidation), async (req: Request, res: Response) => {
    const { device_id, automate } = req.body;

    const desiredState = {
        auto: automate,
    };

    try {
        
        const device = await getUserDevice(device_id);

        if (!device) {
            throw new CustomError('Error getting device info.', 400);
        }

        await updateDeviceShadow(device.thing_name, desiredState);

        successHandler("The device auto has been updated!", 201, res);

    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

dashboardRouter.post('/shadowUpdateAuto', validateRequest(shadowUpdateAutoValidation), async (req: Request, res: Response) => {
    const { thingName, shadowAuto } = req.body;

    try {

        const userDevice = await getDeviceThing(thingName);

        if (!userDevice) {
            throw new CustomError('Error finding user device.', 500);
        }
        
        await emitToUser(userDevice.user_id, 'shadowUpdateAuto', { device: userDevice, thing_name: thingName, shadow_auto: shadowAuto });
        successHandler("Shadow auto update received", 201, res);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

dashboardRouter.post('/presenceUpdateConnection', validateRequest(presenceUpdateConnectionValidation), async (req: Request, res: Response) => {
    const { thingName, presenceConnection } = req.body;

    try {

        const userDevice = await getDeviceThing(thingName);

        if (!userDevice) {
            throw new CustomError('Error finding user device', 500);
        }

        const updatedDevice = await updatePresenceConnection(userDevice.device_id,presenceConnection);

        if (!updatedDevice || Boolean(updatedDevice.presence_connection) !== presenceConnection) {
            throw new CustomError('Error updating device presence connection.', 400);
        }
        
        await emitToUser(userDevice.user_id, 'presenceUpdateConnection', { device: updatedDevice, thing_name: thingName, presence_connection: presenceConnection });
        successHandler("Shadow connection update received", 201, res);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

dashboardRouter.post('/updatePumpWater', validateRequest(updatePumpWaterValidation), async (req: Request, res: Response) => {
    
    const { device_id, pump_water } = req.body;

    const desiredState = {
        pump: pump_water,
    };

    try {
        const device = await getUserDevice(device_id);

        if (!device) {
            throw new CustomError('Error getting device info.', 400);
        }

        await updateDeviceShadow(device.thing_name,desiredState);

        successHandler("The device pump has been updated!", 200, res);

    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

dashboardRouter.post('/shadowUpdatePumpWater', validateRequest(shadowUpdatePumpWaterValidation), async (req: Request, res: Response) => {
    const { thingName, shadowPump} = req.body;

    try {

        const desiredState = {
            pump: false,
        };

        const reportedState = {
            pump: false
        };

        const userDevice = await getDeviceThing(thingName);

        if (!userDevice) {
            throw new CustomError('Error finding user device.', 500);
        }
        
        await emitToUser(userDevice.user_id, 'shadowUpdatePumpWater', { device: userDevice, thing_name: thingName, shadow_pump: shadowPump });

        if (shadowPump) {
            await updateDeviceShadow(thingName,desiredState, reportedState);
        }
        
        successHandler("Shadow pump water update received", 201, res);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

dashboardRouter.get('/deviceShadow', validateAccessToken, validateRequest(deviceShadowValidation), async (req: Request, res: Response) => {
    const thingName = req.query.thingName as string;

    try {
        const deviceShadow = await getDeviceShadow(thingName);

        if (!deviceShadow) {
            throw new CustomError('Error getting device shadow', 500);
        }

        successHandler("Fetched Shadow Successfully.", 201, res, undefined, undefined, undefined, undefined, undefined, undefined, deviceShadow);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

dashboardRouter.get('/test', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Dashboard route accessed' });
});

export { dashboardRouter };
