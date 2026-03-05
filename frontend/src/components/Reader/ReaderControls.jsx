import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaBookmark, FaRegBookmark } from 'react-icons/fa';

const ReaderControls = ({
    isVisible,
    progress,
    isBookmarked,
    onPrevious,
    onNext,
    onToggleBookmark,
    onProgressChange,
    hasPrevious,
    hasNext
}) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed bottom-0 left-0 right-0 z-50 px-4 py-4 md:px-8 md:py-6"
                    style={{
                        background: 'linear-gradient(0deg, var(--reader-content-bg) 0%, transparent 100%)',
                    }}
                >
                    <div className="max-w-5xl mx-auto">
                        {/* Progress Slider */}
                        <div className="mb-4">
                            <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--reader-border)' }}>
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: progress / 100 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute left-0 top-0 h-full rounded-full origin-left"
                                    style={{
                                        backgroundColor: 'var(--reader-accent)',
                                        width: '100%'
                                    }}
                                />
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={(e) => onProgressChange(Number(e.target.value))}
                                className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                                style={{ zIndex: 10 }}
                            />
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex items-center justify-between">
                            {/* Previous Chapter */}
                            <motion.button
                                whileHover={{ scale: hasPrevious ? 1.05 : 1 }}
                                whileTap={{ scale: hasPrevious ? 0.95 : 1 }}
                                onClick={onPrevious}
                                disabled={!hasPrevious}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all duration-300"
                                style={{
                                    backgroundColor: hasPrevious ? 'var(--reader-border)' : 'transparent',
                                    color: hasPrevious ? 'var(--reader-text)' : 'var(--reader-border)',
                                    opacity: hasPrevious ? 1 : 0.3,
                                    cursor: hasPrevious ? 'pointer' : 'not-allowed'
                                }}
                            >
                                <FaChevronLeft className="text-xs" />
                                <span className="hidden sm:inline">Previous</span>
                            </motion.button>

                            {/* Bookmark */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onToggleBookmark}
                                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                                style={{
                                    backgroundColor: isBookmarked ? 'var(--reader-accent)' : 'var(--reader-border)',
                                    color: isBookmarked ? '#FFFFFF' : 'var(--reader-text)',
                                }}
                            >
                                {isBookmarked ? <FaBookmark className="text-lg" /> : <FaRegBookmark className="text-lg" />}
                            </motion.button>

                            {/* Next Chapter */}
                            <motion.button
                                whileHover={{ scale: hasNext ? 1.05 : 1 }}
                                whileTap={{ scale: hasNext ? 0.95 : 1 }}
                                onClick={onNext}
                                disabled={!hasNext}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all duration-300"
                                style={{
                                    backgroundColor: hasNext ? 'var(--reader-border)' : 'transparent',
                                    color: hasNext ? 'var(--reader-text)' : 'var(--reader-border)',
                                    opacity: hasNext ? 1 : 0.3,
                                    cursor: hasNext ? 'pointer' : 'not-allowed'
                                }}
                            >
                                <span className="hidden sm:inline">Next</span>
                                <FaChevronRight className="text-xs" />
                            </motion.button>
                        </div>

                        {/* Progress Text */}
                        <div className="text-center mt-3">
                            <span
                                className="text-xs font-bold"
                                style={{ color: 'var(--reader-text-secondary)' }}
                            >
                                {Math.round(progress)}% Complete
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReaderControls;
