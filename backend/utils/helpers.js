/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date, format = 'short') => {
    const options = format === 'long'
        ? { year: 'numeric', month: 'long', day: 'numeric' }
        : { year: 'numeric', month: 'short', day: 'numeric' };

    return new Intl.DateTimeFormat('en-IN', options).format(new Date(date));
};

/**
 * Calculate expiry date
 */
export const calculateExpiryDate = (billingCycle, startDate = new Date()) => {
    const expiry = new Date(startDate);

    if (billingCycle === 'monthly') {
        expiry.setMonth(expiry.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
        expiry.setFullYear(expiry.getFullYear() + 1);
    }

    return expiry;
};

/**
 * Calculate commission
 */
export const calculateCommission = (amount, rate = 0.15) => {
    return Math.round(amount * rate * 100) / 100;
};

/**
 * Calculate tax
 */
export const calculateTax = (amount, rate = 0.18) => {
    return Math.round(amount * rate * 100) / 100;
};

/**
 * Generate unique order number
 */
export const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `ORD-${timestamp}-${random}`;
};

/**
 * Generate license key
 */
export const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'LIC-';
    for (let i = 0; i < 8; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename) => {
    return filename
        .replace(/[^a-z0-9.-]/gi, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Paginate results
 */
export const paginate = (page = 1, limit = 10) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    return {
        skip: (pageNum - 1) * limitNum,
        limit: limitNum,
        page: pageNum
    };
};

/**
 * Build pagination response
 */
export const buildPaginationResponse = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

/**
 * Check if date is expired
 */
export const isExpired = (date) => {
    return new Date(date) < new Date();
};

/**
 * Days until expiry
 */
export const daysUntilExpiry = (date) => {
    const now = new Date();
    const expiry = new Date(date);
    const diff = expiry - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Slugify text
 */
export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
};

/**
 * Generate random string
 */
export const randomString = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
