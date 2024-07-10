import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
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

export async function addUserDevice(cat_num, user_id, wifi_ssid, wifi_password, init_vec, connection_status, automate, location){
    const [result] = await pool.query(`
        INSERT INTO devices (cat_num, user_id, wifi_ssid, wifi_password, init_vec, connection_status, automate, location)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `, [cat_num, user_id, wifi_ssid, wifi_password, init_vec, connection_status, automate, location]);
    
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

export async function updateDeviceAuto(device_id, automate){
    const [result] = await pool.query(`
        UPDATE devices
        SET automate = ?
        WHERE device_id = ?
    `, [automate, device_id]);
    
    return getUserDevice(device_id);
}
