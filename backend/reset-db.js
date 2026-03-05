import { sequelize } from './config/database.js';

const resetDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');

        console.log('⏳ Dropping all tables...');

        // Disable foreign key checks to allow dropping tables in any order
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Fetch all table names from the current database
        const [tables] = await sequelize.query("SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE()");

        if (tables.length === 0) {
            console.log("ℹ️ No tables found in the database.");
        } else {
            // Loop through and drop each table individually
            for (const row of tables) {
                const tableName = row.TABLE_NAME || row.table_name;
                console.log(`Dropping table: ${tableName}...`);
                await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            }
            console.log(`🔥 Dropped ${tables.length} tables.`);
        }

        // Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("🔥 THE DATABASE IS NOW COMPLETELY EMPTY.");
        console.log("✅ You can now import your SQL file freely.");

        process.exit(0);
    } catch (error) {
        console.error('❌ Unable to drop tables:', error);
        process.exit(1);
    }
}

resetDb();
