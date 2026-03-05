import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Institution = sequelize.define('Institution', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('school', 'college', 'university', 'library', 'corporate'),
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING,
        defaultValue: 'India'
    },
    pincode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contactPerson: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contactEmail: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contactPhone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'institutions',
    timestamps: true
});

export default Institution;
