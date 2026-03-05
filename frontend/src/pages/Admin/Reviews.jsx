import React, { useState, useEffect } from 'react';
import StarRating from '../../components/StarRating';
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaCheckCircle, FaStar, FaSave, FaTimes } from 'react-icons/fa';
import toast from '../../utils/sweetalert';
import reviewService from '../../services/reviews';
import { format } from 'date-fns';

const AdminReviewPanel = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [filters, setFilters] = useState({
        bookId: '',
        rating: '',
        search: '',
        sortBy: 'latest'
    });

    // Edit state
    const [editingReview, setEditingReview] = useState(null);
    const [editForm, setEditForm] = useState({
        rating: 0,
        reviewText: '',
        isFeatured: false,
        isVerified: false
    });



    useEffect(() => {
        fetchReviews();
    }, [currentPage, filters]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewService.getAllReviewsAdmin({
                page: currentPage,
                limit: 20,
                ...filters
            });

            if (response.success) {
                setReviews(response.data.reviews);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Fetch reviews error:', error);
            // toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async (reviewId) => {
        try {
            const response = await reviewService.toggleReviewVisibility(reviewId);

            if (response.success) {
                toast.success(response.message);
                fetchReviews();
            }
        } catch (error) {
            console.error('Toggle visibility error:', error);
            toast.error(error.message || 'Failed to toggle visibility');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            const response = await reviewService.deleteReviewAdmin(reviewId);

            if (response.success) {
                toast.success('Review deleted successfully');
                fetchReviews();
            }
        } catch (error) {
            console.error('Delete review error:', error);
            toast.error(error.message || 'Failed to delete review');
        }
    };

    // ... (edit state functions remain same)

    const startEditReview = (review) => {
        setEditingReview(review.id);
        setEditForm({
            rating: review.rating,
            reviewText: review.reviewText || '',
            isFeatured: review.isFeatured,
            isVerified: review.isVerified
        });
    };

    const cancelEdit = () => {
        setEditingReview(null);
        setEditForm({
            rating: 0,
            reviewText: '',
            isFeatured: false,
            isVerified: false
        });
    };

    const handleUpdateReview = async (reviewId) => {
        try {
            const response = await reviewService.updateReviewAdmin(reviewId, editForm);

            if (response.success) {
                toast.success('Review updated successfully');
                setEditingReview(null);
                fetchReviews();
            }
        } catch (error) {
            console.error('Update review error:', error);
            toast.error(error.message || 'Failed to update review');
        }
    };



    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    if (loading && reviews.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Review Management
                    </h2>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <input
                        type="number"
                        placeholder="Book ID..."
                        value={filters.bookId}
                        onChange={(e) => handleFilterChange('bookId', e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <select
                        value={filters.rating}
                        onChange={(e) => handleFilterChange('rating', e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>

                    <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="latest">Latest</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                    </select>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">No reviews found</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div
                            key={review.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 transition-all
                       ${review.isHidden ? 'border-red-300 dark:border-red-700 opacity-60' : 'border-gray-200 dark:border-gray-700'}`}
                        >
                            {editingReview === review.id ? (
                                // Edit Mode
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            Editing Review by {review.user?.name}
                                        </h4>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateReview(review.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700
                                 text-white rounded-lg transition-colors"
                                            >
                                                <FaSave /> Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700
                                 text-white rounded-lg transition-colors"
                                            >
                                                <FaTimes /> Cancel
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Rating
                                        </label>
                                        <StarRating
                                            rating={editForm.rating}
                                            onRatingChange={(rating) => setEditForm(prev => ({ ...prev, rating }))}
                                            size="lg"
                                            showValue
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Review Text
                                        </label>
                                        <textarea
                                            value={editForm.reviewText}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, reviewText: e.target.value }))}
                                            rows="4"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editForm.isFeatured}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editForm.isVerified}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, isVerified: e.target.checked }))}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Verified</span>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-2">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {review.user?.name || 'Unknown User'}
                                                </h4>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {review.user?.email}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 mb-2">
                                                <StarRating rating={review.rating} readonly size="sm" />
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {format(new Date(review.createdAt), 'MMM dd, yyyy HH:mm')}
                                                </span>
                                            </div>

                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Book: <span className="font-medium">{review.book?.title}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEditReview(review)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Edit Review"
                                            >
                                                <FaEdit />
                                            </button>

                                            <button
                                                onClick={() => handleToggleVisibility(review.id)}
                                                className={`p-2 rounded-lg transition-colors ${review.isHidden
                                                    ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                    : 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                    }`}
                                                title={review.isHidden ? 'Show Review' : 'Hide Review'}
                                            >
                                                {review.isHidden ? <FaEye /> : <FaEyeSlash />}
                                            </button>

                                            <button
                                                onClick={() => handleDeleteReview(review.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete Review"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {review.isVerified && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                     bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                                <FaCheckCircle /> Verified
                                            </span>
                                        )}
                                        {review.isFeatured && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                     bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                                <FaStar /> Featured
                                            </span>
                                        )}
                                        {review.isAdminEdited && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium
                                     bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                                                Admin Edited
                                            </span>
                                        )}
                                        {review.isHidden && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium
                                     bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                                Hidden
                                            </span>
                                        )}
                                    </div>

                                    {/* Review Text */}
                                    {review.reviewText && (
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                                            {review.reviewText}
                                        </p>
                                    )}

                                    {/* Stats */}
                                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <span>Helpful: {review.helpfulCount || 0}</span>
                                        <span>Reports: {review.reportCount || 0}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                     text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Previous
                    </button>

                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {pagination.totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                        disabled={currentPage === pagination.totalPages}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                     text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}


        </div>
    );
};

export default AdminReviewPanel;
