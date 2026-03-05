import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    FaArrowLeft, FaSearchMinus, FaSearchPlus, FaExpand, FaCompress,
    FaLock, FaCrown, FaSun, FaMoon, FaChevronLeft, FaChevronRight,
    FaStickyNote, FaTimes, FaSave, FaCheckCircle, FaBookmark,
    FaEraser
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from '../utils/sweetalert';
import readerService from '../services/readerService';
import bookService from '../services/bookService';
import highlightService from '../services/highlightService';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../utils/constants';
import settingsService from '../services/settingsService';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Preloader from '../components/Preloader';

// Configure PDF.js worker for maximum speed via CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UnifiedReaderPage = () => {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { darkMode, toggleTheme } = useTheme();

    // State
    const [book, setBook] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [isPdfLoading, setIsPdfLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isPurchased, setIsPurchased] = useState(false);
    const [previewPages, setPreviewPages] = useState([1, 2]);
    const [readPages, setReadPages] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [isExiting, setIsExiting] = useState(false);
    const controlTimeoutRef = useRef(null);
    const [selectionWarningRef] = useState({ current: 0 });
    const containerRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    // Highlight State
    const [highlights, setHighlights] = useState([]);
    const [selectedText, setSelectedText] = useState('');
    const [menuPosition, setMenuPosition] = useState(null);
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);
    const [isHighlightEnabled, setIsHighlightEnabled] = useState(false);
    const [isSecurityEnabled, setIsSecurityEnabled] = useState(true);



    // Unified Fetch for Book & Highlights
    useEffect(() => {
        const fetchAllData = async () => {
            if (!bookId) return;
            setHighlights([]); // Clear previous book's highlights

            try {
                setLoading(true);
                let bookData = null;

                // 1. Fetch Book Data
                if (user) {
                    const response = await readerService.getBook(bookId);
                    if (response.success) {
                        bookData = response.data;
                        const isFree = Number(bookData.retailPrice) === 0;
                        const purchasedFlag = bookData.isPurchased === true || bookData.isPurchased === 'true';
                        const isAdmin = user.role === 'admin';
                        setIsPurchased(!!(purchasedFlag || isFree || isAdmin));
                    }
                } else {
                    const response = await bookService.getBookById(bookId);
                    const bData = response.data?.book || response.book || response.data;
                    if (bData) {
                        bookData = { ...bData, isPurchased: false };
                        const isFree = Number(bData.retailPrice) === 0;
                        setIsPurchased(isFree);
                    }
                }

                if (bookData) {
                    setBook(bookData);
                    // Use new previewPages array, fallback to old start/end
                    if (Array.isArray(bookData.previewPages) && bookData.previewPages.length > 0) {
                        setPreviewPages(bookData.previewPages.map(Number));
                    } else {
                        setPreviewPages([Number(bookData.previewStartPage) || 1, Number(bookData.previewEndPage) || 2]);
                    }

                    const apiBase = API_URL.replace(/\/api$/, '');

                    // PDF URL Logic
                    const isFree = Number(bookData.retailPrice) === 0;
                    const purchasedFlag = bookData.isPurchased === true || bookData.isPurchased === 'true';
                    const isAdmin = user?.role === 'admin';

                    if (user && (purchasedFlag || isFree || isAdmin)) {
                        try {
                            const tokenRes = await readerService.getDownloadToken(bookId);
                            if (tokenRes.success && tokenRes.data?.downloadUrl) {
                                setPdfUrl(`${apiBase}${tokenRes.data.downloadUrl}`);
                            } else {
                                setPdfUrl(bookData.fileUrl?.startsWith('http') ? bookData.fileUrl : `${apiBase}${bookData.fileUrl?.startsWith('/') ? '' : '/'}${bookData.fileUrl}`);
                            }
                        } catch (e) {
                            setPdfUrl(bookData.fileUrl?.startsWith('http') ? bookData.fileUrl : `${apiBase}${bookData.fileUrl?.startsWith('/') ? '' : '/'}${bookData.fileUrl}`);
                        }
                    } else {
                        let streamingUrl = `/api/downloads/stream/${bookId}?preview=true`;
                        if (user?.id) streamingUrl += `&uid=${user.id}`;
                        setPdfUrl(`${apiBase}${streamingUrl}`);
                    }

                    // 2. Fetch Highlights (Allow fetching if logged in, even in preview)
                    if (user) {
                        const numericBookId = parseInt(bookId);
                        console.log(`🔍 Fetching highlights for book ${numericBookId}...`);
                        try {
                            const hResponse = await highlightService.getHighlights(numericBookId);
                            if (hResponse.success) {
                                console.log(`✅ Success! Highlights fetched:`, hResponse.data?.length || 0);
                                if (hResponse.data?.length > 0) {
                                    console.log('📌 First highlight sample:', JSON.stringify(hResponse.data[0].position));
                                }
                                setHighlights(hResponse.data || []);
                            }
                        } catch (hErr) {
                            console.error("❌ Failed to fetch highlights:", hErr);
                        }

                        // Restore Page Number from progress
                        if (bookData.lastReadPage && bookData.lastReadPage > 1) {
                            console.log(`📖 Restoring last read page: ${bookData.lastReadPage}`);
                            setPageNumber(bookData.lastReadPage);
                        }

                        // Restore Bookmarks
                        if (bookData.bookmarks && Array.isArray(bookData.bookmarks)) {
                            console.log(`🔖 Restoring ${bookData.bookmarks.length} bookmarks`);
                            setBookmarks(bookData.bookmarks);
                        }
                    }
                }

                // Security Settings fetch is now handled by a dedicated reactive useEffect
            } catch (err) {
                console.error('Error fetching data:', err);
                toast.error('Failed to load book data');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [bookId, user]);

    // Dedicated Reactive Security Settings Fetcher
    useEffect(() => {
        const fetchSecurity = async () => {
            try {
                const secRes = await settingsService.getSecuritySettings();
                if (secRes.screenshotProtection !== undefined) {
                    setIsSecurityEnabled(secRes.screenshotProtection);
                    console.log("🛡️ Security Protection:", secRes.screenshotProtection ? "ENABLED" : "DISABLED");
                }
            } catch (e) {
                console.log("Error fetching security settings");
            }
        };

        fetchSecurity(); // Initial check

        // Re-check whenever window gets focus (Admin toggled setting in another tab)
        window.addEventListener('focus', fetchSecurity);
        return () => window.removeEventListener('focus', fetchSecurity);
    }, []);

    // Debugging: Log highlights state changes
    useEffect(() => {
        if (highlights.length > 0) {
            console.log(`📌 Highlight state updated. Current count: ${highlights.length}`);
        }
    }, [highlights]);

    // Handle Text Selection
    const handleTextSelection = useCallback(() => {
        if (!user || !isHighlightEnabled) return; // Only if logged in AND mode is ON

        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text && text.length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Only show menu if selection is within a page
            const pageElement = range.startContainer.parentElement.closest('.pdf-page-wrapper');
            if (pageElement) {
                setSelectedText(text);
                setMenuPosition({
                    top: rect.top + window.scrollY - 50,
                    left: rect.left + rect.width / 2
                });
                setShowHighlightMenu(true);
            }
        } else {
            setShowHighlightMenu(false);
        }
    }, [user, isPurchased, isHighlightEnabled]); // Added user to dependencies

    const handleAddHighlight = async (color = '#ffeb3b') => {
        if (!user || !selectedText) return;

        try {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const wrapper = range.startContainer.parentElement.closest('.pdf-page-wrapper');
            const container = wrapper?.querySelector('.pdf-page-container');
            if (!wrapper || !container) return;

            const pageNum = parseInt(wrapper.id.split('_').pop());
            const pageRect = container.getBoundingClientRect();

            // Calculate rects relative to page percentage
            const selectionRects = Array.from(range.getClientRects()).map(rect => ({
                top: ((rect.top - pageRect.top) / pageRect.height) * 100,
                left: ((rect.left - pageRect.left) / pageRect.width) * 100,
                width: (rect.width / pageRect.width) * 100,
                height: (rect.height / pageRect.height) * 100
            }));

            if (color === 'eraser') {
                // Find all highlights that overlap with this selection and delete them
                const overlappingHighlights = highlights.filter(h => {
                    if ((h.position?.pageNumber || h.pageNumber) !== pageNum) return false;
                    const hRects = h.position?.rects || h.rects || [];
                    return selectionRects.some(sRect =>
                        hRects.some(hr => {
                            const overlapX = Math.max(0, Math.min(sRect.left + sRect.width, hr.left + hr.width) - Math.max(sRect.left, hr.left));
                            const overlapY = Math.max(0, Math.min(sRect.top + sRect.height, hr.top + hr.height) - Math.max(sRect.top, hr.top));
                            return (overlapX * overlapY) > 2;
                        })
                    );
                });

                if (overlappingHighlights.length > 0) {
                    for (const h of overlappingHighlights) {
                        await handleDeleteHighlight(h._id || h.id);
                    }
                    toast.success("Area erased");
                }
                setShowHighlightMenu(false);
                window.getSelection().removeAllRanges();
                return;
            }

            // Overwrite logic: Find and remove overlapping highlights before adding the new one
            const overlappingHighlights = highlights.filter(h => {
                if ((h.position?.pageNumber || h.pageNumber) !== pageNum) return false;
                const hRects = h.position?.rects || h.rects || [];
                return selectionRects.some(sRect =>
                    hRects.some(hr => {
                        const overlapX = Math.max(0, Math.min(sRect.left + sRect.width, hr.left + hr.width) - Math.max(sRect.left, hr.left));
                        const overlapY = Math.max(0, Math.min(sRect.top + sRect.height, hr.top + hr.height) - Math.max(sRect.top, hr.top));
                        return (overlapX * overlapY) > 2; // Significant overlap
                    })
                );
            });

            if (overlappingHighlights.length > 0) {
                for (const h of overlappingHighlights) {
                    await handleDeleteHighlight(h._id || h.id);
                }
            }

            const highlightData = {
                bookId: parseInt(bookId),
                content: selectedText,
                color,
                position: {
                    pageNumber: pageNum,
                    rects: selectionRects
                }
            };

            const tempId = `temp_${Date.now()}`;
            const optimisticHighlight = {
                id: tempId,
                bookId: parseInt(bookId),
                content: selectedText,
                color,
                position: {
                    pageNumber: pageNum,
                    rects: selectionRects
                }
            };

            // Add optimistically for instant feedback
            setHighlights(prev => [...prev, optimisticHighlight]);

            const response = await highlightService.addHighlight(highlightData);
            if (response.success) {
                // Replace optimistic with real data
                setHighlights(prev => prev.map(h => h.id === tempId ? response.data : h));
                console.log("💾 Highlight saved to database successfully.");
            }
        } catch (error) {
            console.error("Highlight error:", error);
            toast.error("Failed to add highlight");
            setHighlights(prev => prev.filter(h => h.id !== tempId));
        } finally {
            setShowHighlightMenu(false);
            window.getSelection().removeAllRanges();
            setSelectedText('');
        }
    };



    const handleClearPageHighlights = async (pageNum) => {
        const pageHighlights = highlights.filter(h => (h.position?.pageNumber || h.pageNumber) == pageNum);
        if (pageHighlights.length === 0) return;

        if (window.confirm(`Are you sure you want to remove all highlights from page ${pageNum}?`)) {
            try {
                const batchToDelete = [...pageHighlights];

                // Use Promise.allSettled to attempt all deletions even if one fails
                const deletePromises = batchToDelete.map(h => {
                    const id = h._id || h.id;
                    if (id?.toString().startsWith('temp_')) return Promise.resolve({ success: true, isTemp: true });
                    return highlightService.deleteHighlight(id);
                });
                const results = await Promise.allSettled(deletePromises);

                const failedCount = results.filter(r =>
                    r.status === 'rejected' &&
                    r.reason?.response?.status !== 404
                ).length;

                // Remove successfully deleted highlights from state
                const deletedIds = batchToDelete
                    .filter((_, index) => results[index].status === 'fulfilled')
                    .map(h => h._id || h.id);

                setHighlights(prev => prev.filter(h => !deletedIds.includes(h._id || h.id)));

                if (failedCount === 0) {
                    toast.success(`Cleared highlights from page ${pageNum}`);
                } else {
                    toast.warning(`Cleared most highlights, but ${failedCount} failed to remove.`);
                }
            } catch (err) {
                console.error("Clear page error:", err);
                toast.error("Failed to clear highlights. Please try again.");
            }
        }
    };

    const handleDeleteHighlight = async (id) => {
        if (!id) return;
        try {
            const highlightToDelete = highlights.find(h => (h._id === id || h.id === id));
            if (!highlightToDelete) return;

            // If it's a local/temporary highlight, just remove it from state
            if (id.toString().startsWith('temp_')) {
                setHighlights(prev => prev.filter(h => h._id !== id && h.id !== id));
                return;
            }

            const response = await highlightService.deleteHighlight(id);
            if (response.success) {
                setHighlights(prev => prev.filter(h => h._id !== id && h.id !== id));
            }

        } catch (err) {
            // If the server says 404, the highlight is already gone, so just update state
            if (err.response?.status === 404) {
                setHighlights(prev => prev.filter(h => h._id !== id && h.id !== id));
                return;
            }
            console.error("Delete error:", err);
            toast.error("Failed to remove highlight");
        }
    };

    const handleToggleBookmark = () => {
        if (!isPurchased) {
            toast.warning("Purchase the book to use bookmarks!");
            return;
        }

        const isBookmarked = bookmarks.includes(pageNumber);
        console.log(`🔖 Toggling bookmark for page ${pageNumber}. Currently bookmarked: ${isBookmarked}`);
        let newBookmarks;
        if (isBookmarked) {
            newBookmarks = [];
            toast.info(`Removed bookmark`);
        } else {
            newBookmarks = [pageNumber];
            toast.success(`Bookmarked page ${pageNumber}`);
        }
        console.log('🔖 New Bookmarks State:', newBookmarks);
        setBookmarks(newBookmarks);

        // Immediate save for bookmarks
        readerService.updateProgress(bookId, {
            page: pageNumber,
            totalPages: numPages,
            bookmarks: newBookmarks
        }).catch(err => console.error("Failed to save bookmark", err));
    };

    // Save Progress (Debounced)
    useEffect(() => {
        if (!bookId || !isPurchased || !numPages) return;

        const saveTimeout = setTimeout(() => {
            const progress = numPages > 0 ? (readPages.length / numPages) * 100 : 0;
            readerService.updateProgress(bookId, {
                page: pageNumber,
                totalPages: numPages,
                progress: progress,
                bookmarks: bookmarks
            }).catch(err => console.error("Failed to save progress", err));
        }, 3000);

        return () => clearTimeout(saveTimeout);
    }, [pageNumber, bookId, isPurchased, numPages, readPages, bookmarks]);





    // State for temporary screen blur on security violation
    const [isBlurred, setIsBlurred] = useState(false);

    // Security Features
    useEffect(() => {
        if (!isSecurityEnabled) return;

        const preventDefault = (e) => e.preventDefault();
        document.addEventListener('contextmenu', preventDefault);

        const handleKeyDown = (e) => {
            // Prevent Ctrl+A (Select All), Ctrl+C (Copy), Ctrl+X (Cut), Ctrl+V (Paste)
            if (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'x' || e.key === 'v')) {
                e.preventDefault();
                toast.warning("Action disabled for security.");
                return;
            }

            // Prevent Print, Save, Inspect actions
            if (
                e.key === 'PrintScreen' ||
                (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u' || e.key === 'Shift')) ||
                (e.metaKey && e.shiftKey)
            ) {
                e.preventDefault();

                // Trigger Blur Effect
                setIsBlurred(true);
                setTimeout(() => setIsBlurred(false), 2000); // Remove blur after 2s

                toast.error("⚠️ Screenshot Attempt Detected!", {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    theme: "dark",
                });

                // Haptic feedback if available (Warning vibration)
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            }
        };

        // Additional trap for PrintScreen on keyup (some OS/Browsers only fire this)
        const handleKeyUp = (e) => {
            if (e.key === 'PrintScreen') {
                // Trigger Blur Effect
                setIsBlurred(true);
                setTimeout(() => setIsBlurred(false), 2000); // Remove blur after 2s

                toast.error("⚠️ Screenshot Attempt Detected!", {
                    position: "top-right",
                    theme: "dark"
                });
                // Clear clipboard if possible (not always allowed)
                try { navigator.clipboard.writeText(''); } catch (err) { }
            }
        };

        // Auto-Blur on Window Focus Loss (e.g. Snipping Tool opened)
        const handleWindowBlur = () => {
            setIsBlurred(true);
        };

        const handleWindowFocus = () => {
            setIsBlurred(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);

        // Prevent Copy/Cut/Paste events directly
        const preventCopy = (e) => {
            e.preventDefault();
            toast.warning("Copying content is disabled for security.");
        };

        document.addEventListener('copy', preventCopy);
        document.addEventListener('cut', preventCopy);
        document.addEventListener('paste', preventCopy);

        // Prevent Selection
        const preventSelection = (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                if (isPurchased) return; // Allow selection for purchased users

                e.preventDefault();

                // Throttle toast
                const now = Date.now();
                if (now - selectionWarningRef.current > 2000) {
                    const message = user
                        ? "Purchase this book to use the highlight feature! 💎"
                        : "Login and purchase to unlock highlighting. 🔒";
                    toast.info(message, {
                        theme: "dark",
                        autoClose: 3000
                    });
                    selectionWarningRef.current = now;
                }
            }
        };
        document.addEventListener('selectstart', preventSelection);

        return () => {
            document.removeEventListener('contextmenu', preventDefault);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('copy', preventCopy);
            document.removeEventListener('cut', preventCopy);
            document.removeEventListener('paste', preventCopy);
            document.removeEventListener('selectstart', preventSelection);
        };
    }, [isPurchased, user, isSecurityEnabled]);

    // Clear blur if security is disabled
    useEffect(() => {
        if (!isSecurityEnabled) {
            setIsBlurred(false);
        }
    }, [isSecurityEnabled]);

    // Handle PDF Load
    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setIsPdfLoading(false);
    };

    const onDocumentLoadError = (error) => {
        console.error('PDF Load Error:', error);
        setIsPdfLoading(false);
        toast.error('Failed to load PDF file.');
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= (numPages || 1)) {
            if (isPurchased) {
                setPageNumber(newPage);
            } else {
                if (previewPages.includes(newPage)) {
                    setPageNumber(newPage);
                } else {
                    toast.warning("Purchase the book to access all pages.");
                }
            }
        }
    };

    const handleBack = () => {
        setIsExiting(true);
        setPdfUrl(null); // Clear resource heavy URL
        setNumPages(null); // Force unmount of all pages
        setTimeout(() => {
            navigate(user ? '/reader/library' : '/');
        }, 100);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Auto-hide controls disabled as per user feedback to keep navbar visible
    useEffect(() => {
        setShowControls(true);
    }, []);

    // Fullscreen change listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Check if current page is accessible
    const isPageAccessible = (pageNum) => {
        if (isPurchased) return true;
        return previewPages.includes(pageNum);
    };

    // Auto-scroll to page when pageNumber changes
    useEffect(() => {
        // Construct ID based on mode
        const targetId = isPurchased ? `page_${pageNumber}` : `preview_page_${pageNumber}`;
        const pageElement = document.getElementById(targetId);

        if (pageElement && containerRef.current) {
            const container = containerRef.current;
            const elementRect = pageElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Calculate relative scroll position with 80px offset for the navbar
            const scrollOffset = (elementRect.top - containerRect.top) + container.scrollTop - 90;

            container.scrollTo({
                top: scrollOffset,
                behavior: 'smooth'
            });
        }
    }, [pageNumber, isPurchased, previewPages]);

    return (
        <div className={`h-screen w-screen overflow-hidden relative transition-all duration-300 ${isSecurityEnabled ? 'print:hidden' : ''} ${isBlurred ? 'blur-xl scale-105 pointer-events-none' : ''} ${darkMode ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
            }`}>
            {/* Real Preloader - Controlled by loading state */}
            <Preloader isLoading={loading || isPdfLoading} message={loading ? "Fetching book data..." : "Opening your book..."} />
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${darkMode ? 'white' : 'black'} 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Watermark Security Layer */}
            <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden opacity-5">
                <div className="w-[150%] h-[150%] -rotate-45 flex flex-wrap gap-20 items-center justify-center -translate-x-1/4 -translate-y-1/4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <span key={i} className={`text-xl font-bold whitespace-nowrap ${darkMode ? 'text-white' : 'text-black'}`}>
                            {user?.email || 'Protected Content'}
                        </span>
                    ))}
                </div>
            </div>

            {/* Top Toolbar */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ y: -100 }}
                        animate={{ y: 0 }}
                        exit={{ y: -100 }}
                        transition={{ duration: 0.3 }}
                        className={`fixed top-0 left-0 right-0 z-50 h-20 backdrop-blur-xl border-b ${darkMode
                            ? 'bg-black/40 border-white/10'
                            : 'bg-white/40 border-gray-200/50'
                            }`}
                    >
                        <div className="h-full px-6 flex items-center justify-between">
                            {/* Left Section */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleBack}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${darkMode
                                        ? 'bg-white/10 hover:bg-white/20 text-white'
                                        : 'bg-gray-900/10 hover:bg-gray-900/20 text-gray-900'
                                        }`}
                                >
                                    <FaArrowLeft size={18} />
                                </button>
                                <div>
                                    <h1 className={`font-bold text-lg flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {book?.title || 'Reader'}
                                        {!(isPurchased || book?.retailPrice === 0 || book?.retailPrice === "0.00" || user?.role === 'admin') && (
                                            <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-black uppercase rounded-full tracking-wider shadow-lg">
                                                Preview
                                            </span>
                                        )}
                                    </h1>
                                    <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {book?.subtitle && <span className="italic">{book.subtitle} — </span>}{book?.author}
                                    </p>
                                </div>
                            </div>

                            {/* Center Section - Page Navigation */}
                            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl backdrop-blur-md ${darkMode ? 'bg-white/5' : 'bg-gray-900/5'
                                }`}>
                                <button
                                    onClick={() => handlePageChange(pageNumber - 1)}
                                    disabled={pageNumber === 1}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${darkMode
                                        ? 'hover:bg-white/10 text-white disabled:opacity-30'
                                        : 'hover:bg-gray-900/10 text-gray-900 disabled:opacity-30'
                                        }`}
                                >
                                    <FaChevronLeft />
                                </button>
                                <div className={`flex items-center gap-2 min-w-[120px] justify-center ${darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    <input
                                        type="number"
                                        value={pageNumber}
                                        onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                                        className={`w-14 text-center font-mono font-bold text-lg bg-transparent border-b-2 outline-none ${darkMode ? 'border-white/20' : 'border-gray-900/20'
                                            }`}
                                    />
                                    <span className="text-sm opacity-60">/ {isPurchased ? (book?.totalPages || numPages || '...') : previewPages.length}</span>
                                </div>
                                <button
                                    onClick={() => handlePageChange(pageNumber + 1)}
                                    disabled={pageNumber === numPages}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${darkMode
                                        ? 'hover:bg-white/10 text-white disabled:opacity-30'
                                        : 'hover:bg-gray-900/10 text-gray-900 disabled:opacity-30'
                                        }`}
                                >
                                    <FaChevronRight />
                                </button>
                            </div>

                            {/* Right Section */}
                            <div className="flex items-center gap-3">
                                {/* Zoom Controls */}
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-gray-900/5'
                                    }`}>
                                    <button
                                        onClick={() => setScale(Math.max(0.6, scale - 0.2))}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${darkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-900/10 text-gray-900'
                                            }`}
                                    >
                                        <FaSearchMinus size={14} />
                                    </button>
                                    <span className={`w-16 text-center text-sm font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {Math.round(scale * 100)}%
                                    </span>
                                    <button
                                        onClick={() => setScale(Math.min(2.5, scale + 0.2))}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${darkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-900/10 text-gray-900'
                                            }`}
                                    >
                                        <FaSearchPlus size={14} />
                                    </button>
                                </div>

                                {/* Highlight Toggle */}
                                {user && (
                                    <button
                                        onClick={() => {
                                            setIsHighlightEnabled(!isHighlightEnabled);
                                            if (!isHighlightEnabled) {
                                                toast.info("Highlight Mode Enabled 💡. Select text to highlight.", { autoClose: 2000 });
                                            } else {
                                                toast.info("Highlight Mode Disabled.", { autoClose: 2000 });
                                            }
                                        }}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isHighlightEnabled
                                            ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 scale-110'
                                            : darkMode ? 'bg-white/10 text-white opacity-50' : 'bg-gray-900/10 text-gray-900 opacity-50'
                                            }`}
                                        title="Toggle Highlight Mode"
                                    >
                                        <FaStickyNote size={18} />
                                    </button>
                                )}

                                {/* Bookmark Toggle */}
                                {user && isPurchased && (
                                    <button
                                        onClick={handleToggleBookmark}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${bookmarks.includes(pageNumber)
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-110'
                                            : darkMode ? 'bg-white/10 text-white opacity-50' : 'bg-gray-900/10 text-gray-900 opacity-50'
                                            }`}
                                        title="Toggle Bookmark"
                                    >
                                        <FaBookmark size={18} />
                                    </button>
                                )}

                                {/* Theme Toggle */}
                                <button
                                    onClick={toggleTheme}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${darkMode
                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                        }`}
                                >
                                    {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
                                </button>

                                {/* Fullscreen Toggle */}
                                <button
                                    onClick={toggleFullscreen}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${darkMode
                                        ? 'bg-white/10 hover:bg-white/20 text-white'
                                        : 'bg-gray-900/10 hover:bg-gray-900/20 text-gray-900'
                                        }`}
                                >
                                    {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Highlight Menu */}
            <AnimatePresence>
                {showHighlightMenu && menuPosition && user && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        style={{
                            position: 'fixed',
                            top: menuPosition.top,
                            left: menuPosition.left,
                            transform: 'translateX(-50%)',
                            zIndex: 1000
                        }}
                        className="flex items-center gap-2 p-2 bg-gray-900 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl"
                    >
                        {['#ffeb3b', '#ff4081', '#00e676', '#00b0ff'].map(color => (
                            <button
                                key={color}
                                onClick={() => handleAddHighlight(color)}
                                className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-125 focus:ring-2 focus:ring-white/50"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div className="w-[1px] h-4 bg-white/20 mx-1" />
                        <button
                            onClick={() => handleAddHighlight('eraser')}
                            className="p-1.5 text-white/50 hover:text-red-400 transition-colors flex items-center justify-center rounded-lg hover:bg-white/5"
                            title="Erase Highlights in Selection"
                        >
                            <FaEraser size={16} />
                        </button>
                        <div className="w-[1px] h-4 bg-white/20 mx-1" />
                        <button
                            onClick={() => {
                                setShowHighlightMenu(false);
                                window.getSelection().removeAllRanges();
                            }}
                            className="p-1 text-white/50 hover:text-white transition-colors"
                        >
                            <FaTimes size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main PDF Reader Container */}
            <div
                ref={containerRef}
                onMouseUp={handleTextSelection}
                onScroll={(e) => {
                    if (isExiting) return;
                    const container = e.target;
                    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
                    scrollTimeoutRef.current = setTimeout(() => {
                        const pageElements = container.querySelectorAll('[id^="page_"], [id^="preview_page_"]');
                        let closestPage = pageNumber;
                        let minDistance = Infinity;

                        pageElements.forEach(el => {
                            const rect = el.getBoundingClientRect();
                            const distance = Math.abs(rect.top - 100); // Adjust 100px offset for toolbar
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestPage = parseInt(el.id.split('_').pop());
                            }
                        });

                        if (closestPage !== pageNumber) {
                            // Only update state if it's a real page number
                            if (!isNaN(closestPage)) setPageNumber(closestPage);
                        }
                    }, 100);
                }}
                className={`h-full w-full overflow-x-hidden overflow-y-auto flex flex-col items-center pt-24 pb-8 relative custom-scrollbar ${isHighlightEnabled ? 'select-text' : ''}`}
            >
                {pdfUrl ? (
                    <Document
                        file={{ url: pdfUrl, withCredentials: true }}
                        className="flex flex-col items-center min-h-min"
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        key={pdfUrl}
                        loading={null}
                        error={
                            <div className={`flex flex-col items-center justify-center p-10 rounded-3xl ${darkMode ? 'bg-black/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                <FaLock className="text-4xl mb-4" />
                                <h3 className="text-xl font-bold uppercase tracking-widest">Access Denied or Load Failed</h3>
                                <p className="mt-2 text-sm opacity-70">Unable to load the secure PDF stream.</p>
                            </div>
                        }
                    >
                        {/* Render pages based on purchase status */}
                        {numPages && (
                            <>
                                {isPurchased ? (
                                    // Premium: Show ALL pages stacked vertically
                                    <>
                                        {Array.from({ length: numPages }, (_, index) => {
                                            const pageNum = index + 1;
                                            const isActive = pageNum === pageNumber;
                                            const isVisible = Math.abs(pageNum - pageNumber) <= 3;

                                            return (
                                                <div
                                                    key={`page_${pageNum}`}
                                                    id={`page_${pageNum}`}
                                                    className="mb-8 relative pdf-page-wrapper will-change-transform w-fit mx-auto"
                                                    style={{
                                                        minHeight: !isVisible ? `${scale * 800}px` : 'auto'
                                                    }}
                                                >
                                                    {isVisible ? (
                                                        <div className="relative group/page">
                                                            {/* PDF Page container */}
                                                            {/* Page Bookmark Ribbon - Moved outside overflow-hidden */}
                                                            {bookmarks.includes(pageNum) && (
                                                                <div className="absolute right-6 top-0 z-[60] animate-bounce-subtle pointer-events-none">
                                                                    <div className="relative">
                                                                        <FaBookmark className="text-blue-500 text-6xl drop-shadow-2xl" />
                                                                        <div className="absolute inset-0 flex items-center justify-center pt-2">
                                                                            <span className="text-xs font-black text-white">{pageNum}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* PDF Page container */}
                                                            <div className="shadow-2xl rounded-lg overflow-hidden relative group/clear pdf-page-container">
                                                                {/* Batch Clear Button */}
                                                                {isHighlightEnabled && highlights.some(h => (h.position?.pageNumber || h.pageNumber) == pageNum) && (
                                                                    <button
                                                                        onClick={() => handleClearPageHighlights(pageNum)}
                                                                        className="absolute right-4 top-4 z-50 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-xl shadow-xl transition-all duration-300 opacity-0 group-hover/clear:opacity-100 backdrop-blur-md flex items-center gap-2 text-xs font-bold"
                                                                        title="Clear all page highlights"
                                                                    >
                                                                        <FaEraser size={14} />
                                                                        <span>Clear Page</span>
                                                                    </button>
                                                                )}

                                                                <Page
                                                                    pageNumber={pageNum}
                                                                    scale={scale}
                                                                    devicePixelRatio={2}
                                                                    className="bg-white"
                                                                    renderTextLayer={isVisible}
                                                                    renderAnnotationLayer={false}
                                                                    loading={
                                                                        <div className="flex items-center justify-center h-96">
                                                                            <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${darkMode ? 'border-blue-500' : 'border-blue-600'}`} />
                                                                        </div>
                                                                    }
                                                                />
                                                                {/* Highlights Layer - High-durability rendering */}
                                                                <div className="absolute inset-0 pointer-events-none z-[5] pdf-highlights-container">
                                                                    {highlights
                                                                        .filter(h => {
                                                                            let pos = h.position;
                                                                            if (typeof pos === 'string') {
                                                                                try { pos = JSON.parse(pos); } catch (e) { pos = {}; }
                                                                            }
                                                                            return (pos?.pageNumber || h.pageNumber) == pageNum;
                                                                        })
                                                                        .map(highlight => {
                                                                            let pos = highlight.position;
                                                                            if (typeof pos === 'string') {
                                                                                try { pos = JSON.parse(pos); } catch (e) { pos = {}; }
                                                                            }
                                                                            const rects = pos?.rects || highlight.rects || [];
                                                                            return rects.map((rect, i) => (
                                                                                <div
                                                                                    key={`h_${highlight._id || highlight.id}_${i}`}
                                                                                    className="absolute cursor-pointer pointer-events-auto group/h transition-opacity hover:opacity-100"
                                                                                    style={{
                                                                                        top: `${rect.top}%`,
                                                                                        left: `${rect.left}%`,
                                                                                        width: `${rect.width}%`,
                                                                                        height: `${rect.height}%`,
                                                                                        backgroundColor: (highlight.color || '#ffeb3b'),
                                                                                        mixBlendMode: 'multiply',
                                                                                        opacity: 0.4
                                                                                    }}
                                                                                    title="Click to remove"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDeleteHighlight(highlight._id || highlight.id);
                                                                                        toast.info("Highlight removed.");
                                                                                    }}
                                                                                />
                                                                            ));
                                                                        })}
                                                                </div>
                                                            </div>

                                                            {/* Page Number Footer */}
                                                            <div className={`mt-4 text-center text-xs font-mono tracking-widest uppercase ${darkMode ? 'text-white/30' : 'text-gray-900/30'}`}>
                                                                Page {pageNum} of {numPages}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`flex items-center justify-center h-[800px] border border-dashed rounded-lg ${darkMode ? 'bg-white/5 border-white/5 text-white/20' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                                            <div className="text-xs uppercase font-bold tracking-widest animate-pulse">Page {pageNum} Loading...</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </>
                                ) : (
                                    // Preview: Show all accessible pages stacked vertically
                                    <>
                                        {previewPages.map((pageNum, index) => {
                                            const isVisible = Math.abs(pageNum - pageNumber) <= 4;

                                            return (
                                                <div
                                                    key={`preview_page_${pageNum}`}
                                                    id={`preview_page_${pageNum}`}
                                                    className="mb-8 relative pdf-page-wrapper will-change-transform w-fit mx-auto"
                                                    style={{
                                                        minHeight: !isVisible ? `${scale * 800}px` : 'auto'
                                                    }}
                                                >
                                                    {/* Page Bookmark Ribbon in Preview - Moved to wrapper */}
                                                    {bookmarks.includes(pageNum) && (
                                                        <div className="absolute right-[-20px] top-0 z-[100] animate-bounce-subtle pointer-events-none">
                                                            <div className="relative">
                                                                <FaBookmark className="text-blue-500 text-7xl drop-shadow-2xl filter brightness-110" />
                                                                <div className="absolute inset-0 flex items-center justify-center pt-2">
                                                                    <span className="text-sm font-black text-white drop-shadow-md">{pageNum}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {isVisible ? (
                                                        <div className="relative group/page">
                                                            {/* PDF Page Container */}
                                                            <div className="shadow-2xl rounded-lg overflow-hidden relative group/clear pdf-page-container">
                                                                <Page
                                                                    pageNumber={pageNum}
                                                                    scale={scale}
                                                                    devicePixelRatio={2}
                                                                    className="bg-white"
                                                                    renderTextLayer={true}
                                                                    renderAnnotationLayer={false}
                                                                    loading={
                                                                        <div className="flex items-center justify-center h-96">
                                                                            <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${darkMode ? 'border-blue-500' : 'border-blue-600'}`} />
                                                                        </div>
                                                                    }
                                                                />
                                                                {/* Highlights Layer in Preview - Fixed styling class */}
                                                                <div className="absolute inset-0 pointer-events-none z-[5] pdf-highlights-container">
                                                                    {highlights
                                                                        .filter(h => {
                                                                            let pos = h.position;
                                                                            if (typeof pos === 'string') {
                                                                                try { pos = JSON.parse(pos); } catch (e) { pos = {}; }
                                                                            }
                                                                            return (pos?.pageNumber || h.pageNumber) == pageNum;
                                                                        })
                                                                        .map(highlight => {
                                                                            let pos = highlight.position;
                                                                            if (typeof pos === 'string') {
                                                                                try { pos = JSON.parse(pos); } catch (e) { pos = {}; }
                                                                            }
                                                                            const rects = pos?.rects || highlight.rects || [];
                                                                            return rects.map((rect, i) => (
                                                                                <div
                                                                                    key={`preview_h_${highlight._id || highlight.id}_${i}`}
                                                                                    className="absolute cursor-pointer pointer-events-auto group/h transition-opacity hover:opacity-100"
                                                                                    style={{
                                                                                        top: `${rect.top}%`,
                                                                                        left: `${rect.left}%`,
                                                                                        width: `${rect.width}%`,
                                                                                        height: `${rect.height}%`,
                                                                                        backgroundColor: (highlight.color || '#ffeb3b'),
                                                                                        mixBlendMode: 'multiply',
                                                                                        opacity: 0.4
                                                                                    }}
                                                                                    title="Click to remove"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDeleteHighlight(highlight._id || highlight.id);
                                                                                        toast.info("Highlight removed.");
                                                                                    }}
                                                                                />
                                                                            ));
                                                                        })}
                                                                </div>
                                                            </div>

                                                            {/* Page Number Footer */}
                                                            <div className={`mt-4 text-center text-xs font-mono tracking-widest uppercase ${darkMode ? 'text-white/30' : 'text-gray-900/30'}`}>
                                                                Page {pageNum} of {isPurchased ? (book?.totalPages || numPages) : previewEndPage}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`flex items-center justify-center h-[800px] border border-dashed rounded-lg ${darkMode ? 'bg-white/5 border-white/5 text-white/20' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                                            <div className="text-xs uppercase font-bold tracking-widest animate-pulse">Preview Page {pageNum} Loading...</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Lock Screen after preview pages */}
                                        <motion.div
                                            key="premium_lock"
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className={`my-10 p-10 max-w-lg mx-auto rounded-3xl text-center shadow-2xl relative backdrop-blur-xl ${darkMode
                                                ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-white/10'
                                                : 'bg-gradient-to-br from-white/90 to-gray-50/90 border border-gray-200'
                                                }`}
                                        >
                                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${darkMode
                                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                                : 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                                }`}>
                                                <FaLock className="text-white text-2xl" />
                                            </div>
                                            <h2 className={`text-3xl font-black mb-3 ${darkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                Premium Content Locked
                                            </h2>
                                            <p className={`mb-8 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'
                                                }`}>
                                                You've reached the end of the preview. Purchase the full book to unlock all {book?.totalPages || numPages || '...'} pages and premium features.
                                            </p>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => navigate(user ? `/checkout/${bookId}` : '/login')}
                                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white font-bold tracking-wide hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                                                >
                                                    <FaCrown className="animate-pulse" />
                                                    {user ? 'Unlock Full Access' : 'Login to Purchase'}
                                                </button>
                                                {!user && (
                                                    <button
                                                        onClick={() => navigate('/register')}
                                                        className={`w-full py-4 rounded-2xl font-bold tracking-wide transition-all duration-300 ${darkMode
                                                            ? 'bg-white/10 hover:bg-white/20 text-white'
                                                            : 'bg-gray-900/10 hover:bg-gray-900/20 text-gray-900'
                                                            }`}
                                                    >
                                                        Create Account
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </>
                        )}
                    </Document>
                ) : (
                    <div className={`flex items-center justify-center h-full ${darkMode ? 'text-white/50' : 'text-gray-900/50'
                        }`}>
                        No Book Loaded
                    </div>
                )}
            </div>



            {/* Custom Scrollbar & PDF Fixes */}
            <style>{`
                .custom-scrollbar {
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
                }

                /* Ensure PDF Text stays above highlights for readability */
                .react-pdf__Page__textContent {
                    z-index: 10 !important;
                    opacity: 1 !important;
                }
                .react-pdf__Page__canvas {
                    z-index: 1 !important;
                }
                .pdf-highlights-container {
                    z-index: 5 !important;
                }

                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s ease-in-out infinite;
                }
            `}</style>
        </div >
    );
};

export default UnifiedReaderPage;
