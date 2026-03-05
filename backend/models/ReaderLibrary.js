import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ReaderLibrary = sequelize.define('ReaderLibrary', {
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
    purchaseDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    downloadCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastAccessedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    currentPage: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    progress: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    bookmarks: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    notes: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    highlights: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5
        }
    },
    review: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'reader_libraries',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'bookId'], unique: true },
        { fields: ['userId'] },
        { fields: ['bookId'] }
    ]
});

export default ReaderLibrary;
