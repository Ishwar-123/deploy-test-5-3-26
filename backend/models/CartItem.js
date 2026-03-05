import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CartItem = sequelize.define('CartItem', {
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
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: 1
        }
    }
}, {
    tableName: 'cart_items',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['userId', 'bookId'] }
    ]
});

export default CartItem;
