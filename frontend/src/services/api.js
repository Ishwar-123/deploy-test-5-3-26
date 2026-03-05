import axios from 'axios';
import { API_URL } from '../utils/constants';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Debug utility - Add to window for easy access in console
if (typeof window !== 'undefined') {
    window.clearAuth = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        console.log('✅ Authentication data cleared. Doing hard refresh...');
        setTimeout(() => window.location.href = window.location.href, 500);
    };
}

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response) {
            // Server responded with error
            const message = error.response.data?.message || 'An error occurred';

            // Handle unauthorized or blocked
            if (error.response.status === 401 || error.response.status === 403) {
                // Only redirect if it's not a permissions error for admins/vendors 
                // but a full block or auth failure
                const isBlocked = error.response.data?.message?.toLowerCase().includes('blocked') ||
                    error.response.data?.message?.toLowerCase().includes('inactive');

                if (error.response.status === 401 || isBlocked) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    // Use a slightly delayed redirect to allow error toasts to show if any
                    setTimeout(() => {
                        window.location.href = '/login?reason=' + (isBlocked ? 'blocked' : 'session_expired');
                    }, 1000);
                }
            }

            const errorObj = new Error(message);
            errorObj.status = error.response.status;
            errorObj.code = error.response.data?.code;
            errorObj.data = error.response.data; // include full data
            errorObj.sessionDetails = error.response.data?.sessionDetails;
            return Promise.reject(errorObj);
        } else if (error.request) {
            // Request made but no response
            return Promise.reject(new Error('No response from server'));
        } else {
            // Error in request setup
            return Promise.reject(error);
        }
    }
);

export default api;
