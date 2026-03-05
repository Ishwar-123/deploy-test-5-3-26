import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const addOtpSecurityFields = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();

        console.log('--- Checking for columns existence ---');
        const tableInfo = await queryInterface.describeTable('users');

        if (!tableInfo.lastOtpRequestAt) {
            console.log('Adding lastOtpRequestAt to users table...');
            await queryInterface.addColumn('users', 'lastOtpRequestAt', {
                type: DataTypes.DATE,
                allowNull: true
            });
        }

        if (!tableInfo.otpRequestCount) {
            console.log('Adding otpRequestCount to users table...');
            await queryInterface.addColumn('users', 'otpRequestCount', {
                type: DataTypes.INTEGER,
                defaultValue: 0
            });
        }

        console.log('✅ OTP Security fields added successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding OTP Security fields:', error);
        process.exit(1);
    }
};

addOtpSecurityFields();
