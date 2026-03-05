import api from './api';

export const paymentService = {
    createOrder: async (bookId) => {
        return await api.post('/payment/order', { bookId });
    },

    verifyPayment: async (paymentData) => {
        return await api.post('/payment/verify', paymentData);
    },

    createCartOrder: async () => {
        return await api.post('/payment/cart-order');
    },

    verifyCartPayment: async (paymentData) => {
        return await api.post('/payment/verify-cart', paymentData);
    },

    createWishlistOrder: async () => {
        return await api.post('/payment/wishlist-order');
    },

    verifyWishlistPayment: async (paymentData) => {
        return await api.post('/payment/verify-wishlist', paymentData);
    },

    handleFailure: async (failureData) => {
        return await api.post('/payment/failure', failureData);
    }
};

export default paymentService;
