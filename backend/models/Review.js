import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    bookId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'book_id',
        references: {
            model: 'books',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    rating: {
        type: DataTypes.DECIMAL(2, 1),
        allowNull: false,
        validate: {
            min: 0.5,
            max: 5
        }
    },
    reviewText: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'review_text'
    },
    isHidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_hidden'
    },
    isAdminEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_admin_edited'
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_featured'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified'
    },
    helpfulCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'helpful_count'
    },
    reportCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'report_count'
    }
}, {
    tableName: 'reviews',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'book_id'],
            name: 'unique_user_book_review'
        },
        { fields: ['book_id'] },
        { fields: ['user_id'] },
        { fields: ['rating'] },
        { fields: ['is_hidden'] },
        { fields: ['is_featured'] },
        { fields: ['created_at'] }
    ]
});

export default Review;
