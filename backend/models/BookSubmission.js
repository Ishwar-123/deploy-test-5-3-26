import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const BookSubmission = sequelize.define('BookSubmission', {
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
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isbn: {
        type: DataTypes.STRING,
        allowNull: true
    },
    coverImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    proposedRetailPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    proposedWholesalePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    reviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    approvedBookId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'book_submissions',
    timestamps: true,
    indexes: [
        { fields: ['vendorId'] },
        { fields: ['status'] }
    ]
});

export default BookSubmission;
