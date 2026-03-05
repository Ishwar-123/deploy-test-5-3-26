import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaArrowRight, FaCircleNotch, FaBookOpen, FaBook } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/sweetalert';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword(email);
            // Navigate to OTP verification page with forgot-password context
            navigate('/verify-otp', {
                state: {
                    identifier: email,
                    context: 'forgot-password',
                    channel: 'email'
                }
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error(error.message || 'Failed to send reset OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white dark:bg-[#1a1a2e] font-sans selection:bg-[#3D52A0] selection:text-white">
            {/* LEFT SIDE - IMAGERY (55%) */}
            <div className="hidden lg:flex w-[55%] relative bg-[#020617] overflow-hidden group">
                <div className="absolute top-10 left-10 z-30">
                    <Link to="/">
                        <img
                            src="/logo.png"
                            alt="Charotar Publishing House"
                            className="h-14 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                        />
                    </Link>
                </div>

                <div className="absolute inset-0 bg-[#3D52A0]/40 z-10 transition-opacity duration-1000 group-hover:opacity-40" />

                <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2273&auto=format&fit=crop"
                        alt="Security"
                        className="w-full h-full object-cover opacity-90 transition-transform duration-[20s] ease-linear scale-100 group-hover:scale-110"
                    />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent to-transparent z-10" />

                <div className="relative z-20 flex flex-col justify-end p-20 w-full h-full">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#3D52A0] to-[#7091E6] rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-[#3D52A0]/30 transform transition-transform duration-500 group-hover:-translate-y-2">
                        <FaBookOpen className="text-white text-2xl" />
                    </div>
                    <h2 className="text-6xl font-serif text-white mb-6 leading-[1.1] tracking-tight">
                        Security first. <br /> Reset your access.
                    </h2>
                    <p className="text-[#EDE8F5]/80 font-light text-lg max-w-md leading-relaxed border-l-2 border-[#7091E6] pl-6">
                        Lost your password? No worries. We'll help you verify your identity and get back to your bookshelf.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE - FORM (45%) */}
            <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 bg-white dark:bg-[#0f172a] relative">
                <div className="absolute top-8 left-8 lg:hidden">
                    <Link to="/">
                        <img
                            src="/logo.png"
                            alt="Charotar Publishing House"
                            className="h-10 w-auto object-contain brightness-0 dark:brightness-100"
                        />
                    </Link>
                </div>

                <div className="w-full max-w-md mt-16 lg:mt-0 text-center lg:text-left">
                    <div className="animate-fade-in space-y-8">
                        <div>
                            <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mb-3 tracking-tight">Forgot Password?</h1>
                            <p className="text-gray-500 dark:text-[#8697C4] text-base">Enter your email address and we'll send you an OTP to reset your password.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 group text-left">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#8697C4] transition-colors group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6]">Email Address</label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-[#16213e] border border-gray-200 dark:border-[#3D52A0]/20 rounded-xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-1 focus:ring-[#3D52A0] dark:focus:ring-[#7091E6] outline-none transition-all text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#3D52A0] hover:bg-[#7091E6] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-[#3D52A0]/20 hover:shadow-none translate-y-0 hover:translate-y-0.5"
                            >
                                {loading ? <FaCircleNotch className="animate-spin text-lg" /> : 'Send Reset OTP'} {!loading && <FaArrowRight />}
                            </button>
                        </form>

                        <div className="pt-8 text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#3D52A0] dark:hover:text-[#7091E6] transition-colors"
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

export default ForgotPasswordPage;
