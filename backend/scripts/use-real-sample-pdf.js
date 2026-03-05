import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ebook-system')
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Clean Multi-page PDF URL (Locally served)
        const localPdfUrl = "http://localhost:5000/uploads/books/real-sample.pdf";

        // Update ALL books
        const result = await mongoose.connection.db.collection('books').updateMany(
            {},
            {
                $set: {
                    fileUrl: localPdfUrl,
                    totalPages: 10, // Approximate
                    pageCount: 10
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} books to use REAL Sample PDF.`);
        console.log(`🔗 URL: ${localPdfUrl}`);

        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
