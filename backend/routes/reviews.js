import express from 'express';
import {
    createOrUpdateReview,
    getBookReviews,
    getUserReviewForBook,
    deleteReview,
    getAllReviewsAdmin,
    updateReviewAdmin,
    toggleReviewVisibility,
    deleteReviewAdmin,
    createReviewAdmin,
    markReviewHelpful,
    reportReview
} from '../controllers/reviewController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/:bookId', optionalAuth, getBookReviews);

// Protected user routes
router.post('/', protect, createOrUpdateReview);
router.get('/user/:bookId', protect, getUserReviewForBook);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', protect, markReviewHelpful);
router.post('/:id/report', protect, reportReview);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllReviewsAdmin);
router.post('/admin/create', protect, authorize('admin'), createReviewAdmin);
router.put('/admin/:id', protect, authorize('admin'), updateReviewAdmin);
router.patch('/admin/hide/:id', protect, authorize('admin'), toggleReviewVisibility);
router.delete('/admin/:id', protect, authorize('admin'), deleteReviewAdmin);

export default router;
