import express from 'express';
import { body } from 'express-validator';
import {
    register,
    login,
    logout,
    verifyEmail,
    resendOTP,
    forgotPassword,
    resetPassword,
    getMe,
    updateProfile,
    heartbeat,
    verifyPhone,
    requestLoginOTP,
    verifyLoginOTP,
    verifyResetOTP,
    verifyDualOTP,
    setupPin,
    verifyPin,
    changePin,
    forgotPin,
    resetPin
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Validation rules
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').notEmpty().withMessage('Mobile number is required'),
    body('role').optional().isIn(['admin', 'vendor', 'reader']).withMessage('Invalid role')
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const verifyEmailValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

const resetPasswordValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const pinValidation = [
    body('pin').isLength({ min: 6, max: 6 }).withMessage('PIN must be 6 digits').isNumeric().withMessage('PIN must contain only numbers')
];

// Routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/verify-email', verifyEmailValidation, validate, verifyEmail);
router.post('/logout', protect, logout);
router.post('/heartbeat', protect, heartbeat);
router.post('/resend-otp', body('email').isEmail(), validate, resendOTP);
router.post('/forgot-password', body('email').isEmail(), validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/verify-phone', body('phone').notEmpty(), validate, verifyPhone);
router.post('/login-otp/request', requestLoginOTP);
router.post('/login-otp/verify', verifyLoginOTP);
router.post('/verify-dual-otp', verifyDualOTP);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// PIN Routes
router.post('/pin/setup', body('email').isEmail(), pinValidation, validate, setupPin);
router.post('/pin/verify', body('email').isEmail(), pinValidation, validate, verifyPin);
router.post('/pin/change', protect, changePin);
router.post('/pin/forgot', forgotPin);
router.post('/pin/reset', resetPin);

export default router;
