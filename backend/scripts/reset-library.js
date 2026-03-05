import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ReaderLibrary from '../models/ReaderLibrary.js'; // Adjust path if needed or use direct collection access

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ebook-system')
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Find the reader
        const reader = await mongoose.connection.db.collection('users').findOne({ email: 'reader@example.com' });

        if (!reader) {
            console.log('❌ Reader not found');
            process.exit(1);
        }

        // Delete all library entries for this reader
        const result = await mongoose.connection.db.collection('readerlibraries').deleteMany({
            readerId: reader._id
        });

        console.log(`✅ Removed ${result.deletedCount} books from Reader's library.`);
        console.log('🔄 You can now test the Payment Flow again!');

        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
