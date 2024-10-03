//AWS IoT Query Statement Trigger:
//SELECT * FROM 'plantpal/esp32-to-aws/logs'

import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
    timezone: '+00:00'
};

/**
 * AWS Lambda handler for processing logs sent from an ESP32 device and inserting them into an RDS MySQL database.
 * 
 * @param {Object} event - The IoT event payload containing log data from the ESP32 device.
 * @param {number} event.cat_num - The unique identifier for the category of the log entry.
 * @param {number} event.soil_temp - The recorded soil temperature in degrees.
 * @param {number} event.soil_cap - The recorded soil capacitive value (for moisture level).
 * @param {boolean} event.water - The water level status (true if sufficient, false if low).
 * 
 * @returns {Promise<Object>} The response object indicating success or failure of the database insertion.
 */
export const handler = async (event) => {
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        
        const { cat_num, soil_temp, soil_cap, water } = event;

        const query = 'INSERT INTO deviceLogs (cat_num, soil_temp, soil_cap, log_date, water) VALUES (?, ?, ?, now(), ?)';
        const values = [cat_num, soil_temp, soil_cap, water];

        const [results] = await connection.execute(query, values);

        await connection.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Data inserted successfully',
                results
            })
        };
        
    } catch (error) {
        if (connection) {
            await connection.end();
        }
        console.error('Error executing query:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error executing query',
                error: error.message
            })
        };
    }
};