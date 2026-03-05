import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Preloader = ({ isLoading: externalLoading, message }) => {
    const [internalLoading, setInternalLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const isAdmin = window.location.pathname.startsWith('/admin');
    const isSubscriptionPage = window.location.pathname.includes('subscription');

    // Disable loader on subscription page
    const isLoading = isSubscriptionPage ? false : (externalLoading !== undefined ? externalLoading : internalLoading);

    useEffect(() => {
        // If controlled externally, we don't need the internal timer logic for visibility
        if (externalLoading !== undefined) return;

        const timer = setInterval(() => {
            setProgress(prev => {
                const limit = 100;
                // Faster increment to finish in ~800ms + 200ms buffer
                const increment = Math.random() * 15 + 10;
                const next = prev + increment;

                if (next >= limit) {
                    clearInterval(timer);
                    // Minimal delay before unmounting for valid 1s feel
                    setTimeout(() => setInternalLoading(false), 200);
                    return limit;
                }
                return next;
            });
        }, 100); // 100ms interval * ~8 steps = 800ms

        return () => clearInterval(timer);
    }, [externalLoading]);

    // --- ATMOSPHERIC ELEMENTS FOR PRELOADER ---
    const Glow = ({ color, size, top, left, delay }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: [0.1, 0.2, 0.1],
                scale: [1, 1.2, 1],
            }}
            transition={{
                duration: 4,
                delay,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className={`absolute rounded-full blur-[100px] pointer-events-none ${color}`}
            style={{ width: size, height: size, top, left, zIndex: 0 }}
        />
    );

    if (!isLoading) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 1 }}
                exit={{
                    opacity: 0,
                    transition: { duration: 0.8, ease: "easeInOut" }
                }}
                className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#050505] overflow-hidden"
            >
                {/* Background Glows */}
                <Glow color="bg-[#3D52A0]/20" size="400px" top="-10%" left="-10%" delay={0} />
                <Glow color="bg-[#8B5CF6]/20" size="300px" top="60%" left="70%" delay={1} />
                <Glow color="bg-[#10B981]/10" size="250px" top="20%" left="80%" delay={2} />

                <div className="relative z-10 flex flex-col items-center">
                    {/* Main Logo Container with Glassmorphism */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative mb-12"
                    >
                        {/* Main Spinner Ring */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-8 rounded-full border-t-2 border-r-2 border-[#3D52A0] dark:border-[#7091E6]"
                        />

                        {/* Secondary Subtle Spinner */}
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-8 rounded-full border-b border-l border-slate-200 dark:border-white/10"
                        />

                        {/* Center Logo with Morphing Background */}
                        <motion.div
                            animate={{
                                borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "70% 30% 30% 70% / 70% 70% 30% 30%", "30% 70% 70% 30% / 30% 30% 70% 70%"],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="w-24 h-24 bg-gradient-to-br from-[#3D52A0] to-[#7091E6] flex items-center justify-center shadow-2xl shadow-[#3D52A0]/40 relative overflow-hidden"
                        >
                            <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </motion.div>

                            {/* Inner Shimmer */}
                            <motion.div
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                            />
                        </motion.div>
                    </motion.div>

                    {/* Text Elements */}
                    <div className="text-center space-y-3">
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl font-serif font-black tracking-tight text-[#1f2937] dark:text-white"
                        >
                            Charotar<span className="text-[#3D52A0] dark:text-[#7091E6]"> Publishing</span>
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center justify-center gap-3"
                        >
                            <span className="h-px w-6 bg-[#3D52A0]/20" />
                            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-400 dark:text-slate-500">
                                {message || 'Initializing Sanctuary'}
                            </p>
                            <span className="h-px w-6 bg-[#3D52A0]/20" />
                        </motion.div>
                    </div>

                    {/* Premium Progress Bar */}
                    <div className="mt-12 group">
                        <div className="w-64 h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden relative shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: "easeInOut", duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#8B5CF6] relative"
                            >
                                {/* Progress Glow */}
                                <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/40 blur-sm" />
                            </motion.div>
                        </div>

                        {/* Percentage Indicator */}
                        <motion.p
                            className="text-[10px] font-mono font-bold text-[#3D52A0]/60 dark:text-white/40 mt-4 text-center tracking-widest"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            {Math.round(progress)}% COMPLETE
                        </motion.p>
                    </div>
                </div>

                {/* Bottom Branding */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-10 left-0 right-0 text-center"
                >
                    <p className="text-[9px] uppercase tracking-[0.5em] font-bold text-slate-300 dark:text-white/10">
                        &copy; {new Date().getFullYear()} Charotar Publishing House
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default Preloader;
