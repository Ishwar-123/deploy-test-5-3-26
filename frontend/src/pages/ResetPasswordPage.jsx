import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaCheckCircle, FaCircleNotch, FaBookOpen, FaBook } from 'react-icons/fa';
import toast from '../utils/sweetalert';
import { useAuth } from '../context/AuthContext';

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { resetPassword } = useAuth();

    // Get context from navigation state
    const { identifier, otp } = location.state || {};

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if no identifier or otp provided
    useEffect(() => {
        if (!identifier || !otp) {
            toast.error("Invalid access. Please initiate password reset first.");
            navigate('/forgot-password');
        }
    }, [identifier, otp, navigate]);

    const handleReset = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        if (newPassword.length < 6) {
            toast.warning("Password must be at least 6 characters long");
            return;
        }

        setIsSubmitting(true);
        try {
            await resetPassword(identifier, otp, newPassword);
            navigate('/login');
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error(error.message || 'Failed to reset password');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white dark:bg-[#050505] font-sans selection:bg-[#ff4d30] selection:text-white">
            {/* LEFT SIDE - IMAGERY (55%) */}
            <div className="hidden lg:flex w-[55%] relative bg-black overflow-hidden group">
                <div className="absolute top-8 left-8 z-30">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg transition-transform duration-500 group-hover:rotate-12">
                            <FaBook className="text-[#ff4d30] text-lg" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">
                            Book<span className="text-[#ff4d30]">Verse</span>
                        </span>
                    </Link>
                </div>

                <div className="absolute inset-0 bg-black/50 z-10 transition-opacity duration-1000 group-hover:opacity-40" />

                <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1633265485768-306fbda9810f?q=80&w=2670&auto=format&fit=crop"
                        alt="Reset Password"
                        className="w-full h-full object-cover opacity-90 transition-transform duration-[20s] ease-linear scale-100 group-hover:scale-110"
                    />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />

                <div className="relative z-20 flex flex-col justify-end p-20 w-full h-full">
                    <div className="w-14 h-14 bg-[#ff4d30] rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-[#ff4d30]/30 transform transition-transform duration-500 group-hover:-translate-y-2">
                        <FaCheckCircle className="text-white text-2xl" />
                    </div>
                    <h2 className="text-6xl font-serif text-white mb-6 leading-[1.1] tracking-tight">
                        Renew your <br /> credentials.
                    </h2>
                    <p className="text-gray-300 font-light text-lg max-w-md leading-relaxed border-l-2 border-[#ff4d30] pl-6">
                        Verification successful. Now choose a strong new password to protect your account.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE - FORM (45%) */}
            <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 bg-white dark:bg-[#050505] relative">
                <div className="absolute top-8 left-8 lg:hidden">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-[#ff4d30] rounded-xl flex items-center justify-center shadow-lg">
                            <FaBook className="text-white text-lg" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            Book<span className="text-[#ff4d30]">Verse</span>
                        </span>
                    </Link>
                </div>

                <div className="w-full max-w-md mt-16 lg:mt-0">
                    <div className="animate-fade-in space-y-8">
                        <div>
                            <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mb-3 tracking-tight">Create New Password</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-base">Your identity has been verified. Enter a new password for your account.</p>
                        </div>

                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 transition-colors group-focus-within:text-[#ff4d30]">New Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ff4d30] transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#ff4d30] dark:focus:border-[#ff4d30] focus:ring-1 focus:ring-[#ff4d30] outline-none transition-all text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff4d30] transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 transition-colors group-focus-within:text-[#ff4d30]">Confirm Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ff4d30] transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-800 rounded-xl focus:border-[#ff4d30] dark:focus:border-[#ff4d30] focus:ring-1 focus:ring-[#ff4d30] outline-none transition-all text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#ff4d30] dark:hover:bg-[#ff4d30] dark:hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-black/20 hover:shadow-none translate-y-0 hover:translate-y-0.5"
                            >
                                {isSubmitting ? <FaCircleNotch className="animate-spin text-lg" /> : 'Reset Password'} {!isSubmitting && <FaCheckCircle />}
                            </button>
                        </form>

                        <div className="pt-8 text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#ff4d30] transition-colors"
                            >
                                <FaArrowLeft />
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default ResetPasswordPage;
