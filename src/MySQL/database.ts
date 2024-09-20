import mysql, { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import dotenv from "dotenv";
import { User, Device, DeviceLog, FactoryDevice } from "../Types/types";

dotenv.config();

/**
 * MySQL connection pool for managing database connections.
 * @constant {mysql.Pool} pool
 */
export const pool = mysql.createPool({
    host: process.env.RDS_ENDPOINT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: '+00:00'
});

/**
 * Retrieves all users from the database.
 * @returns {Promise<User[]>} A promise that resolves to an array of users.
 */
export async function getUsers(): Promise<User[]> {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM users");
    return rows as User[];
}

/**
 * Retrieves a user by their email address.
 * @param {string} email - The email address of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the user or undefined if not found.
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM users WHERE Lower(email) = ?`,
        [email]
    );
    return (rows as User[])[0];
}

/**
 * Retrieves a user by their unique identifier.
 * @param {number} user_id - The unique identifier of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the user or undefined if not found.
 */
export async function getUserById(user_id: number): Promise<User | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM users WHERE user_id = ?`,
        [user_id]
    );
    return (rows as User[])[0];
}

/**
 * Creates a new user in the database.
 * @param {string} first_name - The first name of the user.
 * @param {string} last_name - The last name of the user.
 * @param {string} email - The email address of the user.
 * @param {string} password - The password for the user (hashed).
 * @returns {Promise<User | undefined>} A promise that resolves to the created user or undefined if unsuccessful.
 */
export async function createUser(first_name: string, last_name: string, email: string, password: string): Promise<User | undefined> {
    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO users (first_name, last_name, email, password, last_login) VALUES(?, ?, ?, ?, NULL)`,
        [first_name, last_name, email, password]
    );
    
    const user_id = result.insertId;
    return getUserById(user_id);
}

/**
 * Updates the last login time for a user.
 * @param {number} user_id - The unique identifier of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
export async function updateLastLoginTime(user_id: number): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET last_login = now() WHERE user_id = ?`,
        [user_id]
    );
    return getUserById(user_id);
}

/**
 * Updates user information in the database.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string} first_name - The updated first name of the user.
 * @param {string} last_name - The updated last name of the user.
 * @param {string} email - The updated email address of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
export async function updateUserInfo(user_id: number, first_name: string, last_name: string, email: string): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ?`,
        [first_name, last_name, email, user_id]
    );
    return getUserById(user_id);
}

/**
 * Updates the password for a user.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string} password - The new password for the user (hashed).
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
export async function updateUserPassword(user_id: number, password: string): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET password = ? WHERE user_id = ?`,
        [password, user_id]
    );
    return getUserById(user_id);
}

/**
 * Updates the refresh token for a user.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string} refreshToken - The new refresh token for the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
export async function updateRefreshToken(user_id: number, refreshToken: string): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET refresh_token = ? WHERE user_id = ?`,
        [refreshToken, user_id]
    );
    return getUserById(user_id);
}

/**
 * Updates the reset token and its expiry for a user.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string} resetToken - The new reset token for the user.
 * @param {string} resetTokenExpiry - The expiry timestamp for the reset token.
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
export async function updateResetToken(user_id: number, resetToken: string, resetTokenExpiry: string): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?`,
        [resetToken, resetTokenExpiry, user_id]
    );
    return getUserById(user_id);
}

/**
 * Clears the reset token and its expiry for a user.
 * @param {number} user_id - The unique identifier of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
export async function clearResetToken(user_id: number): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?`,
        [user_id]
    );
    return getUserById(user_id);
}

/**
 * Retrieves all devices associated with a user.
 * @param {number} user_id - The unique identifier of the user.
 * @returns {Promise<Device[]>} A promise that resolves to an array of devices.
 */
export async function getUserDevices(user_id: number): Promise<Device[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM devices WHERE user_id = ?`,
        [user_id]
    );
    return rows as Device[];
}

/**
 * Retrieves a device by its unique identifier.
 * @param {number} device_id - The unique identifier of the device.
 * @returns {Promise<Device | undefined>} A promise that resolves to the device or undefined if not found.
 */
export async function getUserDevice(device_id: number): Promise<Device | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM devices WHERE device_id = ?`,
        [device_id]
    );
    return (rows as Device[])[0];
}

/**
 * Adds a new device for a user.
 * @param {string} cat_num - The category number of the device.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string} wifi_ssid - The Wi-Fi SSID for the device.
 * @param {string} wifi_password - The Wi-Fi password for the device.
 * @param {string} init_vec - The initialization vector for encryption.
 * @param {boolean} presence_connection - Indicates if the device has a presence connection.
 * @param {string} location - The location of the device.
 * @param {string} thing_name - The name assigned to the device in the IoT system.
 * @returns {Promise<Device | undefined>} A promise that resolves to the added device or undefined if unsuccessful.
 */
export async function addUserDevice(cat_num: string, user_id: number, wifi_ssid: string, wifi_password: string, init_vec: string, presence_connection: boolean, location: string, thing_name: string): Promise<Device | undefined> {
    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO devices (cat_num, user_id, wifi_ssid, wifi_password, init_vec, presence_connection, location, thing_name) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
        [cat_num, user_id, wifi_ssid, wifi_password, init_vec, presence_connection, location, thing_name]
    );
    
    const device_id = result.insertId;
    return getUserDevice(device_id);
}

/**
 * Updates the Wi-Fi settings for a device.
 * @param {number} device_id - The unique identifier of the device.
 * @param {string} wifi_ssid - The new Wi-Fi SSID.
 * @param {string} wifi_password - The new Wi-Fi password.
 * @param {string} init_vec - The new initialization vector.
 * @returns {Promise<Device | undefined>} A promise that resolves to the updated device or undefined if not found.
 */
export async function updateDeviceWifi(device_id: number, wifi_ssid: string, wifi_password: string, init_vec: string): Promise<Device | undefined> {
    await pool.query(
        `UPDATE devices SET wifi_ssid = ?, wifi_password = ?, init_vec = ? WHERE device_id = ?`,
        [wifi_ssid, wifi_password, init_vec, device_id]
    );
    return getUserDevice(device_id);
}

/**
 * Retrieves a factory device by its category number.
 * @param {string} cat_num - The category number of the factory device.
 * @returns {Promise<FactoryDevice | undefined>} A promise that resolves to the factory device or undefined if not found.
 */
export async function getFactoryDevice(cat_num: string): Promise<FactoryDevice | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM factoryDevices WHERE cat_num = ?`,
        [cat_num]
    );
    return (rows as FactoryDevice[])[0];
}

/**
 * Retrieves logs associated with a device.
 * @param {string} cat_num - The category number of the device.
 * @returns {Promise<DeviceLog[]>} A promise that resolves to an array of device logs.
 */
export async function getDeviceLogs(cat_num: string): Promise<DeviceLog[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM deviceLogs WHERE cat_num = ?`,
        [cat_num]
    );
    return rows as DeviceLog[];
}

/**
 * Retrieves the last log entry for a device.
 * @param {string} cat_num - The category number of the device.
 * @returns {Promise<DeviceLog | undefined>} A promise that resolves to the last device log or undefined if not found.
 */
export async function getLastDeviceLog(cat_num: string): Promise<DeviceLog | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM deviceLogs WHERE cat_num = ? ORDER BY log_date DESC LIMIT 1`,
        [cat_num]
    );
    return (rows as DeviceLog[])[0];
}

/**
 * Updates the socket ID associated with a user.
 * @param {number} user_id - The unique identifier of the user.
 * @param {string | null} socket_id - The new socket identifier (or null to clear).
 * @returns {Promise<User | undefined>} A promise that resolves to the updated user or undefined if not found.
 */
export async function updateUserSocketId(user_id: number, socket_id: string | null): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET socket_id = ? WHERE user_id = ?`,
        [socket_id, user_id]
    );
    return getUserById(user_id);
}

/**
 * Retrieves a user by their socket ID.
 * @param {string} socket_id - The socket identifier of the user.
 * @returns {Promise<User | undefined>} A promise that resolves to the user or undefined if not found.
 */
export async function getUserBySocket(socket_id: string): Promise<User | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM users WHERE socket_id = ?`,
        [socket_id]
    );
    return (rows as User[])[0];
}

/**
 * Retrieves a device by its category number.
 * @param {string} cat_num - The category number of the device.
 * @returns {Promise<Device | undefined>} A promise that resolves to the device or undefined if not found.
 */
export async function getDevice(cat_num: string): Promise<Device | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM devices WHERE cat_num = ?`,
        [cat_num]
    );
    return (rows as Device[])[0];
}

/**
 * Retrieves a device by its thing name.
 * @param {string} thingName - The thing name of the device.
 * @returns {Promise<Device | undefined>} A promise that resolves to the device or undefined if not found.
 */
export async function getDeviceThing(thingName: string): Promise<Device | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM devices WHERE thing_name = ?`,
        [thingName]
    );
    return (rows as Device[])[0];
}

/**
 * Updates the presence connection status for a device.
 * @param {number} device_id - The unique identifier of the device.
 * @param {boolean} presenceConnection - The new presence connection status.
 * @returns {Promise<Device | undefined>} A promise that resolves to the updated device or undefined if not found.
 */
export async function updatePresenceConnection(device_id: number, presenceConnection: boolean): Promise<Device | undefined> {
    await pool.query(
        `UPDATE devices SET presence_connection = ? WHERE device_id = ?`,
        [presenceConnection, device_id]
    );
    return getUserDevice(device_id);
}