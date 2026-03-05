import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FaSearch, FaShoppingCart, FaUser, FaBars, FaTimes,
    FaMoon, FaSun, FaUserCircle, FaBook, FaSignOutAlt, FaChevronDown
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import bookService from '../services/bookService';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { cartItems } = useCart();
    const { darkMode, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef(null);
    const profileRef = useRef(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Close search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearch(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch search results
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim()) {
                setIsSearching(true);
                try {
                    const res = await bookService.searchBooks(searchQuery);
                    const books = res?.data?.data?.books || res?.data?.books || [];
                    setSearchResults(books);
                } catch (error) {
                    console.error("Search error", error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Helper to determine if a link is active
    const isActive = (path) => location.pathname === path;

    // Navigation Links Configuration
    const guestLinks = [
        { name: 'Home', path: '/' },
        { name: 'My Library', path: '/reader/library' },
        { name: 'My Orders', path: '/reader/orders' },
        { name: 'Subscription', path: '/reader/subscription' },
        { name: 'About Us', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    const readerLinks = [
        { name: 'Home', path: '/' },
        { name: 'My Library', path: '/reader/library' },
        { name: 'My Orders', path: '/reader/orders' },
        { name: 'Subscription', path: '/reader/subscription' },
        { name: 'About Us', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    const links = user ? readerLinks : guestLinks;

    const handleLinkClick = (link) => {
        setMobileMenuOpen(false);
        if (link.isAnchor) {
            // Handle anchor navigation
            if (location.pathname !== '/') {
                navigate('/');
                setTimeout(() => {
                    const id = link.path.split('#')[1];
                    const element = document.getElementById(id);
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                const id = link.path.split('#')[1];
                const element = document.getElementById(id);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <nav className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-md relative z-50 transition-colors duration-300 border-b border-[#8697C4]/20 dark:border-[#3D52A0]/30 shadow-[0_4px_30px_rgba(0,0,0,0.03)] animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <Link to={user ? "/reader/dashboard" : "/"} className="flex items-center">
                            <img src="/logo.png" alt="Charotar Publishing House" className="h-10 md:h-12 w-auto object-contain" />
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center space-x-5 xl:space-x-7 text-[13px] font-semibold tracking-tight">
                        {links.map((link) => (
                            link.isAnchor ? (
                                <button
                                    key={link.name}
                                    onClick={() => handleLinkClick(link)}
                                    className="text-slate-500 dark:text-slate-400 hover:text-[#3D52A0] dark:hover:text-[#7091E6] transition-all relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[#3D52A0] dark:after:bg-[#7091E6] hover:after:w-full after:transition-all after:duration-300 py-1"
                                >
                                    {link.name}
                                </button>
                            ) : (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`transition-all relative after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:bg-[#3D52A0] dark:after:bg-[#7091E6] hover:after:w-full after:transition-all after:duration-300 py-1 ${isActive(link.path) ? 'text-[#3D52A0] dark:text-[#7091E6] after:w-full' : 'text-slate-500 dark:text-slate-400 after:w-0'}`}
                                >
                                    {link.name}
                                </Link>
                            )
                        ))}
                    </div>

                    {/* Icons */}
                    <div className="hidden lg:flex items-center space-x-6 text-[#3D52A0] dark:text-[#EDE8F5]">
                        <button
                            onClick={toggleTheme}
                            className="hover:text-[#8B5CF6] transition-colors"
                            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {darkMode ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
                        </button>
                        <div className="relative flex items-center" ref={searchRef}>
                            {showSearch ? (
                                <div className="flex items-center bg-white dark:bg-[#1a1a2e] rounded-full px-4 py-2 border border-[#8697C4]/40 dark:border-[#3D52A0]/50 shadow-sm focus-within:border-[#3D52A0] focus-within:ring-2 focus-within:ring-[#3D52A0]/20 dark:focus-within:border-[#7091E6] dark:focus-within:ring-[#7091E6]/20 transition-all duration-300 w-[260px] xl:w-[320px]">
                                    <FaSearch className="text-[#3D52A0] dark:text-[#7091E6] text-sm" />
                                    <input
                                        type="text"
                                        className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none text-sm font-bold ml-2 w-full text-[#1f2937] dark:text-white placeholder-[#8697C4]/70 dark:placeholder-[#8697C4]"
                                        placeholder="Search books, authors..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-[#8697C4] hover:text-red-500 ml-2 outline-none transition-colors bg-slate-100 dark:bg-[#3D52A0]/30 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full">
                                        <FaTimes className="text-xs" />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setShowSearch(true)} className="hover:text-[#8B5CF6] transition-colors outline-none flex items-center h-full">
                                    <FaSearch className="text-xl" />
                                </button>
                            )}

                            {/* Dropdown Results */}
                            {showSearch && searchQuery.trim() && (
                                <div className="absolute right-0 top-[120%] w-[340px] bg-white dark:bg-[#1a1a2e] border border-[#8697C4]/30 dark:border-[#3D52A0]/50 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-fade-in-up">
                                    {isSearching ? (
                                        <div className="p-8 text-center flex flex-col items-center justify-center">
                                            <div className="w-8 h-8 rounded-full border-4 border-[#8697C4]/30 border-t-[#3D52A0] dark:border-[#3D52A0]/30 dark:border-t-[#7091E6] animate-spin mb-3"></div>
                                            <p className="text-sm font-bold text-[#3D52A0] dark:text-[#7091E6]">Finding matches...</p>
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div>
                                            <div className="px-4 py-3 border-b border-[#8697C4]/20 dark:border-[#3D52A0]/30 bg-slate-50/50 dark:bg-[#16213e]">
                                                <p className="text-xs font-bold text-[#8697C4] uppercase tracking-wider">Top Results</p>
                                            </div>
                                            <div className="max-h-[360px] overflow-y-auto">
                                                {searchResults.map(book => (
                                                    <div
                                                        key={book._id || book.id}
                                                        className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-[#3D52A0]/20 cursor-pointer border-b border-[#8697C4]/10 dark:border-[#3D52A0]/10 last:border-0 transition-colors group"
                                                        onClick={() => {
                                                            navigate(`/book/${book._id || book.id}`);
                                                            setShowSearch(false);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <div className="relative overflow-hidden rounded shadow-sm">
                                                            <img src={book.coverImage?.url || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=60&h=80&fit=crop'} alt={book.title} className="w-12 h-16 object-cover group-hover:scale-110 transition-transform duration-300" />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <h4 className="text-sm font-bold text-[#1f2937] dark:text-white truncate group-hover:text-[#3D52A0] dark:group-hover:text-[#7091E6] transition-colors">{book.title}</h4>
                                                            <p className="text-xs font-medium text-[#8697C4] truncate mt-1">{book.author}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs font-bold text-[#3D52A0] dark:text-[#7091E6] bg-[#3D52A0]/10 dark:bg-[#7091E6]/10 px-2 py-0.5 rounded-sm">₹{book.retailPrice || 0}</span>
                                                                <span className="text-[10px] font-bold text-[#8697C4] uppercase bg-slate-100 dark:bg-[#16213e] px-1.5 py-0.5 rounded-sm">{book.category || 'Book'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-[#16213e] flex items-center justify-center mx-auto mb-3 text-[#8697C4]">
                                                <FaSearch className="text-xl opacity-50" />
                                            </div>
                                            <p className="text-sm font-bold text-[#1f2937] dark:text-white mb-1">No results found</p>
                                            <p className="text-xs font-medium text-[#8697C4]">We couldn't find anything for "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <Link to={user ? "/reader/cart" : "/login"} className="text-[#3D52A0] dark:text-[#EDE8F5] hover:text-[#8B5CF6] transition-colors relative">
                            <FaShoppingCart className="text-xl" />
                            {cartItems?.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-[#7091E6] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                    {cartItems.length}
                                </span>
                            )}
                        </Link>

                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className={`flex items-center gap-2.5 p-1.5 pr-4 bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-full border border-[#8697C4]/30 dark:border-white/10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-all text-[#1f2937] dark:text-[#EDE8F5] backdrop-blur-md ${isProfileOpen ? 'ring-2 ring-[#3D52A0]/20' : ''}`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3D52A0] to-[#7091E6] flex items-center justify-center text-xs font-bold text-white shadow-inner border border-white/20">
                                    {user ? user.name?.charAt(0).toUpperCase() : <FaUser className="text-[10px]" />}
                                </div>
                                <span className="hidden xl:block text-[13px] font-semibold tracking-tight">
                                    {user ? user.name?.split(' ')[0] : "Account"}
                                </span>
                                <FaChevronDown className={`hidden xl:block text-[9px] text-slate-400 dark:text-slate-500 transition-transform duration-500 ${isProfileOpen ? 'rotate-180 text-[#3D52A0]' : ''}`} />
                            </button>

                            {/* Dropdown for Logged In User */}
                            {user ? (
                                <div className={`absolute right-0 top-[120%] w-[260px] transition-all duration-300 z-50 ${isProfileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                                    <div className="relative w-full overflow-hidden rounded-2xl shadow-xl bg-transparent">
                                        {/* Slide 1 - Icon Header */}
                                        <div className={`relative z-10 h-28 bg-gradient-to-br from-[#7091E6] to-[#8B5CF6] flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${isProfileOpen ? 'translate-y-0' : 'translate-y-[80px]'}`}>
                                            <FaUserCircle className="text-white drop-shadow-md text-6xl" />
                                        </div>
                                        {/* Slide 2 - Details & Links */}
                                        <div className={`relative z-0 bg-white dark:bg-[#1a1a2e] transition-transform duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] px-5 py-4 pt-6 border-x border-b border-[#7091E6]/20 rounded-b-2xl ${isProfileOpen ? 'translate-y-0' : '-translate-y-[80px]'}`}>
                                            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4"></div>

                                            <div className="text-center mb-4">
                                                <h3 className="text-lg font-bold text-[#3D52A0] dark:text-[#EDE8F5] mb-0.5">{user.name}</h3>
                                                <p className="text-xs text-slate-500 dark:text-[#8697C4] uppercase tracking-wider">{user.email || 'Reader'}</p>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <Link to="/reader/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#3D52A0]/20 text-sm font-medium text-[#1f2937] dark:text-[#EDE8F5] transition-colors">
                                                    <FaUser className="text-[#8B5CF6]" /> Profile
                                                </Link>
                                                <Link to="/reader/library" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#3D52A0]/20 text-sm font-medium text-[#1f2937] dark:text-[#EDE8F5] transition-colors">
                                                    <FaBook className="text-[#8B5CF6]" /> My Library
                                                </Link>
                                                <Link to="/reader/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#3D52A0]/20 text-sm font-medium text-[#1f2937] dark:text-[#EDE8F5] transition-colors">
                                                    <FaShoppingCart className="text-[#8B5CF6]" /> My Orders
                                                </Link>

                                                <div className="h-px w-full bg-[#8697C4]/20 border-t border-[#8697C4]/30 dark:border-[#3D52A0]/30 my-2"></div>

                                                <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-sm font-bold text-red-500 transition-colors w-full text-left">
                                                    <FaSignOutAlt className="text-red-500" /> Logout
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={`absolute right-0 top-[120%] w-[260px] transition-all duration-300 z-50 ${isProfileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                                    <div className="relative w-full overflow-hidden rounded-2xl shadow-xl bg-transparent">
                                        {/* Slide 1 - Icon Header */}
                                        <div className={`relative z-10 h-28 bg-gradient-to-br from-[#7091E6] to-[#8B5CF6] flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${isProfileOpen ? 'translate-y-0' : 'translate-y-[80px]'}`}>
                                            <FaUserCircle className="text-white drop-shadow-md text-6xl" />
                                        </div>
                                        {/* Slide 2 - Details & Links */}
                                        <div className={`relative z-0 bg-[#EDE8F5] dark:bg-[#1a1a2e] transition-transform duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] px-5 py-4 pt-6 border-x border-b border-[#7091E6]/20 rounded-b-2xl ${isProfileOpen ? 'translate-y-0' : '-translate-y-[80px]'}`}>
                                            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4"></div>

                                            <div className="text-center mb-4">
                                                <h3 className="text-lg font-bold text-[#3D52A0] dark:text-[#EDE8F5] mb-0.5">Welcome!</h3>
                                                <p className="text-xs text-slate-500 dark:text-[#8697C4] uppercase tracking-wider">Join Charotar today</p>
                                            </div>

                                            <div className="flex flex-col gap-2 mt-2">
                                                <Link to="/login" className="py-2.5 rounded-xl bg-[#3D52A0] hover:bg-[#8B5CF6] text-white text-sm font-bold flex justify-center items-center gap-2 transition-colors shadow-md">
                                                    Login to Account
                                                </Link>
                                                <Link to="/register" className="py-2.5 rounded-xl border-2 border-[#7091E6] text-[#3D52A0] dark:text-[#EDE8F5] hover:bg-slate-50 dark:hover:bg-[#3D52A0]/20 text-sm font-bold flex justify-center items-center gap-2 transition-colors">
                                                    Create an Account
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center gap-4 text-[#3D52A0] dark:text-[#EDE8F5]">
                        <button
                            onClick={toggleTheme}
                            className="p-2 hover:text-[#8B5CF6]"
                        >
                            {darkMode ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
                        </button>
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:text-[#8B5CF6]">
                            {mobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden bg-[#EDE8F5]/30 dark:bg-[#1a1a2e]/30 backdrop-blur-[12px] border-t border-[#8697C4]/30 dark:border-[#3D52A0]/30 absolute w-full left-0 py-4 px-6 shadow-xl z-50">
                    <div className="flex flex-col space-y-4">
                        {/* Mobile Search */}
                        <div className="relative">
                            <div className="flex items-center bg-white dark:bg-[#1a1a2e] rounded-full px-4 py-2.5 border border-[#8697C4]/40 dark:border-[#3D52A0]/50 shadow-sm focus-within:border-[#3D52A0] focus-within:ring-2 focus-within:ring-[#3D52A0]/20 dark:focus-within:border-[#7091E6] dark:focus-within:ring-[#7091E6]/20 transition-colors">
                                <FaSearch className="text-[#3D52A0] dark:text-[#7091E6] text-sm" />
                                <input
                                    type="text"
                                    className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none text-sm font-bold ml-2 w-full text-[#1f2937] dark:text-white placeholder-[#8697C4]/70 dark:placeholder-[#8697C4]"
                                    placeholder="Search books, authors..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="text-[#8697C4] hover:text-red-500 ml-2 outline-none transition-colors bg-slate-100 dark:bg-[#3D52A0]/30 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full">
                                        <FaTimes className="text-xs" />
                                    </button>
                                )}
                            </div>

                            {/* Mobile Search Results */}
                            {searchQuery.trim() && (
                                <div className="absolute left-0 right-0 top-[110%] bg-white dark:bg-[#1a1a2e] border border-[#8697C4]/30 dark:border-[#3D52A0]/50 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-fade-in-down">
                                    {isSearching ? (
                                        <div className="p-6 text-center flex flex-col items-center justify-center">
                                            <div className="w-6 h-6 rounded-full border-2 border-[#8697C4]/30 border-t-[#3D52A0] dark:border-[#3D52A0]/30 dark:border-t-[#7091E6] animate-spin mb-2"></div>
                                            <p className="text-xs font-bold text-[#3D52A0] dark:text-[#7091E6]">Finding matches...</p>
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div>
                                            <div className="px-4 py-2 border-b border-[#8697C4]/20 dark:border-[#3D52A0]/30 bg-slate-50/50 dark:bg-[#16213e]">
                                                <p className="text-[10px] font-bold text-[#8697C4] uppercase tracking-wider">Top Results</p>
                                            </div>
                                            <div className="max-h-[250px] overflow-y-auto">
                                                {searchResults.map(book => (
                                                    <div
                                                        key={book._id || book.id}
                                                        className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-[#3D52A0]/20 cursor-pointer border-b border-[#8697C4]/10 dark:border-[#3D52A0]/10 last:border-0"
                                                        onClick={() => {
                                                            navigate(`/book/${book._id || book.id}`);
                                                            setMobileMenuOpen(false);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <div className="relative overflow-hidden rounded shadow-sm">
                                                            <img src={book.coverImage?.url || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=50&h=75&fit=crop'} alt={book.title} className="w-10 h-14 object-cover" />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <h4 className="text-xs font-bold text-[#1f2937] dark:text-white truncate">{book.title}</h4>
                                                            <p className="text-[10px] font-medium text-[#8697C4] truncate mt-0.5">{book.author}</p>
                                                            <div className="text-[10px] font-bold text-[#3D52A0] dark:text-[#7091E6] mt-0.5">₹{book.retailPrice || 0}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center">
                                            <p className="text-sm font-bold text-[#1f2937] dark:text-white mb-1">No results found</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {links.map((link) => (
                            link.isAnchor ? (
                                <button
                                    key={link.name}
                                    onClick={() => handleLinkClick(link)}
                                    className="text-left text-[#3D52A0] dark:text-[#EDE8F5] font-bold hover:text-[#8B5CF6] transition-colors"
                                >
                                    {link.name}
                                </button>
                            ) : (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className="text-[#3D52A0] dark:text-[#EDE8F5] font-bold hover:text-[#8B5CF6] transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            )
                        ))}
                        <div className="h-px bg-[#8697C4]/30 dark:bg-[#3D52A0]/30 my-2"></div>
                        <Link to={user ? "/reader/cart" : "/login"} className="text-[#3D52A0] dark:text-[#EDE8F5] font-bold hover:text-[#8B5CF6]" onClick={() => setMobileMenuOpen(false)}>Cart ({cartItems?.length || 0})</Link>
                        {user ? (
                            <>
                                <Link to="/reader/profile" className="text-[#3D52A0] dark:text-[#EDE8F5] font-bold hover:text-[#8B5CF6]" onClick={() => setMobileMenuOpen(false)}>My Account</Link>
                                <button onClick={() => { logout(); setMobileMenuOpen(false); navigate('/'); }} className="text-red-500 font-bold text-left hover:text-red-600">Logout</button>
                            </>
                        ) : (
                            <Link to="/login" className="text-[#7091E6] font-bold" onClick={() => setMobileMenuOpen(false)}>Login / Register</Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
