import rateLimit from 'express-rate-limit';

// Rate limiter for download token requests
export const downloadTokenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Significantly increased for development
    message: 'Too many download requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.id?.toString() || req.ip;
    }
});

// Rate limiter for actual file downloads/streams
export const downloadStreamLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // Significantly increased for development
    message: 'Download limit exceeded. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        return req.query.uid || req.ip;
    }
});

export default {
    downloadTokenLimiter,
    downloadStreamLimiter
};
