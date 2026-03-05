import { Book } from '../models/index.js';
import connectDB from '../config/database.js';

const demoBooks = [
    {
        title: "The Midnight Library",
        author: "Matt Haig",
        description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
        category: "Fiction",
        language: "English",
        retailPrice: 599.00,
        wholesalePrice: 350.00,
        coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400",
        fileUrl: "/uploads/books/sample.pdf",
        isAvailable: true,
        isApproved: true,
        averageRating: 4.8,
        tags: ["Adventure", "Philosophy", "Bestseller"]
    },
    {
        title: "Atomic Habits",
        author: "James Clear",
        description: "No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies.",
        category: "Self-Help",
        language: "English",
        retailPrice: 450.00,
        wholesalePrice: 280.00,
        coverImage: "https://images.unsplash.com/photo-1589998059171-988d887df643?q=80&w=400",
        fileUrl: "/uploads/books/sample.pdf",
        isAvailable: true,
        isApproved: true,
        averageRating: 4.9,
        tags: ["Productivity", "Growth", "Minimalism"]
    },
    {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        description: "Doing well with money isn't necessarily about what you know. It’s about how you behave. And behavior is hard to teach, even to really smart people.",
        category: "Business",
        language: "English",
        retailPrice: 399.00,
        wholesalePrice: 250.00,
        coverImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=400",
        fileUrl: "/uploads/books/sample.pdf",
        isAvailable: true,
        isApproved: true,
        averageRating: 4.7,
        tags: ["Finance", "Psychology", "Investing"]
    },
    {
        title: "Deep Work",
        author: "Cal Newport",
        description: "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information.",
        category: "Technology",
        language: "English",
        retailPrice: 499.00,
        wholesalePrice: 300.00,
        coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400",
        fileUrl: "/uploads/books/sample.pdf",
        isAvailable: true,
        isApproved: true,
        averageRating: 4.6,
        tags: ["Focus", "Career", "Success"]
    },
    {
        title: "The Song of Achilles",
        author: "Madeline Miller",
        description: "A thrilling, profound, and gently moving reimagining of the Trojan War as a love story between the legendary Achilles and his devoted friend Patroclus.",
        category: "Fantasy",
        language: "English",
        retailPrice: 550.00,
        wholesalePrice: 320.00,
        coverImage: "https://images.unsplash.com/photo-1467951591042-f388365db261?q=80&w=400",
        fileUrl: "/uploads/books/sample.pdf",
        isAvailable: true,
        isApproved: true,
        averageRating: 4.9,
        tags: ["Mythology", "Romance", "History"]
    }
];

const seedBooks = async () => {
    try {
        await connectDB();
        console.log('🌱 Seeding demo books...');

        for (const bookData of demoBooks) {
            const [book, created] = await Book.findOrCreate({
                where: { title: bookData.title },
                defaults: bookData
            });

            if (created) {
                console.log(`✅ Added: ${book.title}`);
            } else {
                console.log(`ℹ️ Already exists: ${book.title}`);
            }
        }

        console.log('✨ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedBooks();
