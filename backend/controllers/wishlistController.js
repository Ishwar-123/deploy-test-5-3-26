import WishlistItem from '../models/WishlistItem.js';
import Book from '../models/Book.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Get user wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
export const getWishlist = asyncHandler(async (req, res) => {
    const wishlistItems = await WishlistItem.findAll({
        where: { userId: req.user.id },
        include: [{
            model: Book,
            as: 'book',
            attributes: ['id', 'title', 'coverImage', 'retailPrice', 'author', 'averageRating']
        }]
    });

    res.json({
        success: true,
        data: wishlistItems
    });
});

/**
 * @desc    Add item to wishlist
 * @route   POST /api/wishlist
 * @access  Private
 */
export const addToWishlist = asyncHandler(async (req, res) => {
    const { bookId } = req.body;

    if (!bookId) {
        return res.status(400).json({ message: 'Book ID is required' });
    }

    // Check if book exists
    const book = await Book.findByPk(bookId);
    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    // Check if already in wishlist
    const exists = await WishlistItem.findOne({
        where: {
            userId: req.user.id,
            bookId
        }
    });

    if (exists) {
        return res.status(400).json({ message: 'Item already in wishlist' });
    }

    // Add to wishlist
    const newItem = await WishlistItem.create({
        userId: req.user.id,
        bookId
    });

    // Fetch with book details
    const wishlistItem = await WishlistItem.findByPk(newItem.id, {
        include: [{
            model: Book,
            as: 'book',
            attributes: ['id', 'title', 'coverImage', 'retailPrice', 'author']
        }]
    });

    res.status(201).json({
        success: true,
        data: wishlistItem
    });
});

/**
 * @desc    Remove item from wishlist
 * @route   DELETE /api/wishlist/:bookId
 * @access  Private
 */
export const removeFromWishlist = asyncHandler(async (req, res) => {
    const { bookId } = req.params;

    const result = await WishlistItem.destroy({
        where: {
            userId: req.user.id,
            bookId
        }
    });

    if (!result) {
        return res.status(404).json({ message: 'Item not found in wishlist' });
    }

    res.json({
        success: true,
        message: 'Item removed from wishlist'
    });
});

/**
 * @desc    Check if book is in wishlist
 * @route   GET /api/wishlist/:bookId/check
 * @access  Private
 */
export const checkWishlistStatus = asyncHandler(async (req, res) => {
    const { bookId } = req.params;

    const exists = await WishlistItem.findOne({
        where: {
            userId: req.user.id,
            bookId
        }
    });

    res.json({
        success: true,
        inWishlist: !!exists
    });
});
