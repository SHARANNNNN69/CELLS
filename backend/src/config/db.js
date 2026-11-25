import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cells_db',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    decimalNumbers: true
});

export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✓ Successfully connected to MySQL database:', process.env.DB_NAME || 'cells_db');
        connection.release();
        return true;
    } catch (error) {
        console.error('✗ Failed to connect to MySQL database:', error.message);
        return false;
    }
};

export default pool;
