import { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        // hidden on mobile — the 3D reader has its own bottom nav bar
        <div className="hidden md:block">
            <AnimatePresence>
                {isVisible && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={scrollToTop}
                        className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-[#1a1a2e] text-[#3D52A0] dark:text-[#7091E6] border border-[#8697C4]/30 dark:border-[#3D52A0]/30 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-gradient-to-tr hover:from-[#7091E6] hover:to-[#8B5CF6] hover:text-white dark:hover:text-white transition-all duration-300 group hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(112,145,230,0.5)]"
                        aria-label="Scroll to top"
                    >
                        <FaArrowUp className="text-lg group-hover:-translate-y-1 transition-transform duration-300" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ScrollToTopButton;
