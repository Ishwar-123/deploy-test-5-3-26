import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import toast from '../utils/sweetalert';
import reviewService from '../services/reviews';

const ReviewForm = ({ bookId, existingReview = null, onReviewSubmitted }) => {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (existingReview) {
            setRating(existingReview.rating);
            setReviewText(existingReview.reviewText || '');
        }
    }, [existingReview]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await reviewService.createOrUpdateReview({
                bookId,
                rating,
                reviewText: reviewText.trim()
            });

            if (response.success) {
                toast.success(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
                if (onReviewSubmitted) {
                    onReviewSubmitted(response.data);
                }
            }
        } catch (error) {
            console.error('Submit review error:', error);
            // toast handled by api.js or here
            toast.error(error.message || 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Rating Selection */}
            <div>
                <label className="block text-[10px] font-black uppercase tracking-[3px] text-[#3D52A0] dark:text-[#7091E6] mb-4">
                    Your Rating *
                </label>
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-6 border border-white/40 dark:border-white/10 inline-block rounded-2xl shadow-sm">
                    <StarRating
                        rating={rating}
                        onRatingChange={setRating}
                        size="xl"
                        showValue
                    />
                </div>
            </div>

            {/* Review Text */}
            <div>
                <label
                    htmlFor="reviewText"
                    className="block text-[10px] font-black uppercase tracking-[3px] text-[#3D52A0] dark:text-[#7091E6] mb-4"
                >
                    Your Review
                </label>
                <textarea
                    id="reviewText"
                    rows="6"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your thoughts about this book..."
                    className="w-full px-6 py-5 rounded-2xl border border-[#7091E6]/20 dark:border-white/10 
                     bg-white/40 dark:bg-white/5 backdrop-blur-md text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-[#3D52A0]/30 focus:border-[#3D52A0] outline-none
                     placeholder-gray-400 dark:placeholder-gray-500
                     transition-all duration-300 resize-y shadow-inner"
                    maxLength="2000"
                />
                <div className="flex justify-end mt-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">
                        {reviewText.length} / 2000
                    </span>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#8B5CF6] hover:from-[#7091E6] hover:to-[#8B5CF6] text-white font-black uppercase tracking-[2px] text-[13px] py-4 px-6 rounded-2xl
                   transition-all duration-500 shadow-[0_15px_30px_-5px_#7091E6/40] hover:shadow-[0_20px_40px_-5px_#7091E6/50] hover:-translate-y-1.5
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none active:scale-95"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        PROCESSING EXPERIENCE...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        {existingReview ? 'Update Your Legacy' : 'Publish Your Review'}
                    </span>
                )}
            </button>
        </form>
    );
};

export default ReviewForm;
