import { NavLink, useLocation } from 'react-router-dom';
import { FaCompass, FaLayerGroup, FaCrown, FaUserCircle } from 'react-icons/fa';

const MobileBottomNav = () => {
    const location = useLocation();

    const navLinks = [
        { path: '/reader/dashboard', label: 'Discover', icon: FaCompass },
        { path: '/reader/library', label: 'Library', icon: FaLayerGroup },
        { path: '/reader/subscription', label: 'Premium', icon: FaCrown },
        { path: '/reader/profile', label: 'Profile', icon: FaUserCircle },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={`
                                flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300
                                ${isActive
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-slate-400 dark:text-slate-500'}
                            `}
                        >
                            <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                                <link.icon className="text-xl" />
                                {isActive && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
                                )}
                            </div>
                            <span className="text-[10px] font-bold tracking-tight uppercase">
                                {link.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
