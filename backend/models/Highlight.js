import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Highlight = sequelize.define('Highlight', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    bookId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'The text that was highlighted'
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'User note attached to highlight'
    },
    position: {
        type: DataTypes.JSON, // Stores { pageNumber, boundingRects, rects }
        allowNull: false
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '#ffeb3b' // Default yellow highlight
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: false,
            fields: ['userId', 'bookId']
        }
    ]
});

export default Highlight;
