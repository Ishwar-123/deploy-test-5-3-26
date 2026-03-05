import express from 'express';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/role.js';
import {
    getDashboardStats,
    getBookSubmissions,
    approveSubmission,
    rejectSubmission,
    getAllBooks,
    createBook,
    updateBook,
    deleteBook,
    getAllVendors,
    createVendor,
    updateVendor,
    getAllPackages,
    createPackage,
    updatePackage,
    deletePackage,
    getAllReaders,
    toggleBlockReader,
    getAllOrders,
    getReports,
    grantLicenseToVendor,
    revokeLicenseFromVendor,
    deleteVendor,
    getAuthMonitorData,
    unlockUser,
    expireOTP
} from '../controllers/adminController.js';


const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Book Submissions
router.get('/submissions', getBookSubmissions);
router.put('/submissions/:id/approve', approveSubmission);
router.put('/submissions/:id/reject', rejectSubmission);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrator functions
 */

// Books CRUD
/**
 * @swagger
 * /api/admin/books:
 *   get:
 *     summary: Get all books (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of books
 */
router.get('/books', getAllBooks);

/**
 * @swagger
 * /api/admin/books:
 *   post:
 *     summary: Create a new book
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       201:
 *         description: Book created
 */
router.post('/books', createBook);

/**
 * @swagger
 * /api/admin/books/{id}:
 *   put:
 *     summary: Update a book
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: Book updated
 */
router.put('/books/:id', updateBook);

/**
 * @swagger
 * /api/admin/books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Book deleted
 */
router.delete('/books/:id', deleteBook);

// Vendors
router.get('/vendors', getAllVendors);
router.post('/vendors', createVendor);
router.put('/vendors/:id', updateVendor);
router.post('/vendors/:id/grant-license', grantLicenseToVendor);
router.post('/vendors/:id/revoke-license', revokeLicenseFromVendor);
router.delete('/vendors/:id', deleteVendor);

// Packages CRUD
router.get('/packages', getAllPackages);
router.post('/packages', createPackage);
router.put('/packages/:id', updatePackage);
router.delete('/packages/:id', deletePackage);

// Readers
router.get('/readers', getAllReaders);
router.put('/readers/:id/toggle-block', toggleBlockReader);

// Orders
router.get('/orders', getAllOrders);

// Reports
router.get('/reports', getReports);

// Auth Monitor
router.get('/auth-monitor', getAuthMonitorData);
router.post('/auth-monitor/unlock/:id', unlockUser);
router.post('/auth-monitor/expire-otp/:id', expireOTP);

export default router;
