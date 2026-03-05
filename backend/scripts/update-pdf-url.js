import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ebook-system')
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Longer PDF URL (14 pages)
        const longPdfUrl = "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf";

        // Update ALL books to use this PDF
        const result = await mongoose.connection.db.collection('books').updateMany(
            {},
            {
                $set: {
                    fileUrl: longPdfUrl,
                    totalPages: 14,
                    pageCount: 14
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} books with a 14-page PDF.`);

        console.log('\n⚠️ Why this was needed:');
        console.log('The previous dummy PDF only had 1 page.');
        console.log('Now all books have 14 pages so you can test scrolling/navigation.');

        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
