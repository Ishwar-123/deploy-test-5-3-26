import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    FaShieldAlt, FaArrowLeft, FaStopwatch, FaCircleNotch,
    FaBook, FaArrowRight, FaEnvelope, FaWhatsapp, FaBookOpen
} from 'react-icons/fa';
import toast from '../utils/sweetalert';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

/* ─── Reusable 6-box OTP input group ──────────────────────────────────── */
const OTPInput = ({ id, value, onChange, label, icon, color }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleChange = (e, index) => {
        const v = e.target.value;
        if (!/^[0-9]*$/.test(v)) return;
        const next = [...value];
        next[index] = v.substring(v.length - 1);
        onChange(next);
        if (v && index < 5) setActiveIndex(index + 1);
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            setActiveIndex(index - 1);
        }
    };

    useEffect(() => {
        const isAllEmpty = value.every(v => v === '');
        if (isAllEmpty && activeIndex !== 0) {
            setActiveIndex(0);
        }
    }, [value, activeIndex]);

    useEffect(() => {
        const input = document.getElementById(`${id}-${activeIndex}`);
        if (input) input.focus();
    }, [activeIndex, id]);

    return (
        <div className="space-y-2.5">
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${color} ml-1`}>
                {icon}
                <span>{label}</span>
            </div>
            <div className="flex justify-between gap-1.5 sm:gap-2">
                {value.map((digit, index) => (
                    <input
                        key={index}
                        id={`${id}-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => setActiveIndex(index)}
                        className={`w-full aspect-square max-w-[48px] border-2 rounded-2xl text-center text-lg font-black transition-all duration-300 focus:outline-none
                            ${digit
                                ? 'border-[#3D52A0] dark:border-[#7091E6] text-[#3D52A0] dark:text-[#7091E6] bg-white dark:bg-white/10 shadow-lg scale-105'
                                : activeIndex === index
                                    ? 'border-[#3D52A0] dark:border-[#7091E6] ring-4 ring-[#3D52A0]/5 bg-white dark:bg-white/5 scale-105'
                                    : 'border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white hover:border-[#3D52A0]/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

/* ─── Main Page ────────────────────────────────────────────────────────── */
const OTPVerificationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        user, logout,
        verifyLoginOTP, verifyEmail,
        verifyDualOTP, resendBothOTPs,
        requestLoginOTP, resendOTP,
        forgotPassword, verifyResetOTP
    } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const stateContext = location.state || {};

    const [identifier] = useState(() =>
        stateContext.identifier || sessionStorage.getItem('otp_identifier') || ''
    );
    const [phone] = useState(() =>
        stateContext.phone || sessionStorage.getItem('otp_phone') || ''
    );
    const [context] = useState(() =>
        stateContext.context || sessionStorage.getItem('otp_context') || 'login'
    );
    const [channel] = useState(() =>
        stateContext.channel || sessionStorage.getItem('otp_channel') || 'email'
    );

    const isDual = channel === 'dual';

    // OTP states
    const [emailOtp, setEmailOtp] = useState(new Array(6).fill(''));
    const [phoneOtp, setPhoneOtp] = useState(new Array(6).fill(''));
    const [otp, setOtp] = useState(new Array(6).fill(''));

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Timer
    const [timeLeft, setTimeLeft] = useState(() => {
        const storedExpiry = sessionStorage.getItem('otp_expires_at');
        if (storedExpiry) {
            const remaining = Math.floor((parseInt(storedExpiry) - Date.now()) / 1000);
            return remaining > 0 ? remaining : 0;
        }
        return 300;
    });
    const [isTimerActive, setIsTimerActive] = useState(true);

    // Persist context
    useEffect(() => {
        if (stateContext.identifier) {
            sessionStorage.setItem('otp_identifier', stateContext.identifier);
            sessionStorage.setItem('otp_phone', stateContext.phone || '');
            sessionStorage.setItem('otp_context', stateContext.context || 'login');
            sessionStorage.setItem('otp_channel', stateContext.channel || 'email');
            if (!sessionStorage.getItem('otp_expires_at')) {
                sessionStorage.setItem('otp_expires_at', (Date.now() + 300 * 1000).toString());
            }
        }
    }, [stateContext]);

    const clearOTPStorage = () => {
        ['otp_identifier', 'otp_phone', 'otp_context', 'otp_channel', 'otp_expires_at']
            .forEach(k => sessionStorage.removeItem(k));
    };

    // Force logout if already logged in
    useEffect(() => {
        if (user && !isLoggingOut && !isSubmitting) {
            clearOTPStorage();
            setIsLoggingOut(true);
            logout();
            return;
        }
        if (!identifier && !user) {
            // Wait a small bit to see if props arrive
            const timer = setTimeout(() => {
                if (!identifier && !user) {
                    toast.error('Invalid access. Please login or register first.', { toastId: 'auth-toast' });
                    navigate('/login');
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [identifier, navigate, user, logout, isLoggingOut, isSubmitting]);

    // Timer countdown
    useEffect(() => {
        let interval = null;
        if (isTimerActive && timeLeft > 0) {
            interval = setInterval(() => {
                const storedExpiry = sessionStorage.getItem('otp_expires_at');
                if (storedExpiry) {
                    const remaining = Math.max(0, Math.floor((parseInt(storedExpiry) - Date.now()) / 1000));
                    setTimeLeft(remaining);
                    if (remaining === 0) setIsTimerActive(false);
                } else {
                    setTimeLeft(prev => prev - 1);
                }
            }, 1000);
        } else if (timeLeft === 0) {
            setIsTimerActive(false);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isTimerActive, timeLeft]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleResend = async () => {
        try {
            setIsSubmitting(true);
            if (isDual) {
                await resendBothOTPs(identifier);
            } else if (context === 'login') {
                await requestLoginOTP(identifier, channel);
            } else if (context === 'forgot-password') {
                await forgotPassword(identifier);
            } else {
                await resendOTP(identifier);
            }

            const newExpiry = Date.now() + 300 * 1000;
            sessionStorage.setItem('otp_expires_at', newExpiry.toString());
            setTimeLeft(300);
            setIsTimerActive(true);
            toast.success('Codes resent successfully!');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);

        try {
            if (isDual) {
                const emailOtpVal = emailOtp.join('');
                const phoneOtpVal = phoneOtp.join('');

                if (emailOtpVal.length !== 6 || phoneOtpVal.length !== 6) {
                    toast.warning('Please enter both 6-digit OTPs');
                    setIsSubmitting(false);
                    return;
                }

                await verifyDualOTP(identifier, emailOtpVal, phoneOtpVal, context);
                clearOTPStorage();

                if (context === 'register') {
                    toast.success('Account verified! Please log in.');
                    navigate('/login');
                }
            } else {
                const otpValue = otp.join('');
                if (otpValue.length !== 6) {
                    toast.warning('Please enter the 6-digit OTP');
                    setIsSubmitting(false);
                    return;
                }

                if (context === 'login') {
                    await verifyLoginOTP(identifier, otpValue, channel);
                    clearOTPStorage();
                } else if (context === 'register') {
                    await verifyEmail(identifier, otpValue);
                    clearOTPStorage();
                    navigate('/login');
                } else if (context === 'forgot-password') {
                    await verifyResetOTP(identifier, otpValue);
                    toast.success('OTP verified! Please enter your new password.');
                    clearOTPStorage();
                    navigate('/reset-password', { state: { identifier, otp: otpValue } });
                }
            }
        } catch (error) {
            console.error(error);
            // Use error.data if available (from our api.js interceptor)
            const data = error.data || error.response?.data || {};

            if (isDual) {
                // Only reset the one that didn't match
                if (data.emailMatch === false) setEmailOtp(new Array(6).fill(''));
                if (data.phoneMatch === false) setPhoneOtp(new Array(6).fill(''));

                // If it was a general error (no specific match flags), reset both for safety
                if (data.emailMatch === undefined && data.phoneMatch === undefined) {
                    setEmailOtp(new Array(6).fill(''));
                    setPhoneOtp(new Array(6).fill(''));
                }
            } else {
                setOtp(new Array(6).fill(''));
            }
            setIsSubmitting(false);
        }
    };

    const canSubmit = isDual
        ? emailOtp.join('').length === 6 && phoneOtp.join('').length === 6
        : otp.join('').length === 6;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0f172a] font-sans selection:bg-[#3D52A0] selection:text-white relative overflow-hidden">
            {/* BACKGROUND DECORATIONS */}
            <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-[#3D52A0]/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-5%] right-[5%] w-[25%] h-[25%] bg-[#8B5CF6]/10 blur-[100px] rounded-full pointer-events-none" />

            {/* LEFT SIDE - IMAGERY (55%) */}
            <div className="hidden lg:flex w-[55%] relative bg-[#020617] overflow-hidden group">
                <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#020617] via-transparent to-[#020617] opacity-60" />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(61,82,160,0.15)_0%,transparent_50%)]" />

                {/* LOGO */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="absolute top-10 left-10 z-30"
                >
                    <Link to="/">
                        <img
                            src="/logo.png"
                            alt="Charotar Publishing House"
                            className="h-14 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                        />
                    </Link>
                </motion.div>

                <div className="absolute inset-0 z-0">
                    <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.7 }}
                        transition={{ duration: 1.5 }}
                        src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1974&auto=format&fit=crop"
                        alt="Security"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="relative z-20 flex flex-col justify-end p-16 w-full h-full">
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                    >
                        <div className="w-16 h-16 bg-gradient-to-br from-[#3D52A0] to-[#7091E6] rounded-2xl flex items-center justify-center mb-8 shadow-3xl shadow-[#3D52A0]/40 transform hover:-translate-y-2 transition-transform duration-500">
                            <FaShieldAlt className="text-white text-3xl" />
                        </div>
                        <h2 className="text-5xl font-serif text-white mb-6 leading-[1.05] tracking-tight max-w-xl">
                            Secure your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7091E6] to-[#ADBBDA]">Endless</span> Journey.
                        </h2>
                        <p className="text-[#ADBBDA] font-medium text-lg max-w-lg leading-relaxed border-l-[3px] border-[#7091E6] pl-8 py-2">
                            Privacy is not an option, and it shouldn't be the price we pay for just getting on the Internet.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* RIGHT SIDE - FORM (45%) */}
            <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-4 md:p-8 relative z-20 h-full overflow-y-auto no-scrollbar">
                {/* Mobile Header */}
                <div className="absolute top-8 left-10 lg:hidden text-gray-900 dark:text-white">
                    <Link to="/">
                        <img
                            src="/logo.png"
                            alt="Charotar Publishing House"
                            className="h-10 w-auto object-contain brightness-0 dark:brightness-100"
                        />
                    </Link>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-lg bg-white/60 dark:bg-white/5 backdrop-blur-3xl p-5 md:p-10 rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(61,82,160,0.15)] flex flex-col"
                >
                    <motion.div variants={itemVariants} className="mb-6">
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2 tracking-tighter">Verification Codes</h1>
                        <div className="space-y-1">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                Enter the OTP sent to your <span className="text-[#3D52A0] dark:text-[#7091E6] font-bold">{identifier}</span>
                            </p>
                            {isDual && (
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                    and your WhatsApp <span className="text-green-500 font-bold">{phone ? `+${phone.replace(/\D/g, '')}` : ''}</span>
                                </p>
                            )}
                        </div>
                    </motion.div>

                    <form onSubmit={handleVerify} className="space-y-5">
                        <motion.div variants={itemVariants} className="space-y-5">
                            {isDual ? (
                                <>
                                    <div className="p-4 rounded-2xl border-2 border-slate-100 dark:border-white/5 bg-white/40 dark:bg-white/5">
                                        <OTPInput
                                            id="email-otp"
                                            value={emailOtp}
                                            onChange={setEmailOtp}
                                            label="Email Code"
                                            icon={<FaEnvelope />}
                                            color="text-[#3D52A0] dark:text-[#7091E6]"
                                        />
                                    </div>
                                    <div className="p-4 rounded-2xl border-2 border-slate-100 dark:border-white/5 bg-white/40 dark:bg-white/5">
                                        <OTPInput
                                            id="whatsapp-otp"
                                            value={phoneOtp}
                                            onChange={setPhoneOtp}
                                            label="WhatsApp Code"
                                            icon={<FaWhatsapp />}
                                            color="text-green-500"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="p-5 rounded-3xl border-2 border-slate-100 dark:border-white/5 bg-white/40 dark:bg-white/5">
                                    <OTPInput
                                        id="single-otp"
                                        value={otp}
                                        onChange={setOtp}
                                        label={channel === 'email' ? 'Email Code' : 'WhatsApp Code'}
                                        icon={channel === 'email' ? <FaEnvelope /> : <FaWhatsapp />}
                                        color="text-[#3D52A0] dark:text-[#7091E6]"
                                    />
                                </div>
                            )}
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex items-center justify-between text-xs pt-2">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                                <FaStopwatch className={timeLeft > 0 ? 'text-[#3D52A0] animate-pulse' : 'text-slate-300'} />
                                <span>{timeLeft > 0 ? formatTime(timeLeft) : 'Expired'}</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={isSubmitting || timeLeft > 0}
                                className={`font-black uppercase tracking-[0.2em] transition-all
                                    ${timeLeft > 0
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : 'text-[#3D52A0] dark:text-[#7091E6] hover:underline underline-offset-4'}`}
                            >
                                Resend Codes
                            </button>
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isSubmitting || !canSubmit}
                            className="w-full py-4 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] hover:from-[#7091E6] hover:to-[#3D52A0] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-xl shadow-[#3D52A0]/20 hover:shadow-lg mt-4 relative overflow-hidden group/btn"
                        >
                            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                            {isSubmitting ? <FaCircleNotch className="animate-spin text-xl" /> : 'Verify Identity'}
                            {!isSubmitting && <FaArrowRight className="group-hover:translate-x-1 transition-transform" />}
                        </motion.button>
                    </form>

                    <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col items-center gap-4">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#3D52A0] transition-colors"
                        >
                            <FaArrowLeft className="text-[10px]" /> Back to Login
                        </Link>
                    </motion.div>
                </motion.div>
            </div>

            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
};

export default OTPVerificationPage;
