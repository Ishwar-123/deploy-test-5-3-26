import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaStar, FaShoppingCart, FaBook, FaBookOpen, FaExpand, FaTimes,
    FaDownload,
    FaGlobe, FaLayerGroup, FaFileAlt, FaBuilding, FaChevronRight, FaArrowLeft,
    FaChevronLeft
} from 'react-icons/fa';
import bookService from '../services/bookService';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/sweetalert';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import BookReviewSection from '../components/BookReviewSection';
import { API_URL } from '../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';


const BookDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart, isInCart } = useCart();

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedBooks, setRelatedBooks] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const [isZooming, setIsZooming] = useState(false);
    const scrollRef = useRef(null);

    const scrollThumbnails = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 200;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handleMove = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((clientX - left) / width) * 100;
        const y = ((clientY - top) / height) * 100;
        setZoomPosition({ x, y });
    };

    useEffect(() => {
        fetchBookDetails();
        window.scrollTo(0, 0);
    }, [id, user]);

    const fetchBookDetails = async () => {
        try {
            setLoading(true);
            const data = await bookService.getBookById(id);
            const bookData = data.data.book || data.data;

            // Safely parse additionalImages
            if (typeof bookData.additionalImages === 'string') {
                try {
                    const parsed = JSON.parse(bookData.additionalImages);
                    bookData.additionalImages = Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    bookData.additionalImages = [];
                }
            }

            // Safely parse tags
            if (typeof bookData.tags === 'string') {
                try {
                    const parsed = JSON.parse(bookData.tags);
                    bookData.tags = Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    bookData.tags = [];
                }
            } else if (!Array.isArray(bookData.tags)) {
                bookData.tags = [];
            }
            setBook(bookData);

            // Fetch related books
            if (bookData.category) {
                const related = await bookService.getBooks({ category: bookData.category, limit: 4 });
                setRelatedBooks(related.data.books.filter(b => b._id !== id && b.id !== id));
            }
        } catch (error) {
            console.error('Failed to fetch book details', error);
            toast.error('Failed to load book details');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = () => {
        if (!user) {
            toast.info('Please login to purchase books');
            navigate('/login');
            return;
        }
        navigate(`/checkout/${id}`);
    };

    const handleAddToCart = () => {
        if (!user) {
            toast.info('Please login to add books to cart');
            navigate('/login');
            return;
        }
        addToCart(id);
    };

    const handleReadNow = () => {
        if (!user) {
            toast.info('Please login to read books');
            navigate('/login');
            return;
        }
        navigate(`/book/${id}/read-3d`);
    };

    const getImageUrl = (coverImage) => {
        if (!coverImage) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop';
        if (typeof coverImage === 'string') return coverImage;
        if (coverImage.url) return coverImage.url;
        if (coverImage.path) return `http://localhost:5000${coverImage.path}`;
        return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop';
    };

    // Custom Components (Matching HomePage)



    if (loading) return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-white dark:bg-[#0a0a0a]">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-[#3D52A0]/20 border-t-[#8B5CF6] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-gradient-to-tr from-[#3D52A0] to-[#8B5CF6] rounded-full animate-pulse blur-sm"></div>
                </div>
            </div>
            <p className="mt-6 text-gray-500 font-serif italic tracking-widest animate-pulse">Curating your experience...</p>
        </div>
    );

    if (!book) return <div className="min-h-screen flex justify-center items-center text-xl font-bold bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white">Book not found</div>;

    return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0a0a0a] font-sans selection:bg-[#3D52A0] selection:text-white flex flex-col overflow-x-hidden relative">
            {/* Ambient Background Elements */}
            <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8B5CF6]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3D52A0]/5 blur-[100px] rounded-full pointer-events-none z-0"></div>

            <TopBar />
            <Navbar />

            {/* Breadcrumb Area - Glassmorphic design */}
            <div className="relative z-10 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-full shadow-sm">
                        <Link to="/" className="text-xs text-gray-500 hover:text-[#3D52A0] transition-colors flex items-center gap-1">
                            <FaArrowLeft className="text-[10px]" /> Home
                        </Link>
                        <FaChevronRight className="text-[10px] text-gray-300" />
                        <span className="text-xs text-[#3D52A0] font-bold">Details</span>
                        <FaChevronRight className="text-[10px] text-gray-300" />
                        <span className="text-xs text-gray-400 font-medium truncate max-w-[150px]">{book.title}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <div className="grid lg:grid-cols-12 gap-16 items-start">

                    {/* Left Column: Visuals (5/12) */}
                    <div className="lg:col-span-5 space-y-8 sticky top-24">
                        <div className="relative group">
                            {/* Premium Shadow & Glow behind book */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#3D52A0]/20 to-[#8B5CF6]/20 blur-3xl scale-90 group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>

                            <div
                                className="relative aspect-[3/4.2] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/50 dark:border-white/5 group cursor-zoom-in"
                                onMouseMove={handleMove}
                                onMouseEnter={() => setIsZooming(true)}
                                onMouseLeave={() => setIsZooming(false)}
                                onTouchStart={(e) => { setIsZooming(true); handleMove(e); }}
                                onTouchMove={(e) => { if (isZooming) { handleMove(e); e.preventDefault(); } }}
                                onTouchEnd={() => setIsZooming(false)}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={selectedImage || 'cover'}
                                        src={selectedImage || getImageUrl(book.coverImage)}
                                        alt={book.title}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="w-full h-full object-cover transition-transform duration-300 ease-out"
                                        style={{
                                            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                            transform: isZooming ? 'scale(1.8)' : 'scale(1)'
                                        }}
                                        onClick={() => setShowImageModal(true)}
                                    />
                                </AnimatePresence>

                                {book.isPurchased && (
                                    <div className="absolute top-6 left-6 px-4 py-1.5 bg-[#10B981] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-green-500/20 z-20">
                                        Collection Subscribed
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowImageModal(true)}
                                    className="absolute bottom-6 right-6 bg-white/90 dark:bg-black/80 backdrop-blur-md text-[#3D52A0] p-4 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-[#3D52A0] hover:text-white z-20"
                                >
                                    <FaExpand size={18} />
                                </button>
                            </div>

                            {/* Additional Images / Thumbnails */}
                            {book.additionalImages && book.additionalImages.length > 0 && (
                                <div className="relative group/gallery mt-8">
                                    <div
                                        ref={scrollRef}
                                        className="flex gap-4 pb-4 overflow-x-auto scrollbar-hide snap-x scroll-smooth"
                                    >
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`relative w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-500 flex-shrink-0 snap-start ${(!selectedImage || selectedImage === getImageUrl(book.coverImage)) ? 'border-[#3D52A0] ring-4 ring-[#3D52A0]/10 scale-105 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                            onClick={() => setSelectedImage(getImageUrl(book.coverImage))}
                                        >
                                            <img src={getImageUrl(book.coverImage)} className="w-full h-full object-cover" alt="Cover" />
                                        </motion.button>
                                        {book.additionalImages.map((img, i) => {
                                            const imgUrl = typeof img === 'string' ? img : img.url;
                                            return (
                                                <motion.button
                                                    key={i}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={`relative w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-500 flex-shrink-0 snap-start ${selectedImage === imgUrl ? 'border-[#3D52A0] ring-4 ring-[#3D52A0]/10 scale-105 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                    onClick={() => setSelectedImage(imgUrl)}
                                                >
                                                    <img src={imgUrl} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Navigation Arrows */}
                                    {(book.additionalImages.length + 1) > 4 && (
                                        <>
                                            <button
                                                onClick={() => scrollThumbnails('left')}
                                                className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-[#3D52A0] opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-[#3D52A0] hover:text-white z-20 border border-white/50"
                                            >
                                                <FaChevronLeft size={12} />
                                            </button>
                                            <button
                                                onClick={() => scrollThumbnails('right')}
                                                className="absolute right-[-15px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-[#3D52A0] opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-[#3D52A0] hover:text-white z-20 border border-white/50"
                                            >
                                                <FaChevronRight size={12} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Details (7/12) */}
                    <div className="lg:col-span-7 space-y-10">
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="inline-block py-1 px-4 bg-[#EDE8F5] dark:bg-[#3D52A0]/20 text-[#3D52A0] dark:text-[#7091E6] text-[10px] font-black uppercase tracking-[3px] rounded-sm mb-6">
                                Premium Digital Edition
                            </span>
                            <h2 className="text-5xl md:text-6xl font-serif font-black text-gray-900 dark:text-white mb-3 leading-[1.1] tracking-tight">
                                {book.title}
                            </h2>
                            {book.subtitle && (
                                <p className="text-xl md:text-2xl font-serif italic text-gray-500 dark:text-gray-400 mb-6 leading-snug">{book.subtitle}</p>
                            )}
                            <p className="text-xl text-gray-400 font-medium mb-8">by <span className="text-[#3D52A0] dark:text-[#7091E6] cursor-pointer hover:underline">{book.author}</span></p>

                            <div className="flex items-center gap-10 p-6 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white dark:border-white/5 mb-10 shadow-sm">
                                <div>
                                    <div className="flex text-[#FFD700] text-lg mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar key={i} className={i < Math.floor(book.averageRating || 5) ? '' : 'opacity-20'} />
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">
                                        {book.totalReviews || 0} Verified Reviews
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-gray-200 dark:bg-white/10"></div>
                                <div>
                                    <p className="text-4xl font-black text-[#3D52A0] dark:text-white tracking-tighter">
                                        ₹{book.retailPrice || 0}
                                    </p>
                                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest leading-none mt-1">
                                        Instant Delivery
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            <h3 className="text-xs font-black uppercase tracking-[4px] text-gray-400 mb-4 px-1">Overview</h3>
                            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-light mb-10">
                                {book.description || "Immerse yourself in this captivating read, available instantly in our premium digital library."}
                            </p>
                        </section>

                        {/* Specification Grid: Icon-based cards */}
                        <section className="animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                                {[
                                    { icon: FaBook, label: 'Category', value: book.category },
                                    { icon: FaFileAlt, label: 'Language', value: book.language || 'English' },
                                    { icon: FaLayerGroup, label: 'Pages', value: `${book.pageCount || 'Unknown'} pp` },
                                    { icon: FaBuilding, label: 'Publisher', value: book.publisher || 'Independent' },
                                    { icon: FaGlobe, label: 'Region', value: 'International' },
                                    { icon: FaTimes, label: 'ISBN', value: book.isbn || 'N/A' }
                                ].map((spec, i) => (
                                    <div key={i} className="p-5 bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1">
                                        <spec.icon className="text-[#3D52A0] mb-3 text-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">{spec.label}</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{spec.value}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Actions */}
                        <section className="space-y-6 pt-10 border-t border-gray-100 dark:border-white/10 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
                            {book.isPurchased ? (
                                <button
                                    onClick={handleReadNow}
                                    className="group relative overflow-hidden w-full py-5 bg-gradient-to-r from-[#7091E6]/80 to-[#8B5CF6]/80 hover:from-[#3D52A0] hover:to-[#7091E6] active:from-[#2A3B7D] active:to-[#3D52A0] text-white font-black uppercase tracking-[3px] text-xs transition-all duration-500 shadow-[0_15px_30px_-5px_rgba(61,82,160,0.2)] hover:shadow-[0_20px_50px_-5px_rgba(61,82,160,0.6)] flex items-center justify-center gap-3 hover:-translate-y-1.5 active:scale-95 rounded-2xl border border-white/30"
                                >
                                    {/* Shimmer Effect */}
                                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[25deg] group-hover:animate-shimmer pointer-events-none" />

                                    <FaBookOpen className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                                    <span>Read Now</span>
                                </button>
                            ) : (
                                <div className="flex flex-col md:flex-row items-stretch gap-4 w-full">
                                    {/* Add to Cart */}
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={isInCart(id)}
                                        className={`flex-1 py-4 px-2 font-black uppercase tracking-[1.5px] text-[11px] transition-all duration-500 flex items-center justify-center gap-2 border-2 rounded-2xl ${isInCart(id)
                                            ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                            : 'border-[#3D52A0] text-[#3D52A0] hover:bg-[#3D52A0] hover:text-white hover:-translate-y-1 active:scale-95 shadow-sm'}`}
                                    >
                                        <FaShoppingCart size={13} /> <span>{isInCart(id) ? 'In Cart' : 'Add to Cart'}</span>
                                    </button>

                                    {/* Read Now */}
                                    <button
                                        onClick={() => navigate(`/book/${id}/read-3d`)}
                                        className="flex-1 py-4 px-2 bg-white dark:bg-white/5 border-2 border-[#3D52A0] text-[#3D52A0] dark:text-[#7091E6] font-black uppercase tracking-[1.5px] text-[11px] transition-all duration-500 flex items-center justify-center gap-3 hover:bg-[#3D52A0] hover:text-white rounded-2xl active:scale-95 shadow-sm"
                                    >
                                        <FaBookOpen size={13} />
                                        <span>Read Now</span>
                                    </button>

                                    {/* Download Catalog */}
                                    {book.catalogUrl && (
                                        <a
                                            href={book.catalogUrl.startsWith('http') ? book.catalogUrl : `${API_URL}${book.catalogUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-4 px-2 bg-[#3D52A0] border-2 border-[#3D52A0] text-white font-black uppercase tracking-[1.5px] text-[11px] transition-all duration-500 flex items-center justify-center gap-2 hover:bg-white hover:text-[#3D52A0] rounded-2xl active:scale-95 shadow-[0_10px_20px_rgba(61,82,160,0.2)] hover:shadow-[0_15px_30px_rgba(61,82,160,0.4)] whitespace-nowrap"
                                        >
                                            <FaDownload size={12} />
                                            <span>Download Catalog</span>
                                        </a>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                {/* Tags */}
                {book.tags && book.tags.length > 0 && (
                    <div className="mt-20 flex flex-wrap gap-3 justify-center">
                        {book.tags.map((tag, i) => (
                            <span key={i} className="px-5 py-2 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-gray-100 dark:border-white/5 text-[10px] font-black uppercase tracking-[2px] text-gray-500 rounded-full hover:bg-[#3D52A0] hover:text-white transition-all cursor-default translate-y-0 hover:-translate-y-1">#{tag}</span>
                        ))}
                    </div>
                )}

                {/* Review Section */}
                <div className="mt-32 pt-20 border-t border-gray-100 dark:border-white/10">
                    <BookReviewSection
                        bookId={parseInt(id)}
                        currentUser={user}
                        onReviewUpdate={fetchBookDetails}
                    />
                </div>

                {/* Related Books Section */}
                {relatedBooks.length > 0 && (
                    <div className="mt-32">
                        <div className="flex flex-col items-center mb-16 px-4">
                            <span className="text-[#3D52A0] text-[10px] font-black uppercase tracking-[5px] mb-4">You may also like</span>
                            <h2 className="text-4xl font-serif font-black text-gray-900 dark:text-white text-center">Curated Suggestions</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
                            {relatedBooks.map((related) => (
                                <div key={related.id || related._id} className="group cursor-pointer">
                                    <div className="relative overflow-hidden bg-white dark:bg-gray-900 mb-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 aspect-[3/4.2]">
                                        <img
                                            src={getImageUrl(related.coverImage)}
                                            alt={related.title}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            onClick={() => navigate(`/book/${related.id || related._id}`)}
                                        />
                                        <div className="absolute inset-x-4 bottom-4 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                            <button
                                                onClick={() => navigate(`/book/${related.id || related._id}`)}
                                                className="w-full py-4 bg-[#3D52A0] text-white backdrop-blur-md transition-all text-[12px] font-black uppercase tracking-[2px] rounded-xl shadow-2xl"
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-center px-4">
                                        <h3 className="text-sm font-black font-serif text-gray-900 dark:text-white mb-2 group-hover:text-[#3D52A0] transition-colors line-clamp-1 uppercase tracking-tight">{related.title}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{related.author}</p>
                                        <p className="text-[#3D52A0] dark:text-[#7091E6] font-black mt-3 text-lg">₹{related.retailPrice || 0}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals with premium blur */}
            {
                showImageModal && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6"
                        onClick={() => setShowImageModal(false)}
                    >
                        <button className="absolute top-8 right-8 text-white/50 text-4xl hover:text-white hover:rotate-90 transition-all duration-500" onClick={() => setShowImageModal(false)}>&times;</button>
                        <img src={selectedImage || getImageUrl(book.coverImage)} alt="Full View" className="max-w-full max-h-[85vh] object-contain shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-2xl" onClick={(e) => e.stopPropagation()} />
                    </div>
                )
            }

            <style>{`
                @keyframes shimmer {
                    0% { left: -100%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { left: 100%; opacity: 0; }
                }
                .group-hover\\:animate-shimmer {
                    animation: shimmer 1.2s ease-in-out infinite;
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div >
    );
};

export default BookDetailsPage;
