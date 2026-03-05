import Book from '../models/Book.js';
import { asyncHandler } from '../utils/errorHandler.js';
import ReaderLibrary from '../models/ReaderLibrary.js';
import { Op } from 'sequelize';

/**
 * @desc    Get all books (public)
 * @route   GET /api/books
 * @access  Public
 */
export const getBooks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, category, search, sort = '-createdAt' } = req.query;

    let where = {
        isAvailable: true
    };

    // Filter by category
    if (category) {
        where.category = category;
    }

    // Search filter
    if (search) {
        where[Op.or] = [
            { title: { [Op.like]: `%${search}%` } },
            { author: { [Op.like]: `%${search}%` } },
            { isbn: { [Op.like]: `%${search}%` } }
        ];
    }

    // Determine sort order
    let order;
    switch (sort) {
        case 'price-asc':
            order = [['retailPrice', 'ASC']];
            break;
        case 'price-desc':
            order = [['retailPrice', 'DESC']];
            break;
        case 'rating':
            order = [['averageRating', 'DESC']];
            break;
        case 'views':
            order = [['stats', 'DESC']]; // JSON field sorting
            break;
        default: // newest
            order = [['createdAt', 'DESC']];
    }

    let books = await Book.findAll({
        where,
        order,
        limit: parseInt(limit),
        offset: (page - 1) * limit
    });

    // Convert to plain objects and preserve real ratings
    books = books.map(book => {
        const b = book.toJSON();
        return b;
    });

    // Check purchase status if user is logged in
    if (req.user) {
        const purchasedBooks = await ReaderLibrary.findAll({
            where: {
                userId: req.user.id,
            },
            attributes: ['bookId']
        });

        const purchasedBookIds = new Set(purchasedBooks.map(p => p.bookId));

        books = books.map(book => ({
            ...book,
            isPurchased: purchasedBookIds.has(book.id)
        }));
    } else {
        // Explicitly set isPurchased to false for non-authenticated users
        books = books.map(book => ({
            ...book,
            isPurchased: false
        }));
    }

    const total = await Book.count({ where });

    res.json({
        success: true,
        data: {
            books,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        }
    });
});

/**
 * @desc    Get single book by ID
 * @route   GET /api/books/:id
 * @access  Public
 */
export const getBookById = asyncHandler(async (req, res) => {
    console.log(`[getBookById] Fetching book with ID: ${req.params.id}`);

    try {
        const book = await Book.findByPk(req.params.id);

        if (!book) {
            console.warn(`[getBookById] Book not found for ID: ${req.params.id}`);
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Convert to plain object
        let bookData = book.toJSON();

        // Removed manual rating override so book details only display real data

        // Check if user has purchased this book
        let isPurchased = false;
        if (req.user) {
            const purchase = await ReaderLibrary.findOne({
                where: {
                    userId: req.user.id,
                    bookId: book.id
                }
            });
            const isFree = Number(book.retailPrice) === 0;
            const isAdmin = req.user.role === 'admin';
            isPurchased = !!(purchase || isFree || isAdmin);
        } else {
            // Even for public guests, a book with price 0 is considered "purchased" (accessible)
            isPurchased = Number(book.retailPrice) === 0;
        }

        // Add isPurchased property to book data
        bookData.isPurchased = isPurchased;

        // Parse previewPages into array
        if (bookData.previewPages) {
            try {
                bookData.previewPages = typeof bookData.previewPages === 'string' ? JSON.parse(bookData.previewPages) : bookData.previewPages;
                if (!Array.isArray(bookData.previewPages) || bookData.previewPages.length === 0) {
                    bookData.previewPages = [bookData.previewStartPage || 1, bookData.previewEndPage || 2];
                }
            } catch (e) {
                bookData.previewPages = [bookData.previewStartPage || 1, bookData.previewEndPage || 2];
            }
        } else {
            bookData.previewPages = [bookData.previewStartPage || 1, bookData.previewEndPage || 2];
        }

        res.json({
            success: true,
            data: {
                book: bookData,
                hasAccess: isPurchased
            }
        });

        // Log success
        console.log(`[getBookById] Successfully retrieved book: ${book.title}`);

    } catch (error) {
        console.error(`[getBookById] Error:`, error);
        throw error;
    }
});

/**
 * @desc    Get book categories
 * @route   GET /api/books/meta/categories
 * @access  Public
 */
export const getCategories = asyncHandler(async (req, res) => {
    // Get unique categories from books
    const books = await Book.findAll({
        attributes: ['category'],
        group: ['category']
    });

    const categories = books.map(b => b.category);

    res.json({
        success: true,
        data: categories
    });
});
