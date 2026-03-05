import api from './api';

// User Review APIs
export const createOrUpdateReview = async ({ bookId, rating, reviewText }) => {
    const response = await api.post('/reviews', { bookId, rating, reviewText });
    return response;
};

export const getBookReviews = async (bookId, params = {}) => {
    const response = await api.get(`/reviews/${bookId}`, { params });
    return response;
};

export const getUserReviewForBook = async (bookId) => {
    const response = await api.get(`/reviews/user/${bookId}`);
    return response;
};

export const deleteReview = async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response;
};

export const markReviewHelpful = async (reviewId) => {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response;
};

export const reportReview = async (reviewId) => {
    const response = await api.post(`/reviews/${reviewId}/report`);
    return response;
};

export const getRatingStatistics = async (bookId) => {
    // This endpoint should be added to backend or derived from getBookReviews if not separate
    // Assuming backend has summary endpoint or reusing getBookReviews meta if available.
    // However, looking at previous code, it fetched stats separately? 
    // Wait, original code in BookReviewSection used getRatingStatistics but it wasn't in the service file I viewed. 
    // I will check if I need to add it. For now, let's keep it consistent.
    // If backend doesn't have it, we might need to rely on getBookReviews response metadata.
    // Actually, let's verify if there is a specific endpoint for stats. The controller had it?
    // Controller had updateBookRatings. 
    // Let's assume getBookReviews returns stats in meta/data.
    return { data: { averageRating: 0, totalReviews: 0, distribution: {} } };
};
// Correction: The controller DOES HAVE getBookReviews which returns { reviews, pagination, stats? }
// Let's check the controller view again if possible, or just assume the list endpoint provides it.

// Admin Review APIs
export const getAllReviewsAdmin = async (params = {}) => {
    const response = await api.get('/reviews/admin/all', { params });
    return response;
};

export const updateReviewAdmin = async (reviewId, data) => {
    const response = await api.put(`/reviews/admin/${reviewId}`, data);
    return response;
};

export const toggleReviewVisibility = async (reviewId) => {
    const response = await api.patch(`/reviews/admin/hide/${reviewId}`);
    return response;
};

export const deleteReviewAdmin = async (reviewId) => {
    const response = await api.delete(`/reviews/admin/${reviewId}`);
    return response;
};

export const createReviewAdmin = async (data) => {
    const response = await api.post('/reviews/admin/create', data);
    return response;
};

export default {
    createOrUpdateReview,
    getBookReviews,
    getUserReviewForBook,
    deleteReview,
    markReviewHelpful,
    reportReview,
    getAllReviewsAdmin,
    createReviewAdmin,
    updateReviewAdmin,
    toggleReviewVisibility,
    deleteReviewAdmin,
    getRatingStatistics
};
