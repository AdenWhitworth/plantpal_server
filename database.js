import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
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

export async function getUserById(id){
    const [rows] = await pool.query(`
        SELECT *
        FROM users
        WHERE id = ?
    `, [id]);
    return rows[0];
}

export async function createUser(first_name, last_name, email, password){
    const [result] = await pool.query(`
        INSERT INTO users (first_name, last_name, email, password, last_login)
        VALUES(?, ?, ?, ?, NULL)
    `, [first_name, last_name, email, password]);

    const id = result.insertId;
    return getUserById(id);
}

export async function updateLastLoginTime(id){
    const [result] = await pool.query(`
        UPDATE users
        SET last_login = now()
        WHERE id = ?
    `, [id]);
    
    return getUserById(id);

}