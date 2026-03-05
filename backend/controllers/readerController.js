import asyncHandler from '../middleware/async.js';
import ReaderLibrary from '../models/ReaderLibrary.js';
import Book from '../models/Book.js';
import Order from '../models/Order.js';
import Package from '../models/Package.js';
import Subscription from '../models/Subscription.js';
import { Op } from 'sequelize';

// @desc    Get reader's library
// @route   GET /api/reader/library
// @access  Private (Reader)
export const getLibrary = asyncHandler(async (req, res, next) => {
    const libraryItems = await ReaderLibrary.findAll({
        where: { userId: req.user.id },
        include: [{
            model: Book,
            as: 'book',
            attributes: ['id', 'title', 'author', 'coverImage', 'category', 'fileUrl', 'fileType']
        }],
        order: [['lastAccessedAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        count: libraryItems.length,
        data: libraryItems
    });
});

// @desc    Purchase a book (Simplified for demo)
// @route   POST /api/reader/purchase
// @access  Private (Reader)
export const purchaseBook = asyncHandler(async (req, res, next) => {
    const { bookId } = req.body;

    const book = await Book.findByPk(bookId);

    if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check if already owned
    const existing = await ReaderLibrary.findOne({
        where: {
            userId: req.user.id,
            bookId: bookId
        }
    });

    if (existing) {
        return res.status(400).json({ success: false, message: 'You already own this book' });
    }

    // Create library entry
    const libraryEntry = await ReaderLibrary.create({
        userId: req.user.id,
        bookId: bookId,
        purchaseDate: new Date(),
        orderId: null
    });

    res.status(201).json({
        success: true,
        message: 'Book purchased successfully',
        data: libraryEntry
    });
});

// @desc    Get book details for reading (with purchase status)
// @route   GET /api/reader/book/:bookId
// @access  Private (Reader)
export const getBook = asyncHandler(async (req, res, next) => {
    const { bookId } = req.params;

    // Get book details
    const book = await Book.findByPk(bookId);

    if (!book) {
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
    }

    // Check if user has purchased this book
    let libraryEntry = await ReaderLibrary.findOne({
        where: {
            userId: req.user.id,
            bookId: bookId
        }
    });

    // Check for active subscription
    const activeSub = await Subscription.findOne({
        where: {
            userId: req.user.id,
            status: 'active',
            endDate: { [Op.gt]: new Date() }
        }
    });

    const isPurchased = !!libraryEntry || !!activeSub || req.user.role === 'admin';
    const lastReadPage = libraryEntry ? libraryEntry.currentPage : 1;

    // Parse previewPages
    let previewPages = [1, 2];
    if (book.previewPages) {
        try {
            previewPages = typeof book.previewPages === 'string' ? JSON.parse(book.previewPages) : book.previewPages;
            if (!Array.isArray(previewPages) || previewPages.length === 0) {
                previewPages = [book.previewStartPage || 1, book.previewEndPage || 2];
            }
        } catch (e) {
            previewPages = [book.previewStartPage || 1, book.previewEndPage || 2];
        }
    }

    // Return book data with purchase status
    res.status(200).json({
        success: true,
        data: {
            _id: book.id,
            id: book.id,
            title: book.title,
            subtitle: book.subtitle || '',
            author: book.author,
            coverImage: book.coverImage,
            pdfUrl: book.fileUrl,
            fileUrl: book.fileUrl,
            fileType: book.fileType,
            category: book.category,
            description: book.description,
            isPurchased: isPurchased,
            retailPrice: book.retailPrice,
            totalPages: book.pageCount || null,
            lastReadPage: lastReadPage,
            bookmarks: libraryEntry ? libraryEntry.bookmarks : [],
            previewPages: previewPages,
            previewStartPage: book.previewStartPage,
            previewEndPage: book.previewEndPage
        }
    });
});

// @desc    Update reading progress
// @route   PUT /api/reader/reading-progress/:bookId
// @access  Private (Reader)
export const updateProgress = asyncHandler(async (req, res, next) => {
    const { bookId } = req.params;
    const { page, totalPages } = req.body;

    let libraryEntry = await ReaderLibrary.findOne({
        where: {
            userId: req.user.id,
            bookId: bookId
        }
    });

    if (!libraryEntry) {
        // Check for subscription to auto-borrow
        const activeSub = await Subscription.findOne({
            where: {
                userId: req.user.id,
                status: 'active',
                endDate: { [Op.gt]: new Date() }
            }
        });

        if (activeSub) {
            libraryEntry = await ReaderLibrary.create({
                userId: req.user.id,
                bookId: bookId,
                purchaseDate: new Date(),
                currentPage: page,
                progress: totalPages > 0 ? (page / totalPages) * 100 : 0,
                lastAccessedAt: new Date()
            });

            return res.status(200).json({
                success: true,
                message: 'Progress saved (Book borrowed via Subscription)',
                data: {
                    currentPage: libraryEntry.currentPage,
                    progress: libraryEntry.progress
                }
            });
        }

        return res.status(404).json({
            success: false,
            message: 'Book not found in your library. Please purchase it first.'
        });
    }

    // Update progress
    libraryEntry.currentPage = page;

    // Use frontend calculated progress if available, otherwise fallback
    if (req.body.progress !== undefined) {
        libraryEntry.progress = req.body.progress;
    } else {
        libraryEntry.progress = totalPages > 0 ? (page / totalPages) * 100 : 0;
    }

    if (req.body.bookmarks) {
        libraryEntry.bookmarks = req.body.bookmarks;
    }

    libraryEntry.lastAccessedAt = new Date();
    await libraryEntry.save();

    res.status(200).json({
        success: true,
        message: 'Progress saved',
        data: {
            currentPage: libraryEntry.currentPage,
            progress: libraryEntry.progress
        }
    });
});

// @desc    Get all packages
// @route   GET /api/reader/packages
// @access  Private (Reader)
export const getPackages = asyncHandler(async (req, res, next) => {
    const packages = await Package.findAll({
        where: { isActive: true },
        order: [['monthlyPrice', 'ASC']]
    });

    res.status(200).json({
        success: true,
        count: packages.length,
        data: packages
    });
});
// @desc    Get reader's orders
// @route   GET /api/reader/orders
// @access  Private (Reader)
export const getOrders = asyncHandler(async (req, res, next) => {
    const orders = await Order.findAll({
        where: { customerId: req.user.id },
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders
    });
});
