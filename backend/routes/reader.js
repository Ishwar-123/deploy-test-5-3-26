import express from 'express';
import { protect } from '../middleware/auth.js';
import { readerOnly } from '../middleware/role.js';
import { getLibrary, purchaseBook, getBook, updateProgress, getPackages, getOrders } from '../controllers/readerController.js';

const router = express.Router();

// All reader routes require authentication and reader role
router.use(protect, readerOnly);

// Dashboard
router.get('/dashboard', (req, res) => {
    res.json({ success: true, message: 'Reader dashboard - TODO: Implement' });
});

// Library
router.get('/library', getLibrary);

// Get book details for reading (with purchase status)
router.get('/book/:bookId', getBook);

// Subscription packages
router.get('/packages', getPackages);

// Subscription details (user's)
router.get('/subscription', (req, res) => {
    res.json({ success: true, message: 'Get subscription - TODO: Implement' });
});

router.post('/subscribe', (req, res) => {
    res.json({ success: true, message: 'Purchase package - TODO: Implement' });
});

// Purchase book
router.post('/purchase', purchaseBook);

// Orders
router.get('/orders', getOrders);

// Reading progress
router.put('/reading-progress/:bookId', updateProgress);

export default router;
