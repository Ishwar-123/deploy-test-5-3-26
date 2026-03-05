import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ebook-system')
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Step 1: Add Book
        const bookData = {
            title: "The Complete Guide to JavaScript",
            author: "John Doe",
            description: "A comprehensive guide to modern JavaScript programming with practical examples and best practices.",
            category: "Technology",
            language: "English",
            publisher: "Tech Books Publishing",
            publishedDate: new Date("2024-01-01"),
            pageCount: 350,
            retailPrice: 499,
            wholesalePrice: 299,
            coverImage: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileType: "pdf",
            fileSize: 13264,
            isAvailable: true,
            isApproved: true,
            totalPages: 350,
            tags: ["JavaScript", "Programming", "Web Development"],
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

        // Step 2: Find Reader
        const reader = await mongoose.connection.db.collection('users').findOne({
            email: 'reader@example.com'
        });

        if (!reader) {
            console.log('❌ Reader user not found!');
            process.exit(1);
        }

        console.log('✅ Reader found:', reader.name, '(' + reader.email + ')');

        // Step 3: Add to Library
        const libraryData = {
            readerId: reader._id,
            bookId: book.insertedId,
            accessType: 'purchased',
            purchaseDate: new Date(),
            isActive: true,
            readingProgress: 0,
            lastAccessedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const library = await mongoose.connection.db.collection('readerlibraries').insertOne(libraryData);
        console.log('✅ Book added to library with ID:', library.insertedId);

        console.log('\n📚 Summary:');
        console.log('Book:', bookData.title);
        console.log('Reader:', reader.email);
        console.log('Status: Purchased ✅');
        console.log('\n✅ Done! Reader can now access this book in their library.');
        console.log('\nNow login at: http://localhost:5173/login');
        console.log('Email: reader@example.com');
        console.log('Password: Reader@123');

        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
