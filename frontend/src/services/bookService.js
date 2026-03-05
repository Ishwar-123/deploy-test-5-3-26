import api from './api';

export const bookService = {
    // Get all books with filters
    async getBooks(params = {}) {
        const response = await api.get('/books', { params });
        return response;
    },

    // Get single book by ID
    async getBookById(id) {
        const response = await api.get(`/books/${id}`);
        return response;
    },

    // Get categories
    async getCategories() {
        const response = await api.get('/books/meta/categories');
        return response;
    },

    // Search books
    async searchBooks(query) {
        const response = await api.get('/books', { params: { search: query } });
        return response;
    }
};

export default bookService;
