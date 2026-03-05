import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Setting = sequelize.define('Setting', {
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    value: {
        type: DataTypes.TEXT, // Store as text, parse if needed, or simple string URL
        allowNull: false
    },
    description: {
        type: DataTypes.STRING
    }
});

export default Setting;
