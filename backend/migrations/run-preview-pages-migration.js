import { sequelize } from '../config/database.js';

async function migrate() {
    try {
        console.log('🔄 Running migration: Add preview pages columns...');

        await sequelize.query(`
            ALTER TABLE books 
            ADD COLUMN IF NOT EXISTS previewStartPage INTEGER DEFAULT 1;
        `);

        await sequelize.query(`
            ALTER TABLE books 
            ADD COLUMN IF NOT EXISTS previewEndPage INTEGER DEFAULT 2;
        `);

        await sequelize.query(`
            UPDATE books 
            SET previewStartPage = 1, previewEndPage = 2 
            WHERE previewStartPage IS NULL OR previewEndPage IS NULL;
        `);

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
