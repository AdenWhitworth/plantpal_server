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
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../app");
const jwtManager_1 = require("../../Helper/jwtManager");
const database_1 = require("../../MySQL/database");
const myCrypto_1 = require("../../Helper/myCrypto");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const index_1 = require("../../sockets/index");
/**
 * Mocking the socket.
 */
jest.mock('../../sockets/index', () => ({
    emitToUser: jest.fn(),
    initSocket: jest.fn(),
    connectSocket: jest.fn(),
}));
/**
 * Mocking the jwtManager.
 */
jest.mock('../../Helper/jwtManager', () => ({
    verifyToken: jest.fn(),
}));
/**
 * Mocking the database.
 */
jest.mock('../../MySQL/database', () => ({
    getUserDevices: jest.fn(),
    getDeviceLogs: jest.fn(),
    getLastDeviceLog: jest.fn(),
    addUserDevice: jest.fn(),
    getFactoryDevice: jest.fn(),
    updateDeviceWifi: jest.fn(),
    getUserDevice: jest.fn(),
    getDeviceThing: jest.fn(),
    updatePresenceConnection: jest.fn(),
}));
/**
 * Mocking the myCrypto.
 */
jest.mock('../../Helper/myCrypto', () => ({
    encrypt: jest.fn(),
}));
/**
 * Mocking the aws-sdk.
 */
jest.mock('aws-sdk', () => {
    const updateThingShadowMock = jest.fn();
    const getThingShadowMock = jest.fn();
    const promiseMock = jest.fn();
    updateThingShadowMock.mockReturnValue({
        promise: promiseMock,
    });
    getThingShadowMock.mockReturnValue({
        promise: promiseMock,
    });
    return {
        IotData: jest.fn(() => ({
            updateThingShadow: updateThingShadowMock,
            getThingShadow: getThingShadowMock,
        })),
        config: {
            update: jest.fn(),
        },
    };
});
/**
 * Integration tests for the Dashboard Router.
 */
describe('Dashboard Router Integration Tests', () => {
    const expiryMinutes = 15;
    const resetTokenExpiryTimestamp = Date.now() + (expiryMinutes * 60 * 1000);
    const formattedResetTokenExpiry = new Date(resetTokenExpiryTimestamp).toISOString();
    const testUser = {
        user_id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        hashPassword: 'mockHashedPassword',
        refresh_token: 'mockRefreshToken',
        reset_token_expiry: formattedResetTokenExpiry,
        reset_token: 'mockResetToken%20resetTokenSecret',
        accessToken: 'mockAccessToken',
        invalidAccessToken: 'mockInvalidAccessToken'
    };
    const testDevice = {
        device_id: 1,
        cat_num: "A1B1C1",
        user_id: 1,
        wifi_ssid: "testSsid",
        wifi_password: "wifiPassword123",
        init_vec: "mockInitVec",
        presence_connection: false,
        location: "Kitchen",
        thing_name: "mockThing",
    };
    const testDeviceLog = {
        log_id: 1,
        cat_num: "A1B1C1",
        soil_temp: 30,
        soil_cap: 1500,
        log_date: "2024-09-18T12:10:38.311Z",
        water: false,
    };
    const testFactoryDevice = {
        factory_id: 1,
        cat_num: "A1B1C1",
        factory_date: "2024-09-18T12:10:38.311Z",
        thing_name: "mockThing",
    };
    const testDeviceShadow = {
        state: {
            reported: {
                welcome: "Welcome",
                connected: false,
                auto: false,
                pump: false
            },
            desired: {
                welcome: "Welcome",
                connected: false,
                auto: false,
                pump: false
            }
        },
        metadata: "metaData"
    };
    afterAll(() => {
        app_1.server.close();
    });
    beforeAll(() => {
        process.env.EMAIL_FROM = 'server@gmail.com';
        process.env.AUTH_ACCESS_TOKEN_SECRET = 'accessTokenSecret';
        process.env.API_KEY = 'apiKey';
        process.env.AUTH_REFRESH_TOKEN_SECRET = 'refreshTokenSecret';
        process.env.BASE_URL = 'http://localhost:3000';
        process.env.AWS_IOT_ENDPOINT = 'mockAwsEndpoint';
        app_1.server.close();
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('Dashboard Router Integration Tests', () => {
        /**
         * Test the /dashboard/userDevices endpoint for a valid access token.
         * Verifies that the API returns user devices when a valid access token is provided.
         */
        test('GET/userDevices should return user devices when access token is valid', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            database_1.getUserDevices.mockResolvedValue([testDevice]);
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/dashboard/userDevices')
                .set('Authorization', `Bearer ${testUser.accessToken}`);
            expect(response.status).toBe(200);
            expect(response.body.devices).toEqual([testDevice]);
        }));
        /**
         * Test the /dashboard/userDevices endpoint when the access token is missing user information.
         * Verifies that the API returns a 401 status with an "Invalid access token" message.
         */
        test('GET/userDevices should handle if accessToken is missing user information', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { some_other_field: 'value' };
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/dashboard/userDevices')
                .set('Authorization', `Bearer ${testUser.accessToken}`);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid access token");
        }));
        /**
         * Test the /dashboard/userDevices and /dashboard endpoints for missing access tokens.
         * Verifies that the API returns a 500 status with a token verification error.
         */
        test('Dashboard GET & POST should handle if access token is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation(() => {
                throw new Error('Token verification failed');
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/dashboard/userDevices')
                .set('Authorization', `Bearer incorrectToken`);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Token verification failed');
        }));
        /**
         * Test the /dashboard/deviceLogs endpoint for a valid access token.
         * Verifies that the API returns device logs and the last log when a valid access token and cat_num are provided.
         */
        test('GET/deviceLogs should return device logs and last log', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            database_1.getDeviceLogs.mockResolvedValue([testDeviceLog]);
            database_1.getLastDeviceLog.mockResolvedValue(testDeviceLog);
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/dashboard/deviceLogs')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .query({ cat_num: testDevice.cat_num });
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Fetch Successfully.',
                deviceLogs: [testDeviceLog],
                lastLog: testDeviceLog,
            });
        }));
        /**
         * Test the /dashboard/deviceLogs endpoint when cat_num is missing.
         * Verifies that the API returns a 400 status with an error message for the missing cat_num.
         */
        test('GET/deviceLogs should handle missing cat_num', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/dashboard/deviceLogs')
                .set('Authorization', `Bearer ${testUser.accessToken}`);
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({ "cat_num": "Catalog number is required" });
        }));
        /**
         * Test the /dashboard/addDevice endpoint for adding a new device with valid data.
         * Verifies that the API adds the device and returns a success message with the newly registered device.
         */
        test('POST/addDevice should add a new device when valid data is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            database_1.getFactoryDevice.mockResolvedValue(testFactoryDevice);
            myCrypto_1.encrypt.mockResolvedValue({ content: testDevice.wifi_password, iv: testDevice.init_vec });
            database_1.addUserDevice.mockResolvedValue(testDevice);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/addDevice')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                location: testDevice.location,
                cat_num: testDevice.cat_num,
                wifi_ssid: testDevice.wifi_ssid,
                wifi_password: testDevice.wifi_password,
            });
            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                message: 'The device has been registered with us!',
                device: testDevice,
            });
        }));
        /**
         * Test the /dashboard/addDevice endpoint for missing required fields (location, cat_num, wifi_ssid, wifi_password).
         * Verifies that the API returns a 400 status with error messages for the missing fields.
         */
        test('POST/addDevice should handle missing location, cat_num, wifi_ssid, and wifi_password', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/addDevice')
                .set('Authorization', `Bearer ${testUser.accessToken}`);
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "cat_num": "Catalog number is required",
                "location": "Location is required",
                "wifi_ssid": "Wifi_ssid is required",
                "wifi_password": "Wifi_password is required",
            });
        }));
        /**
         * Test that POST /addDevice handles an unapproved cat_num.
         * When the device's cat_num is not approved, returns a 401 status code with an error message.
         */
        test('POST/addDevice should handle unapproved cat_num', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            database_1.getFactoryDevice.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/addDevice')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                location: testDevice.location,
                cat_num: testDevice.cat_num,
                wifi_ssid: testDevice.wifi_ssid,
                wifi_password: testDevice.wifi_password,
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('PlantPal Asset Number does not exist.');
        }));
        /**
         * Test that POST /addDevice handles database errors when adding a device.
         *  When there is an error adding a device to the database, returns a 401 status code with an error message.
         */
        test('POST/addDevice should handle adding device to database errors', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            database_1.getFactoryDevice.mockResolvedValue(testFactoryDevice);
            myCrypto_1.encrypt.mockResolvedValue({ content: testDevice.wifi_password, iv: testDevice.init_vec });
            database_1.addUserDevice.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/addDevice')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                location: testDevice.location,
                cat_num: testDevice.cat_num,
                wifi_ssid: testDevice.wifi_ssid,
                wifi_password: testDevice.wifi_password,
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Error creating new device.');
        }));
        /**
         * Test that POST /updateWifi successfully updates WiFi credentials when valid data is provided.
         * When valid WiFi credentials are provided, returns a 201 status code with a success message.
         */
        test('POST/updateWifi should update wifi credentials when valid data is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            myCrypto_1.encrypt.mockImplementation(() => {
                return { content: testDevice.wifi_password, iv: testDevice.init_vec };
            });
            database_1.updateDeviceWifi.mockResolvedValue(testDevice);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/updateWifi')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                device_id: testDevice.device_id,
                wifi_ssid: testDevice.wifi_ssid,
                wifi_password: testDevice.wifi_password,
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('The device network has been updated!');
        }));
        /**
         * Test that POST /updateWifi handles missing required fields such as device_id, wifi_ssid, and wifi_password.
         * When required fields are missing, returns a 400 status code with specific field error messages.
         */
        test('POST/updateWifi should handle missing device_id, wifi_ssid, and wifi_password', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/updateWifi')
                .set('Authorization', `Bearer ${testUser.accessToken}`);
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "device_id": "Device_id number is required",
                "wifi_ssid": "Wifi_ssid is required",
                "wifi_password": "Wifi_password is required",
            });
        }));
        /**
         * Test that POST /updateWifi handles database errors when updating WiFi credentials.
         * When there is an error updating WiFi credentials in the database, returns a 400 status code with an error message.
         */
        test('POST/updateWifi should handle updating device wifi to database errors', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            myCrypto_1.encrypt.mockImplementation(() => {
                return { content: testDevice.wifi_password, iv: testDevice.init_vec };
            });
            database_1.updateDeviceWifi.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/updateWifi')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                device_id: testDevice.device_id,
                wifi_ssid: testDevice.wifi_ssid,
                wifi_password: testDevice.wifi_password,
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Error updating device network.');
        }));
        /**
         * Test that POST /updateAuto successfully updates the auto state when valid data is provided.
         * When valid data is provided, returns a 201 status code with a success message and ensures that AWS IoT is called with the correct parameters.
         */
        test('POST/updateAuto should update auto state when valid data is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            database_1.getUserDevice.mockResolvedValue(testDevice);
            const mockIotData = aws_sdk_1.default.IotData;
            const instance = new mockIotData();
            const mockUpdateThingShadowResponse = {
                payload: JSON.stringify({ message: 'Shadow updated successfully' }),
            };
            instance.updateThingShadow.mockReturnValue({
                promise: jest.fn().mockResolvedValue(mockUpdateThingShadowResponse),
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/updateAuto')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                device_id: testDevice.device_id,
                automate: true,
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('The device auto has been updated!');
            expect(instance.updateThingShadow).toHaveBeenCalledWith({
                thingName: testDevice.thing_name,
                payload: JSON.stringify({ state: { desired: { auto: true } } }),
            });
        }));
        /**
         * Test that POST /updateAuto handles missing required fields such as device_id and automate.
         * When required fields are missing, returns a 400 status code with specific field error messages.
         */
        test('POST/updateAuto should handle missing device_id, and automate', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/updateAuto')
                .set('Authorization', `Bearer ${testUser.accessToken}`);
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "device_id": "Device_id number is required",
                "automate": "Automate is required",
            });
        }));
        /**
         * Test that POST /updateAuto handles database errors when retrieving a device.
         * When there is an error retrieving the device from the database, returns a 400 status code with an error message.
         */
        test('POST/updateAuto should handle getting device from database errors', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            database_1.getUserDevice.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/updateAuto')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                device_id: testDevice.device_id,
                automate: true,
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Error getting device info.');
        }));
        /**
         * Test that POST /updateAuto handles shadow update errors.
         * When there is an error updating the device shadow, returns a 500 status code with an error message.
         */
        test('POST/updateAuto should handle shadow update errors', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            database_1.getUserDevice.mockResolvedValue(testDevice);
            const mockIotData = aws_sdk_1.default.IotData;
            const instance = new mockIotData();
            instance.updateThingShadow.mockReturnValue({
                promise: null,
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/updateAuto')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                device_id: testDevice.device_id,
                automate: true,
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to update device shadow.');
        }));
        /**
         * Test that POST /shadowUpdateAuto emits an auto state change to the user from AWS Lambda.
         * When the shadow auto update is received, returns a 201 status code and verifies the emitToUser function is called with the correct parameters.
         */
        test('POST/shadowUpdateAuto should emit auto state change to user from aws lambda', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.getDeviceThing.mockResolvedValue(testDevice);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/shadowUpdateAuto')
                .set('x-api-key', process.env.API_KEY)
                .send({
                thingName: testDevice.thing_name,
                shadowAuto: true,
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Shadow auto update received');
            expect(index_1.emitToUser).toHaveBeenCalledWith(testUser.user_id, "shadowUpdateAuto", { device: testDevice, thing_name: testDevice.thing_name, shadow_auto: true });
        }));
        /**
         * Test that POST /shadowUpdateAuto handles missing required fields such as thingName and shadowAuto.
         * When required fields are missing, returns a 400 status code with specific field error messages.
         */
        test('POST/shadowUpdateAuto should handle missing thingName and shadowAuto', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/shadowUpdateAuto')
                .set('x-api-key', process.env.API_KEY);
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "thingName": "ThingName is required",
                "shadowAuto": "shadowAuto is required",
            });
        }));
        /**
         * Test that POST /shadowUpdateAuto handles missing API key.
         * When the API key is missing, returns a 400 status code with an error message indicating the API key is invalid.
         */
        test('POST/shadowUpdateAuto should handle missing api key', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/shadowUpdateAuto')
                .send({
                thingName: testDevice.thing_name,
                shadowAuto: true,
            });
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "x-api-key": "Invalid API key",
            });
        }));
        /**
         * Test that POST /shadowUpdateAuto handles errors when retrieving a device from the database.
         * When there is an error finding the user device, returns a 500 status code with an error message.
         */
        test('POST/shadowUpdateAuto should handle getting device from database errors', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.getDeviceThing.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/shadowUpdateAuto')
                .set('x-api-key', process.env.API_KEY)
                .send({
                thingName: testDevice.thing_name,
                shadowAuto: true,
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error finding user device.');
            expect(index_1.emitToUser).not.toHaveBeenCalled();
        }));
        /**
         * Test that POST /shadowUpdateAuto handles errors when emitting to the user.
         * When there is an error emitting to the user, returns a 500 status code with an error message.
         */
        test('POST/shadowUpdateAuto should handle emit to user errors', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.getDeviceThing.mockResolvedValue(testDevice);
            index_1.emitToUser.mockRejectedValueOnce(new Error('Emit to user failed'));
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/shadowUpdateAuto')
                .set('x-api-key', process.env.API_KEY)
                .send({
                thingName: testDevice.thing_name,
                shadowAuto: true,
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Emit to user failed');
        }));
        /**
         * Test that POST /presenceUpdateConnection emits a connection state change to the user from AWS IoT.
         * When the presence connection update is received, returns a 201 status code and verifies the emitToUser function is called with the correct parameters.
         */
        test('POST/presenceUpdateConnection should emit connection state change to user from aws iot', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.getDeviceThing.mockResolvedValue(testDevice);
            database_1.updatePresenceConnection.mockResolvedValue(testDevice);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/presenceUpdateConnection')
                .set('x-api-key', process.env.API_KEY)
                .send({
                thingName: testDevice.thing_name,
                presenceConnection: false,
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Shadow connection update received');
            expect(index_1.emitToUser).toHaveBeenCalledWith(testUser.user_id, "presenceUpdateConnection", { device: testDevice, thing_name: testDevice.thing_name, presence_connection: testDevice.presence_connection });
        }));
        /**
         * Test that POST /presenceUpdateConnection handles missing required fields such as thingName and presenceConnection.
         * When required fields are missing, returns a 400 status code with specific field error messages.
         */
        test('POST/presenceUpdateConnection should handle missing thingName and presenceConnection', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/presenceUpdateConnection')
                .set('x-api-key', process.env.API_KEY);
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "thingName": "ThingName is required",
                "presenceConnection": "presenceConnection is required",
            });
        }));
        /**
         * Test that POST /presenceUpdateConnection handles missing API key.
         * When the API key is missing, returns a 400 status code with an error message indicating the API key is invalid.
         */
        test('POST/presenceUpdateConnection should handle missing api key', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/presenceUpdateConnection')
                .send({
                thingName: testDevice.thing_name,
                presenceConnection: false,
            });
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "x-api-key": "Invalid API key",
            });
        }));
        /**
         * Test that POST /presenceUpdateConnection handles errors when retrieving a device from the database.
         * When there is an error finding the user device, returns a 500 status code with an error message.
         */
        test('POST/presenceUpdateConnection should handle getting device from database errors', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.getDeviceThing.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/presenceUpdateConnection')
                .set('x-api-key', process.env.API_KEY)
                .send({
                thingName: testDevice.thing_name,
                presenceConnection: false,
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error finding user device');
            expect(index_1.emitToUser).not.toHaveBeenCalled();
        }));
        /**
         * Test POST /dashboard/presenceUpdateConnection should handle emit to user errors.
         * This test verifies that when an error occurs while emitting an event to the user,
         * the response status is 500 and the error message is returned in the response body.
         */
        test('POST/presenceUpdateConnection should handle emit to user errors', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.getDeviceThing.mockResolvedValue(testDevice);
            index_1.emitToUser.mockRejectedValueOnce(new Error('Emit to user failed'));
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/presenceUpdateConnection')
                .set('x-api-key', process.env.API_KEY)
                .send({
                thingName: testDevice.thing_name,
                presenceConnection: false,
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Emit to user failed');
        }));
        /**
         * Test POST /dashboard/updatePumpWater should update pump state when valid data is provided.
         * This test checks that a valid request updates the device pump state successfully,
         * and ensures the correct response and calls to the AWS IoT Data service.
         */
        test('POST/updatePumpWater should update pump state when valid data is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            database_1.getUserDevice.mockResolvedValue(testDevice);
            const mockIotData = aws_sdk_1.default.IotData;
            const instance = new mockIotData();
            const mockUpdateThingShadowResponse = {
                payload: JSON.stringify({ message: 'Shadow updated successfully' }),
            };
            instance.updateThingShadow.mockReturnValue({
                promise: jest.fn().mockResolvedValue(mockUpdateThingShadowResponse),
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/updatePumpWater')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                device_id: testDevice.device_id,
                pump_water: true,
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('The device pump has been updated!');
            expect(instance.updateThingShadow).toHaveBeenCalledWith({
                thingName: testDevice.thing_name,
                payload: JSON.stringify({ state: { desired: { pump: true } } }),
            });
        }));
        /**
         * Test POST /dashboard/updatePumpWater should handle missing device_id and pump_water.
         * This test validates that when required fields are missing from the request,
         * a 400 status is returned with appropriate error messages.
         */
        test('POST/updatePumpWater should handle missing device_id, and pump_water', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/updatePumpWater')
                .set('Authorization', `Bearer ${testUser.accessToken}`);
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "device_id": "Device_id number is required",
                "pump_water": "Pump_water is required",
            });
        }));
        /**
         * Test POST /dashboard/updatePumpWater should handle getting device from database errors.
         * This test ensures that if the device cannot be found in the database,
         * a 400 status is returned with a relevant error message.
         */
        test('POST/updatePumpWater should handle getting device from database errors', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            database_1.getUserDevice.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/updatePumpWater')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                device_id: testDevice.device_id,
                pump_water: true,
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Error getting device info.');
        }));
        /**
         * Test POST /dashboard/updatePumpWater should handle shadow update errors.
         * This test verifies that if updating the device shadow fails,
         * a 500 status is returned with an appropriate error message.
         */
        test('POST/updatePumpWater should handle shadow update errors', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            database_1.getUserDevice.mockResolvedValue(testDevice);
            const mockIotData = aws_sdk_1.default.IotData;
            const instance = new mockIotData();
            instance.updateThingShadow.mockReturnValue({
                promise: null,
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/updatePumpWater')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                device_id: testDevice.device_id,
                pump_water: true,
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to update device shadow.');
        }));
        /**
         * Test POST /dashboard/shadowUpdatePumpWater should emit pump_water state change to user from AWS Lambda.
         * This test checks that a successful pump water state update triggers an event to the user,
         * and verifies that the correct payloads are sent to the IoT service and emit function.
         */
        test('POST/shadowUpdatePumpWater should emit pump_water state change to user from aws lambda', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.getDeviceThing.mockResolvedValue(testDevice);
            const mockIotData = aws_sdk_1.default.IotData;
            const instance = new mockIotData();
            const mockUpdateThingShadowResponse = {
                payload: JSON.stringify({ message: 'Shadow updated successfully' }),
            };
            instance.updateThingShadow.mockReturnValue({
                promise: jest.fn().mockResolvedValue(mockUpdateThingShadowResponse),
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/shadowUpdatePumpWater')
                .set('x-api-key', process.env.API_KEY)
                .send({
                thingName: testDevice.thing_name,
                shadowPump: true,
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Shadow pump water update received');
            expect(index_1.emitToUser).toHaveBeenCalledWith(testUser.user_id, "shadowUpdatePumpWater", { device: testDevice, thing_name: testDevice.thing_name, shadow_pump: true });
            expect(instance.updateThingShadow).toHaveBeenCalledWith({
                thingName: testDevice.thing_name,
                payload: JSON.stringify({ state: { desired: { pump: false }, reported: { pump: false } } }),
            });
        }));
        /**
         * Test POST /dashboard/shadowUpdatePumpWater should handle missing thingName and shadowPump.
         * This test ensures that when required fields are missing in the request,
         * a 400 status is returned with appropriate error messages.
         */
        test('POST/shadowUpdatePumpWater should handle missing thingName and shadowPump', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/shadowUpdatePumpWater')
                .set('x-api-key', process.env.API_KEY);
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "thingName": "ThingName is required",
                "shadowPump": "shadowPump is required",
            });
        }));
        /**
         * Test POST /dashboard/shadowUpdatePumpWater should handle missing API key.
         * This test verifies that if the API key is not provided in the request,
         * a 400 status is returned with an error message indicating the invalid API key.
         */
        test('POST/shadowUpdatePumpWater should handle missing api key', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/shadowUpdatePumpWater')
                .send({
                thingName: testDevice.thing_name,
                shadowPump: true,
            });
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "x-api-key": "Invalid API key",
            });
        }));
        /**
         * Test POST /dashboard/shadowUpdatePumpWater should handle getting device from database errors.
         * This test checks that if the device cannot be found in the database,
         * a 500 status is returned with an appropriate error message.
         */
        test('POST/shadowUpdatePumpWater should handle getting device from database errors', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.getDeviceThing.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/shadowUpdatePumpWater')
                .set('x-api-key', process.env.API_KEY)
                .send({
                thingName: testDevice.thing_name,
                shadowPump: true,
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error finding user device.');
            expect(index_1.emitToUser).not.toHaveBeenCalled();
        }));
        /**
         * Test POST /dashboard/shadowUpdatePumpWater should handle emit to user errors.
         * This test verifies that if emitting an event to the user fails,
         * a 500 status is returned with the corresponding error message.
         */
        test('POST/shadowUpdatePumpWater should handle emit to user errors', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.getDeviceThing.mockResolvedValue(testDevice);
            index_1.emitToUser.mockRejectedValueOnce(new Error('Emit to user failed'));
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/shadowUpdatePumpWater')
                .set('x-api-key', process.env.API_KEY)
                .send({
                thingName: testDevice.thing_name,
                shadowPump: true,
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Emit to user failed');
        }));
        /**
         * Test POST /dashboard/shadowUpdatePumpWater should handle update shadow errors.
         * This test ensures that if updating the device shadow fails,
         * a 500 status is returned with the appropriate error message.
         */
        test('POST/shadowUpdatePumpWater should handle update shadow errors', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.getDeviceThing.mockResolvedValue(testDevice);
            const mockIotData = aws_sdk_1.default.IotData;
            const instance = new mockIotData();
            instance.updateThingShadow.mockReturnValue({
                promise: null,
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/dashboard/shadowUpdatePumpWater')
                .set('x-api-key', process.env.API_KEY)
                .send({
                thingName: testDevice.thing_name,
                shadowPump: true,
            });
            expect(response.status).toBe(500);
            expect(index_1.emitToUser).toHaveBeenCalledWith(testUser.user_id, "shadowUpdatePumpWater", { device: testDevice, thing_name: testDevice.thing_name, shadow_pump: true });
            expect(response.body.message).toBe('Failed to update device shadow.');
        }));
        /**
         * Test GET /dashboard/deviceShadow should get AWS IoT device shadow when valid data is provided.
         * This test checks that a valid request successfully retrieves the device shadow,
         * returning a 201 status with the correct message.
         */
        test('GET/deviceShadow should get aws iot device shadow when valid data is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            const mockIotData = aws_sdk_1.default.IotData;
            const instance = new mockIotData();
            const mockGetThingShadowResponse = {
                payload: JSON.stringify(testDeviceShadow),
            };
            instance.getThingShadow.mockReturnValue({
                promise: jest.fn().mockResolvedValue(mockGetThingShadowResponse),
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/dashboard/deviceShadow')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .query({ thingName: testDevice.thing_name });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Fetched Shadow Successfully.');
            expect(instance.getThingShadow).toHaveBeenCalledWith({
                thingName: testDevice.thing_name
            });
        }));
        /**
         * Test GET /dashboard/deviceShadow should handle missing thingName.
         * This test verifies that when the required thingName parameter is missing,
         * a 400 status is returned with an appropriate error message.
         */
        test('GET/deviceShadow should handle missing thingName', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/dashboard/deviceShadow')
                .set('Authorization', `Bearer ${testUser.accessToken}`);
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "thingName": "Thing name is required",
            });
        }));
        /**
         * Test GET /dashboard/deviceShadow should handle shadow get errors.
         * This test ensures that if an error occurs while retrieving the device shadow,
         * a 500 status is returned with the appropriate error message.
         */
        test('GET/deviceShadow should handle shadow get errors', () => __awaiter(void 0, void 0, void 0, function* () {
            jwtManager_1.verifyToken.mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });
            const mockIotData = aws_sdk_1.default.IotData;
            const instance = new mockIotData();
            const mockGetThingShadowResponse = {
                payload: null,
            };
            instance.getThingShadow.mockReturnValue({
                promise: null,
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/dashboard/deviceShadow')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .query({ thingName: testDevice.thing_name });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to get device shadow.');
        }));
    });
});