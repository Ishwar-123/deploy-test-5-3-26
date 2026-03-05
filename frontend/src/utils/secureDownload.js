// Secure Download API Helper
// Use this to request and download PDFs securely

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Request a secure download token for a book
 * @param {number} bookId - The ID of the book to download
 * @returns {Promise<Object>} - Download token and URL
 */
export const requestDownloadToken = async (bookId) => {
    try {
        const response = await fetch(`${API_URL}/api/downloads/request/${bookId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to request download token');
        }

        return data.data;
    } catch (error) {
        console.error('Error requesting download token:', error);
        throw error;
    }
};

/**
 * Get secure download URL for a book
 * @param {number} bookId - The ID of the book
 * @param {boolean} forceDownload - Whether to force download or view inline
 * @returns {Promise<string>} - Secure download URL
 */
export const getSecureDownloadUrl = async (bookId, forceDownload = false) => {
    try {
        const tokenData = await requestDownloadToken(bookId);
        const downloadParam = forceDownload ? '&download=true' : '';
        return `${API_URL}${tokenData.downloadUrl}${downloadParam}`;
    } catch (error) {
        console.error('Error getting secure download URL:', error);
        throw error;
    }
};

/**
 * Open book in new tab (for reading)
 * @param {number} bookId - The ID of the book to open
 */
export const openBookInNewTab = async (bookId) => {
    try {
        const url = await getSecureDownloadUrl(bookId, false);
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error opening book:', error);
        alert('Failed to open book. Please make sure you have access to this book.');
    }
};

/**
 * Download book file
 * @param {number} bookId - The ID of the book to download
 * @param {string} bookTitle - The title of the book (for filename)
 */
export const downloadBook = async (bookId, bookTitle = 'book') => {
    try {
        const url = await getSecureDownloadUrl(bookId, true);

        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `${bookTitle}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading book:', error);
        alert('Failed to download book. Please make sure you have access to this book.');
    }
};

/**
 * Get user's download history
 * @param {number} limit - Number of records to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} - Download history data
 */
export const getDownloadHistory = async (limit = 50, offset = 0) => {
    try {
        const response = await fetch(
            `${API_URL}/api/downloads/history?limit=${limit}&offset=${offset}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include'
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch download history');
        }

        return data.data;
    } catch (error) {
        console.error('Error fetching download history:', error);
        throw error;
    }
};

/**
 * Get download analytics (Admin only)
 * @param {Object} filters - Filter options (bookId, startDate, endDate)
 * @returns {Promise<Object>} - Analytics data
 */
export const getDownloadAnalytics = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(
            `${API_URL}/api/downloads/analytics?${queryParams}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include'
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch analytics');
        }

        return data.data;
    } catch (error) {
        console.error('Error fetching analytics:', error);
        throw error;
    }
};

export default {
    requestDownloadToken,
    getSecureDownloadUrl,
    openBookInNewTab,
    downloadBook,
    getDownloadHistory,
    getDownloadAnalytics
};
