import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TopBar = () => {
    const quotes = [
        "“A room without books is like a body without a soul.” — Marcus Tullius Cicero",
        "“Reading is essential for those who seek to rise above the ordinary.” — Jim Rohn",
        "“Books are a uniquely portable magic.” — Stephen King",
        "“The more that you read, the more things you will know.” — Dr. Seuss",
        "“There is no friend as loyal as a book.” — Ernest Hemingway",
        "“Reading is a conversation. All books talk. But a good book listens as well.” — Mark Haddon"
    ];

    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [quotes.length]);

    return (
        <div className="bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#8B5CF6] text-white py-2 px-4 shadow-md relative z-50">
            <div className="max-w-7xl mx-auto flex justify-center items-center gap-3">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>

                <div className="overflow-hidden h-5 flex items-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={currentQuoteIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="text-[11px] md:text-sm italic font-serif font-medium"
                        >
                            {quotes[currentQuoteIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
