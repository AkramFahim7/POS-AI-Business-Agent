const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function run() {
    try {
        console.log('Connecting to MySQL...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('Running schema.sql...');
        const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
        await connection.query(schema);

        console.log('Running seed.sql...');
        const seed = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8');
        await connection.query(seed);

        console.log('Database setup complete!');
        await connection.end();
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

run();
