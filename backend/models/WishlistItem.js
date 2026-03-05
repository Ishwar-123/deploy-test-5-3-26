import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const WishlistItem = sequelize.define('WishlistItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    bookId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'wishlist_items',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['userId', 'bookId'] }
    ]
});

export default WishlistItem;
