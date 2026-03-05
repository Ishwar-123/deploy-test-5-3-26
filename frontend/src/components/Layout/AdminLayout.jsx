import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    FaTachometerAlt, FaBook, FaStore, FaBox, FaUsers,
    FaShoppingCart, FaChartBar, FaSignOutAlt, FaBars, FaTimes,
    FaBell, FaSearch, FaCog, FaMoon, FaSun, FaChevronDown, FaBookOpen, FaShieldAlt, FaComments
} from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const { darkMode, toggleTheme, adminTheme, isDeveloperMode } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Format date and time
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Sync sidebar state for mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setProfileDropdownOpen(false);
            if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/admin/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
        { path: '/admin/books', icon: FaBook, label: 'Books' },
        { path: '/admin/vendors', icon: FaStore, label: 'Vendors' },
        { path: '/admin/packages', icon: FaBox, label: 'Packages' },
        { path: '/admin/readers', icon: FaUsers, label: 'Readers' },
        { path: '/admin/orders', icon: FaShoppingCart, label: 'Orders', badge: '12' },
        { path: '/admin/reviews', icon: FaComments, label: 'Reviews' },
        { path: '/admin/reports', icon: FaChartBar, label: 'Reports' },
        { path: '/admin/auth-monitor', icon: FaShieldAlt, label: 'Auth Monitor' },
        { path: '/admin/settings', icon: FaCog, label: 'Settings' },
    ];

    return (
        <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${isDeveloperMode ? 'developer-mode font-mono' : ''}`}>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && window.innerWidth < 1024 && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    } ${!sidebarOpen && 'lg:w-20'}`}
            >
                {/* Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 admin-accent-bg rounded-lg flex items-center justify-center">
                                <FaBookOpen className="text-white text-lg" />
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                Book<span className="admin-accent-text">Verse</span>
                            </span>
                        </div>
                    )}
                    {!sidebarOpen && (
                        <div className="w-8 h-8 admin-accent-bg rounded-lg flex items-center justify-center mx-auto">
                            <FaBookOpen className="text-white text-lg" />
                        </div>
                    )}
                </div>

                {/* Sidebar Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? 'admin-accent-bg text-white shadow-lg'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    } ${!sidebarOpen && 'justify-center'}`}
                            >
                                <item.icon className="text-lg flex-shrink-0" />
                                {sidebarOpen && (
                                    <>
                                        <span className="font-medium text-sm flex-1">{item.label}</span>
                                        {item.badge && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-white admin-accent-text' : 'admin-accent-bg-soft admin-accent-text'
                                                }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                            <div className="w-9 h-9 rounded-full admin-accent-bg flex items-center justify-center text-white font-semibold text-sm">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Admin</p>
                            </div>
                            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                                <FaSignOutAlt />
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleLogout} className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <FaSignOutAlt className="text-lg" />
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 relative z-30">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <FaBars />
                        </button>
                        <div className="hidden sm:block">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
                        </div>

                        {/* Live Clock & Date */}
                        <div className="hidden lg:flex items-center gap-4 ml-6 pl-6 border-l border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 dark:text-white admin-accent-text tracking-wider font-mono">
                                    {formatTime(currentTime)}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-tighter">
                                    {formatDate(currentTime)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3">
                        {/* Search */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 w-64">
                            <FaSearch className="text-gray-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 w-full"
                            />
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            {darkMode ? <FaSun /> : <FaMoon />}
                        </button>

                        {/* Notifications */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                            >
                                <FaBell />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 admin-accent-bg rounded-full ring-2 ring-white dark:ring-gray-800" />
                            </button>
                            {notificationDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                                    <div className="p-3 admin-accent-bg text-white flex justify-between items-center">
                                        <h4 className="font-semibold text-sm">Notifications</h4>
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">3 NEW</span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                                <h5 className="text-xs font-semibold text-gray-900 dark:text-white">New Submission #{i}</h5>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">A new vendor has submitted a book for review.</p>
                                                <span className="text-xs text-gray-400 mt-1 block">2 mins ago</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                className="flex items-center gap-2 p-1 pr-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full admin-accent-bg flex items-center justify-center text-white font-semibold text-xs shadow-sm shadow-blue-500/10">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="hidden lg:block text-sm font-medium text-gray-900 dark:text-white">{user?.name}</span>
                                <FaChevronDown className={`text-xs text-gray-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {profileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                        <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                navigate('/admin/settings');
                                                setProfileDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                        >
                                            <FaCog /> Settings
                                        </button>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left">
                                            <FaSignOutAlt /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content Scroll Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
