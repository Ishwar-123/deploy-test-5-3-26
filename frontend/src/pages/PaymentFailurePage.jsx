import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimesCircle, FaHome, FaRedo, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const PaymentFailurePage = () => {
    const navigate = useNavigate();
    const { darkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const book = location.state?.book;
    const reason = location.state?.reason || 'Payment was cancelled or failed';

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-gray-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 dark:bg-red-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 dark:bg-orange-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
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
                {/* Error Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                >
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                    <FaTimesCircle className="text-5xl text-red-500 dark:text-red-400 relative z-10" />
                </motion.div>

                {/* Title */}
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent mb-4">
                    Payment Failed
                </h1>

                {/* Message */}
                <p className="text-gray-600 dark:text-gray-300 mb-2 font-medium leading-relaxed">
                    {reason}
                </p>
                {book && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                        Purchase for <strong className="text-gray-900 dark:text-white">"{book.title}"</strong> was not completed.
                    </p>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 hover:scale-105"
                    >
                        <FaRedo /> Try Again
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                    >
                        <FaHome /> Go to Home
                    </button>
                </div>

                {/* Help Text */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
                    Need help? Contact support at <span className="text-red-600 dark:text-red-400 font-semibold">support@ebook.com</span>
                </p>
            </motion.div>
        </div>
    );
};

export default PaymentFailurePage;
