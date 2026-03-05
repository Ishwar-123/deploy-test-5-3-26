import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { FaThumbsUp, FaFlag, FaEdit, FaTrash, FaCheckCircle, FaStar, FaChevronDown } from 'react-icons/fa';
import toast from '../utils/sweetalert';
import { motion, AnimatePresence } from 'framer-motion';
import reviewService from '../services/reviews';
import { format } from 'date-fns';

const ReviewList = ({ bookId, currentUserId, onEditReview, refreshTrigger, onStatsLoaded }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('latest');
    const [isSortOpen, setIsSortOpen] = useState(false);

    const sortOptions = [
        { value: 'latest', label: 'Latest Reviews' },
        { value: 'highest', label: 'Highest Rating' },
        { value: 'lowest', label: 'Lowest Rating' },
        { value: 'helpful', label: 'Most Helpful' }
    ];

    const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Latest Reviews';

    useEffect(() => {
        fetchReviews();
    }, [bookId, currentPage, sortBy, refreshTrigger]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewService.getBookReviews(bookId, {
                page: currentPage,
                limit: 10,
                sortBy
            });

            if (response.success) {
                if (currentPage === 1) {
                    setReviews(response.data.reviews);
                } else {
                    setReviews(prev => [...prev, ...response.data.reviews]);
                }
                setPagination(response.data.pagination);
                if (onStatsLoaded) {
                    // Prefer ratingStats if available, fallback to pagination total if not
                    const stats = response.data.ratingStats || {
                        totalReviews: response.data.pagination?.totalReviews || 0,
                        averageRating: 0,
                        distribution: {}
                    };
                    onStatsLoaded(stats);
                }
            }
        } catch (error) {
            console.error('Fetch reviews error:', error);
            // Error handling is partly done in api.js, but we can catch specific ones here
            // toast.error('Failed to load reviews'); // api.js might handle toast? No, api.js throws error.
        } finally {
            setLoading(false);
        }
    };

    const handleMarkHelpful = async (reviewId) => {
        try {
            const response = await reviewService.markReviewHelpful(reviewId);
            if (response.success) {
                setReviews(prevReviews => prevReviews.map(r => {
                    if (r.id === reviewId) {
                        return {
                            ...r,
                            helpfulCount: response.data.helpfulCount,
                            isHelpful: response.data.isHelpful
                        };
                    }
                    return r;
                }));

                if (response.data.isHelpful) {
                    toast.success('Marked as helpful');
                } else {
                    toast.info('Removed helpful vote');
                }
            }
        } catch (error) {
            console.error('Mark helpful error:', error);
            toast.error(error.message || 'Failed to action');
        }
    };

    const handleReportReview = async (reviewId) => {
        try {
            const response = await reviewService.reportReview(reviewId);
            if (response.success) {
                toast.success('Review reported successfully');
            }
        } catch (error) {
            console.error('Report review error:', error);
            toast.error(error.message || 'Failed to report review');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            const response = await reviewService.deleteReview(reviewId);
            if (response.success) {
                toast.success('Review deleted successfully');
                fetchReviews();
            }
        } catch (error) {
            console.error('Delete review error:', error);
            toast.error(error.message || 'Failed to delete review');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Sort Options */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    {pagination.totalReviews || 0} Reviews
                </h3>

                <div className="relative z-20">
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-3 px-5 py-2.5 bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 transition-all hover:bg-white dark:hover:bg-white/10 group active:scale-95 shadow-sm"
                    >
                        <span className="opacity-60 uppercase tracking-widest text-[10px]">Sort by:</span>
                        <span className="text-[#3D52A0] dark:text-[#7091E6]">{currentSortLabel}</span>
                        <FaChevronDown className={`text-[10px] transition-transform duration-500 ${isSortOpen ? 'rotate-180 text-[#3D52A0]' : 'text-gray-400'}`} />
                    </button>

                    <AnimatePresence>
                        {isSortOpen && (
                            <>
                                {/* Click outside overlay */}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsSortOpen(false)}
                                />

                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="absolute right-0 mt-3 w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20"
                                >
                                    <div className="p-2">
                                        {sortOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setSortBy(option.value);
                                                    setCurrentPage(1);
                                                    setIsSortOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${sortBy === option.value
                                                    ? 'bg-[#3D52A0] text-white'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-[#3D52A0]/5 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                <span className={sortBy === option.value ? 'font-bold' : 'font-medium'}>
                                                    {option.label}
                                                </span>
                                                {sortBy === option.value && (
                                                    <FaCheckCircle className="text-white text-xs" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 italic">
                        No reviews yet. Be the first to share your thoughts!
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="group/review border-b border-gray-100 dark:border-gray-800 pb-8 last:border-0 transition-all duration-500 hover:bg-white/40 dark:hover:bg-white/5 p-6 rounded-3xl -mx-6"
                        >
                            {/* Review Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-4">
                                    {/* User Avatar */}
                                    <div className="w-12 h-12 flex-shrink-0 bg-[#EDE8F5] dark:bg-white/5 
                                rounded-xl flex items-center justify-center text-[#3D52A0] dark:text-[#7091E6] font-serif font-black text-xl shadow-sm">
                                        {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>

                                    {/* User Info */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                {review.user?.name || 'Anonymous'}
                                            </h4>
                                            {review.isVerified && (
                                                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[2px] text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-500/5 px-2.5 py-1 rounded-full border border-green-500/20 shadow-sm">
                                                    <FaCheckCircle className="text-[10px]" /> Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <StarRating rating={review.rating} readonly size="sm" />
                                            <span className="text-xs text-gray-400 uppercase tracking-wide">
                                                {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons for Owner */}
                                {currentUserId == review.userId && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onEditReview(review)}
                                            className="p-2 text-gray-400 hover:text-[#3D52A0] transition-colors"
                                            title="Edit Review"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteReview(review.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Delete Review"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Review Text */}
                            {review.reviewText && (
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-sm">
                                    {review.reviewText}
                                </p>
                            )}

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {review.isFeatured && (
                                    <span className="text-[10px] uppercase font-black tracking-[2px] text-[#3D52A0] dark:text-[#7091E6] flex items-center gap-1 bg-[#3D52A0]/5 dark:bg-white/5 px-3 py-1 rounded-full">
                                        <FaStar className="text-[10px]" /> Featured Review
                                    </span>
                                )}
                                {review.isAdminEdited && (
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400">
                                        (Edited by Admin)
                                    </span>
                                )}
                            </div>

                            {/* Review Actions */}
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => handleMarkHelpful(review.id)}
                                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all group ${review.isHelpful
                                        ? 'text-[#3D52A0] dark:text-[#7091E6]'
                                        : 'text-gray-400 hover:text-[#3D52A0]'
                                        }`}
                                >
                                    <FaThumbsUp className={`transition-transform ${review.isHelpful ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    <span>Helpful ({review.helpfulCount || 0})</span>
                                </button>

                                {currentUserId != review.userId && (
                                    <button
                                        onClick={() => handleReportReview(review.id)}
                                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <FaFlag />
                                        <span>Report</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Load More Button */}
            {(pagination.totalPages > 1 && currentPage < pagination.totalPages) && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="px-10 py-4 border border-[#3D52A0]/30 dark:border-white/10 hover:border-[#3D52A0] dark:hover:border-white font-black uppercase tracking-[2px] text-[12px] transition-all hover:bg-[#3D52A0] hover:text-white dark:hover:bg-white dark:hover:text-black rounded-2xl"
                    >
                        Load More Reviews
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReviewList;
