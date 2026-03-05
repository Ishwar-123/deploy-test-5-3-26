import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { downloadTokenLimiter, downloadStreamLimiter } from '../middleware/downloadLimiter.js';
import {
    requestDownloadToken,
    streamBook,
    getDownloadHistory,
    getDownloadAnalytics
} from '../controllers/downloadController.js';

const router = express.Router();

// Request download token (requires authentication + rate limiting)
router.post('/request/:bookId', protect, downloadTokenLimiter, requestDownloadToken);

// Stream/Download book (requires valid signed token in query params + rate limiting)
router.get('/stream/:bookId', downloadStreamLimiter, streamBook);

// Get user's download history
router.get('/history', protect, getDownloadHistory);

// Get download analytics (admin only)
router.get('/analytics', protect, adminOnly, getDownloadAnalytics);

export default router;
