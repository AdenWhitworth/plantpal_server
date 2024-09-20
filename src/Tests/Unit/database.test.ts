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
import { User, Device, DeviceLog, FactoryDevice } from '../../Types/types';

/**
 * Mocking the mysql2/promise module to create a pool for testing purposes.
 */
jest.mock('mysql2/promise', () => ({
    createPool: () => ({
        query: jest.fn()
    })
}));

/**
 * Tests for the `database` functions.
 * @function
 */
describe('Database functions', () => {
    const mockQuery = jest.spyOn(pool, 'query');

    /** @type {User} Test user object */
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

    /** @type {Device} Test device object */
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
    
    /** @type {DeviceLog} Test device log object */
    const testDeviceLog: DeviceLog =  {
        log_id: 1,
        cat_num: "A1B1C1",
        soil_temp: 30.0,
        soil_cap: 1500,
        log_date: "2024-09-18T22:47:46.000Z",
        water: false,
    };
    
    /** @type {FactoryDevice} Test factory device object */
    const testFactoryDevice: FactoryDevice =  {
        factory_id: 1,
        cat_num: "A1B1C1",
        factory_date: "2024-09-18T22:47:46.000Z",
        thing_name: "mockThing",
    }

    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Tests for the getUsers function.
     * @function
     */
    describe('getUsers', () => {
        /**
         * Test case to return a list of users.
         */
        it('should return a list of users', async () => {
            const mockUsers: RowDataPacket[] = [{ testUser } as RowDataPacket];
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([mockUsers, mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getUsers();

            expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM users");
            expect(result).toEqual(mockUsers);
        });
    });

    /**
     * Tests for the getUserByEmail function.
     * @function
     */
    describe('getUserByEmail', () => {
        /**
         * Test case to return a user when a valid `email` is provided.
         */
        it('should return a user by email', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getUserByEmail(testUser.email);

            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE Lower(email) = ?', [testUser.email]);
            expect(result).toEqual(mockUser);
        });

        /**
         * Test case to return undefined user when `email` is undefiend. 
         */
        it('should return undefined if no user found', async () => {
            const undefinedEmail = 'notfound@example.com';
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getUserByEmail(undefinedEmail);

            expect(result).toBeUndefined();
        });
    });

    /**
     * Tests for the getUserById function.
     * @function
     */
    describe('getUserById', () => {
        /**
         * Test case to return a user when a valid `user_id` is provided.
         */
        it('should return a user by ID', async () => {
            const mockUser: RowDataPacket = testUser as RowDataPacket;
            const mockFields: FieldPacket[] = [];
            mockQuery.mockResolvedValueOnce([[mockUser], mockFields] as [RowDataPacket[], FieldPacket[]]);

            const result = await getUserById(testUser.user_id);

            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE user_id = ?', [testUser.user_id]);
            expect(result).toEqual(mockUser);
        });
    });

    /**
     * Tests for the createUser function.
     * @function
     */
    describe('createUser', () => {
        /**
         * Test case to return a new user when a valid `first_name`, 
         * `last_name`, `email`, and `password` are provided.
         */
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

    /**
     * Tests for the updateLastLoginTime function.
     * @function
     */
    describe('updateLastLoginTime', () => {
        /**
         * Test case to return an updated user when a valid `user_id` is provided.
         */
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

    /**
     * Tests for the updateUserInfo function.
     * @function
     */
    describe('updateUserInfo', () => {
        /**
         * Test case to return an updated user when a valid `user_id`, `first_name`, 
         * `last_name`, `email`, and `password` are provided.
         */
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

    /**
     * Tests for the updateUserPassword function.
     * @function
     */
    describe('updateUserPassword', () => {
        /**
         * Test case to return an updated user when a valid `user_id`, 
         * and `password` are provided.
         */
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

    /**
     * Tests for the updateRefreshToken function.
     * @function
     */
    describe('updateRefreshToken', () => {
        /**
         * Test case to return an updated user when a valid `user_id` and 
         * `refresh_token` are provided.
         */
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

    /**
     * Tests for the updateResetToken function.
     * @function
     */
    describe('updateResetToken', () => {
        /**
         * Test case to return an updated user when a valid `user_id`, 
         * `reset_token_expiry` and `reset_token` are provided.
         */
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

    /**
     * Tests for the clearResetToken function.
     * @function
     */
    describe('clearResetToken', () => {
        /**
         * Test case to return an updated user with null reset variables
         *  when a valid `user_id` is provided.
         */
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

    /**
     * Tests for the getUserDevices function.
     * @function
     */
    describe('getUserDevices', () => {
        /**
         * Test case to return user devices when a valid `user_id` is provided.
         */
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

    /**
     * Tests for the getUserDevice function.
     * @function
     */
    describe('getUserDevice', () => {
        /**
         * Test case to return a user device when a valid `device_id` is provided.
         */
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

    /**
     * Tests for the addUserDevice function.
     * @function
     */
    describe('addUserDevice', () => {
        /**
         * Test case to return a new device when a valid `cat_num`, 
         * `user_id`, `wifi_ssid`, `wifi_password`, `init_vec`, 
         * `presence_connection`, `location`, and `thing_name` are provided.
         */
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

    /**
     * Tests for the updateDeviceWifi function.
     * @function
     */
    describe('updateDeviceWifi', () => {
        /**
         * Test case to return an updated device when a valid `device_id`, 
         * `wifi_ssid`, `wifi_password`, and `init_vec` are provided.
         */
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

    /**
     * Tests for the getFactoryDevice function.
     * @function
     */
    describe('getFactoryDevice', () => {
        /**
         * Test case to return a factory device when a valid `cat_num` is provided.
         */
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

    /**
     * Tests for the getDeviceLogs function.
     * @function
     */
    describe('getDeviceLogs', () => {
        /**
         * Test case to return a device's logs when a valid `cat_num` is provided.
         */
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

    /**
     * Tests for the getLastDeviceLog function.
     * @function
     */
    describe('getLastDeviceLog', () => {
        /**
         * Test case to return a device's most recent log when a valid `cat_num` is provided.
         */
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

    /**
     * Tests for the updateUserSocketId function.
     * @function
     */
    describe('updateUserSocketId', () => {
        /**
         * Test case to return an updated user socket when a valid `user_id` 
         * and `socket_id` are provided.
         */
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

    /**
     * Tests for the getUserBySocket function.
     * @function
     */
    describe('getUserBySocket', () => {
        /**
         * Test case to return a user socket when a valid `socket_id` are provided.
         */
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

    /**
     * Tests for the getDevice function.
     * @function
     */
    describe('getDevice', () => {
        /**
         * Test case to return an user device when a valid `cat_num` is provided.
         */
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

    /**
     * Tests for the getDeviceThing function.
     * @function
     */
    describe('getDeviceThing', () => {
        /**
         * Test case to return an user device when a valid `thing_name` is provided.
         */
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

    /**
     * Tests for the updatePresenceConnection function.
     * @function
     */
    describe('updatePresenceConnection', () => {
        /**
         * Test case to return an user device with updated connection state
         * when a valid `device_id` and `presence_connection` are provided.
         */
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
