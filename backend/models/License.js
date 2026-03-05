import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const License = sequelize.define('License', {
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
    licenseNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    licenseType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    issuedDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'expired', 'suspended', 'revoked'),
        defaultValue: 'active'
    },
    documentUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    verifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'licenses',
    timestamps: true,
    indexes: [
        { fields: ['vendorId'] },
        { fields: ['licenseNumber'], unique: true },
        { fields: ['status'] }
    ]
});

export default License;
