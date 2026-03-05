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

async function resetTables() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();

        console.log('🛡️  Disabling Foreign Key Checks...');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        console.log('🗑️  Dropping all tables...');
        // This drops all tables in the database
        await sequelize.drop();

        console.log('✅ All tables dropped successfully!');

        console.log('🛡️  Enabling Foreign Key Checks...');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✨ Done! Now restart your backend server: npm run dev');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting tables:', error);
        process.exit(1);
    }
}

resetTables();
