import express, { Request, Response } from 'express';
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
import { errorHandler, CustomError } from '../Helper/errorManager';
import { successHandler } from '../Helper/successManager';
import { validateAccessToken, validateRequest } from '../Helper/validateRequestManager';
import { 
    deviceLogsValidation, 
    addDeviceValidation, 
    updateWifiValidation, 
    updateAutoValidation, 
    presenceUpdateConnectionValidation, 
    shadowUpdateAutoValidation, 
    updatePumpWaterValidation, 
    shadowUpdatePumpWaterValidation, 
    deviceShadowValidation 
} from '../Helper/validateRequestManager';
import { AccessTokenRequest} from '../Types/types';
import { getDeviceShadow, updateDeviceShadow } from '../Helper/shadowManager';

const dashboardRouter = express.Router();

/**
 * Route to fetch user devices.
 * @route GET /userDevices
 * @param {AccessTokenRequest} req - The request object containing the user ID.
 * @param {Response} res - The response object.
 * @throws {CustomError} If the user ID is not present or fetching devices fails.
 */
dashboardRouter.get('/userDevices', validateAccessToken, async (req: AccessTokenRequest, res: Response) => {
    try {
        if (!req.user_id){
            throw new CustomError('Error fetching user devices.', 401);
        }

        const devices = await getUserDevices(req.user_id);

        const formattedDevices = devices.map((device: any) => ({
            ...device,
            presence_connection: !!device.presence_connection
        }));

        successHandler("Fetch Successfully.", 200, res, undefined, formattedDevices);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

/**
 * Route to fetch device logs.
 * @route GET /deviceLogs
 * @param {Request} req - The request object containing query parameters.
 * @param {Response} res - The response object.
 * @throws {CustomError} If fetching logs fails.
 */
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

/**
 * Route to add a new device.
 * @route POST /addDevice
 * @param {AccessTokenRequest} req - The request object containing device data.
 * @param {Response} res - The response object.
 * @throws {CustomError} If adding the device fails.
 */
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

/**
 * Route to update device Wi-Fi settings.
 * @route POST /updateWifi
 * @param {Request} req - The request object containing device and Wi-Fi data.
 * @param {Response} res - The response object.
 * @throws {CustomError} If updating the Wi-Fi settings fails.
 */
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

/**
 * Route to update the device's automatic control settings.
 * @route POST /updateAuto
 * @param {Request} req - The request object containing device ID and automation setting.
 * @param {Response} res - The response object.
 * @throws {CustomError} If updating the settings fails.
 */
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

/**
 * Route to handle shadow update for automatic control.
 * @route POST /shadowUpdateAuto
 * @param {Request} req - The request object containing thing name and shadow setting.
 * @param {Response} res - The response object.
 * @throws {CustomError} If the shadow update fails.
 */
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

/**
 * Route to update presence connection status.
 * @route POST /presenceUpdateConnection
 * @param {Request} req - The request object containing thing name and presence status.
 * @param {Response} res - The response object.
 * @throws {CustomError} If updating presence connection fails.
 */
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

/**
 * Route to update the pump water setting.
 * @route POST /updatePumpWater
 * @param {Request} req - The request object containing device ID and pump setting.
 * @param {Response} res - The response object.
 * @throws {CustomError} If updating the pump fails.
 */
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

/**
 * Route to handle shadow update for pump water.
 * @route POST /shadowUpdatePumpWater
 * @param {Request} req - The request object containing thing name and shadow pump status.
 * @param {Response} res - The response object.
 * @throws {CustomError} If the shadow update fails.
 */
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

        if (shadowPump) {
            await updateDeviceShadow(thingName,desiredState, reportedState);
        }
        
        await emitToUser(userDevice.user_id, 'shadowUpdatePumpWater', { device: userDevice, thing_name: thingName, shadow_pump: shadowPump });
        
        successHandler("Shadow pump water update received", 201, res);
    } catch (error) {
        errorHandler(error as CustomError, res);
    }
});

/**
 * Route to fetch the device shadow.
 * @route GET /deviceShadow
 * @param {Request} req - The request object containing the thing name.
 * @param {Response} res - The response object.
 * @throws {CustomError} If fetching the shadow fails.
 */
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

/**
 * Test route to check dashboard access.
 * @route GET /test
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
dashboardRouter.get('/test', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Dashboard route accessed' });
});

export { dashboardRouter };
