
import { sequelize } from '../config/database.js';
import { User, Setting } from './index.js';
import bcrypt from 'bcryptjs';

const resetDB = async () => {
    try {
        console.log('🔄 Resetting Database...');

        // Disable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Force Sync (Drops tables and recreates them)
        await sequelize.sync({ force: true });

        // Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Database reset successfully');

        // Create Admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
            isEmailVerified: true
        });
        console.log('👤 Admin created:', admin.email);

        // Create Reader (User)
        const user = await User.create({
            name: 'Reader User',
            email: 'user@example.com',
            password: 'password123',
            role: 'reader',
            isEmailVerified: true
        });
        console.log('👤 Reader created:', user.email);

        // Create initial settings
        await Setting.create({ key: 'gst_percentage', value: '18', category: 'tax' });
        await Setting.create({ key: 'support_email', value: 'support@ebook.com', category: 'contact' });

        console.log('🚀 Seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
};

resetDB();
