import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Package from '../models/Package.js';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seed...\n');

        // Create Admin User
        console.log('👤 Creating admin user...');
        const hashedPassword = await bcrypt.hash('Admin@123', 10);

        const [admin, created] = await User.findOrCreate({
            where: { email: 'admin@ebook.com' },
            defaults: {
                name: 'Admin User',
                email: 'admin@ebook.com',
                password: hashedPassword,
                role: 'admin',
                isEmailVerified: true,
                isActive: true,
                isVerified: true
            }
        });

        if (created) {
            console.log('✅ Admin user created: admin@ebook.com');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // Create Vendor User
        console.log('\n👤 Creating vendor user...');
        const vendorPassword = await bcrypt.hash('Vendor@123', 10);

        const [vendor] = await User.findOrCreate({
            where: { email: 'vendor@example.com' },
            defaults: {
                name: 'Vendor One',
                email: 'vendor@example.com',
                password: vendorPassword,
                role: 'vendor',
                isEmailVerified: true,
                isActive: true,
                isVerified: true,
                vendorDetails: {
                    companyName: 'Book Distributors Inc.',
                    businessType: 'Distributor'
                }
            }
        });
        console.log('✅ Vendor user created: vendor@example.com');

        // Create Reader User
        console.log('\n👤 Creating reader user...');
        const readerPassword = await bcrypt.hash('Reader@123', 10);

        const [reader] = await User.findOrCreate({
            where: { email: 'reader@example.com' },
            defaults: {
                name: 'John Reader',
                email: 'reader@example.com',
                password: readerPassword,
                role: 'reader',
                isEmailVerified: true,
                isActive: true
            }
        });
        console.log('✅ Reader user created: reader@example.com');

        // Create Packages
        console.log('\n📦 Creating subscription packages...');
        const packages = [
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
        ];

        for (const pkg of packages) {
            await Package.findOrCreate({
                where: { name: pkg.name },
                defaults: pkg
            });
        }
        console.log('✅ Packages created');

        // Create Sample Books
        console.log('\n📚 Creating sample books...');
        const bookCategories = ['Fiction', 'Technology', 'Business', 'Science', 'Self-Help'];

        for (let i = 1; i <= 10; i++) {
            const category = bookCategories[Math.floor(Math.random() * bookCategories.length)];
            await Book.findOrCreate({
                where: { title: `Sample Book ${i}: ${category} Guide` },
                defaults: {
                    title: `Sample Book ${i}: ${category} Guide`,
                    author: `Author ${i}`,
                    description: `This is a comprehensive guide to ${category.toLowerCase()}. Perfect for beginners and experts alike.`,
                    category: category,
                    language: 'English',
                    pageCount: Math.floor(Math.random() * 300) + 100,
                    coverImage: `/uploads/covers/sample-${i}.jpg`,
                    fileUrl: `/uploads/books/sample-${i}.pdf`,
                    fileType: 'pdf',
                    fileSize: Math.floor(Math.random() * 10000000) + 1000000,
                    retailPrice: Math.floor(Math.random() * 500) + 100,
                    wholesalePrice: Math.floor(Math.random() * 300) + 50,
                    isAvailable: true,
                    isApproved: true,
                    totalSales: Math.floor(Math.random() * 100),
                    averageRating: (Math.random() * 2 + 3).toFixed(1),
                    totalReviews: Math.floor(Math.random() * 50),
                    tags: JSON.stringify([category.toLowerCase(), 'bestseller', 'recommended'])
                }
            });
        }
        console.log('✅ 10 sample books created');

        console.log('\n✨ Database seeded successfully!\n');
        console.log('📋 Summary:');
        console.log('  - 1 Admin user');
        console.log('  - 1 Vendor user');
        console.log('  - 1 Reader user');
        console.log('  - 3 Subscription packages');
        console.log('  - 10 Sample books\n');

        console.log('🔑 Login Credentials:');
        console.log('  Admin:  admin@ebook.com / Admin@123');
        console.log('  Vendor: vendor@example.com / Vendor@123');
        console.log('  Reader: reader@example.com / Reader@123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
