import dotenv from 'dotenv';
import { connectDB, sequelize } from '../config/database.js';

dotenv.config();

const updateAdminEmail = async () => {
    try {
        await connectDB();

        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) {
            console.error('❌ ADMIN_EMAIL not set in .env');
            process.exit(1);
        }

        console.log(`🔄 Updating admin email to: ${adminEmail}`);

        const [rowsUpdated] = await sequelize.query(
            `UPDATE users SET email = ? WHERE role = 'admin'`,
            { replacements: [adminEmail] }
        );

        console.log(`✅ Admin email updated! Rows affected: ${rowsUpdated}`);

        // Verify
        const [rows] = await sequelize.query(
            `SELECT id, name, email, role FROM users WHERE role = 'admin'`
        );
        console.log('📋 Admin user now:', rows[0]);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

updateAdminEmail();
