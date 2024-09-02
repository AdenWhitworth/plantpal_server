import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
    host: process.env.RDS_ENDPOINT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: '+00:00'
}).promise();

export async function getUsers() {
    const [rows] = await pool.query("SELECT * FROM users");
    return rows;
}

export async function getUserByEmail(email){
    const [rows] = await pool.query(`
        SELECT *
        FROM users
        WHERE Lower(email) = ?
    `, [email]);
    return rows[0];
}

export async function getUserById(user_id){
    const [rows] = await pool.query(`
        SELECT *
        FROM users
        WHERE user_id = ?
    `, [user_id]);
    return rows[0];
}

export async function createUser(first_name, last_name, email, password){
    const [result] = await pool.query(`
        INSERT INTO users (first_name, last_name, email, password, last_login)
        VALUES(?, ?, ?, ?, NULL)
    `, [first_name, last_name, email, password]);
    
    const user_id = result.insertId;
    return getUserById(user_id);
}

export async function updateLastLoginTime(user_id){
    const [result] = await pool.query(`
        UPDATE users
        SET last_login = now()
        WHERE user_id = ?
    `, [user_id]);
    
    return getUserById(user_id);
}

export async function updateUserInfo(user_id, first_name , last_name, email){
    const [result] = await pool.query(`
        UPDATE users
        SET first_name = ?, last_name = ?, email = ?
        WHERE user_id = ?
    `, [first_name, last_name, email, user_id]);
    
    return getUserById(user_id);
}

export async function updateUserPassword(user_id, password){
    const [result] = await pool.query(`
        UPDATE users
        SET password = ?
        WHERE user_id = ?
    `, [password, user_id]);
    
    return getUserById(user_id);
}

export async function updateRefreshToken(user_id, refreshToken){
    const [result] = await pool.query(`
        UPDATE users
        SET refresh_token = ?
        WHERE user_id = ?
    `, [refreshToken, user_id]);
    
    return getUserById(user_id);
}

export async function updateResetToken(user_id, resetToken, resetTokenExpiry){
    const [result] = await pool.query(`
        UPDATE users
        SET reset_token = ?, reset_token_expiry = ?
        WHERE user_id = ?
    `, [resetToken, resetTokenExpiry, user_id]);
    
    return getUserById(user_id);
}

export async function clearResetToken(user_id){
    const [result] = await pool.query(`
        UPDATE users
        SET reset_token = NULL, reset_token_expiry = NULL
        WHERE user_id = ?
    `, [user_id]);
    
    return getUserById(user_id);
}

export async function getUserDevices(user_id){
    const [rows] = await pool.query(`
        SELECT *
        FROM devices
        WHERE user_id = ?
    `, [user_id]);
    return rows;
}

export async function getUserDevice(device_id){
    const [rows] = await pool.query(`
        SELECT *
        FROM devices
        WHERE device_id = ?
    `, [device_id]);
    return rows[0];
}

export async function addUserDevice(cat_num, user_id, wifi_ssid, wifi_password, init_vec, presence_connection, location, thing_name){
    const [result] = await pool.query(`
        INSERT INTO devices (cat_num, user_id, wifi_ssid, wifi_password, init_vec, presence_connection, location, thing_name)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `, [cat_num, user_id, wifi_ssid, wifi_password, init_vec, presence_connection, location, thing_name]);
    
    const device_id = result.insertId;
    return getUserDevice(device_id);
}

export async function updateDeviceWifi(device_id, wifi_ssid, wifi_password, init_vec){
    const [result] = await pool.query(`
        UPDATE devices
        SET wifi_ssid = ?, wifi_password = ?, init_vec=?
        WHERE device_id = ?
    `, [wifi_ssid, wifi_password, init_vec, device_id]);
    
    return getUserDevice(device_id);
}

export async function getFactoryDevice(cat_num){
    const [rows] = await pool.query(`
        SELECT *
        FROM factoryDevices
        WHERE cat_num = ?
    `, [cat_num]);
    return rows[0];
}

export async function getDeviceLogs(cat_num){
    const [rows] = await pool.query(`
        SELECT *
        FROM deviceLogs
        WHERE cat_num = ?
    `, [cat_num]);
    return rows;
}

export async function getLastDeviceLog(cat_num){
    const [rows] = await pool.query(`
        SELECT *
        FROM deviceLogs
        WHERE cat_num = ?
        ORDER  BY log_date DESC
        LIMIT  1
    `, [cat_num]);
    return rows[0];
}

export async function updateUserSocketId(user_id, socket_id){
    const [result] = await pool.query(`
        UPDATE users
        SET socket_id = ?
        WHERE user_id = ?
    `, [socket_id, user_id]);
    
    return getUserById(user_id);
}

export async function getUserBySocket(socket_id){
    const [rows] = await pool.query(`
        SELECT *
        FROM users
        WHERE socket_id = ?
    `, [socket_id]);
    return rows[0];
}

export async function getDevice(cat_num){
    const [rows] = await pool.query(`
        SELECT *
        FROM devices
        WHERE cat_num = ?
    `, [cat_num]);
    return rows[0];
}

export async function getDeviceThing(thingName){
    const [rows] = await pool.query(`
        SELECT *
        FROM devices
        WHERE thing_name = ?
    `, [thingName]);
    return rows[0];
}

export async function updatePresenceConnection(device_id, presenceConnection){
    const [result] = await pool.query(`
        UPDATE devices
        SET presence_connection = ?
        WHERE device_id = ?
    `, [presenceConnection, device_id]);
    
    return getUserDevice(device_id);
}