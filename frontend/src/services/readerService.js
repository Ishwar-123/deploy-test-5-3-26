import api from './api';

export const readerService = {
    // Get reader's library
    async getLibrary() {
        const response = await api.get('/reader/library');
        return response;
    },

    // Purchase a book
    async purchaseBook(bookId) {
        const response = await api.post('/reader/purchase', { bookId });
        return response;
    },

    // Update reading progress
    async updateProgress(bookId, progressData) {
        const response = await api.put(`/reader/reading-progress/${bookId}`, progressData);
        return response;
    },

    // Get book details for reading
    async getBook(bookId) {
        const response = await api.get(`/reader/book/${bookId}`);
        return response;
    },

    // Get subscription packages
    async getPackages() {
        const response = await api.get('/reader/packages');
        return response;
    },

    // Secure Download System
    async getDownloadToken(bookId) {
        const response = await api.post(`/downloads/request/${bookId}`);
        return response;
    },

    getDownloadUrl(bookId, token) {
        return `${api.defaults.baseURL}/downloads/stream/${bookId}?token=${token}`;
    },

    // Get order history/receipts
    async getOrders() {
        const response = await api.get('/reader/orders');
        return response;
    }
};

export default readerService;
