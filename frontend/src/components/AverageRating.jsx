import React from 'react';
import StarRating from './StarRating';
import { FaStar } from 'react-icons/fa';

const AverageRating = ({ ratingStats }) => {
    // Robustly extract stats with fallback
    const averageRating = Number(ratingStats?.averageRating || 0);
    const totalReviews = Number(ratingStats?.totalReviews || 0);
    const distribution = ratingStats?.distribution || {};

    const getPercentage = (count) => {
        if (totalReviews <= 0) return 0;
        return ((Number(count || 0) / totalReviews) * 100).toFixed(0);
    };

    const ratingLevels = [5, 4, 3, 2, 1];

    if (!totalReviews || totalReviews <= 0) {
        return (
            <div className="text-center py-6 bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/20">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium italic tracking-wide">
                    No verified reviews yet. Be the first to pioneer a legacy!
                </p>
            </div>
        );
    }

    return (
        <div className="grid md:grid-cols-12 gap-8 items-center">
            {/* Average Rating Display */}
            <div className="md:col-span-4 text-center md:border-r border-gray-100 dark:border-white/10 pr-0 md:pr-10 mb-8 md:mb-0">
                <div className="text-7xl font-serif font-black text-gray-900 dark:text-white mb-3 tracking-tighter">
                    {averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-4 scale-110">
                    <StarRating rating={averageRating} readonly size="md" />
                </div>
                <p className="text-[10px] font-black text-[#3D52A0] dark:text-[#7091E6] uppercase tracking-[3px]">
                    {totalReviews} Verified {totalReviews === 1 ? 'Review' : 'Reviews'}
                </p>
            </div>

            {/* Rating Distribution */}
            <div className="md:col-span-8 space-y-3">
                {ratingLevels.map((level) => {
                    const count = distribution[level] || 0;
                    const percentage = getPercentage(count);

                    return (
                        <div key={level} className="flex items-center gap-4">
                            <div className="flex items-center gap-1 w-16 text-sm font-bold text-gray-900 dark:text-white">
                                {level} <span className="text-gray-400 font-normal ml-1">stars</span>
                            </div>

                            <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-[#3D52A0] to-[#7091E6] h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            <div className="w-12 text-right text-xs font-medium text-gray-500">
                                {percentage}%
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AverageRating;
