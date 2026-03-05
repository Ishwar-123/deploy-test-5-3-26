import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Package = sequelize.define('Package', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    bookLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    isUnlimited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    hasVerifiedBadge: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isRecommended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    monthlyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    yearlyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    lifetimePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    wholesaleMonthlyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    wholesaleYearlyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    features: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    maxBooks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    displayOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'packages',
    timestamps: true
});

export default Package;
