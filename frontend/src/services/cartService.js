import api from './api';

export const getCart = () => {
    return api.get('/cart');
};

export const addToCart = (bookId) => {
    return api.post('/cart', { bookId });
};

export const removeFromCart = (bookId) => {
    return api.delete(`/cart/${bookId}`);
};

export const clearCart = () => {
    return api.delete('/cart');
};
