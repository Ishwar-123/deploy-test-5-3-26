import api from './api';

export const getWishlist = () => {
    return api.get('/wishlist');
};

export const addToWishlist = (bookId) => {
    return api.post('/wishlist', { bookId });
};

export const removeFromWishlist = (bookId) => {
    return api.delete(`/wishlist/${bookId}`);
};

export const checkWishlistStatus = (bookId) => {
    return api.get(`/wishlist/${bookId}/check`);
};
