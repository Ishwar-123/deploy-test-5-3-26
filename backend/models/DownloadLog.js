import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const DownloadLog = sequelize.define('DownloadLog', {
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
    bookId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'books',
            key: 'id'
        }
    },
    downloadType: {
        type: DataTypes.ENUM('view', 'download'),
        defaultValue: 'view'
    },
    ipAddress: {
        type: DataTypes.STRING(45), // IPv6 support
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fileSize: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    downloadedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'download_logs',
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['bookId']
        },
        {
            fields: ['downloadedAt']
        }
    ]
});

export default DownloadLog;
