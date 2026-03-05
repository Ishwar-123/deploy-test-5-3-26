import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation, NavLink } from 'react-router-dom';
import {
    FaBook, FaUserCircle, FaSignOutAlt, FaSun, FaMoon,
    FaBars, FaTimes, FaCompass, FaLayerGroup, FaCrown, FaChevronDown, FaShoppingCart
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const PublicNavbar = () => {
    const { darkMode, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdmin = user?.role === 'admin';
    const isVendor = user?.role === 'vendor';
    const isReader = user?.role === 'reader' || !user?.role; // Default to reader if role missing for some reason

    const navLinks = user ? (
        isAdmin ? [
            { path: '/admin/dashboard', label: 'Admin Panel', icon: FaLayerGroup },
            { path: '/', label: 'Browse Site', icon: FaCompass },
        ] : isVendor ? [
            { path: '/vendor/dashboard', label: 'Vendor Panel', icon: FaLayerGroup },
            { path: '/', label: 'Browse Site', icon: FaCompass },
        ] : [
            { path: '/', label: 'Discover', icon: FaCompass },
            { path: '/reader/library', label: 'My Library', icon: FaLayerGroup },
            { path: '/reader/subscription', label: 'Premium', icon: FaCrown },
        ]
    ) : [];

    return (
        <>
            <header className={`relative w-full z-50 transition-all duration-300 ${isScrolled
                ? 'bg-[#EDE8F5]/10 dark:bg-slate-900/10 backdrop-blur-[12px] shadow-sm border-b border-[#8697C4]/30 dark:border-[#3D52A0]/30'
                : 'bg-[#EDE8F5]/10 dark:bg-slate-900/10 backdrop-blur-[12px] border-b border-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">

                        {/* Left: Brand */}
                        <Link to="/" className="flex items-center">
                            <img src="/logo.png" alt="Charotar Publishing House" className="h-10 md:h-12 w-auto object-contain" />
                        </Link>

                        {/* Middle: Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map((link) => {
                                const isActive = location.pathname === link.path;
                                return (
                                    <NavLink
                                        key={link.path}
                                        to={link.path}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isActive
                                            ? 'text-[#3D52A0] dark:text-[#7091E6]'
                                            : 'text-[#3D52A0] dark:text-[#EDE8F5] hover:text-[#8B5CF6] dark:hover:text-white'
                                            }`}
                                    >
                                        <link.icon className={`text-lg transition-transform group-hover:scale-110 ${isActive ? 'text-[#3D52A0]' : ''}`} />
                                        <span>{link.label}</span>
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2 md:gap-4">

                            {user ? (
                                <>
                                    {/* Reader specific features */}
                                    {isReader && (
                                        <>
                                            {/* Cart */}
                                            <Link
                                                to="/reader/cart"
                                                className="p-2.5 text-[#3D52A0] dark:text-[#EDE8F5] hover:text-[#8B5CF6] rounded-xl transition-all relative group"
                                                title="Cart"
                                            >
                                                <FaShoppingCart className="text-xl group-hover:scale-110 transition-transform" />
                                                {cartItems?.length > 0 && (
                                                    <span className="absolute top-2 right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full text-[10px] font-bold text-white shadow-sm">
                                                        {cartItems.length}
                                                    </span>
                                                )}
                                            </Link>
                                        </>
                                    )}

                                    {/* Theme Toggle */}
                                    <button
                                        onClick={toggleTheme}
                                        className="p-2.5 text-[#3D52A0] dark:text-[#EDE8F5] hover:text-[#8B5CF6] rounded-xl transition-all group"
                                        title={darkMode ? 'Light Mode' : 'Dark Mode'}
                                    >
                                        {darkMode ? (
                                            <FaSun className="text-xl text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
                                        ) : (
                                            <FaMoon className="text-xl group-hover:-rotate-12 transition-transform duration-500" />
                                        )}
                                    </button>

                                    {/* Profile Dropdown */}
                                    <div className="relative ml-2" ref={dropdownRef}>
                                        <button
                                            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                            className="flex items-center gap-2 p-1 pl-3 pr-2 bg-gray-50 dark:bg-[#1a1a2e] hover:bg-gray-100 dark:hover:bg-[#3D52A0]/20 rounded-full border border-gray-100 dark:border-[#3D52A0]/30 transition-all group text-[#3D52A0] dark:text-[#EDE8F5]"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#7091E6] flex items-center justify-center text-sm font-bold text-white shadow-md group-hover:shadow-lg transition-all">
                                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <span className="hidden md:block text-sm font-bold">
                                                {user?.name}
                                            </span>
                                            <FaChevronDown className={`hidden md:block text-[10px] text-[#3D52A0] dark:text-[#EDE8F5] transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {profileDropdownOpen && (
                                            <div className="absolute right-0 mt-3 w-64 bg-[#EDE8F5] dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-3 z-50 animate-slide-in-right">
                                                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 mb-2">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setProfileDropdownOpen(false);
                                                        if (isAdmin) navigate('/admin/dashboard');
                                                        else if (isVendor) navigate('/vendor/dashboard');
                                                        else navigate('/reader/profile');
                                                    }}
                                                    className="w-full text-left px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a2e] flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-[#ADBBDA]/30 dark:bg-[#3D52A0]/20 text-[#3D52A0] dark:text-[#7091E6] flex items-center justify-center">
                                                        <FaUserCircle />
                                                    </div>
                                                    {isAdmin ? 'Admin Dashboard' : isVendor ? 'Vendor Dashboard' : 'My Profile'}
                                                </button>
                                                <div className="px-3 mt-2">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full px-4 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl text-sm font-bold flex items-center gap-3 transition-all"
                                                    >
                                                        <FaSignOutAlt /> Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 md:gap-4 ml-2">
                                    <Link
                                        to="/login"
                                        className="hidden lg:block px-5 py-2.5 text-[#3D52A0] dark:text-[#EDE8F5] font-bold hover:text-[#8B5CF6] transition-colors text-sm"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="hidden lg:block px-6 py-3 bg-[#7091E6] hover:bg-[#3D52A0] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#7091E6]/20 hover:shadow-[#7091E6]/40 hover:scale-105 transition-all active:scale-95"
                                    >
                                        Join Now
                                    </Link>

                                    {/* Theme Toggle for Guests */}
                                    <button
                                        onClick={toggleTheme}
                                        className="p-2.5 text-[#3D52A0] dark:text-[#EDE8F5] hover:text-[#8B5CF6] rounded-xl transition-all"
                                    >
                                        {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                                    </button>
                                </div>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden w-11 h-11 rounded-xl bg-[#EDE8F5]/50 dark:bg-[#1a1a2e]/50 flex items-center justify-center text-[#3D52A0] dark:text-[#EDE8F5] hover:text-[#8B5CF6] transition-colors border border-[#8697C4]/30 dark:border-[#3D52A0]/30"
                            >
                                <FaBars />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay - Portal */}
            {createPortal(
                <div className={`fixed inset-0 z-[10000] lg:hidden bg-[#EDE8F5]/80 dark:bg-[#020617]/80 backdrop-blur-xl transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                    <div className="flex flex-col h-full relative">
                        {/* Header with Close Button */}
                        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6">
                            <div className="flex items-center">
                                <img src="/logo.png" alt="Charotar Publishing House" className="h-10 w-auto object-contain" />
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-12 h-12 rounded-full flex items-center justify-center text-[#3D52A0] dark:text-[#EDE8F5] hover:text-[#8B5CF6] transition-all"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>

                        {/* Centered Content */}
                        <nav className="flex-1 flex flex-col items-center justify-center space-y-8 p-6">
                            {user && navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-4 text-2xl font-bold transition-all ${location.pathname === link.path
                                        ? 'text-[#3D52A0]'
                                        : 'text-gray-900 dark:text-white hover:text-[#8B5CF6]'
                                        }`}
                                >
                                    <link.icon className="text-3xl opacity-50" />
                                    {link.label}
                                </Link>
                            ))}

                            {!user && (
                                <div className="flex flex-col items-center gap-6 w-full max-w-xs animate-fade-in-up">
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full py-4 text-center text-gray-900 dark:text-white font-bold text-lg border-2 border-gray-100 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full py-4 text-center bg-[#7091E6] text-white font-bold text-lg rounded-2xl shadow-xl shadow-[#7091E6]/30 hover:bg-[#3D52A0] hover:scale-105 transition-all"
                                    >
                                        Join Now
                                    </Link>
                                </div>
                            )}

                            {user && (
                                <button
                                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 text-red-500 font-bold text-xl mt-8 hover:bg-red-50 dark:hover:bg-red-900/10 px-6 py-3 rounded-2xl transition-all"
                                >
                                    <FaSignOutAlt /> Sign Out
                                </button>
                            )}
                        </nav>

                        {/* Footer / Copyright */}
                        <div className="p-6 text-center text-gray-400 text-sm">
                            &copy; {new Date().getFullYear()} Charotar Publishing. All rights reserved.
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default PublicNavbar;
