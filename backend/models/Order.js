import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        defaultValue: () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    customerName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    customerEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    orderType: {
        type: DataTypes.ENUM('book', 'package', 'mixed', 'subscription'),
        allowNull: false
    },
    // Items stored as JSON array
    items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    tax: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    // Purchase source
    purchasedFrom: {
        type: DataTypes.ENUM('admin', 'vendor'),
        defaultValue: 'admin'
    },
    vendorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Commission (for vendor sales)
    commission: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    vendorEarnings: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    // Razorpay specific
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
    // Payment
    isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.ENUM('credit_card', 'debit_card', 'upi', 'wallet', 'net_banking', 'razorpay'),
        allowNull: true
    },
    paymentId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Order status
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled', 'refunded'),
        defaultValue: 'pending'
    },
    // Coupon
    couponCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Institution
    institutionId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'orders',
    timestamps: true,
    indexes: [
        { fields: ['orderNumber'], unique: true },
        { fields: ['customerId', 'createdAt'] },
        { fields: ['vendorId', 'createdAt'] },
        { fields: ['status'] },
        { fields: ['paymentStatus'] }
    ]
});

export default Order;
