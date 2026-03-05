import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash, FaBook, FaArrowRight, FaRocket, FaHeart, FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/sweetalert';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });

    // Sync mode with route
    useEffect(() => {
        setIsRegisterMode(location.pathname === '/register');
    }, [location.pathname]);

    // Update route when mode changes
    const toggleMode = (registerMode) => {
        setIsRegisterMode(registerMode);
        navigate(registerMode ? '/register' : '/login', { replace: true });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(loginData.email, loginData.password);
            toast.success('Login successful!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(registerData);
            toast.success('Registration successful! Welcome aboard!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (role) => {
        const demoCredentials = {
            admin: { email: 'admin@ebook.com', password: 'Admin@123' },
            vendor: { email: 'vendor@example.com', password: 'Vendor@123' },
            reader: { email: 'reader@example.com', password: 'Reader@123' }
        };
        setLoginData(demoCredentials[role]);
    };

    return (
        <>
            <PublicNavbar />
            <div className="min-h-screen flex items-center justify-center p-4 pt-8 pb-8 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl animate-pulse-slow"
                        style={{ background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)' }}
                    ></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl animate-pulse-slow"
                        style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)', animationDelay: '1s' }}
                    ></div>
                </div>

                {/* Main Container */}
                <div className="w-full max-w-6xl relative">
                    <div className="relative glass-strong rounded-[3rem] shadow-premium overflow-hidden min-h-[600px]">
                        <div className="grid md:grid-cols-2 relative">
                            {/* Login Form Side */}
                            <div className={`p-8 md:p-12 transition-all duration-700 ${isRegisterMode ? 'hidden md:block md:order-2' : 'block md:order-1'
                                }`}>
                                <div className={`transition-all duration-700 ${isRegisterMode ? 'md:opacity-0 md:translate-x-10 md:pointer-events-none' : 'opacity-100 translate-x-0'
                                    }`}>
                                    {/* Login Header */}
                                    <div className="mb-8">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 shadow-2xl animate-glow"
                                            style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}>
                                            <FaBook className="text-2xl text-white" />
                                        </div>
                                        <h1 className="text-4xl font-display font-bold mb-2">
                                            <span className="gradient-text">Welcome</span>
                                            <span className="text-slate-900"> Back</span>
                                        </h1>
                                        <p className="text-slate-600 font-medium">Sign in to continue your reading journey</p>
                                    </div>

                                    {/* Login Form */}
                                    <form onSubmit={handleLogin} className="space-y-5">
                                        {/* Email Input */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                                                    <FaEnvelope className="text-base" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={loginData.email}
                                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 glass rounded-2xl border border-white/40 focus:ring-2 focus:ring-purple-500 text-slate-800 font-medium relative z-0"
                                                    placeholder="your@email.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Password Input */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                                                    <FaLock className="text-base" />
                                                </div>
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={loginData.password}
                                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                    className="w-full pl-12 pr-12 py-4 glass rounded-2xl border border-white/40 focus:ring-2 focus:ring-purple-500 text-slate-800 font-medium relative z-0"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-600 transition-colors z-10"
                                                >
                                                    {showPassword ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-4 rounded-2xl text-white font-bold shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                                            style={{ background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)' }}
                                        >
                                            {loading ? 'Signing In...' : 'Sign In'}
                                            <FaArrowRight />
                                        </button>
                                    </form>

                                    {/* Demo Credentials */}
                                    <div className="mt-6 pt-6 border-t border-purple-100">
                                        <p className="text-xs text-slate-600 mb-3 font-semibold text-center">Quick Demo Access:</p>
                                        <div className="flex gap-2">
                                            {['admin', 'vendor', 'reader'].map(role => (
                                                <button
                                                    key={role}
                                                    onClick={() => fillDemo(role)}
                                                    className="flex-1 py-2 px-3 glass rounded-xl text-xs font-bold text-slate-700 hover:bg-white/80 transition-all border border-white/40"
                                                >
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Register Form Side */}
                            <div className={`p-8 md:p-12 transition-all duration-700 ${isRegisterMode ? 'block md:order-1' : 'hidden md:block md:order-2'
                                }`}>
                                <div className={`transition-all duration-700 ${isRegisterMode ? 'opacity-100 translate-x-0' : 'md:opacity-0 md:-translate-x-10 md:pointer-events-none'
                                    }`}>
                                    {/* Register Header */}
                                    <div className="mb-8">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 shadow-2xl animate-glow"
                                            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #ef4444 100%)' }}>
                                            <FaBook className="text-2xl text-white" />
                                        </div>
                                        <h1 className="text-4xl font-display font-bold mb-2">
                                            <span className="gradient-text">Join</span>
                                            <span className="text-slate-900"> Charotar</span>
                                        </h1>
                                        <p className="text-slate-600 font-medium">Start your reading adventure today</p>
                                    </div>

                                    {/* Register Form */}
                                    <form onSubmit={handleRegister} className="space-y-4">
                                        {/* Name Input */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                                                    <FaUser className="text-base" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={registerData.name}
                                                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 glass rounded-2xl border border-white/40 focus:ring-2 focus:ring-pink-500 text-slate-800 font-medium relative z-0"
                                                    placeholder="John Doe"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Email Input */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                                                    <FaEnvelope className="text-base" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={registerData.email}
                                                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 glass rounded-2xl border border-white/40 focus:ring-2 focus:ring-pink-500 text-slate-800 font-medium relative z-0"
                                                    placeholder="your@email.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Password Input */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                                                    <FaLock className="text-base" />
                                                </div>
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={registerData.password}
                                                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                                    className="w-full pl-12 pr-12 py-3 glass rounded-2xl border border-white/40 focus:ring-2 focus:ring-pink-500 text-slate-800 font-medium relative z-0"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-600 transition-colors z-10"
                                                >
                                                    {showPassword ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Phone Input */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                                                    <FaPhone className="text-base" />
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={registerData.phone}
                                                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 glass rounded-2xl border border-white/40 focus:ring-2 focus:ring-pink-500 text-slate-800 font-medium relative z-0"
                                                    placeholder="+91 98765 43210"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-4 rounded-2xl text-white font-bold shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg mt-6"
                                            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #ef4444 100%)' }}
                                        >
                                            {loading ? 'Creating Account...' : 'Create Account'}
                                            <FaArrowRight />
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Sliding Overlay Panel */}
                            <div className={`absolute inset-y-0 w-full md:w-1/2 transition-all duration-700 ease-in-out ${isRegisterMode ? 'md:left-0' : 'md:left-1/2'
                                } hidden md:block`}
                                style={{
                                    background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #ef4444 100%)',
                                    zIndex: 10
                                }}
                            >
                                <div className="h-full flex items-center justify-center p-12 text-white relative overflow-hidden">
                                    {/* Decorative Elements */}
                                    <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                                    <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>

                                    {/* Content for Register Mode - Show when in register mode */}
                                    <div className={`text-center relative z-10 transition-all duration-700 ${isRegisterMode ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                                        } ${!isRegisterMode && 'absolute'}`}>
                                        {/* Illustration */}
                                        <div className="mb-6 flex justify-center">
                                            <img
                                                src="/images/auth/reading.png"
                                                alt="Reading illustration"
                                                className="w-48 h-48 object-contain drop-shadow-2xl animate-float"
                                            />
                                        </div>
                                        <h2 className="text-4xl font-display font-bold mb-4">Already a Member?</h2>
                                        <p className="text-white/90 mb-6 text-lg leading-relaxed">
                                            Sign in to access your personal library and continue your reading journey!
                                        </p>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="glass-strong p-4 rounded-2xl backdrop-blur-sm">
                                                <div className="text-3xl font-bold">10K+</div>
                                                <div className="text-sm text-white/80">Books</div>
                                            </div>
                                            <div className="glass-strong p-4 rounded-2xl backdrop-blur-sm">
                                                <div className="text-3xl font-bold">5K+</div>
                                                <div className="text-sm text-white/80">Readers</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggleMode(false)}
                                            className="px-8 py-4 rounded-2xl bg-white text-purple-600 font-bold shadow-2xl hover:scale-105 transition-all"
                                        >
                                            Sign In Now
                                        </button>
                                    </div>

                                    {/* Content for Login Mode - Show when NOT in register mode */}
                                    <div className={`text-center relative z-10 transition-all duration-700 ${!isRegisterMode ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
                                        } ${isRegisterMode && 'absolute'}`}>
                                        {/* Illustration */}
                                        <div className="mb-6 flex justify-center">
                                            <img
                                                src="/images/auth/books.png"
                                                alt="Books collection"
                                                className="w-48 h-48 object-contain drop-shadow-2xl animate-float"
                                            />
                                        </div>
                                        <h2 className="text-4xl font-display font-bold mb-4">Join Charotar!</h2>
                                        <p className="text-white/90 mb-6 text-lg leading-relaxed">
                                            Discover thousands of books and join our community of passionate readers!
                                        </p>

                                        {/* Features */}
                                        <div className="space-y-3 mb-8 text-left">
                                            <div className="flex items-center gap-3 glass-strong p-3 rounded-xl backdrop-blur-sm">
                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                                    <FaBook className="text-sm" />
                                                </div>
                                                <span className="text-sm font-medium">Access 10,000+ eBooks</span>
                                            </div>
                                            <div className="flex items-center gap-3 glass-strong p-3 rounded-xl backdrop-blur-sm">
                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                                    <FaHeart className="text-sm" />
                                                </div>
                                                <span className="text-sm font-medium">Personalized recommendations</span>
                                            </div>
                                            <div className="flex items-center gap-3 glass-strong p-3 rounded-xl backdrop-blur-sm">
                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                                    <FaStar className="text-sm" />
                                                </div>
                                                <span className="text-sm font-medium">Premium reading experience</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggleMode(true)}
                                            className="px-8 py-4 rounded-2xl bg-white text-pink-600 font-bold shadow-2xl hover:scale-105 transition-all"
                                        >
                                            Create Free Account
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Toggle Buttons */}
                            <div className="md:hidden col-span-full p-6 border-t border-white/20">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => toggleMode(false)}
                                        className={`flex-1 py-3 rounded-2xl font-bold transition-all ${!isRegisterMode
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                            : 'glass text-slate-700'
                                            }`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => toggleMode(true)}
                                        className={`flex-1 py-3 rounded-2xl font-bold transition-all ${isRegisterMode
                                            ? 'bg-gradient-to-r from-pink-600 to-red-600 text-white shadow-lg'
                                            : 'glass text-slate-700'
                                            }`}
                                    >
                                        Register
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AuthPage;
