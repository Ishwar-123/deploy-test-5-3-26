import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Book from '../models/Book.js';

dotenv.config();

const seedBooks = async () => {
    try {
        await connectDB();

        console.log('📚 Adding showcase demo books...');

        const books = [
            {
                title: "The Future of AI",
                author: "Sarah Connor",
                description: "Exploring the boundaries of Artificial Intelligence and what it means for humanity in the next decade.",
                category: "Technology",
                retailPrice: 599,
                wholesalePrice: 400,
                coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=600",
                isAvailable: true,
                rating: 4.8,
                stats: { views: 1240, sales: 150 }
            },
            {
                title: "Cosmic Voyager",
                author: "Neil Tyson",
                description: "A journey through the stars and the mysteries of our universe, from the Big Bang to Black Holes.",
                category: "Science",
                retailPrice: 850,
                wholesalePrice: 600,
                coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600",
                isAvailable: true,
                rating: 4.9,
                stats: { views: 3400, sales: 450 }
            },
            {
                title: "Startup Zero",
                author: "Peter Thiel",
                description: "Notes on startups, or how to build the future. The essential guide for every entrepreneur.",
                category: "Business",
                retailPrice: 700,
                wholesalePrice: 500,
                coverImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=600",
                isAvailable: true,
                rating: 4.7,
                stats: { views: 2100, sales: 300 }
            },
            {
                title: "The Silent Forest",
                author: "Haruki M.",
                description: "A mesmerizing tale of nature, silence, and the secrets hidden within the deep woods.",
                category: "Fiction",
                retailPrice: 499,
                wholesalePrice: 350,
                coverImage: "https://images.unsplash.com/photo-1448375240586-dfd8d395ea6c?auto=format&fit=crop&q=80&w=600",
                isAvailable: true,
                rating: 4.5,
                stats: { views: 980, sales: 120 }
            },
            {
                title: "Mindset Shift",
                author: "Carol Dweck",
                description: "The new psychology of success. How we can learn to fulfill our potential.",
                category: "Self-Help",
                retailPrice: 650,
                wholesalePrice: 450,
                coverImage: "https://images.unsplash.com/photo-1499209974431-2761387d1ea3?auto=format&fit=crop&q=80&w=600",
                isAvailable: true,
                rating: 4.6,
                stats: { views: 1560, sales: 230 }
            },
            {
                title: "Digital Nomad Life",
                author: "Tim Ferriss",
                description: "How to escape the 9-5, live anywhere, and join the new rich.",
                category: "Non-Fiction", // Was Travel
                retailPrice: 450,
                wholesalePrice: 300,
                coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600",
                isAvailable: true,
                rating: 4.4,
                stats: { views: 890, sales: 95 }
            },
            {
                title: "Healthy Habits",
                author: "Michael Pollan",
                description: "A guide to eating well and living a balanced life in the modern world.",
                category: "Non-Fiction", // Was Health
                retailPrice: 550,
                wholesalePrice: 380,
                coverImage: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=600",
                isAvailable: true,
                rating: 4.3,
                stats: { views: 750, sales: 80 }
            },
            {
                title: "Ancient Civilizations",
                author: "Graham Hancock",
                description: "Uncovering the lost chapters of human history and forgotten empires.",
                category: "History",
                retailPrice: 950,
                wholesalePrice: 700,
                coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600",
                isAvailable: true,
                rating: 4.8,
                stats: { views: 1800, sales: 290 }
            },
            {
                title: "Code Mastery",
                author: "Robert Martin",
                description: "Clean code principles and practices for the modern software engineer.",
                category: "Technology",
                retailPrice: 1200,
                wholesalePrice: 900,
                coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600",
                isAvailable: true,
                rating: 4.9,
                stats: { views: 5600, sales: 800 }
            },
            {
                title: "Modern Economics",
                author: "Thomas Piketty",
                description: "Capital in the Twenty-First Century. An analysis of wealth inequality.",
                category: "Business",
                retailPrice: 1100,
                wholesalePrice: 850,
                coverImage: "https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=600",
                isAvailable: true,
                rating: 4.5,
                stats: { views: 1100, sales: 150 }
            }
        ];

        await Book.insertMany(books);
        console.log(`✅ Successfully added ${books.length} demo books!`);
        console.log('Refresh your dashboard to see them.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding books:', error);
        process.exit(1);
    }
};

seedBooks();
