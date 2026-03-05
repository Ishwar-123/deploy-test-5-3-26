import api from './api';

const highlightService = {
    // Get all highlights for a book
    getHighlights: async (bookId) => {
        try {
            return await api.get(`/highlights/book/${bookId}`);
        } catch (error) {
            throw error;
        }
    },

    // Add a new highlight
    addHighlight: async (highlightData) => {
        try {
            return await api.post('/highlights', highlightData);
        } catch (error) {
            throw error;
        }
    },

    // Update a highlight
    updateHighlight: async (id, updateData) => {
        try {
            return await api.put(`/highlights/${id}`, updateData);
        } catch (error) {
            throw error;
        }
    },

    // Delete a highlight
    deleteHighlight: async (id) => {
        try {
            return await api.delete(`/highlights/${id}`);
        } catch (error) {
            throw error;
        }
    }
};

export default highlightService;
