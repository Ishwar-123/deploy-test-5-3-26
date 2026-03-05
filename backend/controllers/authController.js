import User from '../models/User.js';
import LoginLog from '../models/LoginLog.js';
import { Op } from 'sequelize';
import { generateAccessToken, generateRefreshToken, generateOTP, OTP_EXPIRY_MINUTES } from '../config/auth.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { sendEmailOTP } from '../utils/emailService.js';
import { sendWhatsAppOTP } from '../utils/smsService.js';
import { emitLogout } from '../utils/socket.js';

// --- Security Constants ---
const OTP_COOLDOWN_SECONDS = 60; // Wait 60s between each request
const OTP_MAX_REQUESTS = 5;      // Max 5 requests
const OTP_REQUEST_WINDOW = 30 * 60 * 1000; // 30 minutes window
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Helper to prevent OTP Bombing (Spam protection)
 */
const checkOtpBombing = async (user) => {
    const now = new Date();

    // 1. Cooldown Check (Wait at least 60s)
    if (user.lastOtpRequestAt) {
        const secondsSinceLastRequest = (now - new Date(user.lastOtpRequestAt)) / 1000;
        if (secondsSinceLastRequest < OTP_COOLDOWN_SECONDS) {
            return {
                isBlocked: true,
                message: `Please wait ${Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLastRequest)} seconds before requesting a new OTP.`
            };
        }
    }

    // 2. Request Count Check (Max 5 per 30 minutes)
    // Reset count if it's been more than 30 minutes since last request
    const windowTime = user.lastOtpRequestAt ? (now - new Date(user.lastOtpRequestAt)) : 0;
    if (windowTime > OTP_REQUEST_WINDOW) {
        user.otpRequestCount = 0;
    }

    if (user.otpRequestCount >= OTP_MAX_REQUESTS) {
        return {
            isBlocked: true,
            message: 'Too many OTP requests. Please try again after 30 minutes.'
        };
    }

    // Update security fields
    user.lastOtpRequestAt = now;
    user.otpRequestCount += 1;
    await user.save();
    return { isBlocked: false };
};


/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, role = 'reader', phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        return res.status(400).json({
            success: false,
            message: 'User already exists with this email'
        });
    }

    // Generate TWO separate OTPs — one for email, one for WhatsApp
    const emailOTP = generateOTP();
    const phoneOTP = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Create user with both OTPs
    const user = await User.create({
        name,
        email,
        password,
        role,
        phone,
        emailVerificationOTP: emailOTP,
        phoneVerificationOTP: phoneOTP,
        otpExpiry
    });

    // Send both OTPs in parallel
    const [emailResult, whatsappResult] = await Promise.allSettled([
        sendEmailOTP(email, name, emailOTP),
        phone ? sendWhatsAppOTP(phone, phoneOTP) : Promise.resolve({ success: false, message: 'No phone' })
    ]);

    if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Email OTP for ${email}: ${emailOTP}`);
        console.log(`📱 WhatsApp OTP for ${phone}: ${phoneOTP}`);
    }
    if (whatsappResult.status === 'rejected') {
        console.warn('WhatsApp OTP failed:', whatsappResult.reason);
    }

    res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify with OTPs sent to your email and WhatsApp.',
        data: {
            userId: user.id,
            email: user.email,
            phone: user.phone,
            ...(process.env.NODE_ENV === 'development' && { emailOTP, phoneOTP })
        }
    });
});

/**
 * @desc    Verify email with OTP
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (user.isEmailVerified) {
        return res.status(400).json({
            success: false,
            message: 'Email already verified'
        });
    }

    // Lockout check
    if (user.lockUntil && new Date() < user.lockUntil) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        return res.status(429).json({
            success: false,
            message: `Too many incorrect attempts. Please try again after ${remainingMinutes} minute(s).`
        });
    }

    if (!user.emailVerificationOTP || String(user.emailVerificationOTP).trim() !== String(otp).trim()) {
        user.otpAttempts += 1;

        if (user.otpAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
            user.otpAttempts = 0;
            await user.save();
            return res.status(429).json({
                success: false,
                message: `Too many incorrect attempts. Account locked for ${LOCKOUT_DURATION / (60 * 1000)} minutes.`
            });
        }

        await user.save();
        return res.status(401).json({
            success: false,
            message: `Invalid OTP. ${MAX_LOGIN_ATTEMPTS - user.otpAttempts} attempt(s) remaining.`
        });
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return res.status(400).json({
            success: false,
            message: 'OTP has expired. Please request a new one.'
        });
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.json({
        success: true,
        message: 'Email verified successfully'
    });
});

/**
 * @desc    Verify phone with OTP
 * @route   POST /api/auth/verify-phone
 * @access  Public
 */
export const verifyPhone = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;

    const user = await User.findOne({ where: { phone } });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (user.isPhoneVerified) {
        return res.status(400).json({
            success: false,
            message: 'Phone number already verified'
        });
    }

    // Lockout check
    if (user.lockUntil && new Date() < user.lockUntil) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        return res.status(429).json({
            success: false,
            message: `Too many incorrect attempts. Please try again after ${remainingMinutes} minute(s).`
        });
    }

    const providedOTP = String(otp).trim();
    const storedPhoneOTP = user.phoneVerificationOTP ? String(user.phoneVerificationOTP).trim() : null;
    const storedEmailOTP = user.emailVerificationOTP ? String(user.emailVerificationOTP).trim() : null;

    const isMatch = (providedOTP === storedPhoneOTP) || (providedOTP === storedEmailOTP);

    if (!isMatch) {
        user.otpAttempts += 1;

        if (user.otpAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
            user.otpAttempts = 0;
            await user.save();
            return res.status(429).json({
                success: false,
                message: `Too many incorrect attempts. Account locked for ${LOCKOUT_DURATION / (60 * 1000)} minutes.`
            });
        }

        await user.save();
        return res.status(401).json({
            success: false,
            message: `Invalid OTP. ${MAX_LOGIN_ATTEMPTS - user.otpAttempts} attempt(s) remaining.`
        });
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return res.status(400).json({
            success: false,
            message: 'OTP has expired. Please request a new one.'
        });
    }

    user.isPhoneVerified = true;
    user.phoneVerificationOTP = undefined;
    // Keep otpExpiry if email is still not verified, or clear if it is
    if (user.isEmailVerified) user.otpExpiry = undefined;

    await user.save();

    res.json({
        success: true,
        message: 'Phone number verified successfully'
    });
});


/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user and include password and session info
    const user = await User.findOne({ where: { email } });

    if (!user) {
        await LoginLog.create({
            email,
            status: 'failed',
            message: 'User not found during login attempt',
            ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    // Check for lockout
    if (user.lockUntil && new Date() < user.lockUntil) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        await LoginLog.create({
            email: user.email,
            status: 'locked',
            message: 'Login attempt while account is locked',
            ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });
        return res.status(429).json({
            success: false,
            message: `Too many failed attempts. Your account is locked for 15 minutes. Please try again after ${remainingMinutes} minutes.`
        });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
        user.otpAttempts += 1;

        if (user.otpAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
            user.otpAttempts = 0;
            await user.save();
            return res.status(429).json({
                success: false,
                message: 'Too many incorrect attempts. Your account is locked for 15 minutes.'
            });
        }

        await user.save();

        await LoginLog.create({
            email,
            status: 'failed',
            message: `Incorrect password attempt (${user.otpAttempts}/3)`,
            ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    // Reset failed attempts on success
    user.otpAttempts = 0;
    user.lockUntil = null;

    // Check if account is active
    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: 'Account is inactive. Please contact support.'
        });
    }

    if (user.isBlocked) {
        return res.status(403).json({
            success: false,
            message: 'Your account has been blocked by admin.'
        });
    }


    // --- Single Session Enforcement ---
    const { forceLogout } = req.body;
    const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 Minutes activity window

    if (user.sessionToken && user.lastActiveAt) {
        const timeSinceActive = Date.now() - new Date(user.lastActiveAt).getTime();

        if (timeSinceActive < SESSION_TIMEOUT) {
            if (!forceLogout) {
                return res.status(409).json({
                    success: false,
                    message: 'Account is currently active on another device.',
                    code: 'SESSION_ACTIVE',
                    sessionDetails: {
                        lastActiveAt: user.lastActiveAt,
                        lastLoginIp: user.lastLoginIp,
                        lastUserAgent: user.lastUserAgent
                    }
                });
            } else {
                // If user is active and forcing logout, kick them out immediately
                console.log(`🚀 Force logging out user ${user.id} from other devices`);
                emitLogout(user.id);
            }
        }
    }

    // PIN-based authentication: after password success, require PIN
    const hasPinSet = !!user.pin;

    await user.save();

    // Log password success
    await LoginLog.create({
        email: user.email,
        status: 'pin_required',
        message: `Password verified, PIN ${hasPinSet ? 'entry' : 'setup'} required`,
        ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
    });

    res.json({
        success: true,
        message: hasPinSet ? 'Please enter your PIN to continue.' : 'Please create a PIN to secure your account.',
        pinRequired: true,
        data: {
            email: user.email,
            phone: user.phone,
            name: user.name,
            hasPinSet
        }
    });
});

/**
 * @desc    Request Login OTP
 * @route   POST /api/auth/login-otp/request
 * @access  Public
 */
export const requestLoginOTP = asyncHandler(async (req, res) => {
    const { identifier, channel } = req.body;

    // Find user by either email or phone, doesn't matter which identifier is provided
    let user = await User.findOne({
        where: {
            [Op.or]: [
                { email: identifier },
                { phone: identifier }
            ]
        }
    });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: 'Account is inactive. Please contact support.'
        });
    }

    if (user.isBlocked) {
        return res.status(403).json({
            success: false,
            message: 'Your account has been blocked by admin.'
        });
    }

    // Check for lockout
    if (user.lockUntil && new Date() < user.lockUntil) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        return res.status(429).json({
            success: false,
            message: `Too many failed attempts. Your account is locked for ${LOCKOUT_DURATION / (60 * 1000)} minutes. Please try again after ${remainingMinutes} minute(s).`
        });
    }

    // --- OTP Bombing Protection ---
    const bombingCheck = await checkOtpBombing(user);
    if (bombingCheck.isBlocked) {
        return res.status(429).json({
            success: false,
            message: bombingCheck.message
        });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store login OTP
    if (channel === 'email') {
        user.emailVerificationOTP = otp;
    } else {
        user.phoneVerificationOTP = otp;
    }
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    await user.save();

    // Send OTP
    if (channel === 'email') {
        await sendEmailOTP(user.email, user.name, otp);
    } else {
        await sendSMSOTP(user.phone, otp);
    }

    if (process.env.NODE_ENV === 'development') {
        console.log(`Login OTP for ${identifier}: ${otp}`);
    }

    res.json({
        success: true,
        message: `OTP sent to your ${channel}`,
        ...(process.env.NODE_ENV === 'development' && { otp })
    });
});

/**
 * @desc    Verify Login OTP
 * @route   POST /api/auth/login-otp/verify
 * @access  Public
 */
export const verifyLoginOTP = asyncHandler(async (req, res) => {
    const { identifier, otp, channel } = req.body;
    // Trim and normalize identifier
    const normalizedIdentifier = String(identifier).toLowerCase().trim();

    let user = await User.findOne({
        where: {
            [Op.or]: [
                { email: normalizedIdentifier },
                { phone: identifier } // Phone might not be lowercaseable
            ]
        }
    });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: 'Account is inactive. Please contact support.'
        });
    }

    if (user.isBlocked) {
        return res.status(403).json({
            success: false,
            message: 'Your account has been blocked by admin.'
        });
    }

    // Check for lockout
    if (user.lockUntil && new Date() < user.lockUntil) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        return res.status(429).json({
            success: false,
            message: `Too many failed attempts. Your account is locked for ${LOCKOUT_DURATION / (60 * 1000)} minutes. Please try again after ${remainingMinutes} minute(s).`
        });
    }

    // Check OTP with fallback
    const providedOTP = String(otp).trim();
    const emailOTP = user.emailVerificationOTP ? String(user.emailVerificationOTP).trim() : null;
    const phoneOTP = user.phoneVerificationOTP ? String(user.phoneVerificationOTP).trim() : null;

    // Is it in either field?
    const isMatch = (providedOTP === emailOTP) || (providedOTP === phoneOTP);

    if (!isMatch) {
        user.otpAttempts += 1;

        if (user.otpAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
            user.otpAttempts = 0;
            await user.save();
            await LoginLog.create({
                email: user.email,
                status: 'locked',
                message: `Account locked due to ${MAX_LOGIN_ATTEMPTS} failed OTP attempts`,
                ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'],
                otpUsed: providedOTP
            });
            return res.status(429).json({ success: false, message: `Too many incorrect attempts. Account locked for ${LOCKOUT_DURATION / (60 * 1000)} minutes.` });
        }
        await user.save();
        await LoginLog.create({
            email: user.email,
            status: 'failed',
            message: `Incorrect OTP attempt (${user.otpAttempts}/3)`,
            ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            otpUsed: providedOTP
        });
        return res.status(400).json({
            success: false,
            message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.`
        });
    }

    // Check Expiry
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return res.status(400).json({
            success: false,
            message: 'OTP has expired. Please request a new one.'
        });
    }

    // Clear OTP fields
    if (channel === 'email') {
        user.emailVerificationOTP = undefined;
        user.isEmailVerified = true;
    } else {
        user.phoneVerificationOTP = undefined;
        user.isPhoneVerified = true;
    }
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.lockUntil = null;

    // Generate session token first
    user.sessionToken = uuidv4();
    user.lastActiveAt = new Date();
    user.lastLogin = new Date();
    user.lastLoginIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
    user.lastUserAgent = req.headers['user-agent'];

    // Generate tokens (include sessionToken in access token)
    const accessToken = generateAccessToken(user.id, user.role, user.sessionToken);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    await user.save();

    // Kick out other devices instantly via Socket.io
    emitLogout(user.id);

    await LoginLog.create({
        email: user.email,
        status: 'success',
        message: 'Login successful via OTP',
        ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        otpUsed: otp
    });

    // Set cookie
    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified
            },
            accessToken,
            refreshToken
        }
    });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
    // Clear refresh token and session info
    await User.update({
        refreshToken: null,
        sessionToken: null,
        lastActiveAt: null
    }, {
        where: { id: req.user.id }
    });

    // Clear cookie
    res.clearCookie('token');

    res.json({
        success: true,
        message: 'Logout successful'
    });
});

/**
 * @desc    Keep session alive
 * @route   POST /api/auth/heartbeat
 * @access  Private
 */
export const heartbeat = asyncHandler(async (req, res) => {
    await User.update({
        lastActiveAt: new Date()
    }, {
        where: { id: req.user.id }
    });

    res.json({ success: true });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    res.json({
        success: true,
        data: { user }
    });
});

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (user.isEmailVerified) {
        return res.status(400).json({
            success: false,
            message: 'Email already verified'
        });
    }

    // Check for cooldown
    // --- OTP Bombing Protection ---
    const bombingCheck = await checkOtpBombing(user);
    if (bombingCheck.isBlocked) {
        return res.status(429).json({
            success: false,
            message: bombingCheck.message
        });
    }

    const emailOTP = generateOTP();
    const phoneOTP = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Check for lockout
    if (user.lockUntil && new Date() < user.lockUntil) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        return res.status(429).json({
            success: false,
            message: `Too many failed attempts. Your account is locked for ${LOCKOUT_DURATION / (60 * 1000)} minutes. Please try again after ${remainingMinutes} minute(s).`
        });
    }

    user.emailVerificationOTP = emailOTP;
    user.phoneVerificationOTP = phoneOTP;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Resend both OTPs in parallel
    await Promise.allSettled([
        sendEmailOTP(email, user.name, emailOTP),
        user.phone ? sendWhatsAppOTP(user.phone, phoneOTP) : Promise.resolve()
    ]);

    if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Resend Email OTP for ${email}: ${emailOTP}`);
        console.log(`📱 Resend WhatsApp OTP for ${user.phone}: ${phoneOTP}`);
    }

    res.json({
        success: true,
        message: 'OTPs resent to your email and WhatsApp.',
        ...(process.env.NODE_ENV === 'development' && { emailOTP, phoneOTP })
    });
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // --- OTP Bombing Protection ---
    const bombingCheck = await checkOtpBombing(user);
    if (bombingCheck.isBlocked) {
        return res.status(429).json({
            success: false,
            message: bombingCheck.message
        });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    user.emailVerificationOTP = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP via email
    await sendEmailOTP(email, user.name, otp);

    console.log(`Password reset OTP for ${email}: ${otp}`);

    res.json({
        success: true,
        message: 'Password reset OTP sent to your email',
        ...(process.env.NODE_ENV === 'development' && { otp })
    });
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (!user.emailVerificationOTP || String(user.emailVerificationOTP).trim() !== String(otp).trim()) {
        user.otpAttempts += 1;
        await user.save();

        if (user.otpAttempts >= 3) {
            user.lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes lockout
            user.otpAttempts = 0;
            await user.save();
            return res.status(429).json({
                success: false,
                message: 'Too many incorrect attempts. Account locked for 10 minutes.'
            });
        }

        return res.status(400).json({
            success: false,
            message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.`
        });
    }

    if (new Date() > user.otpExpiry) {
        return res.status(400).json({
            success: false,
            message: 'OTP expired'
        });
    }

    user.password = newPassword;
    user.emailVerificationOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
        success: true,
        message: 'Password reset successful'
    });
});

/**
 * @desc    Verify Reset OTP (Frontend check)
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
export const verifyResetOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (!user.emailVerificationOTP || String(user.emailVerificationOTP).trim() !== String(otp).trim()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid OTP'
        });
    }

    if (new Date() > user.otpExpiry) {
        return res.status(400).json({
            success: false,
            message: 'OTP expired'
        });
    }

    res.json({
        success: true,
        message: 'OTP verified'
    });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (user) {
        user.name = req.body.name || user.name;
        // Check explicitly for undefined to allow setting to null (removing photo)
        if (req.body.profilePicture !== undefined) {
            user.profilePicture = req.body.profilePicture;
        }

        if (req.body.password) {
            if (!req.body.currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is required to set a new password'
                });
            }

            const isMatch = await user.comparePassword(req.body.currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Incorrect current password'
                });
            }
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                _id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                profilePicture: updatedUser.profilePicture,
            }
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

/**
 * @desc    Verify BOTH Email OTP and WhatsApp OTP in one step
 * @route   POST /api/auth/verify-dual-otp
 * @access  Public
 * @body    { email, emailOTP, phoneOTP, context: 'register' | 'login' }
 */
export const verifyDualOTP = asyncHandler(async (req, res) => {
    const { email, emailOTP, phoneOTP, context } = req.body;

    if (!email || !emailOTP || !phoneOTP) {
        return res.status(400).json({
            success: false,
            message: 'Email, email OTP, and WhatsApp OTP are all required.'
        });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Lockout check
    if (user.lockUntil && new Date() < user.lockUntil) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        return res.status(429).json({
            success: false,
            message: `Account locked. Try again after ${remainingMinutes} minute(s).`
        });
    }

    // Expiry check
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return res.status(400).json({
            success: false,
            message: 'OTPs have expired. Please request new ones.'
        });
    }

    // Compare both OTPs
    const storedEmailOTP = user.emailVerificationOTP ? String(user.emailVerificationOTP).trim() : null;
    const storedPhoneOTP = user.phoneVerificationOTP ? String(user.phoneVerificationOTP).trim() : null;
    const providedEmailOTP = String(emailOTP).trim();
    const providedPhoneOTP = String(phoneOTP).trim();

    const emailMatch = storedEmailOTP === providedEmailOTP;
    const phoneMatch = storedPhoneOTP === providedPhoneOTP;

    if (!emailMatch || !phoneMatch) {
        user.otpAttempts += 1;

        if (user.otpAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
            user.otpAttempts = 0;
            await user.save();
            return res.status(429).json({
                success: false,
                message: `Too many incorrect attempts. Account locked for ${LOCKOUT_DURATION / (60 * 1000)} minutes.`
            });
        }

        await user.save();
        const errors = [];
        if (!emailMatch) errors.push('Email OTP is incorrect');
        if (!phoneMatch) errors.push('WhatsApp OTP is incorrect');

        return res.status(400).json({
            success: false,
            message: errors.join(' & ') + `. ${5 - user.otpAttempts} attempt(s) remaining.`,
            emailMatch,
            phoneMatch
        });
    }

    // Both OTPs matched — clear them
    user.emailVerificationOTP = null;
    user.phoneVerificationOTP = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    user.lockUntil = null;
    user.isEmailVerified = true;
    user.isPhoneVerified = true;

    // REGISTRATION context: mark verified, send to login
    if (context === 'register') {
        await user.save();
        return res.json({
            success: true,
            message: 'Account verified successfully! You can now log in.'
        });
    }

    // LOGIN context: complete login, generate tokens
    user.sessionToken = uuidv4();
    user.lastActiveAt = new Date();
    user.lastLogin = new Date();
    user.lastLoginIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
    user.lastUserAgent = req.headers['user-agent'];

    const accessToken = generateAccessToken(user.id, user.role, user.sessionToken);
    const refreshToken = generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    emitLogout(user.id);

    await LoginLog.create({
        email: user.email,
        status: 'success',
        message: 'Login successful via Dual OTP (Email + WhatsApp)',
        ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
    });

    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified
            },
            accessToken,
            refreshToken
        }
    });
});

/**
 * @desc    Setup PIN (first time, after login password verified)
 * @route   POST /api/auth/pin/setup
 * @access  Public (identified by email)
 */
export const setupPin = asyncHandler(async (req, res) => {
    const { email, pin } = req.body;

    if (!email || !pin) {
        return res.status(400).json({ success: false, message: 'Email and PIN are required.' });
    }

    if (!/^\d{6}$/.test(pin)) {
        return res.status(400).json({ success: false, message: 'PIN must be exactly 6 digits.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.pin) {
        return res.status(400).json({ success: false, message: 'PIN is already set. Use change PIN instead.' });
    }

    // Hash and save PIN
    user.pin = await User.hashPin(pin);
    user.pinAttempts = 0;
    user.pinLockUntil = null;

    // Complete login — generate tokens
    user.sessionToken = uuidv4();
    user.lastActiveAt = new Date();
    user.lastLogin = new Date();
    user.lastLoginIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
    user.lastUserAgent = req.headers['user-agent'];

    const accessToken = generateAccessToken(user.id, user.role, user.sessionToken);
    const refreshToken = generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    emitLogout(user.id);

    await LoginLog.create({
        email: user.email,
        status: 'success',
        message: 'Login successful — PIN created',
        ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
    });

    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        success: true,
        message: 'PIN created and login successful!',
        data: {
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified
            },
            accessToken,
            refreshToken
        }
    });
});

/**
 * @desc    Verify PIN (after password login)
 * @route   POST /api/auth/pin/verify
 * @access  Public (identified by email)
 */
export const verifyPin = asyncHandler(async (req, res) => {
    const { email, pin } = req.body;

    if (!email || !pin) {
        return res.status(400).json({ success: false, message: 'Email and PIN are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.pin) {
        return res.status(400).json({ success: false, message: 'PIN is not set. Please set up a PIN first.' });
    }

    /* Lockout Disabled Temporary
    if (user.pinLockUntil && new Date() < user.pinLockUntil) {
        const remainingMinutes = Math.ceil((user.pinLockUntil - Date.now()) / (60 * 1000));
        return res.status(429).json({
            success: false,
            message: `Too many incorrect PIN attempts. Please try again after ${remainingMinutes} minute(s).`
        });
    }
    */

    const isPinMatch = await user.comparePin(pin);

    // Lockout check
    if (user.pinLockUntil && new Date() < user.pinLockUntil) {
        const remainingMinutes = Math.ceil((user.pinLockUntil - Date.now()) / (60 * 1000));
        return res.status(429).json({
            success: false,
            message: `Too many incorrect PIN attempts. Please try again after ${remainingMinutes} minute(s).`
        });
    }

    if (!isPinMatch) {
        user.pinAttempts += 1;

        if (user.pinAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.pinLockUntil = new Date(Date.now() + LOCKOUT_DURATION);
            user.pinAttempts = 0;
            await user.save();
            return res.status(429).json({
                success: false,
                message: `Too many incorrect PIN attempts. Account locked for ${LOCKOUT_DURATION / (60 * 1000)} minutes.`
            });
        }

        await user.save();
        return res.status(401).json({
            success: false,
            message: `Incorrect PIN. ${MAX_LOGIN_ATTEMPTS - user.pinAttempts} attempt(s) remaining.`
        });
    }

    // PIN matched — complete login
    user.pinAttempts = 0;
    user.pinLockUntil = null;
    user.sessionToken = uuidv4();
    user.lastActiveAt = new Date();
    user.lastLogin = new Date();
    user.lastLoginIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
    user.lastUserAgent = req.headers['user-agent'];

    const accessToken = generateAccessToken(user.id, user.role, user.sessionToken);
    const refreshToken = generateRefreshToken(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    emitLogout(user.id);

    await LoginLog.create({
        email: user.email,
        status: 'success',
        message: 'Login successful via PIN',
        ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
    });

    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified
            },
            accessToken,
            refreshToken
        }
    });
});

/**
 * @desc    Change PIN (user is authenticated)
 * @route   POST /api/auth/pin/change
 * @access  Private
 */
export const changePin = asyncHandler(async (req, res) => {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
        return res.status(400).json({ success: false, message: 'Current PIN and new PIN are required.' });
    }

    if (!/^\d{6}$/.test(newPin)) {
        return res.status(400).json({ success: false, message: 'New PIN must be exactly 6 digits.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.pin) {
        return res.status(400).json({ success: false, message: 'No PIN is set. Please set up a PIN first.' });
    }

    const isPinMatch = await user.comparePin(currentPin);
    if (!isPinMatch) {
        return res.status(400).json({ success: false, message: 'Current PIN is incorrect.' });
    }

    user.pin = await User.hashPin(newPin);
    user.pinAttempts = 0;
    user.pinLockUntil = null;
    await user.save();

    res.json({
        success: true,
        message: 'PIN changed successfully.'
    });
});

/**
 * @desc    Forgot PIN — send OTP to email & WhatsApp
 * @route   POST /api/auth/pin/forgot
 * @access  Public
 */
export const forgotPin = asyncHandler(async (req, res) => {
    const { identifier } = req.body;

    if (!identifier) {
        return res.status(400).json({ success: false, message: 'Email or phone number is required.' });
    }

    const user = await User.findOne({
        where: {
            [Op.or]: [
                { email: identifier.toLowerCase().trim() },
                { phone: identifier.trim() }
            ]
        }
    });

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const bombingCheck = await checkOtpBombing(user);
    if (bombingCheck.isBlocked) {
        return res.status(429).json({
            success: false,
            message: bombingCheck.message
        });
    }

    // Generate SAME OTP for both channels
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    user.emailVerificationOTP = otp;
    user.phoneVerificationOTP = otp;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    await user.save();

    // Send OTP to both channels
    const [emailResult, whatsappResult] = await Promise.allSettled([
        sendEmailOTP(user.email, user.name, otp),
        user.phone ? sendWhatsAppOTP(user.phone, otp) : Promise.resolve({ success: false })
    ]);

    console.log('\n--- FORGOT PIN OTP LOG ---');
    console.log(`📧 PIN Reset Email OTP for ${user.email}: ${otp}`);
    if (user.phone) {
        console.log(`📱 PIN Reset WhatsApp OTP for ${user.phone}: ${otp}`);
    }
    console.log('--------------------------\n');

    res.json({
        success: true,
        message: 'OTP sent to your email and WhatsApp.',
        data: {
            email: user.email,
            phone: user.phone,
            ...(process.env.NODE_ENV === 'development' && { otp })
        }
    });
});

/**
 * @desc    Reset PIN — verify OTP and set new PIN
 * @route   POST /api/auth/pin/reset
 * @access  Public
 */
export const resetPin = asyncHandler(async (req, res) => {
    const { identifier, otp, newPin } = req.body;

    if (!identifier || !otp || !newPin) {
        return res.status(400).json({ success: false, message: 'Identifier, OTP, and new PIN are required.' });
    }

    if (!/^\d{6}$/.test(newPin)) {
        return res.status(400).json({ success: false, message: 'PIN must be exactly 6 digits.' });
    }

    const user = await User.findOne({
        where: {
            [Op.or]: [
                { email: identifier.toLowerCase().trim() },
                { phone: identifier.trim() }
            ]
        }
    });

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify OTP (check both fields)
    const providedOTP = String(otp).trim();
    const storedEmailOTP = user.emailVerificationOTP ? String(user.emailVerificationOTP).trim() : null;
    const storedPhoneOTP = user.phoneVerificationOTP ? String(user.phoneVerificationOTP).trim() : null;
    const isMatch = (providedOTP === storedEmailOTP) || (providedOTP === storedPhoneOTP);

    // Lockout check
    if (user.lockUntil && new Date() < user.lockUntil) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        return res.status(429).json({
            success: false,
            message: `Too many incorrect attempts. Please try again after ${remainingMinutes} minute(s).`
        });
    }

    if (!isMatch) {
        user.otpAttempts += 1;

        if (user.otpAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
            user.otpAttempts = 0;
            await user.save();
            return res.status(429).json({
                success: false,
                message: `Too many incorrect attempts. Account locked for ${LOCKOUT_DURATION / (60 * 1000)} minutes.`
            });
        }

        await user.save();
        return res.status(401).json({
            success: false,
            message: `Invalid OTP. ${MAX_LOGIN_ATTEMPTS - user.otpAttempts} attempt(s) remaining.`
        });
    }

    // Check expiry
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return res.status(400).json({
            success: false,
            message: 'OTP has expired. Please request a new one.'
        });
    }

    // Reset PIN
    user.pin = await User.hashPin(newPin);
    user.pinAttempts = 0;
    user.pinLockUntil = null;
    user.emailVerificationOTP = null;
    user.phoneVerificationOTP = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.json({
        success: true,
        message: 'PIN reset successfully. You can now login with your new PIN.'
    });
});
