import { sequelize } from './config/database.js';
import { User } from './models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const users = [
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        phone: '9999999999',
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true
    },
    {
        name: 'Vendor User',
        email: 'vendor@example.com',
        password: 'password123',
        phone: '1122334455',
        role: 'vendor',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        vendorDetails: {
            companyName: 'Demo Vendor Store'
        }
    },
    {
        name: 'Reader User',
        email: 'user@example.com',
        password: 'password123',
        phone: '9988776655',
        role: 'reader',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true
    }
];

const seedDemo = async () => {
    try {
        console.log('🔄 Connecting to database and dropping tables...');
        // Force sync will drop all tables and recreate them based on models
        await sequelize.sync({ force: true });
        console.log('✅ Database tables reset successfully');

        for (const userData of users) {
            await User.create(userData);
            console.log(`✅ Created demo user: ${userData.email} (${userData.role})`);
        }

        console.log('✨ Demo seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding demo users:', error);
        process.exit(1);
    }
};

seedDemo();
