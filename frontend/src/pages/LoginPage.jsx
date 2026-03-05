import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaCircleNotch, FaBookOpen, FaBook } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/sweetalert';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '', phone: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Redirect logic
    useEffect(() => {
        if (user && !loading) {
            if (user.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else if (user.role === 'vendor') {
                navigate('/vendor/dashboard', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [user, loading, navigate]);

    const [showSessionDialog, setShowSessionDialog] = useState(false);
    const [activeSessionDetails, setActiveSessionDetails] = useState(null);

    const formatUserAgent = (ua) => {
        if (!ua) return 'Unknown Device';
        if (ua.includes('iPhone')) return 'iPhone';
        if (ua.includes('Android')) return 'Android Device';
        if (ua.includes('Windows')) return 'Windows PC';
        if (ua.includes('Macintosh')) return 'MacBook';
        return 'Web Browser';
    };

    const handlePasswordSubmit = async (e, force = false) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const loginData = force ? { ...formData, forceLogout: true } : formData;
            const response = await login(loginData);

            if (response.pinRequired) {
                navigate('/pin', {
                    state: {
                        email: formData.email,
                        hasPinSet: response.data?.hasPinSet,
                        name: response.data?.name
                    }
                });
            }
            setShowSessionDialog(false);
        } catch (error) {
            console.error('Login error:', error);
            if (error.code === 'SESSION_ACTIVE') {
                setActiveSessionDetails(error.sessionDetails);
                setShowSessionDialog(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForceLogout = () => {
        handlePasswordSubmit(null, true);
    };

    const fillDemo = (role) => {
        const demoCredentials = {
            admin: { email: 'admin@example.com', password: 'password123', phone: '9999999999' },
            vendor: { email: 'vendor@example.com', password: 'password123', phone: '1122334455' },
            reader: { email: 'user@example.com', password: 'password123', phone: '9988776655' }
        };
        setFormData(demoCredentials[role]);
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0f172a] font-sans selection:bg-[#3D52A0] selection:text-white relative overflow-hidden">
            {/* BACKGROUND DECORATIONS (Right Side) */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#3D52A0]/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[30%] bg-[#8B5CF6]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute top-[20%] right-[30%] w-[20%] h-[20%] bg-[#7091E6]/5 blur-[80px] rounded-full pointer-events-none" />

            {/* LEFT SIDE - IMAGERY (55%) */}
            <div className="hidden lg:flex w-[55%] relative bg-[#020617] overflow-hidden group">
                {/* Mesh Gradient Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#020617] via-transparent to-[#020617] opacity-60" />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(61,82,160,0.15)_0%,transparent_50%)]" />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.1)_0%,transparent_50%)]" />

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
                        src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2256&auto=format&fit=crop"
                        alt="Library"
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
                            Unlock the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7091E6] to-[#ADBBDA]">Infinite</span> Library.
                        </h2>
                        <p className="text-[#ADBBDA] font-medium text-lg max-w-lg leading-relaxed border-l-[3px] border-[#7091E6] pl-8 py-2">
                            Join 50,000+ passionate readers and access the world's most premium collection of digital literature.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* RIGHT SIDE - FORM (45%) */}
            <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-4 md:p-8 relative z-20 h-full">
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
                    className="w-full max-w-lg bg-white/60 dark:bg-white/5 backdrop-blur-3xl p-6 md:p-10 rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(61,82,160,0.15)] flex flex-col"
                >
                    <motion.div variants={itemVariants} className="mb-5">
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-1 tracking-tighter">Welcome back</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Please enter your credentials to sign in.</p>
                    </motion.div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <motion.div variants={itemVariants} className="space-y-2.5 group">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-[#8697C4] transition-colors group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] ml-1">Email Address</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors text-base" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-14 pr-5 py-4 bg-white/50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-bold text-gray-900 dark:text-white placeholder-slate-400 shadow-sm"
                                    placeholder="name@example.com"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2.5 group">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 group-focus-within:text-[#3D52A0]">Password</label>
                                <Link to="/forgot-password" size="sm" className="text-[11px] font-black text-[#3D52A0] dark:text-[#7091E6] hover:opacity-80 transition-opacity uppercase tracking-wider">Forgot Password?</Link>
                            </div>
                            <div className="relative">
                                <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3D52A0] dark:group-focus-within:text-[#7091E6] transition-colors text-base" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-14 pr-14 py-4 bg-white/50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-[#3D52A0] dark:focus:border-[#7091E6] focus:ring-4 focus:ring-[#3D52A0]/5 outline-none transition-all text-sm font-bold text-gray-900 dark:text-white placeholder-slate-400 shadow-sm"
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

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] hover:from-[#7091E6] hover:to-[#3D52A0] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-xl shadow-[#3D52A0]/20 hover:shadow-lg mt-4 relative overflow-hidden group/btn"
                        >
                            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                            {loading ? <FaCircleNotch className="animate-spin text-xl" /> : 'Sign In Now'}
                            {!loading && <FaArrowRight className="group-hover:translate-x-1 transition-transform" />}
                        </motion.button>
                    </form>



                    <motion.p variants={itemVariants} className="mt-6 text-center text-[12px] text-slate-600 font-bold tracking-tight">
                        New to the library?{' '}
                        <Link to="/register" className="text-[#3D52A0] dark:text-[#7091E6] font-black hover:underline underline-offset-4 decoration-2">Create Account</Link>
                    </motion.p>
                </motion.div>
            </div>

            {/* SESSION CONFLICT DIALOG */}
            <AnimatePresence>
                {showSessionDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-3xl p-10 border border-white/10 shadow-3xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#8B5CF6]"></div>

                            <div className="w-16 h-16 bg-[#EDE8F5] dark:bg-[#3D52A0]/30 rounded-2xl flex items-center justify-center mb-8">
                                <FaLock className="text-[#3D52A0] dark:text-[#7091E6] text-2xl" />
                            </div>

                            <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                                Account Active Elsewhere
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-8 font-medium">
                                To protect your security, only one session is allowed at a time. Your current account is active on another device.
                            </p>

                            {(activeSessionDetails?.lastUserAgent || activeSessionDetails?.lastLoginIp) && (
                                <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-6 mb-10 border border-slate-100 dark:border-white/5 space-y-5">
                                    {activeSessionDetails?.lastUserAgent && (
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-black uppercase tracking-widest">Device</span>
                                            <span className="text-slate-900 dark:text-white font-black">{formatUserAgent(activeSessionDetails.lastUserAgent)}</span>
                                        </div>
                                    )}
                                    {activeSessionDetails?.lastLoginIp && (
                                        <div className="flex justify-between items-center text-xs font-medium">
                                            <span className="text-slate-400 font-bold uppercase tracking-widest">Network IP</span>
                                            <span className="text-slate-900 dark:text-slate-300 font-mono bg-white dark:bg-white/5 px-2 py-0.5 rounded">{activeSessionDetails.lastLoginIp}</span>
                                        </div>
                                    )}
                                    {activeSessionDetails?.lastActiveAt && (
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-black uppercase tracking-widest">Last Activity</span>
                                            <span className="text-slate-900 dark:text-slate-300 font-black">
                                                {new Date(activeSessionDetails.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleForceLogout}
                                    className="flex-1 py-4 bg-[#3D52A0] hover:bg-[#7091E6] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#3D52A0]/30"
                                >
                                    End Other Session
                                </button>
                                <button
                                    onClick={() => setShowSessionDialog(false)}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all text-center"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoginPage;
