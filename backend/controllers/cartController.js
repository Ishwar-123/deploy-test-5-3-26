import CartItem from '../models/CartItem.js';
import Book from '../models/Book.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Get user cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = asyncHandler(async (req, res) => {
    const cartItems = await CartItem.findAll({
        where: { userId: req.user.id },
        include: [{
            model: Book,
            as: 'book',
            attributes: ['id', 'title', 'coverImage', 'retailPrice', 'author', 'fileType']
        }]
    });

    res.json({
        success: true,
        data: cartItems
    });
});

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
export const addToCart = asyncHandler(async (req, res) => {
    const { bookId } = req.body;

    if (!bookId) {
        return res.status(400).json({ message: 'Book ID is required' });
    }

    // Check if book exists
    const book = await Book.findByPk(bookId);
    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    // Check if item already in cart
    let cartItem = await CartItem.findOne({
        where: {
            userId: req.user.id,
            bookId
        }
    });

    if (cartItem) {
        // If already exists, increment quantity (optional logic, usually for ebooks quantity=1)
        // For now, let's keep it simple and say it's already in cart
        return res.status(400).json({ message: 'Item already in cart' });
    }

    // Create new cart item
    cartItem = await CartItem.create({
        userId: req.user.id,
        bookId
    });

    // Fetch complete item with book details
    const newItem = await CartItem.findByPk(cartItem.id, {
        include: [{
            model: Book,
            as: 'book',
            attributes: ['id', 'title', 'coverImage', 'retailPrice', 'author']
        }]
    });

    res.status(201).json({
        success: true,
        data: newItem
    });
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:bookId
 * @access  Private
 */
export const removeFromCart = asyncHandler(async (req, res) => {
    const { bookId } = req.params;

    const result = await CartItem.destroy({
        where: {
            userId: req.user.id,
            bookId
        }
    });

    if (!result) {
        return res.status(404).json({ message: 'Item not found in cart' });
    }

    res.json({
        success: true,
        message: 'Item removed from cart'
    });
});

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
export const clearCart = asyncHandler(async (req, res) => {
    await CartItem.destroy({
        where: { userId: req.user.id }
    });

    res.json({
        success: true,
        message: 'Cart cleared'
    });
});
