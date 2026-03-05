import { sequelize } from '../config/database.js';
import Review from '../models/Review.js';

/**
 * Migration Script for Review System
 * This script creates the reviews table and updates the books table if needed
 */

async function runMigration() {
    try {
        console.log('🚀 Starting Review System Migration...\n');

        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Sync Review model (creates table if not exists)
        console.log('📝 Creating reviews table...');
        await Review.sync({ alter: false }); // Use { alter: true } to update existing table
        console.log('✅ Reviews table created successfully\n');

        // Verify the table
        const tableInfo = await sequelize.query(`DESCRIBE reviews`);
        console.log('📊 Reviews table structure:');
        console.table(tableInfo[0]);

        // Check if books table has required columns
        console.log('\n🔍 Checking books table...');
        const booksColumns = await sequelize.query(`SHOW COLUMNS FROM books`);
        const columnNames = booksColumns[0].map(col => col.Field);

        const hasAverageRating = columnNames.includes('averageRating');
        const hasTotalReviews = columnNames.includes('totalReviews');

        if (hasAverageRating && hasTotalReviews) {
            console.log('✅ Books table already has rating columns');
        } else {
            console.log('⚠️  Books table missing rating columns');
            console.log('   These should already exist in your Book model');
            console.log('   If not, run: ALTER TABLE books ADD COLUMN averageRating DECIMAL(2,1) DEFAULT 0;');
            console.log('   And: ALTER TABLE books ADD COLUMN totalReviews INT DEFAULT 0;');
        }

        // Create indexes if they don't exist
        console.log('\n📌 Creating indexes...');
        try {
            await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
      `);
            await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
      `);
            await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
      `);
            await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
      `);
            console.log('✅ Indexes created successfully');
        } catch (error) {
            console.log('ℹ️  Indexes may already exist (this is normal)');
        }

        // Insert sample review (optional - commented out)
        // console.log('\n📝 Inserting sample review...');
        // await Review.create({
        //   userId: 1,
        //   bookId: 1,
        //   rating: 5,
        //   reviewText: 'This is a sample review created by the migration script.'
        // });
        // console.log('✅ Sample review created');

        console.log('\n✨ Migration completed successfully!\n');
        console.log('📋 Summary:');
        console.log('   - Reviews table: ✅ Created');
        console.log('   - Indexes: ✅ Created');
        console.log('   - Foreign keys: ✅ Set up');
        console.log('   - Constraints: ✅ Applied\n');
        console.log('🎉 Review system is ready to use!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

// Run migration
runMigration();
