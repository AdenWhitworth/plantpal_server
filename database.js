import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

export const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();

export async function getNote(id){
    const [rows] = await pool.query(`
        SELECT *
        FROM notes
        WHERE id = ?
    `, [id]);
    return rows[0];
}

/*
const notes = await getNote(1);
console.log(notes);
*/


export async function createNote(title, content){
    const [result] = await pool.query(`
        INSERT INTO notes (title, contents)
        VALUES(?, ?)
    `, [title,content]);

    const id = result.insertId;

    return getNote(id);
}

/*
const newNote = await createNote('test','test');
console.log(newNote);
*/
