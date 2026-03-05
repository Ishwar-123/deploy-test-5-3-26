import { sequelize } from '../config/database.js';

const runMigration = async () => {
    try {
        console.log('🔄 Running migration: add subtitle & update preview pages...');

        // Add subtitle column
        await sequelize.query(`
            ALTER TABLE books 
            ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255) DEFAULT '';
        `);
        console.log('✅ subtitle column added');

        // Migrate old previewStartPage/previewEndPage to previewPages JSON array
        // For existing books, convert the two page numbers into a JSON array
        const [books] = await sequelize.query(`
            SELECT id, previewStartPage, previewEndPage, previewPages 
            FROM books 
            WHERE previewPages IS NULL OR previewPages = '[]' OR previewPages = 'null'
        `);

        for (const book of books) {
            const startPage = book.previewStartPage || 1;
            const endPage = book.previewEndPage || 2;
            const pages = [startPage, endPage];
            await sequelize.query(
                `UPDATE books SET previewPages = ? WHERE id = ?`,
                { replacements: [JSON.stringify(pages), book.id] }
            );
        }
        console.log(`✅ Migrated ${books.length} books' preview pages to JSON array format`);

        console.log('🎉 Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
};

runMigration();
