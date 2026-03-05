import React, { useState, useEffect } from 'react';
import AverageRating from './AverageRating';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import { getUserReviewForBook, deleteReview } from '../services/reviews';
import toast from '../utils/sweetalert';

const BookReviewSection = ({ bookId, currentUser, onReviewUpdate }) => {
    const [userReview, setUserReview] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [ratingStats, setRatingStats] = useState(null);

    useEffect(() => {
        if (currentUser) {
            fetchUserReview();
        }
    }, [bookId, currentUser]);

    useEffect(() => {
        // When reviews are shared or deleted, tell parent to refresh its own book stats if callback exists
        if (refreshTrigger > 0 && onReviewUpdate) {
            onReviewUpdate();
        }
    }, [refreshTrigger, onReviewUpdate]);

    const fetchUserReview = async () => {
        try {
            const response = await getUserReviewForBook(bookId);
            if (response.success) {
                setUserReview(response.data);
            } else {
                setUserReview(null);
            }
        } catch (error) {
            // User hasn't reviewed yet - this is normal
            if (error.status !== 404) {
                console.error('Fetch user review error:', error);
            }
            setUserReview(null);
        }
    };

    const handleDeleteReview = async () => {
        if (!window.confirm('Are you sure you want to delete your review? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await deleteReview(userReview.id);
            if (response.success) {
                toast.success('Review deleted successfully');
                setUserReview(null);
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error('Delete review error:', error);
            toast.error(error.message || 'Failed to delete review');
        }
    };

    const handleReviewSubmitted = (review) => {
        setUserReview(review);
        setShowReviewForm(false);
        setRefreshTrigger(prev => prev + 1);
        toast.success('Thank you for your review!');
    };

    const handleEditReview = (review) => {
        setUserReview(review);
        setShowReviewForm(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col items-center mb-12">
                <span className="text-[#3D52A0] text-[10px] font-black uppercase tracking-[5px] mb-4">Voice of the Readers</span>
                <h3 className="text-3xl font-serif font-black text-gray-900 dark:text-white">
                    Customer Reviews
                </h3>
            </div>

            {/* Average Rating Section - Glassmorphic */}
            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/40 dark:border-white/10 shadow-sm transition-all duration-500 hover:shadow-md">
                <AverageRating ratingStats={ratingStats} />
            </div>

            {/* Review Form Section */}
            {currentUser ? (
                <div className="border border-gray-100 dark:border-gray-800 p-8 rounded-sm">
                    {!showReviewForm && !userReview && (
                        <div className="text-center bg-white/40 dark:bg-white/5 backdrop-blur-sm p-10 rounded-2xl border border-white/20 dark:border-white/5">
                            <h4 className="text-xl font-serif font-black mb-4 text-gray-900 dark:text-white">Share your thoughts</h4>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm max-w-sm mx-auto">If you've read this book, we'd love to hear what you think!</p>
                            <button
                                onClick={() => setShowReviewForm(true)}
                                className="inline-block px-10 py-4 bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#8B5CF6] hover:from-[#7091E6] hover:to-[#8B5CF6] text-white font-black uppercase tracking-[2px] text-[13px] transition-all duration-500 shadow-[0_15px_30px_-5px_#7091E6/40] rounded-2xl hover:-translate-y-1.5 active:scale-95"
                            >
                                Write a Review
                            </button>
                        </div>
                    )}

                    {!showReviewForm && userReview && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#EDE8F5]/40 dark:bg-[#3D52A0]/5 backdrop-blur-md border border-[#7091E6]/20 dark:border-[#3D52A0]/20 p-8 rounded-2xl shadow-sm">
                            <div className="text-center sm:text-left">
                                <h4 className="font-black text-[#3D52A0] dark:text-[#7091E6] mb-2 uppercase tracking-[2px] text-sm">Thanks for your review!</h4>
                                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">You have already shared your feedback for this book.</p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => setShowReviewForm(true)}
                                    className="px-8 py-3 bg-white dark:bg-white/5 border border-[#3D52A0]/30 text-[#3D52A0] dark:text-[#7091E6] font-black uppercase tracking-[2px] text-[12px] rounded-xl transition-all hover:bg-[#3D52A0] hover:text-white"
                                >
                                    Edit Review
                                </button>
                                <button
                                    onClick={handleDeleteReview}
                                    className="px-8 py-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 font-black uppercase tracking-[2px] text-[12px] rounded-xl transition-all hover:bg-red-600 hover:text-white"
                                >
                                    Delete Review
                                </button>
                            </div>
                        </div>
                    )}

                    {showReviewForm && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-10">
                                <h4 className="text-xl font-serif font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                    {userReview ? 'Refine Your History' : 'Pioneer a Review'}
                                </h4>
                                <button
                                    onClick={() => setShowReviewForm(false)}
                                    className="text-gray-400 hover:text-[#3D52A0] transition-colors text-sm font-bold uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            </div>

                            <ReviewForm
                                bookId={bookId}
                                existingReview={userReview}
                                onReviewSubmitted={handleReviewSubmitted}
                                onCancel={() => setShowReviewForm(false)}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/5 rounded-2xl p-10 text-center">
                    <h4 className="text-xl font-serif font-black text-gray-900 dark:text-white mb-4">Sign in to write a review</h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">You need to be logged in to share your thoughts.</p>
                    <a
                        href="/login"
                        className="inline-block px-10 py-4 bg-[#3D52A0] text-white font-black uppercase tracking-[2px] text-[13px] transition-all duration-500 shadow-xl rounded-2xl hover:bg-[#7091E6] hover:-translate-y-1"
                    >
                        Log In Now
                    </a>
                </div>
            )}

            {/* Reviews List Section */}
            <div className="pt-8">
                <ReviewList
                    key={`${bookId}-${refreshTrigger}`}
                    bookId={bookId}
                    currentUserId={currentUser?.id}
                    onEditReview={handleEditReview}
                    refreshTrigger={refreshTrigger}
                    onStatsLoaded={setRatingStats}
                />
            </div>
        </div>
    );
};

export default BookReviewSection;
