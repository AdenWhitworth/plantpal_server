import {
    pool,
    getUsers,
    getUserByEmail,
    getUserById,
    createUser,
    updateLastLoginTime,
    updateUserInfo,
    updateUserPassword,
    updateRefreshToken,
    updateResetToken,
    clearResetToken,
    getUserDevices,
    getUserDevice,
    addUserDevice,
    updateDeviceWifi,
    getFactoryDevice,
    getDeviceLogs,
    getLastDeviceLog,
    updateUserSocketId,
    getUserBySocket,
    getDevice,
    getDeviceThing,
    updatePresenceConnection
} from '../../MySQL/database';
import { RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2/promise';

jest.mock('mysql2/promise', () => ({
    createPool: () => ({
        query: jest.fn()
    })
}));

describe('Database functions', () => {
    const mockQuery = jest.spyOn(pool, 'query');

    interface User {
        user_id: number;
        first_name: string;
        last_name: string;
        email: string;
        password: string;
        last_login: string | null;
        refresh_token?: string | null;
        reset_token?: string | null;
        reset_token_expiry?: string | null;
        socket_id?: string | null;
    }

    interface Device {
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
    
    interface DeviceLog {
        log_id: number;
        cat_num: string;
        soil_temp: number;
        soil_cap: number;
        log_date: string;
        water: boolean;
    };
    
    interface FactoryDevice {
        factory_id: number,
        cat_num: string,
        factory_date: string,
        thing_name: string,
    }

    const testUser: User = {
        user_id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        refresh_token: 'mockRefreshToken',
        reset_token_expiry: "2024-09-18T22:47:46.000Z",
        reset_token: 'mockResetToken%20resetTokenSecret',
        last_login: "2024-09-18T22:47:46.000Z",
        socket_id: "mockSocketId",
    }


    const testDevice: Device = {
        device_id: 1,
        cat_num: "A1B1C1",
        user_id: 1,
        wifi_ssid: "mockSSID",
        wifi_password: "mockPassword",
        init_vec: "mockVec",
        presence_connection: false,
        location: "Kitchen",
        thing_name: "mockThing",
    };
    
    const testDeviceLog: DeviceLog =  {
        log_id: 1,
        cat_num: "A1B1C1",
        soil_temp: 30.0,
        soil_cap: 1500,
        log_date: "2024-09-18T22:47:46.000Z",
        water: false,
    };
    
    const testFactoryDevice: FactoryDevice =  {
        factory_id: 1,
        cat_num: "A1B1C1",
        factory_date: "2024-09-18T22:47:46.000Z",
        thing_name: "mockThing",
    }

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUsers', () => {
        it('should return a list of users', async () => {
            const mockUsers: RowDataPacket[] = [{ testUser } as RowDataPacket];
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([mockUsers, mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getUsers();

            expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM users");
            expect(result).toEqual(mockUsers);
        });
    });

    describe('getUserByEmail', () => {
        it('should return a user by email', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getUserByEmail(testUser.email);

            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE Lower(email) = ?', [testUser.email]);
            expect(result).toEqual(mockUser);
        });

        it('should return undefined if no user found', async () => {
            const undefinedEmail = 'notfound@example.com';
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getUserByEmail(undefinedEmail);

            expect(result).toBeUndefined();
        });
    });

    describe('getUserById', () => {
        it('should return a user by ID', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getUserById(testUser.user_id);

            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE user_id = ?', [testUser.user_id]);
            expect(result).toEqual(mockUser);
        });
    });

    describe('createUser', () => {
        it('should create a new user and return the user data', async () => {
            
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockInsertResult: ResultSetHeader = {
                affectedRows: 1,
                fieldCount: 0,
                insertId: 1,
                info: '',
                serverStatus: 2,
                warningCount: 0,
                message: '',
                protocol41: true,
                changedRows: 0,
                warningStatus: 0
            } as ResultSetHeader;
            const mockFields: FieldPacket[] = [];
            mockQuery
                .mockResolvedValueOnce([mockInsertResult, mockFields] as [ResultSetHeader, FieldPacket[]])
                .mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await createUser(testUser.first_name, testUser.last_name, testUser.email, testUser.password);

            expect(mockQuery).toHaveBeenNthCalledWith(1, 
                'INSERT INTO users (first_name, last_name, email, password, last_login) VALUES(?, ?, ?, ?, NULL)',
                [testUser.first_name, testUser.last_name, testUser.email, testUser.password]
            );
            expect(mockQuery).toHaveBeenNthCalledWith(2, 
                'SELECT * FROM users WHERE user_id = ?',
                [testUser.user_id]
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('updateLastLoginTime', () => {
        it('should update the last login time and return the updated user', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockFields: FieldPacket[] = [];
            mockQuery
                .mockResolvedValueOnce([{}, mockFields] as [ResultSetHeader, FieldPacket[]])
                .mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await updateLastLoginTime(testUser.user_id);

            expect(mockQuery).toHaveBeenNthCalledWith(1, 
                'UPDATE users SET last_login = now() WHERE user_id = ?',
                [testUser.user_id]
            );
            expect(mockQuery).toHaveBeenNthCalledWith(2, 
                'SELECT * FROM users WHERE user_id = ?',
                [testUser.user_id]
            );
            expect(result).toEqual(mockUser);
        });
    });


    //////////////////////////////////////////////////

    describe('updateUserInfo', () => {
        it('should update user information', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockInsertResult: ResultSetHeader = {
                affectedRows: 1,
                fieldCount: 0,
                insertId: 1,
                info: '',
                serverStatus: 2,
                warningCount: 0,
                message: '',
                protocol41: true,
                changedRows: 0,
                warningStatus: 0
            } as ResultSetHeader;
            const mockFields: FieldPacket[] = [];
            mockQuery
                .mockResolvedValueOnce([mockInsertResult, mockFields] as [ResultSetHeader, FieldPacket[]])
                .mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await updateUserInfo(testUser.user_id, testUser.first_name, testUser.last_name, testUser.email);

            expect(mockQuery).toHaveBeenNthCalledWith(1,
                'UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ?',
                [testUser.first_name, testUser.last_name, testUser.email, testUser.user_id]
            );
            expect(mockQuery).toHaveBeenNthCalledWith(2, 
                'SELECT * FROM users WHERE user_id = ?',
                [testUser.user_id]
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('updateUserPassword', () => {
        it('should update user password', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockInsertResult: ResultSetHeader = {
                affectedRows: 1,
                fieldCount: 0,
                insertId: 1,
                info: '',
                serverStatus: 2,
                warningCount: 0,
                message: '',
                protocol41: true,
                changedRows: 0,
                warningStatus: 0
            } as ResultSetHeader;
            const mockFields: FieldPacket[] = [];
            mockQuery
                .mockResolvedValueOnce([mockInsertResult, mockFields] as [ResultSetHeader, FieldPacket[]])
                .mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await updateUserPassword(testUser.user_id, testUser.password);

            expect(mockQuery).toHaveBeenNthCalledWith(1,
                'UPDATE users SET password = ? WHERE user_id = ?',
                [testUser.password, testUser.user_id]
            );
            expect(mockQuery).toHaveBeenNthCalledWith(2, 
                'SELECT * FROM users WHERE user_id = ?',
                [testUser.user_id]
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('updateRefreshToken', () => {
        it('should update the refresh token', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockInsertResult: ResultSetHeader = {
                affectedRows: 1,
                fieldCount: 0,
                insertId: 1,
                info: '',
                serverStatus: 2,
                warningCount: 0,
                message: '',
                protocol41: true,
                changedRows: 0,
                warningStatus: 0
            } as ResultSetHeader;
            const mockFields: FieldPacket[] = [];
            mockQuery
                .mockResolvedValueOnce([mockInsertResult, mockFields] as [ResultSetHeader, FieldPacket[]])
                .mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await updateRefreshToken(testUser.user_id, testUser.refresh_token as string);

            expect(mockQuery).toHaveBeenNthCalledWith(1,
                'UPDATE users SET refresh_token = ? WHERE user_id = ?',
                [testUser.refresh_token, testUser.user_id]
            );
            expect(mockQuery).toHaveBeenNthCalledWith(2, 
                'SELECT * FROM users WHERE user_id = ?',
                [testUser.user_id]
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('updateResetToken', () => {
        it('should update the reset token', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockInsertResult: ResultSetHeader = {
                affectedRows: 1,
                fieldCount: 0,
                insertId: 1,
                info: '',
                serverStatus: 2,
                warningCount: 0,
                message: '',
                protocol41: true,
                changedRows: 0,
                warningStatus: 0
            } as ResultSetHeader;
            const mockFields: FieldPacket[] = [];
            mockQuery
                .mockResolvedValueOnce([mockInsertResult, mockFields] as [ResultSetHeader, FieldPacket[]])
                .mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await updateResetToken(testUser.user_id, testUser.reset_token as string, testUser.reset_token_expiry as string);

            expect(mockQuery).toHaveBeenNthCalledWith(1,
                'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?',
                [testUser.reset_token, testUser.reset_token_expiry, testUser.user_id]
            );
            expect(mockQuery).toHaveBeenNthCalledWith(2, 
                'SELECT * FROM users WHERE user_id = ?',
                [testUser.user_id]
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('clearResetToken', () => {
        it('should clear the reset token', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockInsertResult: ResultSetHeader = {
                affectedRows: 1,
                fieldCount: 0,
                insertId: 1,
                info: '',
                serverStatus: 2,
                warningCount: 0,
                message: '',
                protocol41: true,
                changedRows: 0,
                warningStatus: 0
            } as ResultSetHeader;
            const mockFields: FieldPacket[] = [];
            mockQuery
                .mockResolvedValueOnce([mockInsertResult, mockFields] as [ResultSetHeader, FieldPacket[]])
                .mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await clearResetToken(testUser.user_id);

            expect(mockQuery).toHaveBeenNthCalledWith(1,
                'UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?',
                [testUser.user_id]
            );
            expect(mockQuery).toHaveBeenNthCalledWith(2, 
                'SELECT * FROM users WHERE user_id = ?',
                [testUser.user_id]
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('getUserDevices', () => {
        it('should return user devices', async () => {
            const mockDevices: RowDataPacket[] = [{ testDevice } as RowDataPacket];
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([mockDevices, mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getUserDevices(testDevice.user_id);

            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM devices WHERE user_id = ?',
                [testDevice.user_id]
            );
            expect(result).toEqual(mockDevices);
        });
    });

    describe('getUserDevice', () => {
        it('should return a specific user device', async () => {
            const mockDevice: RowDataPacket = testDevice as RowDataPacket;
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[mockDevice], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getUserDevice(testDevice.device_id);

            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM devices WHERE device_id = ?',
                [testDevice.device_id]
            );
            expect(result).toEqual(mockDevice);
        });
    });

    describe('addUserDevice', () => {
        it('should add a new user device', async () => {
            const mockDevice: RowDataPacket = testDevice as RowDataPacket;
            const mockInsertResult: ResultSetHeader = {
                affectedRows: 1,
                fieldCount: 0,
                insertId: 1,
                info: '',
                serverStatus: 2,
                warningCount: 0,
                message: '',
                protocol41: true,
                changedRows: 0,
                warningStatus: 0
            } as ResultSetHeader;
            const mockFields: FieldPacket[] = [];
            mockQuery
                .mockResolvedValueOnce([mockInsertResult, mockFields] as [ResultSetHeader, FieldPacket[]])
                .mockResolvedValueOnce([[mockDevice], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await addUserDevice(testDevice.cat_num, testDevice.user_id, testDevice.wifi_ssid, testDevice.wifi_password, testDevice.init_vec, testDevice.presence_connection, testDevice.location, testDevice.thing_name);

            expect(mockQuery).toHaveBeenNthCalledWith(1,
                'INSERT INTO devices (cat_num, user_id, wifi_ssid, wifi_password, init_vec, presence_connection, location, thing_name) VALUES(?, ?, ?, ?, ?, ?, ?, ?)',
                [testDevice.cat_num, testDevice.user_id, testDevice.wifi_ssid, testDevice.wifi_password, testDevice.init_vec, testDevice.presence_connection, testDevice.location, testDevice.thing_name]
            );
            expect(mockQuery).toHaveBeenNthCalledWith(2,
                'SELECT * FROM devices WHERE device_id = ?',
                [testDevice.device_id]
            );
            expect(result).toEqual(mockDevice);
        });
    });

    describe('updateDeviceWifi', () => {
        it('should update the device WiFi', async () => {
            const mockDevice: RowDataPacket = testDevice as RowDataPacket;
            const mockInsertResult: ResultSetHeader = {
                affectedRows: 1,
                fieldCount: 0,
                insertId: 1,
                info: '',
                serverStatus: 2,
                warningCount: 0,
                message: '',
                protocol41: true,
                changedRows: 0,
                warningStatus: 0
            } as ResultSetHeader;
            const mockFields: FieldPacket[] = [];
            mockQuery
                .mockResolvedValueOnce([mockInsertResult, mockFields] as [ResultSetHeader, FieldPacket[]])
                .mockResolvedValueOnce([[mockDevice], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await updateDeviceWifi(testDevice.device_id, testDevice.wifi_ssid, testDevice.wifi_password, testDevice.init_vec);

            expect(mockQuery).toHaveBeenNthCalledWith(1,
                `UPDATE devices SET wifi_ssid = ?, wifi_password = ?, init_vec = ? WHERE device_id = ?`,
                [testDevice.wifi_ssid, testDevice.wifi_password, testDevice.init_vec, testDevice.device_id]
            );
            expect(mockQuery).toHaveBeenNthCalledWith(2,
                'SELECT * FROM devices WHERE device_id = ?',
                [testDevice.device_id]
            );
            expect(result).toEqual(mockDevice);
        });
    });

    describe('getFactoryDevice', () => {
        it('should return a factory device', async () => {
            const mockFactoryDevice: RowDataPacket = testFactoryDevice as RowDataPacket;
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[mockFactoryDevice], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getFactoryDevice(testDevice.cat_num);

            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM factoryDevices WHERE cat_num = ?',
                [testDevice.cat_num]
            );
            expect(result).toEqual(mockFactoryDevice);
        });
    });

    describe('getDeviceLogs', () => {
        it('should return logs for a specific device', async () => {
            const mockDeviceLogs: RowDataPacket[] = [{ testDeviceLog } as RowDataPacket];
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([mockDeviceLogs, mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getDeviceLogs(testDevice.cat_num);

            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM deviceLogs WHERE cat_num = ?',
                [testDevice.cat_num]
            );
            expect(result).toEqual(mockDeviceLogs);
        });
    });

    describe('getLastDeviceLog', () => {
        it('should return the last log for a specific device', async () => {
            const mockLastLog: RowDataPacket = testDeviceLog as RowDataPacket;
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[mockLastLog], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getLastDeviceLog(testDevice.cat_num);

            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM deviceLogs WHERE cat_num = ? ORDER BY log_date DESC LIMIT 1',
                [testDevice.cat_num]
            );
            expect(result).toEqual(mockLastLog);
        });
    });

    describe('updateUserSocketId', () => {
        it('should update the user socket ID', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockInsertResult: ResultSetHeader = {
                affectedRows: 1,
                fieldCount: 0,
                insertId: 1,
                info: '',
                serverStatus: 2,
                warningCount: 0,
                message: '',
                protocol41: true,
                changedRows: 0,
                warningStatus: 0
            } as ResultSetHeader;
            const mockFields: FieldPacket[] = [];
            mockQuery
                .mockResolvedValueOnce([mockInsertResult, mockFields] as [ResultSetHeader, FieldPacket[]])
                .mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await updateUserSocketId(testUser.user_id, testUser.socket_id as string);

            expect(mockQuery).toHaveBeenNthCalledWith(1,
                'UPDATE users SET socket_id = ? WHERE user_id = ?',
                [testUser.socket_id, testUser.user_id]
            );

            expect(mockQuery).toHaveBeenNthCalledWith(2, 
                'SELECT * FROM users WHERE user_id = ?',
                [testUser.user_id]
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('getUserBySocket', () => {
        it('should return a user by socket ID', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getUserBySocket(testUser.socket_id as string);

            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE socket_id = ?',
                [testUser.socket_id]
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe('getDevice', () => {
        it('should return a device by device ID', async () => {
            const mockDevice: RowDataPacket = testDevice as RowDataPacket;
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[mockDevice], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getDevice(testDevice.cat_num);

            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM devices WHERE cat_num = ?',
                [testDevice.cat_num]
            );
            expect(result).toEqual(mockDevice);
        });
    });

    describe('getDeviceThing', () => {
        it('should return a device thing by device ID', async () => {
            const mockDevice: RowDataPacket = testDevice as RowDataPacket;
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[mockDevice], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getDeviceThing(testDevice.thing_name);

            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM devices WHERE thing_name = ?',
                [testDevice.thing_name]
            );
            expect(result).toEqual(mockDevice);
        });
    });

    describe('updatePresenceConnection', () => {
        it('should update the presence connection status of a device', async () => {
            const mockDevice: RowDataPacket = testDevice as RowDataPacket;
            const mockInsertResult: ResultSetHeader = {
                affectedRows: 1,
                fieldCount: 0,
                insertId: 1,
                info: '',
                serverStatus: 2,
                warningCount: 0,
                message: '',
                protocol41: true,
                changedRows: 0,
                warningStatus: 0
            } as ResultSetHeader;
            const mockFields: FieldPacket[] = [];
            mockQuery
                .mockResolvedValueOnce([mockInsertResult, mockFields] as [ResultSetHeader, FieldPacket[]])
                .mockResolvedValueOnce([[mockDevice], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await updatePresenceConnection(testDevice.device_id, testDevice.presence_connection);

            expect(mockQuery).toHaveBeenNthCalledWith(1,
                'UPDATE devices SET presence_connection = ? WHERE device_id = ?',
                [testDevice.presence_connection, testDevice.device_id]
            );
            expect(mockQuery).toHaveBeenNthCalledWith(2,
                'SELECT * FROM devices WHERE device_id = ?',
                [testDevice.device_id]
            );
            expect(result).toEqual(mockDevice);
        });
    });

});
