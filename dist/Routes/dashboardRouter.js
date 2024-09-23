"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = __importDefault(require("express"));
const myCrypto_1 = require("../Helper/myCrypto");
const index_1 = require("../sockets/index");
const database_1 = require("../MySQL/database");
const errorManager_1 = require("../Helper/errorManager");
const successManager_1 = require("../Helper/successManager");
const validateRequestManager_1 = require("../Helper/validateRequestManager");
const validateRequestManager_2 = require("../Helper/validateRequestManager");
const shadowManager_1 = require("../Helper/shadowManager");
const dashboardRouter = express_1.default.Router();
exports.dashboardRouter = dashboardRouter;
/**
 * Route to fetch user devices.
 * @route GET /userDevices
 * @param {AccessTokenRequest} req - The request object containing the user ID.
 * @param {Response} res - The response object.
 * @throws {CustomError} If the user ID is not present or fetching devices fails.
 */
dashboardRouter.get('/userDevices', validateRequestManager_1.validateAccessToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user_id) {
            throw new errorManager_1.CustomError('Error fetching user devices.', 401);
        }
        const devices = yield (0, database_1.getUserDevices)(req.user_id);
        (0, successManager_1.successHandler)("Fetch Successfully.", 200, res, undefined, devices);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * Route to fetch device logs.
 * @route GET /deviceLogs
 * @param {Request} req - The request object containing query parameters.
 * @param {Response} res - The response object.
 * @throws {CustomError} If fetching logs fails.
 */
dashboardRouter.get('/deviceLogs', validateRequestManager_1.validateAccessToken, (0, validateRequestManager_1.validateRequest)(validateRequestManager_2.deviceLogsValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const cat_num = req.query.cat_num;
    try {
        const deviceLogs = yield (0, database_1.getDeviceLogs)(cat_num);
        const lastLog = yield (0, database_1.getLastDeviceLog)(cat_num);
        (0, successManager_1.successHandler)("Fetch Successfully.", 200, res, undefined, undefined, deviceLogs || [], lastLog);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * Route to add a new device.
 * @route POST /addDevice
 * @param {AccessTokenRequest} req - The request object containing device data.
 * @param {Response} res - The response object.
 * @throws {CustomError} If adding the device fails.
 */
dashboardRouter.post('/addDevice', validateRequestManager_1.validateAccessToken, (0, validateRequestManager_1.validateRequest)(validateRequestManager_2.addDeviceValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { location, cat_num, wifi_ssid, wifi_password } = req.body;
    try {
        if (!req.user_id) {
            throw new errorManager_1.CustomError('Error fetching user devices.', 401);
        }
        const factoryDevices = yield (0, database_1.getFactoryDevice)(cat_num);
        if (!factoryDevices) {
            throw new errorManager_1.CustomError('PlantPal Asset Number does not exist.', 401);
        }
        const hashWifi = (0, myCrypto_1.encrypt)(wifi_password);
        const newDevice = yield (0, database_1.addUserDevice)(cat_num, req.user_id, wifi_ssid, hashWifi.content, hashWifi.iv, false, location, factoryDevices.thing_name);
        if (!newDevice) {
            throw new errorManager_1.CustomError('Error creating new device.', 401);
        }
        (0, successManager_1.successHandler)("The device has been registered with us!", 201, res, undefined, undefined, undefined, undefined, newDevice);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * Route to update device Wi-Fi settings.
 * @route POST /updateWifi
 * @param {Request} req - The request object containing device and Wi-Fi data.
 * @param {Response} res - The response object.
 * @throws {CustomError} If updating the Wi-Fi settings fails.
 */
dashboardRouter.post('/updateWifi', validateRequestManager_1.validateAccessToken, (0, validateRequestManager_1.validateRequest)(validateRequestManager_2.updateWifiValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { device_id, wifi_ssid, wifi_password } = req.body;
    try {
        const hashWifi = (0, myCrypto_1.encrypt)(wifi_password);
        const updatedDevice = yield (0, database_1.updateDeviceWifi)(device_id, wifi_ssid, hashWifi.content, hashWifi.iv);
        if (!updatedDevice || updatedDevice.wifi_password !== hashWifi.content) {
            throw new errorManager_1.CustomError('Error updating device network.', 400);
        }
        (0, successManager_1.successHandler)("The device network has been updated!", 201, res);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * Route to update the device's automatic control settings.
 * @route POST /updateAuto
 * @param {Request} req - The request object containing device ID and automation setting.
 * @param {Response} res - The response object.
 * @throws {CustomError} If updating the settings fails.
 */
dashboardRouter.post('/updateAuto', validateRequestManager_1.validateAccessToken, (0, validateRequestManager_1.validateRequest)(validateRequestManager_2.updateAutoValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { device_id, automate } = req.body;
    const desiredState = {
        auto: automate,
    };
    try {
        const device = yield (0, database_1.getUserDevice)(device_id);
        if (!device) {
            throw new errorManager_1.CustomError('Error getting device info.', 400);
        }
        yield (0, shadowManager_1.updateDeviceShadow)(device.thing_name, desiredState);
        (0, successManager_1.successHandler)("The device auto has been updated!", 201, res);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * Route to handle shadow update for automatic control.
 * @route POST /shadowUpdateAuto
 * @param {Request} req - The request object containing thing name and shadow setting.
 * @param {Response} res - The response object.
 * @throws {CustomError} If the shadow update fails.
 */
dashboardRouter.post('/shadowUpdateAuto', (0, validateRequestManager_1.validateRequest)(validateRequestManager_2.shadowUpdateAutoValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { thingName, shadowAuto } = req.body;
    try {
        const userDevice = yield (0, database_1.getDeviceThing)(thingName);
        if (!userDevice) {
            throw new errorManager_1.CustomError('Error finding user device.', 500);
        }
        yield (0, index_1.emitToUser)(userDevice.user_id, 'shadowUpdateAuto', { device: userDevice, thing_name: thingName, shadow_auto: shadowAuto });
        (0, successManager_1.successHandler)("Shadow auto update received", 201, res);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * Route to update presence connection status.
 * @route POST /presenceUpdateConnection
 * @param {Request} req - The request object containing thing name and presence status.
 * @param {Response} res - The response object.
 * @throws {CustomError} If updating presence connection fails.
 */
dashboardRouter.post('/presenceUpdateConnection', (0, validateRequestManager_1.validateRequest)(validateRequestManager_2.presenceUpdateConnectionValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { thingName, presenceConnection } = req.body;
    try {
        const userDevice = yield (0, database_1.getDeviceThing)(thingName);
        if (!userDevice) {
            throw new errorManager_1.CustomError('Error finding user device', 500);
        }
        const updatedDevice = yield (0, database_1.updatePresenceConnection)(userDevice.device_id, presenceConnection);
        if (!updatedDevice || Boolean(updatedDevice.presence_connection) !== presenceConnection) {
            throw new errorManager_1.CustomError('Error updating device presence connection.', 400);
        }
        yield (0, index_1.emitToUser)(userDevice.user_id, 'presenceUpdateConnection', { device: updatedDevice, thing_name: thingName, presence_connection: presenceConnection });
        (0, successManager_1.successHandler)("Shadow connection update received", 201, res);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * Route to update the pump water setting.
 * @route POST /updatePumpWater
 * @param {Request} req - The request object containing device ID and pump setting.
 * @param {Response} res - The response object.
 * @throws {CustomError} If updating the pump fails.
 */
dashboardRouter.post('/updatePumpWater', (0, validateRequestManager_1.validateRequest)(validateRequestManager_2.updatePumpWaterValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { device_id, pump_water } = req.body;
    const desiredState = {
        pump: pump_water,
    };
    try {
        const device = yield (0, database_1.getUserDevice)(device_id);
        if (!device) {
            throw new errorManager_1.CustomError('Error getting device info.', 400);
        }
        yield (0, shadowManager_1.updateDeviceShadow)(device.thing_name, desiredState);
        (0, successManager_1.successHandler)("The device pump has been updated!", 200, res);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * Route to handle shadow update for pump water.
 * @route POST /shadowUpdatePumpWater
 * @param {Request} req - The request object containing thing name and shadow pump status.
 * @param {Response} res - The response object.
 * @throws {CustomError} If the shadow update fails.
 */
dashboardRouter.post('/shadowUpdatePumpWater', (0, validateRequestManager_1.validateRequest)(validateRequestManager_2.shadowUpdatePumpWaterValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { thingName, shadowPump } = req.body;
    try {
        const desiredState = {
            pump: false,
        };
        const reportedState = {
            pump: false
        };
        const userDevice = yield (0, database_1.getDeviceThing)(thingName);
        if (!userDevice) {
            throw new errorManager_1.CustomError('Error finding user device.', 500);
        }
        yield (0, index_1.emitToUser)(userDevice.user_id, 'shadowUpdatePumpWater', { device: userDevice, thing_name: thingName, shadow_pump: shadowPump });
        if (shadowPump) {
            yield (0, shadowManager_1.updateDeviceShadow)(thingName, desiredState, reportedState);
        }
        (0, successManager_1.successHandler)("Shadow pump water update received", 201, res);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * Route to fetch the device shadow.
 * @route GET /deviceShadow
 * @param {Request} req - The request object containing the thing name.
 * @param {Response} res - The response object.
 * @throws {CustomError} If fetching the shadow fails.
 */
dashboardRouter.get('/deviceShadow', validateRequestManager_1.validateAccessToken, (0, validateRequestManager_1.validateRequest)(validateRequestManager_2.deviceShadowValidation), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const thingName = req.query.thingName;
    try {
        const deviceShadow = yield (0, shadowManager_1.getDeviceShadow)(thingName);
        if (!deviceShadow) {
            throw new errorManager_1.CustomError('Error getting device shadow', 500);
        }
        (0, successManager_1.successHandler)("Fetched Shadow Successfully.", 201, res, undefined, undefined, undefined, undefined, undefined, undefined, deviceShadow);
    }
    catch (error) {
        (0, errorManager_1.errorHandler)(error, res);
    }
}));
/**
 * Test route to check dashboard access.
 * @route GET /test
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
dashboardRouter.get('/test', (req, res) => {
    res.status(200).json({ message: 'Dashboard route accessed' });
});
