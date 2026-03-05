import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'INR'
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
    },
    paymentGateway: {
        type: DataTypes.STRING,
        defaultValue: 'razorpay'
    },
    razorpayOrderId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    razorpayPaymentId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    razorpaySignature: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['orderId'] },
        { fields: ['status'] },
        { fields: ['razorpayOrderId'] }
    ]
});

export default Payment;
