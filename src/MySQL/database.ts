import mysql, { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

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

const pool = mysql.createPool({
    host: process.env.RDS_ENDPOINT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: '+00:00'
});

export async function getUsers(): Promise<User[]> {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM users");
    return rows as User[];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM users WHERE Lower(email) = ?`,
        [email]
    );
    return (rows as User[])[0];
}

export async function getUserById(user_id: number): Promise<User | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM users WHERE user_id = ?`,
        [user_id]
    );
    return (rows as User[])[0];
}

export async function createUser(first_name: string, last_name: string, email: string, password: string): Promise<User | undefined> {
    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO users (first_name, last_name, email, password, last_login) VALUES(?, ?, ?, ?, NULL)`,
        [first_name, last_name, email, password]
    );
    
    const user_id = result.insertId;
    return getUserById(user_id);
}

export async function updateLastLoginTime(user_id: number): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET last_login = now() WHERE user_id = ?`,
        [user_id]
    );
    return getUserById(user_id);
}

export async function updateUserInfo(user_id: number, first_name: string, last_name: string, email: string): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ?`,
        [first_name, last_name, email, user_id]
    );
    return getUserById(user_id);
}

export async function updateUserPassword(user_id: number, password: string): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET password = ? WHERE user_id = ?`,
        [password, user_id]
    );
    return getUserById(user_id);
}

export async function updateRefreshToken(user_id: number, refreshToken: string): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET refresh_token = ? WHERE user_id = ?`,
        [refreshToken, user_id]
    );
    return getUserById(user_id);
}

export async function updateResetToken(user_id: number, resetToken: string, resetTokenExpiry: string): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?`,
        [resetToken, resetTokenExpiry, user_id]
    );
    return getUserById(user_id);
}

export async function clearResetToken(user_id: number): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?`,
        [user_id]
    );
    return getUserById(user_id);
}

export async function getUserDevices(user_id: number): Promise<Device[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM devices WHERE user_id = ?`,
        [user_id]
    );
    return rows as Device[];
}

export async function getUserDevice(device_id: number): Promise<Device | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM devices WHERE device_id = ?`,
        [device_id]
    );
    return (rows as Device[])[0];
}

export async function addUserDevice(cat_num: string, user_id: number, wifi_ssid: string, wifi_password: string, init_vec: string, presence_connection: boolean, location: string, thing_name: string): Promise<Device | undefined> {
    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO devices (cat_num, user_id, wifi_ssid, wifi_password, init_vec, presence_connection, location, thing_name) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
        [cat_num, user_id, wifi_ssid, wifi_password, init_vec, presence_connection, location, thing_name]
    );
    
    const device_id = result.insertId;
    return getUserDevice(device_id);
}

export async function updateDeviceWifi(device_id: number, wifi_ssid: string, wifi_password: string, init_vec: string): Promise<Device | undefined> {
    await pool.query(
        `UPDATE devices SET wifi_ssid = ?, wifi_password = ?, init_vec = ? WHERE device_id = ?`,
        [wifi_ssid, wifi_password, init_vec, device_id]
    );
    return getUserDevice(device_id);
}

export async function getFactoryDevice(cat_num: string): Promise<FactoryDevice | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM factoryDevices WHERE cat_num = ?`,
        [cat_num]
    );
    return (rows as FactoryDevice[])[0];
}

export async function getDeviceLogs(cat_num: string): Promise<DeviceLog[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM deviceLogs WHERE cat_num = ?`,
        [cat_num]
    );
    return rows as DeviceLog[];
}

export async function getLastDeviceLog(cat_num: string): Promise<DeviceLog | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM deviceLogs WHERE cat_num = ? ORDER BY log_date DESC LIMIT 1`,
        [cat_num]
    );
    return (rows as DeviceLog[])[0];
}

export async function updateUserSocketId(user_id: number, socket_id: string | null): Promise<User | undefined> {
    await pool.query(
        `UPDATE users SET socket_id = ? WHERE user_id = ?`,
        [socket_id, user_id]
    );
    return getUserById(user_id);
}

export async function getUserBySocket(socket_id: string): Promise<User | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM users WHERE socket_id = ?`,
        [socket_id]
    );
    return (rows as User[])[0];
}

export async function getDevice(cat_num: string): Promise<Device | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM devices WHERE cat_num = ?`,
        [cat_num]
    );
    return (rows as Device[])[0];
}

export async function getDeviceThing(thingName: string): Promise<Device | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM devices WHERE thing_name = ?`,
        [thingName]
    );
    return (rows as Device[])[0];
}

export async function updatePresenceConnection(device_id: number, presenceConnection: string): Promise<Device | undefined> {
    await pool.query(
        `UPDATE devices SET presence_connection = ? WHERE device_id = ?`,
        [presenceConnection, device_id]
    );
    return getUserDevice(device_id);
}