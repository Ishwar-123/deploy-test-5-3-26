import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Book from '../models/Book.js';

dotenv.config();

const checkBooks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        const books = await Book.find();
        console.log(`📚 Total Books in Database: ${books.length}\n`);

        if (books.length > 0) {
            console.log('First 5 books:');
            books.slice(0, 5).forEach((book, index) => {
                console.log(`${index + 1}. ${book.title} by ${book.author}`);
            });
        } else {
            console.log('❌ No books found in database!');
            console.log('\n💡 Run seed script to add demo books:');
            console.log('   node utils/seed.js');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkBooks();
