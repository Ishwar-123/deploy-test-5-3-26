import dotenv from 'dotenv';
import connectDB from './config/database.js';
import User from './models/User.js';

dotenv.config();

const createInitialUsers = async () => {
    try {
        await connectDB();

        console.log('👤 Creating essential users...');

        // 1. Create Admin
        const adminExists = await User.findOne({ where: { email: 'admin@ebook.com' } });
        if (!adminExists) {
            await User.create({
                name: 'System Admin',
                email: 'admin@ebook.com',
                password: 'Admin@123',
                role: 'admin',
                isEmailVerified: true,
                isActive: true
            });
            console.log('✅ Admin User created: admin@ebook.com / Admin@123');
        } else {
            console.log('ℹ️ Admin User already exists');
        }

        // 2. Create Regular Reader
        const readerExists = await User.findOne({ where: { email: 'reader@example.com' } });
        if (!readerExists) {
            await User.create({
                name: 'John Reader',
                email: 'reader@example.com',
                password: 'Reader@123',
                role: 'reader',
                isEmailVerified: true,
                isActive: true
            });
            console.log('✅ Reader User created: reader@example.com / Reader@123');
        } else {
            console.log('ℹ️ Reader User already exists');
        }

        // 3. Create Ishwar Reader (Personal test account)
        const ishwarExists = await User.findOne({ where: { email: 'prajapatiishwar79@gmail.com' } });
        if (!ishwarExists) {
            await User.create({
                name: 'Ishwar Prajapati',
                email: 'prajapatiishwar79@gmail.com',
                password: 'User@123',
                role: 'reader',
                isEmailVerified: true,
                isActive: true
            });
            console.log('✅ Test Reader created: prajapatiishwar79@gmail.com / User@123');
        } else {
            console.log('ℹ️ Test Reader already exists');
        }

        console.log('\n✨ Essential users are ready!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating users:', error);
        process.exit(1);
    }
};

createInitialUsers();
