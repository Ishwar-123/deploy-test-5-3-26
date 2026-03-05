import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Notification = sequelize.define('Notification', {
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
    type: {
        type: DataTypes.ENUM('order', 'payment', 'subscription', 'system', 'promotion'),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    },
    readAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['isRead'] },
        { fields: ['createdAt'] }
    ]
});

export default Notification;
