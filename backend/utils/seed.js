import dotenv from 'dotenv';
import { connectDB, sequelize } from '../config/database.js';
import {
    User, Book, Package, License, BookSubmission,
    Review, ReaderLibrary, VendorInventory
} from '../models/index.js';

dotenv.config();

const seedDatabase = async () => {
    try {
        // Force sync for fresh start
        console.log('🔄 Resetting database schema...');
        await sequelize.sync({ force: true });
        console.log('✅ Tables recreated');

        console.log('👤 Creating users...');

        // 1. Admin - email/password from .env
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
        const admin = await User.create({
            name: 'System Admin',
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            isEmailVerified: true,
            isActive: true,
            phone: '9999999999'
        });
        console.log('✅ Admin created:', admin.email);

        // 2. Vendor (Matches Quick Login)
        const vendor = await User.create({
            name: 'Premium Vendor',
            email: 'vendor@example.com',
            password: 'password123',
            role: 'vendor',
            isEmailVerified: true,
            isActive: true,
            phone: '1122334455',
            vendorDetails: {
                companyName: 'BookVerse Official'
            }
        });
        console.log('✅ Vendor created:', vendor.email);

        // 3. Reader (Matches Quick Login)
        const reader = await User.create({
            name: 'Jane Reader',
            email: 'user@example.com',
            password: 'password123',
            role: 'reader',
            isEmailVerified: true,
            isActive: true,
            phone: '9988776655'
        });
        console.log('✅ Reader created:', reader.email);

        // Create Packages
        console.log('📦 Creating packages...');
        await Package.bulkCreate([
            {
                name: 'Silver',
                bookLimit: 3,
                monthlyPrice: 299,
                yearlyPrice: 2999,
                wholesaleMonthlyPrice: 249,
                wholesaleYearlyPrice: 2499,
                description: 'Perfect for casual readers',
                features: JSON.stringify(['3 Books per month', 'Unlimited reading', 'Download access']),
                isActive: true
            },
            {
                name: 'Gold',
                bookLimit: 5,
                monthlyPrice: 499,
                yearlyPrice: 4999,
                wholesaleMonthlyPrice: 399,
                wholesaleYearlyPrice: 3999,
                description: 'Best for regular readers',
                features: JSON.stringify(['5 Books per month', 'Unlimited reading', 'Download access', 'Priority support']),
                isActive: true
            },
            {
                name: 'Platinum',
                bookLimit: 7,
                monthlyPrice: 699,
                yearlyPrice: 6999,
                wholesaleMonthlyPrice: 549,
                wholesaleYearlyPrice: 5499,
                description: 'Ultimate reading experience',
                features: JSON.stringify(['7 Books per month', 'Unlimited reading', 'Download access', 'Priority support', 'Early access']),
                isActive: true
            }
        ]);

        // Create Sample Books
        console.log('📚 Creating sample books...');
        const bookCategories = ['Fiction', 'Technology', 'Business', 'Science', 'Self-Help'];

        for (let i = 1; i <= 10; i++) {
            const category = bookCategories[Math.floor(Math.random() * bookCategories.length)];
            await Book.create({
                title: `Premium Guide to ${category} Vol ${i}`,
                author: `Expert Author ${i}`,
                description: `A deep dive into the world of ${category}. Includes advanced techniques and case studies.`,
                category: category,
                language: 'English',
                pageCount: 250,
                coverImage: `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400`,
                fileUrl: `/uploads/books/sample.pdf`,
                fileType: 'pdf',
                retailPrice: 499,
                wholesalePrice: 299,
                isAvailable: true,
                isApproved: true,
                averageRating: 4.5,
                totalReviews: 10
            });
        }
        console.log('✅ 10 books created');

        console.log('\n✨ Database seeded successfully!\n');
        console.log('🔑 Quick Login Ready:');
        console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
        console.log('  Vendor: vendor@example.com / password123');
        console.log('  Reader: user@example.com / password123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
