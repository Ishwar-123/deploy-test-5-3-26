import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { getBooks, getBookById, getCategories } from '../controllers/bookController.js';

const router = express.Router();

// Public routes for browsing books

// Get categories (must be before :id)
router.get('/meta/categories', getCategories);

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book Management
 */

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 */
router.get('/', optionalAuth, getBooks);

// Search books (can be handled by getBooks with query param, but keeping explicit route if needed)
router.get('/search', optionalAuth, getBooks);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 */
router.get('/:id', optionalAuth, getBookById);

export default router;
