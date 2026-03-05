import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();
const sequelize = new Sequelize(
    process.env.DB_NAME || 'ebook_platform',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
    }
);
async function run() {
    try {
        await sequelize.authenticate();
        await sequelize.query('ALTER TABLE reviews MODIFY COLUMN rating DECIMAL(2,1) NOT NULL;');
        console.log('Successfully altered rating to DECIMAL');
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
run();
