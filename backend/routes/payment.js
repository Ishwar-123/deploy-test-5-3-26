import express from 'express';
import {
    createOrder,
    verifyPayment,
    createSubscriptionOrder,
    verifySubscriptionPayment,
    createCartOrder,
    verifyCartPayment,
    createWishlistOrder,
    verifyWishlistPayment,
    handleRazorpayWebhook,
    handlePaymentFailure
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/subscription-order', protect, createSubscriptionOrder);
router.post('/verify-subscription', protect, verifySubscriptionPayment);
router.post('/cart-order', protect, createCartOrder);
router.post('/verify-cart', protect, verifyCartPayment);
router.post('/wishlist-order', protect, createWishlistOrder);
router.post('/verify-wishlist', protect, verifyWishlistPayment);

// Webhook Route (No Auth Middleware - Signature Verification Inside)
router.post('/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

// Payment Failure Route
router.post('/failure', protect, handlePaymentFailure);

export default router;
