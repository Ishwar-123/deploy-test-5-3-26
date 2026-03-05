import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ReviewHelpful = sequelize.define('ReviewHelpful', {
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
    reviewId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'review_id',
        references: {
            model: 'reviews',
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'review_helpfuls',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'review_id'],
            name: 'unique_user_review_helpful'
        }
    ]
});

export default ReviewHelpful;
