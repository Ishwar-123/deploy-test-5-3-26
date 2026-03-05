import jwt from 'jsonwebtoken';

/**
 * Generate JWT Access Token
 */
export const generateAccessToken = (userId, role, sessionToken) => {
    return jwt.sign(
        { userId, role, sessionToken },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

/**
 * Generate JWT Refresh Token
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
};

/**
 * Verify JWT Token
 */
export const verifyToken = (token, isRefreshToken = false) => {
    try {
        const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

/**
 * Generate OTP (6-digit)
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * OTP expiry time (1 minute)
 */
export const OTP_EXPIRY_MINUTES = 5;
