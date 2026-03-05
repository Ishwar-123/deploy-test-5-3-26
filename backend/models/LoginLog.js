import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const LoginLog = sequelize.define('LoginLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('success', 'failed', 'otp_sent', 'locked'),
        allowNull: false
    },
    message: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: true
    },
    otpUsed: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'login_logs',
    timestamps: true
});

export default LoginLog;
