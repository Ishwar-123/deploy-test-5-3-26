import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaArrowRight, FaCircleNotch, FaUser, FaEnvelope, FaMobile, FaLock, FaBook, FaBookOpen } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/sweetalert';
import { motion } from 'framer-motion';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, logout, user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Force logout if user navigates back to registration while session is active
    useEffect(() => {
        if (user && !isLoggingOut) {
            console.log('🔄 User navigating back to registration while authenticated. Expiring session...');
            setIsLoggingOut(true);
            logout();
        }
    }, [user, logout, isLoggingOut]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const userData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            };
            await register(userData);

            // Navigate to dual OTP verification page
            navigate('/verify-otp', {
                state: {
                    identifier: formData.email,
                    phone: formData.phone,
                    context: 'register',
                    channel: 'dual'
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
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
            {/* BACKGROUND DECORATIONS (Right Side) */}
            <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-[#3D52A0]/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-5%] right-[5%] w-[25%] h-[25%] bg-[#8B5CF6]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] bg-[#7091E6]/5 blur-[80px] rounded-full pointer-events-none opacity-50" />

            {/* LEFT SIDE - IMAGERY (55%) */}
            <div className="hidden lg:flex w-[55%] relative bg-[#020617] overflow-hidden group">
                {/* Mesh Gradient Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#020617] via-transparent to-[#020617] opacity-60" />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(61,82,160,0.15)_0%,transparent_50%)]" />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.1)_0%,transparent_50%)]" />

                {/* LOGO (Desktop) */}
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

                {/* Main Content Illustration/Image */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.7 }}
                        transition={{ duration: 1.5 }}
                        src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1974&auto=format&fit=crop"
                        alt="Reading"
                        className="w-full h-full object-cover transition-transform duration-[30s] ease-linear hover:scale-110"
                    />
                </div>

                {/* Bottom Text Overlay */}
                <div className="relative z-20 flex flex-col justify-end p-16 w-full h-full">
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                    >
                        <div className="w-16 h-16 bg-gradient-to-br from-[#3D52A0] to-[#7091E6] rounded-2xl flex items-center justify-center mb-8 shadow-3xl shadow-[#3D52A0]/40 transform hover:-translate-y-2 transition-transform duration-500">
                            <FaBookOpen className="text-white text-3xl" />
                        </div>
                        <h2 className="text-5xl font-serif text-white mb-6 leading-[1.05] tracking-tight max-w-xl">
                            Start your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7091E6] to-[#ADBBDA]">Endless</span> Journey.
                        </h2>
                        <p className="text-[#ADBBDA] font-medium text-lg max-w-lg leading-relaxed border-l-[3px] border-[#7091E6] pl-8 py-2">
                            "The more that you read, the more things you will know. The more that you learn, the more places you'll go."
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* RIGHT SIDE - FORM (45%) */}
            <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-4 md:p-8 relative z-20 h-full overflow-y-auto no-scrollbar">
                {/* Mobile Header */}
                <div className="absolute top-6 left-8 lg:hidden">
                    <Link to="/">
                        <img src="/logo.png" alt="Charotar Publishing House" className="h-10 w-auto object-contain" />
                    </Link>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-lg bg-white/60 dark:bg-white/5 backdrop-blur-3xl p-5 md:p-8 rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(61,82,160,0.15)] flex flex-col"
                >
                    <motion.div variants={itemVariants} className="mb-4">
                        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-0.5 tracking-tighter">Create Account</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Please enter your details to sign up.</p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-2">
                        <motion.div variants={itemVariants} className="space-y-1.5 group">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-[#8697C4] transition-colors group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] ml-1">Full Name</label>
                            <div className="relative">
                                <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors text-base" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-14 pr-5 py-3.5 bg-white/50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-bold text-gray-900 dark:text-white placeholder-slate-400 shadow-sm"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-1.5 group">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-[#8697C4] transition-colors group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] ml-1">Email Address</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors text-base" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-14 pr-5 py-3.5 bg-white/50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-bold text-gray-900 dark:text-white placeholder-slate-400 shadow-sm"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-1.5 group">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-[#8697C4] transition-colors group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] ml-1">Mobile Number</label>
                            <div className="relative">
                                <FaMobile className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors text-base" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-14 pr-5 py-3.5 bg-white/50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-bold text-gray-900 dark:text-white placeholder-slate-400 shadow-sm"
                                    placeholder="+1 234 567 890"
                                    required
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-1.5 group">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-[#8697C4] transition-colors group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] ml-1">Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors text-base" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-14 pr-12 py-3.5 bg-white/50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-bold text-gray-900 dark:text-white placeholder-slate-400 shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3D52A0] transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-1.5 group">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-[#8697C4] transition-colors group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] ml-1">Confirm Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors text-base" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full pl-14 pr-12 py-3.5 bg-white/50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-bold text-gray-900 dark:text-white placeholder-slate-400 shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3D52A0] transition-colors"
                                >
                                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] hover:from-[#7091E6] hover:to-[#3D52A0] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-xl shadow-[#3D52A0]/20 hover:shadow-lg mt-3 relative overflow-hidden group/btn"
                        >
                            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                            {loading ? <FaCircleNotch className="animate-spin text-xl" /> : 'Create Account'}
                            {!loading && <FaArrowRight className="group-hover:translate-x-1 transition-transform" />}
                        </motion.button>
                    </form>

                    <motion.p variants={itemVariants} className="mt-4 text-center text-[11px] text-slate-600 font-bold tracking-tight">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#3D52A0] dark:text-[#7091E6] font-black hover:underline underline-offset-4 decoration-2">Log In</Link>
                    </motion.p>
                </motion.div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default RegisterPage;
