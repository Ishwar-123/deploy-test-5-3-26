import { useState, useEffect } from 'react';
import { FaBook, FaSearch, FaPlay, FaSortAmountDown, FaCheckCircle, FaSpinner, FaDownload, FaBookOpen, FaCompass } from 'react-icons/fa';
import toast from '../utils/sweetalert';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import readerService from '../services/readerService';
import { API_URL } from '../utils/constants';

// --- GLOWING PARTICLE BACKGROUND COMPONENT ---
const ParticleBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-blue-500/10 dark:bg-white/5"
                    initial={{
                        x: Math.random() * 100 + "%",
                        y: Math.random() * 100 + "%",
                        scale: Math.random() * 0.5 + 0.5,
                        opacity: Math.random() * 0.3 + 0.1
                    }}
                    animate={{
                        y: [null, (Math.random() * 10 - 5) + "%"],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        width: Math.random() * 4 + 2 + 'px',
                        height: Math.random() * 4 + 2 + 'px',
                        filter: 'blur(1px)'
                    }}
                />
            ))}
        </div>
    );
};

// --- ATMOSPHERIC ELEMENTS ---
const Sphere = ({ delay, size, left, top, color }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
            y: [0, 30, 0]
        }}
        transition={{
            duration: 8,
            delay,
            repeat: Infinity,
            ease: "easeInOut"
        }}
        className={`absolute rounded-full blur-[80px] pointer-events-none z-0 ${color}`}
        style={{ width: size, height: size, left, top }}
    />
);

const ReaderLibrary = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [libraryBooks, setLibraryBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterQuery, setFilterQuery] = useState('');
    const darkMode = document.documentElement.classList.contains('dark');

    useEffect(() => {
        fetchLibrary();
    }, []);

    const fetchLibrary = async () => {
        try {
            setLoading(true);
            const data = await readerService.getLibrary();
            if (data.success) {
                setLibraryBooks(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch library:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter books based on active tab and search query
    const filteredBooks = libraryBooks.filter(item => {
        const matchesTab = activeTab === 'all' || (activeTab === 'finished' && Number(item.progress) >= 100);
        const matchesSearch = item.book?.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
            item.book?.author.toLowerCase().includes(filterQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const LibraryBookCard = ({ item }) => {
        const book = item.book;
        if (!book) return null;

        const image = book.coverImage?.url || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop';

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative flex flex-col sm:flex-row gap-6 p-6 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_50px_-12px_rgba(61,82,160,0.25)] transition-all duration-500 hover:-translate-y-1"
            >
                {/* Cover with 3D Float Effect */}
                <div className="w-full sm:w-28 h-40 flex-shrink-0 bg-white/10 overflow-hidden rounded-xl relative shadow-2xl group-hover:scale-105 transition-transform duration-500">
                    <img
                        src={image}
                        alt={book.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">View Details</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3
                                className="font-serif font-bold text-xl text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-[#3D52A0] dark:group-hover:text-[#7091E6] transition-colors cursor-pointer"
                                onClick={() => navigate(`/book/${book.id}`)}
                            >
                                {book.title}
                            </h3>
                            <button className="text-gray-400 hover:text-[#8B5CF6] transition-colors">
                                <FaSortAmountDown size={14} />
                            </button>
                        </div>
                        <p className="text-sm text-[#7091E6] font-black uppercase tracking-[0.2em] text-[10px] mb-3">
                            {book.author}
                        </p>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#3D52A0]/10 rounded-full border border-[#3D52A0]/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3D52A0] animate-pulse"></span>
                                <span className="text-[10px] text-[#3D52A0] font-black uppercase tracking-widest">
                                    {(() => {
                                        if (!item.createdAt) return '365 Days Access';
                                        const expiryDate = new Date(item.createdAt);
                                        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                                        const diff = expiryDate - new Date();
                                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                        const remaining = days > 0 ? days : 0;
                                        return `${remaining > 365 ? 365 : remaining} Days Remaining`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Progress */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-gray-500/80">
                                <span className="flex items-center gap-1.5">
                                    <FaCheckCircle className={item.progress === 100 ? 'text-[#3D52A0]' : 'opacity-30'} />
                                    {item.progress || 0}% Complete
                                </span>
                                <span>{item.lastAccessedAt ? new Date(item.lastAccessedAt).toLocaleDateString() : 'Ready to Start'}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200/50 dark:bg-white/10 rounded-full overflow-hidden shadow-inner p-[1px]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.progress || 0}%` }}
                                    className="h-full bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#8B5CF6] rounded-full relative"
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                >
                                    <div className="absolute top-0 right-0 w-4 h-full bg-white/20 skew-x-12 animate-shimmer" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => navigate(`/book/${book.id}/read-3d`)}
                                className="flex-1 px-5 py-3.5 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] text-white hover:from-[#7091E6] hover:to-[#8B5CF6] rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-[#3D52A0]/25 transform hover:scale-[1.02] active:scale-95"
                            >
                                <FaPlay className="text-[10px]" /> {item.progress > 0 ? 'Continue Reading' : 'Start Your Reading Journey'}
                            </button>
                            {book.catalogUrl && (
                                <a
                                    href={book.catalogUrl.startsWith('http') ? book.catalogUrl : `${API_URL}${book.catalogUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-3 bg-white/50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/40 dark:border-white/10"
                                    title="Download Product Catalog"
                                >
                                    <FaDownload />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div >
        );
    };

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-500 overflow-hidden">
            {/* ATMOSPHERIC BACKGROUND */}
            <Sphere delay={0} size={400} left="-10%" top="-10%" color={darkMode ? "bg-[#3D52A0]/20" : "bg-[#3D52A0]/10"} />
            <Sphere delay={2} size={300} left="85%" top="40%" color={darkMode ? "bg-[#8B5CF6]/20" : "bg-[#8B5CF6]/10"} />
            <ParticleBackground />

            <div className="container mx-auto px-6 py-16 max-w-7xl relative z-10 space-y-16 animate-fade-in">
                {/* Editorial Header */}
                <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-10">
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3"
                        >
                            <span className="w-12 h-[2px] bg-[#3D52A0]"></span>
                            <span className="text-[#3D52A0] dark:text-[#7091E6] font-black tracking-[0.3em] text-[10px] uppercase">
                                Personal Collection
                            </span>
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#8B5CF6] animate-gradient-x">Library</span>
                        </h1>
                        <p className="text-gray-500/80 dark:text-gray-400 max-w-lg font-medium leading-relaxed italic text-lg">
                            Curated excellence from your literary journey. Access your premium titles and track your progress through our immersive 3D reader.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 sm:gap-8">
                        {[
                            { label: 'Total Books', value: libraryBooks.length, color: 'text-[#3D52A0]' },
                            { label: 'Finished', value: libraryBooks.filter(b => Number(b.progress) >= 100).length, color: 'text-[#3D52A0]' },
                            {
                                label: 'Progress All Books',
                                value: (() => {
                                    if (!libraryBooks || libraryBooks.length === 0) return '0%';
                                    const validBooks = libraryBooks.filter(item => item && item.progress !== undefined && item.progress !== null);
                                    if (validBooks.length === 0) return '0%';
                                    const total = validBooks.reduce((acc, item) => acc + Number(item.progress), 0);
                                    return `${Math.round(total / libraryBooks.length)}%`;
                                })(),
                                color: 'text-[#8B5CF6]'
                            }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="px-8 py-5 bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-black/10 dark:border-white/10 min-w-[140px] text-center shadow-xl shadow-[#3D52A0]/5 group hover:-translate-y-1 transition-all duration-300"
                            >
                                <span className={`block text-4xl font-serif font-black mb-1 ${stat.color} group-hover:scale-110 transition-transform duration-500`}>{stat.value}</span>
                                <span className="text-[10px] font-black text-[#3D52A0]/60 dark:text-gray-400 uppercase tracking-[0.2em]">{stat.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-8 justify-between items-center p-8 bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-[32px] border border-black/10 dark:border-white/10 shadow-2xl shadow-[#3D52A0]/10">
                    <div className="bg-[#3D52A0]/5 dark:bg-white/5 p-1.5 rounded-[20px] flex gap-1 relative group/tabs border border-[#3D52A0]/10 dark:border-white/10 backdrop-blur-md">
                        {['all', 'finished'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-10 py-3 rounded-[14px] text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500 relative z-10
                                    ${activeTab === tab
                                        ? 'text-white'
                                        : 'text-[#3D52A0]/60 dark:text-gray-400 hover:text-[#3D52A0] dark:hover:text-white'
                                    }
                                `}
                            >
                                {tab} Books
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTabPill"
                                        className="absolute inset-0 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] rounded-[14px] -z-10 shadow-lg shadow-[#3D52A0]/20"
                                        transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="w-full md:w-[450px] relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#3D52A0]/5 to-[#8B5CF6]/5 rounded-2xl blur-xl opacity-100 transition-opacity duration-500"></div>
                        <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-[#3D52A0] transition-all duration-500 z-10" />
                        <input
                            type="text"
                            placeholder="Search your library..."
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className="w-full pl-16 pr-8 py-5 bg-white/90 dark:bg-white/10 backdrop-blur-md border border-[#3D52A0]/40 focus:border-[#3D52A0] rounded-2xl outline-none shadow-2xl shadow-[#3D52A0]/10 transition-all duration-500 text-sm font-black text-[#1E1E2D] dark:text-white placeholder:text-[#3D52A0]/40 tracking-wide"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="relative">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {[1, 2, 3, 4].map(n => (
                                <div key={n} className="h-48 rounded-3xl bg-white/10 dark:bg-white/5 animate-pulse border border-white/10"></div>
                            ))}
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredBooks.length > 0 ? (
                                <motion.div
                                    className="grid grid-cols-1 lg:grid-cols-2 gap-10"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {filteredBooks.map((item) => (
                                        <LibraryBookCard key={item.id || item.book.id} item={item} />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-32 rounded-3xl bg-white/20 dark:bg-white/5 backdrop-blur-xl border-2 border-dashed border-white/30 dark:border-white/10 overflow-hidden relative"
                                >
                                    <div className="relative z-10">
                                        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[#3D52A0] to-[#8B5CF6] rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-[#3D52A0]/40 transform hover:scale-110 transition-transform duration-500">
                                            {filterQuery ? <FaCompass className="text-4xl animate-pulse" /> : <FaBookOpen className="text-4xl" />}
                                        </div>
                                        <h3 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                                            {filterQuery ? 'No Treasures Found' : 'Your Library Awaits'}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto leading-relaxed font-medium px-6">
                                            {filterQuery
                                                ? `Our curators couldn't find "${filterQuery}" in your collection. Try a different search term.`
                                                : 'Your digital bookshelf is ready to be filled with world-class literature and premium ebooks.'}
                                        </p>
                                        {!filterQuery && (
                                            <button
                                                onClick={() => navigate('/reader/dashboard')}
                                                className="px-10 py-4 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] hover:from-[#7091E6] hover:to-[#8B5CF6] text-white font-black text-[11px] tracking-[0.3em] uppercase transition-all rounded-full shadow-2xl shadow-[#3D52A0]/40 hover:-translate-y-1"
                                            >
                                                Discover Collection
                                            </button>
                                        )}
                                    </div>

                                    {/* Decorative subtle background icon for empty state */}
                                    <FaBook className="absolute -bottom-10 -right-10 text-[200px] text-gray-500/5 rotate-12 -z-0" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Custom Shimmer Animation */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(12deg); }
                    100% { transform: translateX(200%) skewX(12deg); }
                }
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-shimmer {
                    animation: shimmer 2.5s infinite;
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 15s ease infinite;
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .rotate-y-12 {
                    transform: rotateY(12deg);
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ReaderLibrary;
