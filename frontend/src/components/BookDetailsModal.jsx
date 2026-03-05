import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaEye, FaStar, FaHeart, FaShareAlt, FaCalendarAlt, FaFileAlt, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_URL } from '../utils/constants';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const BookDetailsModal = ({ book, onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useCart();
    const [showPreview, setShowPreview] = useState(false);
    const [numPages, setNumPages] = useState(null);
    const [pdfWidth, setPdfWidth] = useState(undefined);

    const bookId = book.id || book._id;
    const inWishlist = isInWishlist(bookId);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleResize = () => {
            setPdfWidth(window.innerWidth < 768 ? window.innerWidth - 60 : undefined);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    if (!book) return null;

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const handleWishlistToggle = (e) => {
        e.stopPropagation();
        if (inWishlist) {
            removeFromWishlist(bookId);
        } else {
            addToWishlist(bookId);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            <div
                className="bg-white dark:bg-gray-900 rounded-3xl max-w-5xl w-full h-[85vh] md:h-auto md:max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col md:flex-row animate-scale-in border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button - Floating */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md text-gray-800 dark:text-white transition-all transform hover:rotate-90"
                >
                    <FaTimes />
                </button>

                {showPreview ? (
                    // PREVIEW MODE
                    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900">
                        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shadow-sm z-10">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <FaEye className="text-blue-600" /> Preview Mode
                            </h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Close Preview
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6 md:p-10 flex justify-center">
                            <Document
                                file={
                                    book.fileUrl && book.fileUrl.includes('cloudinary.com')
                                        ? book.fileUrl
                                        : `${API_URL}/downloads/stream/${bookId}?preview=true`
                                }
                                onLoadSuccess={onDocumentLoadSuccess}
                                className="shadow-2xl"
                                loading={
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        Loading PDF...
                                    </div>
                                }
                            >
                                <div className="flex flex-col md:flex-row justify-center gap-8 items-start">
                                    <div className="bg-white shadow-xl rounded-sm overflow-hidden">
                                        <Page pageNumber={1} width={pdfWidth || 400} renderTextLayer={false} renderAnnotationLayer={false} />
                                    </div>
                                    {numPages >= 2 && (
                                        <div className="bg-white shadow-xl rounded-sm overflow-hidden hidden md:block relative">
                                            <Page pageNumber={2} width={pdfWidth || 400} renderTextLayer={false} renderAnnotationLayer={false} />
                                            {/* Gradient overlay for page 2 */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent pointer-events-none"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center mt-12 mb-8">
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Want to read the whole book?</h4>
                                    <button
                                        onClick={() => { setShowPreview(false); navigate(`/checkout/${bookId}`); }}
                                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 transition-all"
                                    >
                                        Unlock Full Access
                                    </button>
                                </div>
                            </Document>
                        </div>
                    </div>
                ) : (
                    // DETAILS MODE
                    <>
                        {/* Left Column: Visuals */}
                        <div className="md:w-[40%] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Decorative Circle */}
                            <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative z-10 w-full max-w-[240px] md:max-w-[280px] group perspective-1000">
                                <div className="relative transform transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1">
                                    <img
                                        src={book.coverImage?.url || book.coverImage}
                                        alt={book.title}
                                        className="w-full h-auto rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white dark:bg-gray-800"
                                    />
                                    {/* Reflection effect */}
                                    <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/20 blur-xl rounded-[100%]"></div>
                                </div>
                            </div>

                            {/* Social Proof / Stats */}
                            <div className="mt-8 flex gap-4 md:gap-6 text-gray-600 dark:text-gray-400 w-full justify-center">
                                <div className="text-center">
                                    <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                                        {Number(book.averageRating || 4.5).toFixed(1)} <FaStar className="text-yellow-400 text-sm" />
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">Rating</div>
                                </div>
                                <div className="w-px bg-gray-300 dark:bg-gray-700"></div>
                                <div className="text-center">
                                    <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                        {book.pageCount || 'N/A'}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">Pages</div>
                                </div>
                                <div className="w-px bg-gray-300 dark:bg-gray-700"></div>
                                <div className="text-center">
                                    <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                        {book.category || 'General'}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">Genre</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Content */}
                        <div className="md:w-[60%] p-6 md:p-12 flex flex-col h-full overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">

                            <div className="flex-1">
                                {/* Meta Tags */}
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-100 dark:border-blue-800">
                                        {book.category}
                                    </span>
                                    {book.isPurchased && (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 text-xs font-bold uppercase tracking-wider rounded-full border border-green-100 dark:border-green-800">
                                            <FaCheckCircle size={10} /> Purchased
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-2 leading-[1.1]">
                                    {book.title}
                                </h2>
                                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-8">
                                    by <span className="text-gray-900 dark:text-white font-semibold">{book.author}</span>
                                </p>

                                {/* Synopsis */}
                                <div className="mb-8 group">
                                    <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                                        Synopsis
                                    </h3>
                                    <div className="text-gray-600 dark:text-gray-300 leading-relaxed text-base space-y-4 max-h-[150px] md:max-h-[200px] overflow-y-auto pr-4 custom-scrollbar">
                                        <p>{book.description || "No description available for this title."}</p>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <FaCalendarAlt />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-bold uppercase">Published</div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">2023</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <FaFileAlt />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-bold uppercase">Format</div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">PDF / ePub</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="w-full sm:w-auto">
                                        {!book.isPurchased ? (
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                                        ₹{book.retailPrice || 0}
                                                    </span>
                                                    <span className="text-lg text-gray-400 line-through font-medium">
                                                        ₹{Math.round((book.retailPrice || 0) * 1.2)}
                                                    </span>
                                                </div>
                                                <div className="text-xs font-bold text-green-600 mt-1 inline-block bg-green-50 px-2 py-0.5 rounded">
                                                    Save 20%
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-green-600 dark:text-green-400 font-bold text-md flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                                                <FaCheckCircle /> Purchased on {new Date().toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 w-full sm:w-auto">
                                        {/* Wishlist Button */}
                                        {!book.isPurchased && (
                                            <button
                                                onClick={handleWishlistToggle}
                                                className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all ${inWishlist ? 'border-red-500 bg-red-50 text-red-500 dark:bg-red-900/20' : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400 dark:border-gray-700 dark:hover:border-red-500 dark:hover:text-red-500'}`}
                                                title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                                            >
                                                <FaHeart size={20} className={inWishlist ? "fill-current" : ""} />
                                            </button>
                                        )}

                                        {book.isPurchased ? (
                                            <button
                                                onClick={() => navigate(`/reader/read/${bookId}`)}
                                                className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg shadow-green-500/30 text-lg flex items-center gap-2 justify-center min-w-[200px]"
                                            >
                                                <FaBook /> Read Book
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setShowPreview(true)}
                                                    className="px-6 py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-700 transition-colors"
                                                >
                                                    Preview
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/checkout/${bookId}`)}
                                                    className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 text-lg min-w-[160px]"
                                                >
                                                    Buy Now
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default BookDetailsModal;
