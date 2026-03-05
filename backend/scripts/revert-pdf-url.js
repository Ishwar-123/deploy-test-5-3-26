import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ebook-system')
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Revert to the original Dummy PDF (1 page)
        const originalPdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

        // Update ALL books back to original
        const result = await mongoose.connection.db.collection('books').updateMany(
            {},
            {
                $set: {
                    fileUrl: originalPdfUrl,
                    totalPages: 1, // Only 1 page
                    pageCount: 1
                }
            }
        );

        console.log(`✅ Reverted ${result.modifiedCount} books to original PDF.`);
        console.log('⚠️ Note: This PDF has ONLY 1 PAGE.');

        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
