import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const VendorInventory = sequelize.define('VendorInventory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    vendorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    itemType: {
        type: DataTypes.ENUM('book', 'package'),
        allowNull: false
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantityPurchased: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    quantityAvailable: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    quantitySold: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    purchasePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    sellingPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    totalRevenue: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    lastPurchaseDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastSaleDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'vendor_inventories',
    timestamps: true,
    indexes: [
        { fields: ['vendorId'] },
        { fields: ['itemId', 'itemType'] },
        { fields: ['vendorId', 'itemId', 'itemType'], unique: true }
    ]
});

export default VendorInventory;
