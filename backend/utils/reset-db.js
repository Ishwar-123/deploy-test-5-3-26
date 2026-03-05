import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const reset = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        console.log('🗑️ Dropping database...');
        await connection.query('DROP DATABASE IF EXISTS ebook_platform');

        console.log('✨ Creating database...');
        await connection.query('CREATE DATABASE ebook_platform');

        console.log('✅ Database reset successfully!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
};

reset();
