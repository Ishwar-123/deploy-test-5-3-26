import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaBookOpen, FaSun, FaMoon, FaHome, FaFileInvoice } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useState, useEffect } from 'react';

const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    const { darkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const book = location.state?.book;
    const [showConfetti, setShowConfetti] = useState(true);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);

        // Stop confetti after 5 seconds
        const timer = setTimeout(() => setShowConfetti(false), 5000);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Confetti Effect */}
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.3}
                />
            )}

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 dark:bg-green-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
            </div>

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="fixed top-6 right-6 p-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform z-50"
            >
                {darkMode ? <FaSun className="text-amber-400" /> : <FaMoon className="text-blue-600" />}
            </button>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl text-center max-w-md w-full border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                >
                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                    <FaCheckCircle className="text-5xl text-green-500 dark:text-green-400 relative z-10" />
                </motion.div>

                {/* Title */}
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
                    Payment Successful!
                </h1>

                {/* Message */}
                <p className="text-gray-600 dark:text-gray-300 mb-2 font-medium leading-relaxed">
                    Your purchase has been confirmed successfully.
                </p>
                {book && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                        <strong className="text-gray-900 dark:text-white">"{book.title}"</strong> is now available in your library.
                    </p>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/reader/library', { replace: true })}
                        className="w-full py-3.5 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2 hover:scale-105"
                    >
                        <FaBookOpen /> Go to Library
                    </button>
                    <button
                        onClick={() => navigate('/reader/orders')}
                        className="w-full py-3.5 bg-white dark:bg-gray-800 border-2 border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                    >
                        <FaFileInvoice /> Download Receipt
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                    >
                        <FaHome /> Continue Shopping
                    </button>
                </div>

                {/* Thank You Message */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
                    Thank you for your purchase! 🎉
                </p>
            </motion.div>
        </div>
    );
};

export default PaymentSuccessPage;

