import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ebook-system')
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Local Multi-page PDF URL
        const localPdfUrl = "http://localhost:5000/uploads/books/book.pdf";

        // Update ALL books
        const result = await mongoose.connection.db.collection('books').updateMany(
            {},
            {
                $set: {
                    fileUrl: localPdfUrl,
                    totalPages: 14,
                    pageCount: 14
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} books to use Local Multi-page PDF.`);
        console.log(`🔗 URL: ${localPdfUrl}`);
        console.log('ℹ️ Note: This PDF has 14 PAGES.');

        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
