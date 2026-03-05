
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: '::1',
            user: 'root',
            password: '',
            port: 3306
        });
        console.log('✅ Connection successful!');
        await connection.end();
    } catch (error) {
        console.error('❌ Connection failed:', error);
    }
}

testConnection();
