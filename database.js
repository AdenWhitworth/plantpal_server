import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();


export async function getUser(email){
    const [rows] = await pool.query(`
        SELECT *
        FROM users
        WHERE Lower(email) = ?
    `, [email]);
    return rows[0];
}

export async function createUser(name, email, password){
    const [result] = await pool.query(`
        INSERT INTO users (name, email, password)
        VALUES(?, ?, ?)
    `, [name, email, password]);

    const id = result.insertId;

    return getUser(email);
}



/* Example Notes Functions 
export async function getNotes() {
    const [rows] = await pool.query("SELECT * FROM notes");
    return rows;
}

export async function getNote(id){
    const [rows] = await pool.query(`
        SELECT *
        FROM notes
        WHERE id = ?
    `, [id]);
    return rows[0];
}

export async function createNote(title, contents){
    const [result] = await pool.query(`
        INSERT INTO notes (title, contents)
        VALUES(?, ?)
    `, [title,contents]);

    const id = result.insertId;

    return getNote(id);
}

*/
