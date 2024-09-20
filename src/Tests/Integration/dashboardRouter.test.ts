import request from 'supertest';
import { app, server  } from '../../app';
import { verifyToken } from '../../Helper/jwtManager';
import { getUserDevices, getDeviceLogs, getLastDeviceLog, addUserDevice, getFactoryDevice, updateDeviceWifi, getUserDevice, getDeviceThing, updatePresenceConnection } from '../../MySQL/database';
import { encrypt } from '../../Helper/myCrypto';
import AWS from 'aws-sdk';
import { emitToUser } from '../../sockets/index';

jest.mock('../../sockets/index', () => ({
    emitToUser: jest.fn(),
    initSocket: jest.fn(),
    connectSocket: jest.fn(),
}));

jest.mock('../../Helper/jwtManager', () => ({
    verifyToken: jest.fn(),
}));

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

jest.mock('../../Helper/myCrypto', () => ({
    encrypt: jest.fn(),
}));

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
        })) as unknown as jest.MockedClass<typeof AWS.IotData>,
        config: {
            update: jest.fn(),
        },
    };
});

describe('Dashboard Router Integration Tests', () => {
    const expiryMinutes = 15;
    const resetTokenExpiryTimestamp = Date.now() + (expiryMinutes * 60 * 1000);
    const formattedResetTokenExpiry = new Date(resetTokenExpiryTimestamp).toISOString();
    
    interface TestUser {
        user_id: number,
        first_name: string,
        last_name: string,
        email: string,
        password: string,
        hashPassword: string,
        refresh_token: string,
        reset_token_expiry: string,
        reset_token: string,
        accessToken: string,
        invalidAccessToken: string
    };

    interface TestDevice {
        device_id: number;
        cat_num: string;
        user_id: number;
        wifi_ssid: string;
        wifi_password: string;
        init_vec: string;
        presence_connection: boolean;
        location: string;
        thing_name: string;
    };
    
    interface TestDeviceLog {
        log_id: number;
        cat_num: string;
        soil_temp: number;
        soil_cap: number;
        log_date: string;
        water: boolean;
    };

    interface TestFactoryDevice {
        factory_id: number,
        cat_num: string,
        factory_date: string,
        thing_name: string,
    };

    interface TestDeviceShadow {
        state: {
            reported: {
                welcome: string;
                connected: boolean;
                auto: boolean;
                pump: boolean;
            };
            desired: {
                welcome: string;
                connected: boolean;
                auto: boolean;
                pump: boolean;
            };
        };
        metadata?: any;
    }

    const testUser: TestUser = {
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

    const testDevice: TestDevice = {
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

    const testDeviceLog: TestDeviceLog = {
        log_id: 1,
        cat_num: "A1B1C1",
        soil_temp: 30,
        soil_cap: 1500,
        log_date: "2024-09-18T12:10:38.311Z",
        water: false,
    };

    const testFactoryDevice: TestFactoryDevice = {
        factory_id: 1,
        cat_num: "A1B1C1",
        factory_date: "2024-09-18T12:10:38.311Z",
        thing_name: "mockThing",
    };

    const testDeviceShadow: TestDeviceShadow =  {
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
    }

    afterAll(() => {
      server.close();
    });

    beforeAll(() => {
        process.env.EMAIL_FROM = 'server@gmail.com';
        process.env.AUTH_ACCESS_TOKEN_SECRET = 'accessTokenSecret';
        process.env.API_CLIENT_KEY = 'apiKey';
        process.env.AUTH_REFRESH_TOKEN_SECRET = 'refreshTokenSecret';
        process.env.BASE_URL = 'http://localhost:3000';
        process.env.AWS_IOT_ENDPOINT = 'mockAwsEndpoint';
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Dashboard Router Integration Tests', () => {
        test('GET/userDevices should return user devices when access token is valid', async () => {
            
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (getUserDevices as jest.Mock).mockResolvedValue([testDevice]);

            const response = await request(app)
            .get('/dashboard/userDevices')
            .set('Authorization', `Bearer ${testUser.accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.devices).toEqual([testDevice]);
        });

        test('GET/userDevices should handle if accessToken is missing user information', async () => {
            
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { some_other_field: 'value' };
            });

            const response = await request(app)
            .get('/dashboard/userDevices')
            .set('Authorization', `Bearer ${testUser.accessToken}`);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid access token");
        });

        test('Dashboard GET & POST should handle if access token is missing', async () => {
            (verifyToken as jest.Mock).mockImplementation(() => {
                throw new Error('Token verification failed');
            });
            
            const response = await request(app)
            .get('/dashboard/userDevices')
            .set('Authorization', `Bearer incorrectToken`);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Token verification failed');
        });

        test('GET/deviceLogs should return device logs and last log', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (getDeviceLogs as jest.Mock).mockResolvedValue([testDeviceLog]);
            (getLastDeviceLog as jest.Mock).mockResolvedValue(testDeviceLog);

            const response = await request(app)
            .get('/dashboard/deviceLogs')
            .set('Authorization', `Bearer ${testUser.accessToken}`)
            .query({ cat_num: testDevice.cat_num });
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Fetch Successfully.',
                deviceLogs: [testDeviceLog],
                lastLog: testDeviceLog,
            });
        });

        test('GET/deviceLogs should handle missing cat_num', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            const response = await request(app)
            .get('/dashboard/deviceLogs')
            .set('Authorization', `Bearer ${testUser.accessToken}`);
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({"cat_num": "Catalog number is required"});
        });

        test('POST/addDevice should add a new device when valid data is provided', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (getFactoryDevice as jest.Mock).mockResolvedValue(testFactoryDevice);
            (encrypt as jest.Mock).mockResolvedValue({ content: testDevice.wifi_password, iv: testDevice.init_vec });
            (addUserDevice as jest.Mock).mockResolvedValue(testDevice);


            const response = await request(app)
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
        });

        test('POST/addDevice should handle missing location, cat_num, wifi_ssid, and wifi_password', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            const response = await request(app)
            .post('/dashboard/addDevice')
            .set('Authorization', `Bearer ${testUser.accessToken}`);
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "cat_num": "Catalog number is required",
                "location": "Location is required",
                "wifi_ssid": "Wifi_ssid is required",
                "wifi_password": "Wifi_password is required",
            });
        });

        test('POST/addDevice should handle unapproved cat_num', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (getFactoryDevice as jest.Mock).mockResolvedValue(null);


            const response = await request(app)
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
        });

        test('POST/addDevice should handle adding device to database errors', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (getFactoryDevice as jest.Mock).mockResolvedValue(testFactoryDevice);
            (encrypt as jest.Mock).mockResolvedValue({ content: testDevice.wifi_password, iv: testDevice.init_vec });
            (addUserDevice as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
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
        });

        test('POST/updateWifi should update wifi credentials when valid data is provided', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (encrypt as jest.Mock).mockImplementation(() => { 
                return {content: testDevice.wifi_password, iv: testDevice.init_vec}
            });

            (updateDeviceWifi as jest.Mock).mockResolvedValue(testDevice);

            const response = await request(app)
                .post('/dashboard/updateWifi')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                    device_id: testDevice.device_id,
                    wifi_ssid: testDevice.wifi_ssid,
                    wifi_password: testDevice.wifi_password,
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('The device network has been updated!');
        });

        test('POST/updateWifi should handle missing device_id, wifi_ssid, and wifi_password', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            const response = await request(app)
            .post('/dashboard/updateWifi')
            .set('Authorization', `Bearer ${testUser.accessToken}`);
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "device_id": "Device_id number is required",
                "wifi_ssid": "Wifi_ssid is required",
                "wifi_password": "Wifi_password is required",
            });
        });

        test('POST/updateWifi should handle updating device wifi to database errors', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (encrypt as jest.Mock).mockImplementation(() => { 
                return {content: testDevice.wifi_password, iv: testDevice.init_vec}
            });

            (updateDeviceWifi as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/dashboard/updateWifi')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                    device_id: testDevice.device_id,
                    wifi_ssid: testDevice.wifi_ssid,
                    wifi_password: testDevice.wifi_password,
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Error updating device network.');
        });

        test('POST/updateAuto should update auto state when valid data is provided', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (getUserDevice as jest.Mock).mockResolvedValue(testDevice);

            const mockIotData = AWS.IotData as jest.MockedClass<typeof AWS.IotData>;
            const instance = new mockIotData();

            const mockUpdateThingShadowResponse = {
                payload: JSON.stringify({ message: 'Shadow updated successfully' }),
            };

            (instance.updateThingShadow as jest.Mock).mockReturnValue({
                promise: jest.fn().mockResolvedValue(mockUpdateThingShadowResponse),
            });

            const response = await request(app)
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
        });
        
        test('POST/updateAuto should handle missing device_id, and automate', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            const response = await request(app)
            .post('/dashboard/updateAuto')
            .set('Authorization', `Bearer ${testUser.accessToken}`);
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "device_id": "Device_id number is required",
                "automate": "Automate is required",
            });
        });
        
        test('POST/updateAuto should handle getting device from database errors', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (getUserDevice as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/dashboard/updateAuto')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                    device_id: testDevice.device_id,
                    automate: true,
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Error getting device info.');
        });

        test('POST/updateAuto should handle shadow update errors', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (getUserDevice as jest.Mock).mockResolvedValue(testDevice);

            const mockIotData = AWS.IotData as jest.MockedClass<typeof AWS.IotData>;
            const instance = new mockIotData();

            (instance.updateThingShadow as jest.Mock).mockReturnValue({
                promise: null,
            });

            const response = await request(app)
                .post('/dashboard/updateAuto')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                    device_id: testDevice.device_id,
                    automate: true,
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to update device shadow.');
        });

        test('POST/shadowUpdateAuto should emit auto state change to user from aws lambda', async () => {

            (getDeviceThing as jest.Mock).mockResolvedValue(testDevice);

            const response = await request(app)
                .post('/dashboard/shadowUpdateAuto')
                .set('x-api-key', process.env.API_CLIENT_KEY as string)
                .send({
                    thingName: testDevice.thing_name,
                    shadowAuto: true,
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Shadow auto update received');
            expect(emitToUser).toHaveBeenCalledWith(testUser.user_id, "shadowUpdateAuto", { device: testDevice, thing_name: testDevice.thing_name, shadow_auto: true });
        });
        
        test('POST/shadowUpdateAuto should handle missing thingName and shadowAuto', async () => {

            const response = await request(app)
                .post('/dashboard/shadowUpdateAuto')
                .set('x-api-key', process.env.API_CLIENT_KEY as string);
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "thingName": "ThingName is required",
                "shadowAuto": "shadowAuto is required",
            });
        });

        test('POST/shadowUpdateAuto should handle missing api key', async () => {

            const response = await request(app)
                .post('/dashboard/shadowUpdateAuto')
                .send({
                    thingName: testDevice.thing_name,
                    shadowAuto: true,
                });
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "x-api-key": "Invalid API key",
            });
        });
        
        test('POST/shadowUpdateAuto should handle getting device from database errors', async () => {
            (getDeviceThing as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/dashboard/shadowUpdateAuto')
                .set('x-api-key', process.env.API_CLIENT_KEY as string)
                .send({
                    thingName: testDevice.thing_name,
                    shadowAuto: true,
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error finding user device.');
            expect(emitToUser).not.toHaveBeenCalled();
        });

        test('POST/shadowUpdateAuto should handle emit to user errors', async () => {
            (getDeviceThing as jest.Mock).mockResolvedValue(testDevice);

            (emitToUser as jest.Mock).mockRejectedValueOnce(new Error('Emit to user failed'));

            const response = await request(app)
                .post('/dashboard/shadowUpdateAuto')
                .set('x-api-key', process.env.API_CLIENT_KEY as string)
                .send({
                    thingName: testDevice.thing_name,
                    shadowAuto: true,
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Emit to user failed');
        });

        test('POST/presenceUpdateConnection should emit connection state change to user from aws iot', async () => {

            (getDeviceThing as jest.Mock).mockResolvedValue(testDevice);

            (updatePresenceConnection as jest.Mock).mockResolvedValue(testDevice);

            const response = await request(app)
                .post('/dashboard/presenceUpdateConnection')
                .set('x-api-key', process.env.API_CLIENT_KEY as string)
                .send({
                    thingName: testDevice.thing_name,
                    presenceConnection: false,
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Shadow connection update received');
            expect(emitToUser).toHaveBeenCalledWith(testUser.user_id, "presenceUpdateConnection", { device: testDevice, thing_name: testDevice.thing_name, presence_connection: testDevice.presence_connection });
        });
        
        test('POST/presenceUpdateConnection should handle missing thingName and presenceConnection', async () => {

            const response = await request(app)
                .post('/dashboard/presenceUpdateConnection')
                .set('x-api-key', process.env.API_CLIENT_KEY as string);
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "thingName": "ThingName is required",
                "presenceConnection": "presenceConnection is required",
            });
        });

        test('POST/presenceUpdateConnection should handle missing api key', async () => {

            const response = await request(app)
                .post('/dashboard/presenceUpdateConnection')
                .send({
                    thingName: testDevice.thing_name,
                    presenceConnection: false,
                });
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "x-api-key": "Invalid API key",
            });
        });
        
        test('POST/presenceUpdateConnection should handle getting device from database errors', async () => {
            (getDeviceThing as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/dashboard/presenceUpdateConnection')
                .set('x-api-key', process.env.API_CLIENT_KEY as string)
                .send({
                    thingName: testDevice.thing_name,
                    presenceConnection: false,
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error finding user device');
            expect(emitToUser).not.toHaveBeenCalled();
        });

        test('POST/presenceUpdateConnection should handle emit to user errors', async () => {
            (getDeviceThing as jest.Mock).mockResolvedValue(testDevice);

            (emitToUser as jest.Mock).mockRejectedValueOnce(new Error('Emit to user failed'));

            const response = await request(app)
                .post('/dashboard/presenceUpdateConnection')
                .set('x-api-key', process.env.API_CLIENT_KEY as string)
                .send({
                    thingName: testDevice.thing_name,
                    presenceConnection: false,
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Emit to user failed');
        });

        test('POST/updatePumpWater should update pump state when valid data is provided', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (getUserDevice as jest.Mock).mockResolvedValue(testDevice);

            const mockIotData = AWS.IotData as jest.MockedClass<typeof AWS.IotData>;
            const instance = new mockIotData();

            const mockUpdateThingShadowResponse = {
                payload: JSON.stringify({ message: 'Shadow updated successfully' }),
            };

            (instance.updateThingShadow as jest.Mock).mockReturnValue({
                promise: jest.fn().mockResolvedValue(mockUpdateThingShadowResponse),
            });

            const response = await request(app)
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
        });
        
        test('POST/updatePumpWater should handle missing device_id, and pump_water', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            const response = await request(app)
            .post('/dashboard/updatePumpWater')
            .set('Authorization', `Bearer ${testUser.accessToken}`);
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "device_id": "Device_id number is required",
                "pump_water": "Pump_water is required",
            });
        });
        
        test('POST/updatePumpWater should handle getting device from database errors', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (getUserDevice as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/dashboard/updatePumpWater')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                    device_id: testDevice.device_id,
                    pump_water: true,
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Error getting device info.');
        });

        test('POST/updatePumpWater should handle shadow update errors', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            (getUserDevice as jest.Mock).mockResolvedValue(testDevice);

            const mockIotData = AWS.IotData as jest.MockedClass<typeof AWS.IotData>;
            const instance = new mockIotData();

            (instance.updateThingShadow as jest.Mock).mockReturnValue({
                promise: null,
            });

            const response = await request(app)
                .post('/dashboard/updatePumpWater')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .send({
                    device_id: testDevice.device_id,
                    pump_water: true,
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to update device shadow.');
        });

        test('POST/shadowUpdatePumpWater should emit pump_water state change to user from aws lambda', async () => {

            (getDeviceThing as jest.Mock).mockResolvedValue(testDevice);

            const mockIotData = AWS.IotData as jest.MockedClass<typeof AWS.IotData>;
            const instance = new mockIotData();

            const mockUpdateThingShadowResponse = {
                payload: JSON.stringify({ message: 'Shadow updated successfully' }),
            };

            (instance.updateThingShadow as jest.Mock).mockReturnValue({
                promise: jest.fn().mockResolvedValue(mockUpdateThingShadowResponse),
            });

            const response = await request(app)
                .post('/dashboard/shadowUpdatePumpWater')
                .set('x-api-key', process.env.API_CLIENT_KEY as string)
                .send({
                    thingName: testDevice.thing_name,
                    shadowPump: true,
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Shadow pump water update received');
            expect(emitToUser).toHaveBeenCalledWith(testUser.user_id, "shadowUpdatePumpWater", { device: testDevice, thing_name: testDevice.thing_name, shadow_pump: true });
            expect(instance.updateThingShadow).toHaveBeenCalledWith({
                thingName: testDevice.thing_name,
                payload: JSON.stringify({ state: { desired: { pump: false }, reported: { pump: false } } }),
            });
        });
        
        test('POST/shadowUpdatePumpWater should handle missing thingName and shadowPump', async () => {

            const response = await request(app)
                .post('/dashboard/shadowUpdatePumpWater')
                .set('x-api-key', process.env.API_CLIENT_KEY as string);
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "thingName": "ThingName is required",
                "shadowPump": "shadowPump is required",
            });
        });

        test('POST/shadowUpdatePumpWater should handle missing api key', async () => {

            const response = await request(app)
                .post('/dashboard/shadowUpdatePumpWater')
                .send({
                    thingName: testDevice.thing_name,
                    shadowPump: true,
                });
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "x-api-key": "Invalid API key",
            });
        });
        
        test('POST/shadowUpdatePumpWater should handle getting device from database errors', async () => {
            (getDeviceThing as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/dashboard/shadowUpdatePumpWater')
                .set('x-api-key', process.env.API_CLIENT_KEY as string)
                .send({
                    thingName: testDevice.thing_name,
                    shadowPump: true,
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error finding user device.');
            expect(emitToUser).not.toHaveBeenCalled();
        });

        test('POST/shadowUpdatePumpWater should handle emit to user errors', async () => {
            (getDeviceThing as jest.Mock).mockResolvedValue(testDevice);

            (emitToUser as jest.Mock).mockRejectedValueOnce(new Error('Emit to user failed'));

            const response = await request(app)
                .post('/dashboard/shadowUpdatePumpWater')
                .set('x-api-key', process.env.API_CLIENT_KEY as string)
                .send({
                    thingName: testDevice.thing_name,
                    shadowPump: true,
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Emit to user failed');
        });

        test('POST/shadowUpdatePumpWater should handle update shadow errors', async () => {
            (getDeviceThing as jest.Mock).mockResolvedValue(testDevice);

            const mockIotData = AWS.IotData as jest.MockedClass<typeof AWS.IotData>;
            const instance = new mockIotData();

            (instance.updateThingShadow as jest.Mock).mockReturnValue({
                promise: null,
            });

            const response = await request(app)
                .post('/dashboard/shadowUpdatePumpWater')
                .set('x-api-key', process.env.API_CLIENT_KEY as string)
                .send({
                    thingName: testDevice.thing_name,
                    shadowPump: true,
                });

            expect(response.status).toBe(500);
            expect(emitToUser).toHaveBeenCalledWith(testUser.user_id, "shadowUpdatePumpWater", { device: testDevice, thing_name: testDevice.thing_name, shadow_pump: true });
            expect(response.body.message).toBe('Failed to update device shadow.');
        });

        test('GET/deviceShadow should get aws iot device shadow when valid data is provided', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            const mockIotData = AWS.IotData as jest.MockedClass<typeof AWS.IotData>;
            const instance = new mockIotData();

            const mockGetThingShadowResponse = {
                payload: JSON.stringify(testDeviceShadow),
            };

            (instance.getThingShadow as jest.Mock).mockReturnValue({
                promise: jest.fn().mockResolvedValue(mockGetThingShadowResponse),
            });

            const response = await request(app)
                .get('/dashboard/deviceShadow')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .query({ thingName: testDevice.thing_name });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Fetched Shadow Successfully.');
            expect(instance.getThingShadow).toHaveBeenCalledWith({
                thingName: testDevice.thing_name
            });
        });
        
        test('GET/deviceShadow should handle missing thingName', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            const response = await request(app)
                .get('/dashboard/deviceShadow')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
            
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual({
                "thingName": "Thing name is required",
            });
        });

        test('GET/deviceShadow should handle shadow get errors', async () => {
            (verifyToken as jest.Mock).mockImplementation((token, secret) => {
                return { user_id: testUser.user_id };
            });

            const mockIotData = AWS.IotData as jest.MockedClass<typeof AWS.IotData>;
            const instance = new mockIotData();

            const mockGetThingShadowResponse = {
                payload: null,
            };

            (instance.getThingShadow as jest.Mock).mockReturnValue({
                promise: null,
            });

            const response = await request(app)
                .get('/dashboard/deviceShadow')
                .set('Authorization', `Bearer ${testUser.accessToken}`)
                .query({ thingName: testDevice.thing_name });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to get device shadow.');
        });
    
    });
});