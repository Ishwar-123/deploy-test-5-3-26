import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSun, FaMoon, FaAdjust } from 'react-icons/fa';

const ReaderSettingsModal = ({
    isOpen,
    onClose,
    settings,
    onSettingsChange
}) => {
    const themes = [
        { id: 'dark', name: 'Dark', icon: FaMoon, bg: '#0B0B0B', text: '#E5E7EB' },
        { id: 'sepia', name: 'Sepia', icon: FaAdjust, bg: '#2B2118', text: '#F5E6D3' },
        { id: 'light', name: 'Light', icon: FaSun, bg: '#F9FAFB', text: '#111827' },
    ];

    const fonts = [
        { id: 'inter', name: 'Inter', sample: 'The quick brown fox' },
        { id: 'georgia', name: 'Georgia', sample: 'The quick brown fox' },
        { id: 'merriweather', name: 'Merriweather', sample: 'The quick brown fox' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] backdrop-blur-md"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-md rounded-3xl shadow-2xl overflow-hidden"
                        style={{
                            backgroundColor: 'var(--reader-content-bg)',
                            border: '1px solid var(--reader-border)',
                        }}
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--reader-border)' }}>
                            <div className="flex items-center justify-between">
                                <h2
                                    className="text-xl font-bold"
                                    style={{ color: 'var(--reader-text)' }}
                                >
                                    Reading Settings
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                                    style={{
                                        backgroundColor: 'var(--reader-border)',
                                        color: 'var(--reader-text)',
                                    }}
                                >
                                    <FaTimes />
                                </motion.button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto reader-scrollbar">

                            {/* Theme Selection */}
                            <div>
                                <label
                                    className="block text-sm font-bold mb-3"
                                    style={{ color: 'var(--reader-text)' }}
                                >
                                    Theme
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {themes.map((theme) => {
                                        const Icon = theme.icon;
                                        const isActive = settings.theme === theme.id;
                                        return (
                                            <motion.button
                                                key={theme.id}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => onSettingsChange({ theme: theme.id })}
                                                className="relative p-4 rounded-2xl transition-all duration-300"
                                                style={{
                                                    backgroundColor: theme.bg,
                                                    border: isActive ? `2px solid var(--reader-accent)` : '2px solid transparent',
                                                    boxShadow: isActive ? '0 0 20px rgba(34, 197, 94, 0.3)' : 'none',
                                                }}
                                            >
                                                <Icon className="text-xl mb-2 mx-auto" style={{ color: theme.text }} />
                                                <span className="text-xs font-bold block" style={{ color: theme.text }}>
                                                    {theme.name}
                                                </span>
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeTheme"
                                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                                        style={{ backgroundColor: 'var(--reader-accent)' }}
                                                    >
                                                        <span className="text-white text-xs">✓</span>
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Font Family */}
                            <div>
                                <label
                                    className="block text-sm font-bold mb-3"
                                    style={{ color: 'var(--reader-text)' }}
                                >
                                    Font Family
                                </label>
                                <div className="space-y-2">
                                    {fonts.map((font) => {
                                        const isActive = settings.fontFamily === font.id;
                                        return (
                                            <motion.button
                                                key={font.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => onSettingsChange({ fontFamily: font.id })}
                                                className="w-full p-4 rounded-xl text-left transition-all duration-300"
                                                style={{
                                                    backgroundColor: isActive ? 'var(--reader-border)' : 'transparent',
                                                    border: `1px solid ${isActive ? 'var(--reader-accent)' : 'var(--reader-border)'}`,
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div
                                                            className="font-bold text-sm mb-1"
                                                            style={{ color: 'var(--reader-text)' }}
                                                        >
                                                            {font.name}
                                                        </div>
                                                        <div
                                                            className={`reader-font-${font.id} text-xs`}
                                                            style={{ color: 'var(--reader-text-secondary)' }}
                                                        >
                                                            {font.sample}
                                                        </div>
                                                    </div>
                                                    {isActive && (
                                                        <div
                                                            className="w-5 h-5 rounded-full flex items-center justify-center"
                                                            style={{ backgroundColor: 'var(--reader-accent)' }}
                                                        >
                                                            <span className="text-white text-xs">✓</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Font Size */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label
                                        className="text-sm font-bold"
                                        style={{ color: 'var(--reader-text)' }}
                                    >
                                        Font Size
                                    </label>
                                    <span
                                        className="text-sm font-bold px-3 py-1 rounded-full"
                                        style={{
                                            backgroundColor: 'var(--reader-border)',
                                            color: 'var(--reader-accent)'
                                        }}
                                    >
                                        {settings.fontSize}px
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="14"
                                    max="24"
                                    value={settings.fontSize}
                                    onChange={(e) => onSettingsChange({ fontSize: Number(e.target.value) })}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, var(--reader-accent) 0%, var(--reader-accent) ${((settings.fontSize - 14) / 10) * 100}%, var(--reader-border) ${((settings.fontSize - 14) / 10) * 100}%, var(--reader-border) 100%)`,
                                    }}
                                />
                                <div className="flex justify-between mt-2">
                                    <span className="text-xs" style={{ color: 'var(--reader-text-secondary)' }}>14px</span>
                                    <span className="text-xs" style={{ color: 'var(--reader-text-secondary)' }}>24px</span>
                                </div>
                            </div>

                            {/* Line Height */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label
                                        className="text-sm font-bold"
                                        style={{ color: 'var(--reader-text)' }}
                                    >
                                        Line Height
                                    </label>
                                    <span
                                        className="text-sm font-bold px-3 py-1 rounded-full"
                                        style={{
                                            backgroundColor: 'var(--reader-border)',
                                            color: 'var(--reader-accent)'
                                        }}
                                    >
                                        {settings.lineHeight}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1.4"
                                    max="2.2"
                                    step="0.1"
                                    value={settings.lineHeight}
                                    onChange={(e) => onSettingsChange({ lineHeight: Number(e.target.value) })}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, var(--reader-accent) 0%, var(--reader-accent) ${((settings.lineHeight - 1.4) / 0.8) * 100}%, var(--reader-border) ${((settings.lineHeight - 1.4) / 0.8) * 100}%, var(--reader-border) 100%)`,
                                    }}
                                />
                                <div className="flex justify-between mt-2">
                                    <span className="text-xs" style={{ color: 'var(--reader-text-secondary)' }}>Compact</span>
                                    <span className="text-xs" style={{ color: 'var(--reader-text-secondary)' }}>Spacious</span>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ReaderSettingsModal;
