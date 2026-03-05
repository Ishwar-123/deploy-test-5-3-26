import express from 'express';
import { protect } from '../middleware/auth.js';
import { getCart, addToCart, removeFromCart, clearCart } from '../controllers/cartController.js';

const router = express.Router();

router.use(protect); // All cart routes require authentication

router.get('/', getCart);
router.post('/', addToCart);
router.delete('/:bookId', removeFromCart);
router.delete('/', clearCart);

export default router;
