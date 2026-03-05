import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Subscription = sequelize.define('Subscription', {
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
    packageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'packages',
            key: 'id'
        }
    },
    billingCycle: {
        type: DataTypes.ENUM('monthly', 'yearly'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'cancelled', 'expired', 'pending'),
        defaultValue: 'pending'
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    autoRenew: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    paymentId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['status'] },
        { fields: ['endDate'] }
    ]
});

export default Subscription;
