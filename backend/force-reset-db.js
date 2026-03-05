import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'ebook_v2',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
    }
);

async function forceReset() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();

        const [results] = await sequelize.query("SHOW TABLES");
        const tableNames = results.map(t => Object.values(t)[0]);

        if (tableNames.length === 0) {
            console.log('✅ Database is already empty.');
            process.exit(0);
        }

        console.log(`🗑️  Found ${tableNames.length} tables. Dropping...`);

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const tableName of tableNames) {
            await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            console.log(`   - Dropped ${tableName}`);
        }
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ All tables dropped successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
}

forceReset();
