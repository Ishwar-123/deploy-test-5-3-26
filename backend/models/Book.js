import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Book = sequelize.define('Book', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Book title is required' }
        }
    },
    subtitle: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Author name is required' }
        }
    },
    description: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        defaultValue: ''
    },
    isbn: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    category: {
        type: DataTypes.ENUM(
            'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering',
            'Electronics', 'Computer Science & IT', 'Architecture',
            'Business & Management', 'Physics & Chemistry', 'Mathematics',
            'Vocational & Higher Education', 'Other Technical'
        ),
        allowNull: false
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'English'
    },
    publisher: {
        type: DataTypes.STRING,
        allowNull: true
    },
    publishedDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    pageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    coverImage: {
        type: DataTypes.STRING,
        defaultValue: '/uploads/covers/default.jpg'
    },
    additionalImages: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    fileUrl: {
        type: DataTypes.STRING,
        defaultValue: '/uploads/books/sample.pdf'
    },
    fileType: {
        type: DataTypes.ENUM('pdf', 'epub'),
        defaultValue: 'pdf'
    },
    fileSize: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    // Pricing
    retailPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    wholesalePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    // Availability
    isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    submissionId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Stats (using JSON for nested object)
    stats: {
        type: DataTypes.JSON,
        defaultValue: {
            views: 0
        }
    },
    catalogUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    totalSales: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalRevenue: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    averageRating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 0,
        validate: {
            min: 0,
            max: 5
        }
    },
    totalReviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    manualRating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 0.0,
        validate: {
            min: 0,
            max: 5
        }
    },
    useManualRating: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // DRM Settings (JSON field)
    drm: {
        type: DataTypes.JSON,
        defaultValue: {
            allowDownload: true,
            downloadLimit: 3,
            allowPrint: false,
            watermark: true
        }
    },
    // Tags (JSON array)
    tags: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    // Preview pages (JSON array)
    previewPages: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    // Admin-selected preview page range
    previewStartPage: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    previewEndPage: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        validate: {
            min: 1
        }
    }
}, {
    tableName: 'books',
    timestamps: true,
    indexes: [
        { fields: ['title', 'author'] },
        { fields: ['category', 'isAvailable'] },
        { fields: ['retailPrice'] },
        { fields: ['averageRating'] },
        { fields: ['totalSales'] },
        { fields: ['createdAt'] }
    ]
});

export default Book;
