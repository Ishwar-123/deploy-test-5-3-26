import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const fixUsers = async () => {
    try {
        console.log('🔧 Fixing user passwords...\n');

        // Delete existing users
        await User.destroy({
            where: {
                email: ['admin@ebook.com', 'vendor@example.com', 'reader@example.com']
            }
        });
        console.log('✅ Deleted old users');

        // Create admin with plain password (hook will hash it)
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@ebook.com',
            password: 'Admin@123',
            role: 'admin',
            isEmailVerified: true,
            isActive: true,
            isVerified: true
        });
        console.log('✅ Admin created:', admin.email);

        // Create vendor
        const vendor = await User.create({
            name: 'Vendor One',
            email: 'vendor@example.com',
            password: 'Vendor@123',
            role: 'vendor',
            isEmailVerified: true,
            isActive: true,
            isVerified: true,
            vendorDetails: {
                companyName: 'Book Distributors Inc.'
            }
        });
        console.log('✅ Vendor created:', vendor.email);

        // Create reader
        const reader = await User.create({
            name: 'John Reader',
            email: 'reader@example.com',
            password: 'Reader@123',
            role: 'reader',
            isEmailVerified: true,
            isActive: true
        });
        console.log('✅ Reader created:', reader.email);

        console.log('\n🎉 Users fixed successfully!');
        console.log('\n🔑 Login Credentials:');
        console.log('  Admin:  admin@ebook.com / Admin@123');
        console.log('  Vendor: vendor@example.com / Vendor@123');
        console.log('  Reader: reader@example.com / Reader@123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixUsers();
