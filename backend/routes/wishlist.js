import express from 'express';
import { protect } from '../middleware/auth.js';
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlistStatus } from '../controllers/wishlistController.js';

const router = express.Router();

router.use(protect); // All wishlist routes require authentication

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:bookId', removeFromWishlist);
router.get('/:bookId/check', checkWishlistStatus);

export default router;
