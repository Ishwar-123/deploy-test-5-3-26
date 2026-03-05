import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaLock, FaShieldAlt, FaArrowLeft, FaCircleNotch, FaKey, FaEnvelope, FaPhone, FaBookOpen } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const PinPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setupPin, verifyPinLogin, forgotPin, resetPinWithOTP, user } = useAuth();

    // Get data from login redirect
    const email = location.state?.email;
    const hasPinSet = location.state?.hasPinSet;
    const userName = location.state?.name;

    // States
    const [mode, setMode] = useState(hasPinSet ? 'enter' : 'create'); // 'create' | 'enter' | 'forgot' | 'reset'
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
    const [isConfirming, setIsConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Forgot PIN states
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [newPin, setNewPin] = useState(['', '', '', '', '', '']);
    const [otpSent, setOtpSent] = useState(false);

    const pinRefs = useRef([]);
    const confirmPinRefs = useRef([]);
    const newPinRefs = useRef([]);
    const otpRefs = useRef([]);

    // Redirect if no email (direct access)
    useEffect(() => {
        if (!email) {
            navigate('/login', { replace: true });
        }
    }, [email, navigate]);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    // Focus first input on mode change
    useEffect(() => {
        if (mode === 'create' || mode === 'enter') {
            setTimeout(() => {
                if (isConfirming) {
                    document.getElementById('confirm-0')?.focus();
                } else {
                    const prefix = mode === 'enter' ? 'login' : 'create';
                    document.getElementById(`${prefix}-0`)?.focus();
                }
            }, 100);
        }
    }, [mode, isConfirming]);

    const handlePinChange = (index, value, pinArray, setPinArray, idPrefix) => {
        if (!/^\d*$/.test(value)) return;

        const newPinArray = [...pinArray];
        newPinArray[index] = value.slice(-1);
        setPinArray(newPinArray);
        setError('');

        // Auto-focus next
        if (value && index < 5) {
            setTimeout(() => {
                const nextInput = document.getElementById(`${idPrefix}-${index + 1}`);
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
            }, 10);
        }
    };

    const handlePinKeyDown = (index, e, pinArray, setPinArray, idPrefix) => {
        if (e.key === 'Backspace' && !pinArray[index] && index > 0) {
            const newPinArray = [...pinArray];
            newPinArray[index - 1] = '';
            setPinArray(newPinArray);
            setTimeout(() => {
                const prevInput = document.getElementById(`${idPrefix}-${index - 1}`);
                if (prevInput) {
                    prevInput.focus();
                    prevInput.select();
                }
            }, 10);
        }
    };

    const handlePinPaste = (e, setPinArray, refs) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            setPinArray(pastedData.split(''));
            refs.current[5]?.focus();
        }
    };

    // Create PIN flow
    const handleCreatePin = async () => {
        const pinStr = pin.join('');
        if (pinStr.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        if (!isConfirming) {
            setIsConfirming(true);
            setConfirmPin(['', '', '', '', '', '']);
            setTimeout(() => document.getElementById('confirm-0')?.focus(), 100);
            return;
        }

        const confirmPinStr = confirmPin.join('');
        if (pinStr !== confirmPinStr) {
            setError('PINs do not match. Please try again.');
            setConfirmPin(['', '', '', '', '', '']);
            setTimeout(() => document.getElementById('confirm-0')?.focus(), 100);
            return;
        }

        setLoading(true);
        try {
            await setupPin(email, pinStr);
        } catch (err) {
            setError(err.message || 'Failed to create PIN');
        } finally {
            setLoading(false);
        }
    };

    // Enter PIN flow
    const handleVerifyPin = async () => {
        const pinStr = pin.join('');
        if (pinStr.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        try {
            await verifyPinLogin(email, pinStr);
        } catch (err) {
            setError(err.message || 'Incorrect PIN');
            setPin(['', '', '', '', '', '']);
            setTimeout(() => document.getElementById('pin-0')?.focus(), 100);
        } finally {
            setLoading(false);
        }
    };

    // Forgot PIN — send OTP
    const handleForgotPinSendOTP = async () => {
        if (!identifier.trim()) {
            setError('Please enter your email or phone number');
            return;
        }

        setLoading(true);
        try {
            await forgotPin(identifier.trim());
            setOtpSent(true);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Reset PIN — verify OTP + set new PIN
    const handleResetPin = async () => {
        const newPinStr = newPin.join('');
        if (!otp.trim()) {
            setError('Please enter the OTP');
            return;
        }
        if (newPinStr.length !== 6) {
            setError('Please enter all 6 digits of new PIN');
            return;
        }

        setLoading(true);
        try {
            await resetPinWithOTP(identifier.trim(), otp.trim(), newPinStr);
            // After reset, go back to enter PIN mode
            setMode('enter');
            setPin(['', '', '', '', '', '']);
            setOtp('');
            setNewPin(['', '', '', '', '', '']);
            setOtpSent(false);
            setIdentifier('');
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to reset PIN');
            // Reset only the OTP field, keep the new PIN intact
            setOtp('');
            setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
        } finally {
            setLoading(false);
        }
    };

    // Auto-submit when all digits entered
    useEffect(() => {
        if (mode === 'enter' && pin.every(d => d !== '')) {
            handleVerifyPin();
        }
    }, [pin]);

    useEffect(() => {
        if (mode === 'create' && isConfirming && confirmPin.every(d => d !== '')) {
            handleCreatePin();
        }
    }, [confirmPin]);

    if (!email) return null;

    const renderPinInputs = (pinArray, setPinArray, refs, idPrefix = 'pin') => (
        <div className="flex justify-center gap-3 sm:gap-4">
            {pinArray.map((digit, index) => (
                <motion.input
                    key={index}
                    id={`${idPrefix}-${index}`}
                    ref={(el) => (refs.current[index] = el)}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value, pinArray, setPinArray, idPrefix)}
                    onKeyDown={(e) => handlePinKeyDown(index, e, pinArray, setPinArray, idPrefix)}
                    onPaste={(e) => handlePinPaste(e, setPinArray, refs)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.08 }}
                    className={`w-14 h-16 sm:w-16 sm:h-18 text-center text-2xl font-black bg-white/50 dark:bg-white/5 border-2 
                        ${digit ? 'border-[#3D52A0] dark:border-[#7091E6] shadow-lg shadow-[#3D52A0]/10' : 'border-slate-200 dark:border-white/10'}
                        rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/10 
                        outline-none transition-all text-gray-900 dark:text-white placeholder-slate-300
                        hover:border-slate-300 dark:hover:border-white/20`}
                    autoComplete="off"
                />
            ))}
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0f172a] font-sans selection:bg-[#3D52A0] selection:text-white relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#3D52A0]/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[10%] w-[30%] h-[30%] bg-[#8B5CF6]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute top-[40%] left-[30%] w-[20%] h-[20%] bg-[#7091E6]/5 blur-[80px] rounded-full pointer-events-none" />

            {/* LEFT SIDE - Imagery (Hidden on mobile) */}
            <div className="hidden lg:flex w-[55%] relative bg-[#020617] overflow-hidden">
                <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#020617] via-transparent to-[#020617] opacity-60" />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(61,82,160,0.15)_0%,transparent_50%)]" />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.1)_0%,transparent_50%)]" />

                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="absolute top-10 left-10 z-30"
                >
                    <Link to="/">
                        <img src="/logo.png" alt="Charotar Publishing House" className="h-14 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300" />
                    </Link>
                </motion.div>

                <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.7 }}
                        transition={{ duration: 1.5 }}
                        src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2256&auto=format&fit=crop"
                        alt="Library"
                        className="w-full h-full object-cover transition-transform duration-[30s] ease-linear hover:scale-110"
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
                            Secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7091E6] to-[#ADBBDA]">Access</span> Control.
                        </h2>
                        <p className="text-[#ADBBDA] font-medium text-lg max-w-lg leading-relaxed border-l-[3px] border-[#7091E6] pl-8 py-2">
                            A secure 6-digit PIN ensures only you can access your digital library and account settings.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* RIGHT SIDE - PIN Form */}
            <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-4 md:p-8 relative z-20 h-full">
                {/* Mobile Header */}
                <div className="absolute top-6 left-8 lg:hidden">
                    <Link to="/">
                        <img src="/logo.png" alt="Charotar Publishing House" className="h-10 w-auto object-contain" />
                    </Link>
                </div>

                <AnimatePresence mode="wait">
                    {/* ============ CREATE PIN ============ */}
                    {mode === 'create' && (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-lg bg-white/60 dark:bg-white/5 backdrop-blur-3xl p-6 md:p-10 rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(61,82,160,0.15)]"
                        >
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#3D52A0] to-[#7091E6] rounded-3xl flex items-center justify-center shadow-xl shadow-[#3D52A0]/30">
                                    <FaKey className="text-white text-3xl" />
                                </div>
                            </div>

                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2 text-center tracking-tighter">
                                {isConfirming ? 'Confirm Your PIN' : 'Create Your PIN'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium text-center mb-8">
                                {isConfirming
                                    ? 'Please re-enter your 6-digit PIN to confirm.'
                                    : `Welcome ${userName || ''}! Set a 6-digit PIN to secure your account.`}
                            </p>

                            {/* PIN Dots */}
                            <div className="mb-6">
                                {isConfirming
                                    ? renderPinInputs(confirmPin, setConfirmPin, confirmPinRefs, 'confirm')
                                    : renderPinInputs(pin, setPin, pinRefs, 'create')}
                            </div>

                            {/* Error */}
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-sm text-center font-bold mb-4"
                                >
                                    {error}
                                </motion.p>
                            )}

                            {/* Submit */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleCreatePin}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] hover:from-[#7091E6] hover:to-[#3D52A0] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-xl shadow-[#3D52A0]/20 hover:shadow-lg mt-2 relative overflow-hidden group/btn"
                            >
                                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                                {loading ? <FaCircleNotch className="animate-spin text-xl" /> : isConfirming ? 'Confirm PIN' : 'Set PIN'}
                            </motion.button>

                            {isConfirming && (
                                <button
                                    onClick={() => {
                                        setIsConfirming(false);
                                        setConfirmPin(['', '', '', '', '', '']);
                                        setPin(['', '', '', '', '', '']);
                                        setError('');
                                        setTimeout(() => document.getElementById('create-0')?.focus(), 100);
                                    }}
                                    className="w-full mt-4 text-sm text-slate-500 dark:text-slate-400 hover:text-[#3D52A0] dark:hover:text-[#7091E6] font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaArrowLeft className="text-xs" /> Re-enter PIN
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* ============ ENTER PIN ============ */}
                    {mode === 'enter' && (
                        <motion.div
                            key="enter"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-lg bg-white/60 dark:bg-white/5 backdrop-blur-3xl p-6 md:p-10 rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(61,82,160,0.15)]"
                        >
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#3D52A0] to-[#7091E6] rounded-3xl flex items-center justify-center shadow-xl shadow-[#3D52A0]/30">
                                    <FaLock className="text-white text-3xl" />
                                </div>
                            </div>

                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2 text-center tracking-tighter">
                                Enter Your PIN
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium text-center mb-8">
                                Welcome back{userName ? `, ${userName}` : ''}! Enter your 6-digit PIN to continue.
                            </p>

                            {/* PIN Inputs */}
                            <div className="mb-6">
                                {renderPinInputs(pin, setPin, pinRefs, 'login')}
                            </div>

                            {/* Error */}
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-sm text-center font-bold mb-4"
                                >
                                    {error}
                                </motion.p>
                            )}

                            {/* Loading indicator */}
                            {loading && (
                                <div className="flex justify-center mb-4">
                                    <FaCircleNotch className="animate-spin text-[#3D52A0] text-2xl" />
                                </div>
                            )}

                            {/* Submit - visible for manual trigger */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleVerifyPin}
                                disabled={loading || pin.some(d => d === '')}
                                className="w-full py-4 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] hover:from-[#7091E6] hover:to-[#3D52A0] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-xl shadow-[#3D52A0]/20 hover:shadow-lg mt-2 relative overflow-hidden group/btn"
                            >
                                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                                {loading ? <FaCircleNotch className="animate-spin text-xl" /> : 'Verify PIN'}
                            </motion.button>

                            {/* Forgot PIN */}
                            <button
                                onClick={() => {
                                    setMode('forgot');
                                    setError('');
                                    setIdentifier(email || '');
                                }}
                                className="w-full mt-5 text-sm text-[#3D52A0] dark:text-[#7091E6] hover:opacity-80 font-black transition-opacity text-center uppercase tracking-wider text-[11px]"
                            >
                                Forgot PIN?
                            </button>

                            {/* Back to login */}
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full mt-3 text-sm text-slate-500 dark:text-slate-400 hover:text-[#3D52A0] dark:hover:text-[#7091E6] font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <FaArrowLeft className="text-xs" /> Back to Login
                            </button>
                        </motion.div>
                    )}

                    {/* ============ FORGOT PIN ============ */}
                    {mode === 'forgot' && (
                        <motion.div
                            key="forgot"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-lg bg-white/60 dark:bg-white/5 backdrop-blur-3xl p-6 md:p-10 rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(61,82,160,0.15)]"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#8B5CF6] to-[#3D52A0] rounded-3xl flex items-center justify-center shadow-xl shadow-[#8B5CF6]/30">
                                    <FaShieldAlt className="text-white text-3xl" />
                                </div>
                            </div>

                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2 text-center tracking-tighter">
                                {otpSent ? 'Reset Your PIN' : 'Forgot PIN'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium text-center mb-8">
                                {otpSent
                                    ? 'Enter the OTP sent to your email/WhatsApp and set a new PIN.'
                                    : 'Enter your email or phone number to receive an OTP.'}
                            </p>

                            {!otpSent ? (
                                <>
                                    {/* Identifier Input */}
                                    <div className="space-y-2.5 group mb-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-[#8697C4] ml-1">
                                            Email or Phone Number
                                        </label>
                                        <div className="relative">
                                            <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors text-base" />
                                            <input
                                                type="text"
                                                value={identifier}
                                                onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                                                className="w-full pl-14 pr-5 py-4 bg-white/50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-bold text-gray-900 dark:text-white placeholder-slate-400 shadow-sm"
                                                placeholder="Enter email or phone number"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center font-bold mb-4">
                                            {error}
                                        </motion.p>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={handleForgotPinSendOTP}
                                        disabled={loading}
                                        className="w-full py-4 bg-gradient-to-r from-[#8B5CF6] to-[#3D52A0] hover:from-[#3D52A0] hover:to-[#8B5CF6] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-xl shadow-[#8B5CF6]/20 hover:shadow-lg relative overflow-hidden group/btn"
                                    >
                                        <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                                        {loading ? <FaCircleNotch className="animate-spin text-xl" /> : 'Send OTP'}
                                    </motion.button>
                                </>
                            ) : (
                                <>
                                    {/* OTP Input UI */}
                                    <div className="space-y-2.5 group mb-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-[#8697C4] ml-1 block mb-3">
                                            Enter Code
                                        </label>
                                        <div className="flex justify-center gap-3 sm:gap-4">
                                            {Array(6).fill('').map((_, index) => (
                                                <input
                                                    key={index}
                                                    id={`otp-${index}`}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={otp[index] || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        if (!val && otp[index] === '') return;
                                                        const newOtpArray = [...(otp || '      ').split('')];
                                                        newOtpArray[index] = val.slice(-1) || ' ';
                                                        const updatedOtp = newOtpArray.join('').replace(/\s+/g, '');
                                                        setOtp(updatedOtp);
                                                        setError('');

                                                        if (val && index < 5) {
                                                            document.getElementById(`otp-${index + 1}`)?.focus();
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Backspace' && !e.target.value && index > 0) {
                                                            document.getElementById(`otp-${index - 1}`)?.focus();
                                                        }
                                                    }}
                                                    className={`w-14 h-16 sm:w-16 sm:h-18 text-center text-2xl font-black bg-white/50 dark:bg-white/5 border-2 rounded-2xl transition-all duration-300 focus:outline-none
                                                        ${otp[index]
                                                            ? 'border-[#3D52A0] dark:border-[#7091E6] text-[#3D52A0] dark:text-[#7091E6] shadow-lg shadow-[#3D52A0]/10'
                                                            : 'border-slate-200 dark:border-white/10 text-gray-900 dark:text-white hover:border-[#3D52A0]/50'
                                                        } focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/10 outline-none`}
                                                    autoComplete="off"
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* New PIN */}
                                    <div className="mb-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-[#8697C4] ml-1 block mb-3">
                                            New 6-Digit PIN
                                        </label>
                                        {renderPinInputs(newPin, setNewPin, newPinRefs)}
                                    </div>

                                    {error && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center font-bold mb-4">
                                            {error}
                                        </motion.p>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={handleResetPin}
                                        disabled={loading}
                                        className="w-full py-4 bg-gradient-to-r from-[#8B5CF6] to-[#3D52A0] hover:from-[#3D52A0] hover:to-[#8B5CF6] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-xl shadow-[#8B5CF6]/20 hover:shadow-lg relative overflow-hidden group/btn"
                                    >
                                        <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                                        {loading ? <FaCircleNotch className="animate-spin text-xl" /> : 'Reset PIN'}
                                    </motion.button>
                                </>
                            )}

                            {/* Back */}
                            <button
                                onClick={() => {
                                    setMode('enter');
                                    setError('');
                                    setOtpSent(false);
                                    setIdentifier('');
                                    setOtp('');
                                    setNewPin(['', '', '', '', '', '']);
                                    setPin(['', '', '', '', '', '']);
                                }}
                                className="w-full mt-5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#3D52A0] dark:hover:text-[#7091E6] font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <FaArrowLeft className="text-xs" /> Back to PIN Entry
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PinPage;
