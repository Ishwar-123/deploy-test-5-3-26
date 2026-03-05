import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Book from '../models/Book.js';

dotenv.config();

const dropTextIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // Drop the text index
        try {
            await Book.collection.dropIndex('title_text_author_text_description_text_tags_text');
            console.log('✅ Dropped old text index');
        } catch (error) {
            console.log('ℹ️  Text index not found or already dropped');
        }

        // Create new indexes
        await Book.createIndexes();
        console.log('✅ Created new indexes');

        console.log('\n✅ Index update complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

dropTextIndex();
