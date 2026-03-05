/**
 * User Roles
 */
export const ROLES = {
    ADMIN: 'admin',
    VENDOR: 'vendor',
    READER: 'reader'
};

/**
 * Package Types
 */
export const PACKAGES = {
    SILVER: 'Silver',
    GOLD: 'Gold',
    PLATINUM: 'Platinum'
};

/**
 * Package Book Limits
 */
export const PACKAGE_LIMITS = {
    Silver: 3,
    Gold: 5,
    Platinum: 7
};

/**
 * Billing Cycles
 */
export const BILLING_CYCLES = {
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
};

/**
 * Order Status
 */
export const ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

/**
 * Payment Status
 */
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

/**
 * Book Categories
 */
export const BOOK_CATEGORIES = [
    'Fiction',
    'Non-Fiction',
    'Science',
    'Technology',
    'Business',
    'Self-Help',
    'Biography',
    'History',
    'Education',
    'Children',
    'Romance',
    'Mystery',
    'Fantasy',
    'Other'
];

/**
 * Submission Status
 */
export const SUBMISSION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

/**
 * License Types
 */
export const LICENSE_TYPES = {
    VENDOR: 'vendor',
    INSTITUTION: 'institution'
};

/**
 * Access Types
 */
export const ACCESS_TYPES = {
    PURCHASED: 'purchased',
    SUBSCRIPTION: 'subscription'
};

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
    ORDER_CONFIRMATION: 'order_confirmation',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',
    SUBSCRIPTION_EXPIRY: 'subscription_expiry',
    SUBSCRIPTION_RENEWAL: 'subscription_renewal',
    LICENSE_EXPIRY: 'license_expiry',
    LOW_INVENTORY: 'low_inventory',
    BOOK_APPROVED: 'book_approved',
    BOOK_REJECTED: 'book_rejected',
    NEW_BOOK: 'new_book',
    SYSTEM_ANNOUNCEMENT: 'system_announcement',
    OTHER: 'other'
};

/**
 * File Types
 */
export const FILE_TYPES = {
    PDF: 'pdf',
    EPUB: 'epub'
};

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = {
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    UPI: 'upi',
    WALLET: 'wallet',
    NET_BANKING: 'net_banking'
};

/**
 * Institution Types
 */
export const INSTITUTION_TYPES = {
    UNIVERSITY: 'university',
    COLLEGE: 'college',
    SCHOOL: 'school',
    LIBRARY: 'library',
    CORPORATE: 'corporate',
    OTHER: 'other'
};

/**
 * Default Values
 */
export const DEFAULTS = {
    PLATFORM_COMMISSION: 0.15, // 15%
    TAX_RATE: 0.18, // 18% GST
    DOWNLOAD_LIMIT: 3,
    OTP_EXPIRY_MINUTES: 10,
    MAX_FILE_SIZE: 52428800, // 50MB
    REFUND_DAYS: 7
};
