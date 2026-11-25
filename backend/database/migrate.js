import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('--- Starting CELLS Database Migration ---');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        multipleStatements: true
    });

    try {
        const sqlPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing schema definition...');
        await connection.query(sql);
        console.log('✓ Migration completed successfully. All tables and constraints established.');
    } catch (err) {
        console.error('✗ Migration failed:', err.message);
        process.exitCode = 1;
    } finally {
        await connection.end();
    }
}

runMigration();
