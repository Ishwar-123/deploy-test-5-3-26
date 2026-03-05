// User Roles
export const ROLES = {
    ADMIN: 'admin',
    VENDOR: 'vendor',
    READER: 'reader'
};

// API Base URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Package Types
export const PACKAGES = {
    SILVER: 'Silver',
    GOLD: 'Gold',
    PLATINUM: 'Platinum'
};

// Package Details
export const PACKAGE_DETAILS = {
    Silver: {
        name: 'Silver',
        bookLimit: 3,
        color: 'gray',
        icon: '🥈'
    },
    Gold: {
        name: 'Gold',
        bookLimit: 5,
        color: 'yellow',
        icon: '🥇'
    },
    Platinum: {
        name: 'Platinum',
        bookLimit: 7,
        color: 'purple',
        icon: '💎'
    }
};

// Book Categories
export const BOOK_CATEGORIES = [
    'Civil Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Electronics',
    'Computer Science & IT',
    'Architecture',
    'Business & Management',
    'Physics & Chemistry',
    'Mathematics',
    'Vocational & Higher Education',
    'Other Technical'
];

// Order Status
export const ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

// Payment Status
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

// Status Colors
export const STATUS_COLORS = {
    pending: 'yellow',
    processing: 'blue',
    completed: 'green',
    cancelled: 'red',
    refunded: 'gray',
    failed: 'red',
    approved: 'green',
    rejected: 'red',
    active: 'green',
    inactive: 'gray',
    expired: 'red'
};

// Routes
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',

    // Admin
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_SUBMISSIONS: '/admin/submissions',
    ADMIN_VENDORS: '/admin/vendors',
    ADMIN_PACKAGES: '/admin/packages',
    ADMIN_READERS: '/admin/readers',
    ADMIN_ORDERS: '/admin/orders',
    ADMIN_REPORTS: '/admin/reports',

    // Vendor
    VENDOR_DASHBOARD: '/vendor/dashboard',
    VENDOR_INVENTORY: '/vendor/inventory',
    VENDOR_SALES: '/vendor/sales',
    VENDOR_PURCHASE: '/vendor/purchase',

    // Reader
    READER_DASHBOARD: '/reader/dashboard',
    READER_BROWSE: '/reader/browse',
    READER_LIBRARY: '/reader/library',
    READER_CART: '/reader/cart',
    READER_ORDERS: '/reader/orders',
    READER_SUBSCRIPTION: '/reader/subscription'
};
