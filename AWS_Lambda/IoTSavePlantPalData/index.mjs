import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE
};

export const handler = async (event) => {
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to the database');

        const { cat_num, soil_temp, soil_cap, log_date, water } = event;

        const query = 'INSERT INTO deviceLogs (cat_num, soil_temp, soil_cap, log_date, water) VALUES (?, ?, ?, ?, ?)';
        const values = [cat_num, soil_temp, soil_cap, log_date, water];

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