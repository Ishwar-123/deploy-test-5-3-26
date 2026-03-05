import { sequelize } from './config/database.js';
import User from './models/User.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const users = [
    {
        name: 'Admin User',
        email: 'admin@ebook.com',
        password: 'admin123',
        role: 'admin',
        isEmailVerified: true
    },
    {
        name: 'Vendor User',
        email: 'vendor@ebook.com',
        password: 'vendor123',
        role: 'vendor',
        isEmailVerified: true,
        vendorDetails: {
            companyName: 'Best Books Co.'
        }
    },
    {
        name: 'Reader User',
        email: 'reader@ebook.com',
        password: 'reader123',
        role: 'reader',
        isEmailVerified: true
    }
];

const seedUsers = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to Database');

        // Sync database first to ensure tables exist
        await sequelize.sync();

        for (const user of users) {
            // Check if user exists
            const existingUser = await User.findOne({ where: { email: user.email } });

            if (!existingUser) {
                // Create user
                await User.create(user);
                console.log(`✅ Created user: ${user.name} (${user.role})`);
            } else {
                console.log(`⚠️  User already exists: ${user.email}`);
            }
        }

        console.log('✨ Seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
