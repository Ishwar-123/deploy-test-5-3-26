import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ebook-system')
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Add a book that is NOT purchased (for payment testing)
        const bookData = {
            title: "Advanced React Patterns",
            author: "Jane Smith",
            description: "Master advanced React patterns and best practices for building scalable applications.",
            category: "Technology",
            language: "English",
            publisher: "Tech Books Publishing",
            publishedDate: new Date("2024-02-01"),
            pageCount: 420,
            retailPrice: 599,
            wholesalePrice: 399,
            coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileType: "pdf",
            fileSize: 13264,
            isAvailable: true,
            isApproved: true,
            totalPages: 420,
            tags: ["React", "JavaScript", "Web Development"],
            drm: {
                allowDownload: true,
                downloadLimit: 3,
                allowPrint: false,
                watermark: true
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const book = await mongoose.connection.db.collection('books').insertOne(bookData);
        console.log('✅ Book added with ID:', book.insertedId);
        console.log('📚 Book Title:', bookData.title);
        console.log('💰 Price: ₹' + bookData.retailPrice);
        console.log('\n⚠️ This book is NOT in library - perfect for testing payment!');
        console.log('\nTo test payment:');
        console.log('1. Login as reader@example.com');
        console.log('2. Go to library');
        console.log('3. Find "Advanced React Patterns"');
        console.log('4. Click "Read Now"');
        console.log('5. Try to view page 3');
        console.log('6. Click "Purchase Now"');
        console.log('7. Test Razorpay payment!');

        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
