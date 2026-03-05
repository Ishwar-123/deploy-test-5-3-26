import { motion, AnimatePresence } from 'framer-motion';
import { FaCog, FaArrowLeft } from 'react-icons/fa';

const ReaderTopBar = ({
    isVisible,
    bookTitle,
    chapterName,
    progress,
    onSettingsClick,
    onBackClick
}) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-8 md:py-4"
                    style={{
                        background: 'linear-gradient(180deg, var(--reader-content-bg) 0%, transparent 100%)',
                    }}
                >
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        {/* Left: Back Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onBackClick}
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                            style={{
                                backgroundColor: 'var(--reader-border)',
                                color: 'var(--reader-text)',
                            }}
                        >
                            <FaArrowLeft className="text-sm" />
                        </motion.button>

                        {/* Center: Book Info */}
                        <div className="flex-1 mx-4 text-center">
                            <h1
                                className="text-sm md:text-base font-bold truncate"
                                style={{ color: 'var(--reader-text)' }}
                            >
                                {bookTitle}
                            </h1>
                            <p
                                className="text-xs truncate mt-0.5"
                                style={{ color: 'var(--reader-text-secondary)' }}
                            >
                                {chapterName}
                            </p>
                        </div>

                        {/* Right: Progress & Settings */}
                        <div className="flex items-center gap-3">
                            <span
                                className="text-xs font-bold hidden sm:block"
                                style={{ color: 'var(--reader-accent)' }}
                            >
                                {progress}%
                            </span>
                            <motion.button
                                whileHover={{ scale: 1.05, rotate: 90 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onSettingsClick}
                                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                                style={{
                                    backgroundColor: 'var(--reader-border)',
                                    color: 'var(--reader-text)',
                                }}
                            >
                                <FaCog className="text-sm" />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReaderTopBar;
