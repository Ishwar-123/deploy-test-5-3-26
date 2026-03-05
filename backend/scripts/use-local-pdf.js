import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ebook-system')
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Local PDF URL (Served by backend)
        // Assuming backend is at http://localhost:5000
        const localPdfUrl = "http://localhost:5000/uploads/books/dummy.pdf";

        // Update ALL books to use this local URL
        const result = await mongoose.connection.db.collection('books').updateMany(
            {},
            {
                $set: {
                    fileUrl: localPdfUrl,
                    totalPages: 1, // It is 1 page
                    pageCount: 1
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} books to use Local PDF.`);
        console.log(`🔗 URL: ${localPdfUrl}`);
        console.log('⚠️ This fixes the CORS error.');
        console.log('ℹ️ Note: This PDF has 1 PAGE.');

        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
