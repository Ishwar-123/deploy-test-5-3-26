/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                secondary: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Fraunces', 'Playfair Display', 'serif'],
                display: ['Outfit', 'Inter', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #2563eb 0%, #111827 100%)',
                'gradient-secondary': 'linear-gradient(135deg, #4b5563 0%, #111827 100%)',
                'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            boxShadow: {
                'glow': '0 0 20px rgba(37, 99, 235, 0.2)',
                'glow-lg': '0 0 40px rgba(37, 99, 235, 0.4)',
                'premium': '0 20px 60px -10px rgba(0, 0, 0, 0.1)',
            },
            animation: {
                'gradient': 'gradient 15s ease infinite',
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s infinite',
                'slide-in-right': 'slideInRight 0.5s ease-out',
                'slide-in-left': 'slideInLeft 0.5s ease-out',
                'fade-in': 'fadeIn 0.5s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
