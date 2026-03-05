import React, { useState } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';

const StarRating = ({
    rating = 0,
    onRatingChange = null,
    size = 'md',
    readonly = false,
    showValue = false
}) => {
    const [hover, setHover] = useState(0);

    const sizes = {
        sm: 'text-sm',
        md: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-3xl'
    };

    const handleMouseMove = (e, index) => {
        if (readonly) return;
        const domRect = e.currentTarget.getBoundingClientRect();
        const cursorPosition = e.clientX - domRect.left;
        const isHalf = cursorPosition < domRect.width / 2;
        setHover(isHalf ? index - 0.5 : index);
    };

    const renderStars = () => {
        const stars = [];
        const currentRating = hover || rating;

        for (let i = 1; i <= 5; i++) {
            const isFilled = i <= currentRating;
            const isHalfFilled = currentRating > i - 1 && currentRating < i;

            stars.push(
                <button
                    key={i}
                    type="button"
                    disabled={readonly}
                    onClick={() => !readonly && onRatingChange && onRatingChange(hover || i)}
                    onMouseMove={(e) => handleMouseMove(e, i)}
                    className={`
            ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
            transition-all duration-200 ease-in-out
            ${sizes[size]}
            focus:outline-none relative
          `}
                >
                    {isFilled ? (
                        <FaStar className="text-[#f59e0b] drop-shadow-[0_0_2px_rgba(245,158,11,0.4)]" />
                    ) : isHalfFilled ? (
                        <FaStarHalfAlt className="text-[#f59e0b] drop-shadow-[0_0_2px_rgba(245,158,11,0.4)]" />
                    ) : (
                        <FaRegStar className="text-gray-300 dark:text-gray-600" />
                    )}
                </button>
            );
        }

        return stars;
    };

    return (
        <div className="flex items-center gap-2">
            <div
                className="flex items-center gap-1 group"
                onMouseLeave={() => !readonly && setHover(0)}
            >
                {renderStars()}
            </div>
            {showValue && (
                <span className="ml-2 text-sm font-black text-gray-700 dark:text-gray-300 w-8 text-center bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5 shadow-inner">
                    {Number(hover || rating).toFixed(1)}
                </span>
            )}
        </div>
    );
};

export default StarRating;
