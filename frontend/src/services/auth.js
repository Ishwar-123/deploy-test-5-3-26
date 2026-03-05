import api from './api';

/**
 * Authentication Service
 */

export const authService = {
    // Register new user
    register: async (userData) => {
        return await api.post('/auth/register', userData);
    },

    // Login (step 1: email + password)
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        // If pinRequired, don't store tokens yet — PIN step comes next
        if (response.pinRequired) {
            return response;
        }
        if (response.success && response.data.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response;
    },

    // Request Login OTP
    requestLoginOTP: async (identifier, channel) => {
        return await api.post('/auth/login-otp/request', { identifier, channel });
    },

    // Verify Login OTP
    verifyLoginOTP: async (identifier, otp, channel) => {
        const response = await api.post('/auth/login-otp/verify', { identifier, otp, channel });
        if (response.success && response.data.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response;
    },

    // Logout
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    // Heartbeat (Keep Session Alive)
    heartbeat: async () => {
        return await api.post('/auth/heartbeat');
    },

    // Verify email
    verifyEmail: async (email, otp) => {
        return await api.post('/auth/verify-email', { email, otp });
    },

    // Verify phone
    verifyPhone: async (phone, otp) => {
        return await api.post('/auth/verify-phone', { phone, otp });
    },

    // Resend OTP
    resendOTP: async (email) => {
        return await api.post('/auth/resend-otp', { email });
    },

    // Forgot password
    forgotPassword: async (email) => {
        return await api.post('/auth/forgot-password', { email });
    },

    // Reset password
    resetPassword: async (email, otp, newPassword) => {
        return await api.post('/auth/reset-password', { email, otp, newPassword });
    },

    // Verify Reset OTP
    verifyResetOTP: async (email, otp) => {
        return await api.post('/auth/verify-reset-otp', { email, otp });
    },

    // Verify BOTH Email OTP + WhatsApp OTP (dual-channel)
    verifyDualOTP: async (email, emailOTP, phoneOTP, context) => {
        const response = await api.post('/auth/verify-dual-otp', { email, emailOTP, phoneOTP, context });
        // If login context, store tokens
        if (context === 'login' && response.success && response.data?.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response;
    },

    // Resend both Email + WhatsApp OTPs
    resendBothOTPs: async (email) => {
        return await api.post('/auth/resend-otp', { email });
    },

    // ============ PIN Authentication ============

    // Setup PIN (first time)
    setupPin: async (email, pin) => {
        const response = await api.post('/auth/pin/setup', { email, pin });
        if (response.success && response.data?.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response;
    },

    // Verify PIN (login step 2)
    verifyPin: async (email, pin) => {
        const response = await api.post('/auth/pin/verify', { email, pin });
        if (response.success && response.data?.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response;
    },

    // Change PIN (authenticated)
    changePin: async (currentPin, newPin) => {
        return await api.post('/auth/pin/change', { currentPin, newPin });
    },

    // Forgot PIN — send OTP
    forgotPin: async (identifier) => {
        return await api.post('/auth/pin/forgot', { identifier });
    },

    // Reset PIN — verify OTP + new PIN
    resetPin: async (identifier, otp, newPin) => {
        return await api.post('/auth/pin/reset', { identifier, otp, newPin });
    },

    // Update profile
    updateProfile: async (profileData) => {
        const response = await api.put('/auth/profile', profileData);
        if (response.success && response.data) {
            const currentUser = authService.getCurrentUser();
            const updatedUser = { ...currentUser, ...response.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return response;
    },

    // Get current user
    getMe: async () => {
        return await api.get('/auth/me');
    },

    // Get stored user
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Check if authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // Get user role
    getUserRole: () => {
        const user = authService.getCurrentUser();
        return user?.role || null;
    }
};

export default authService;
