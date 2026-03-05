import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(false); // Force Light Mode as default on initial load

    const [adminTheme, setAdminTheme] = useState(() => {
        return localStorage.getItem('adminTheme') || 'blue';
    });

    const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
        return localStorage.getItem('isDeveloperMode') === 'true';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem('adminTheme', adminTheme);
        // Apply theme color to root
        const root = window.document.documentElement;
        const colors = {
            blue: { primary: '#2563eb', secondary: '#1e40af' },
            purple: { primary: '#9333ea', secondary: '#7e22ce' },
            emerald: { primary: '#10b981', secondary: '#059669' },
            rose: { primary: '#f43f5e', secondary: '#e11d48' },
            amber: { primary: '#f59e0b', secondary: '#d97706' },
            indigo: { primary: '#4f46e5', secondary: '#4338ca' },
            cyan: { primary: '#0891b2', secondary: '#0e7490' },
            violet: { primary: '#7c3aed', secondary: '#6d28d9' },
            orange: { primary: '#f97316', secondary: '#ea580c' },
            lime: { primary: '#84cc16', secondary: '#65a30d' },
            fuchsia: { primary: '#d946ef', secondary: '#c026d3' },
            slate: { primary: '#475569', secondary: '#334155' }
        };
        const selected = colors[adminTheme] || colors.blue;
        root.style.setProperty('--admin-primary', selected.primary);
        root.style.setProperty('--admin-secondary', selected.secondary);
    }, [adminTheme]);



    useEffect(() => {
        localStorage.setItem('isDeveloperMode', isDeveloperMode);
    }, [isDeveloperMode]);

    const toggleTheme = () => {
        setDarkMode((prev) => !prev);
    };

    return (
        <ThemeContext.Provider value={{
            darkMode,
            toggleTheme,
            adminTheme,
            setAdminTheme,
            isDeveloperMode,
            setIsDeveloperMode
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
