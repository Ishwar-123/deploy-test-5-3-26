import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Check for token in cookies
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findByPk(decoded.userId);

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Session token check (Single Session Enforcement)
            if (decoded.sessionToken && req.user.sessionToken && decoded.sessionToken !== req.user.sessionToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. You have been logged in on another device.',
                    code: 'SESSION_EXPIRED'
                });
            }

            // Account status checks
            if (!req.user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is inactive. Please contact support.'
                });
            }

            if (req.user.isBlocked) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been blocked by admin.'
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token invalid or expired'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findByPk(decoded.userId);
            } catch (error) {
                // Token invalid, but we don't fail - just continue without user
                req.user = null;
            }
        }

        next();
    } catch (error) {
        next();
    }
};

/**
 * Admin only - Check if user is admin
 */
export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
};

/**
 * Vendor only - Check if user is vendor
 */
export const vendorOnly = (req, res, next) => {
    if (req.user && req.user.role === 'vendor') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Vendor only.'
        });
    }
};

/**
 * Reader only - Check if user is reader
 */
export const readerOnly = (req, res, next) => {
    if (req.user && req.user.role === 'reader') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Reader only.'
        });
    }
};

/**
 * Authorization middleware - check if user has required role
 * @param {...String} roles - Roles allowed to access the route
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

