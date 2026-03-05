import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageFlip } from 'page-flip';
import * as pdfjsLib from 'pdfjs-dist';
import {
    FaChevronLeft, FaChevronRight, FaMoon, FaSun, FaSearchPlus, FaSearchMinus,
    FaArrowLeft, FaBookmark, FaExpand, FaCompress, FaBookOpen, FaPlay, FaPause,
    FaRegSquare, FaColumns, FaThLarge, FaChevronDown, FaPenNib, FaEllipsisV, FaChevronUp
} from 'react-icons/fa';
import toast from '../utils/sweetalert';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash, FaCloud, FaMusic, FaHighlighter, FaMousePointer, FaEraser, FaTrash, FaCaretLeft } from 'react-icons/fa';
import bookService from '../services/bookService';
import readerService from '../services/readerService';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/constants';
import settingsService from '../services/settingsService';
import highlightService from '../services/highlightService';
import 'react-pdf/dist/Page/TextLayer.css';


// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

// --- DRAWING COLOR PALETTE ---
const DRAW_COLORS = [
    '#000000', '#424242', '#757575', '#BDBDBD', '#E0E0E0', '#FFFFFF',
    '#C2185B', '#D32F2F', '#F57C00', '#FBC02D', '#FFEB3B', '#FFEA00',
    '#AFB42B', '#388E3C', '#00796B', '#00BCD4', '#0055ff', '#512DA8',
    '#6200EA', '#7B1FA2', '#FFCCBC', '#BCAAA4', '#8D6E63', '#5D4037',
    '#FF66FF', '#FFB74D', '#FFF59D', '#81C784', '#81D4FA', '#B39DDB'
];

// --- GLOWING PARTICLE BACKGROUND COMPONENT ---
const ParticleBackground = ({ darkMode }) => {
    const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className={`absolute rounded-full ${darkMode ? 'bg-white' : 'bg-emerald-500'}`}
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        opacity: darkMode ? 0.05 : 0.1,
                        filter: 'blur(1px)'
                    }}
                    animate={{
                        y: [0, -100, 0],
                        x: [0, Math.random() * 50 - 25, 0],
                        opacity: [0, 0.3, 0]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
};

// --- ATMOSPHERIC ELEMENTS ---
const Sphere = ({ delay, size, left, top, color }) => (
    <div
        className={`absolute rounded-full blur-3xl opacity-20 animate-pulse ${color}`}
        style={{
            width: size,
            height: size,
            left: left,
            top: top,
            zIndex: 0,
            animationDuration: `${Math.random() * 5 + 5}s`,
            transition: 'background-color 1s ease'
        }}
    />
);

// --- DYNAMIC BOOK EDGE SHADOW LOGIC ---
const getStackShadow = (percent, isLeft) => {
    if (percent <= 0) return [];
    const steps = Math.max(2, Math.min(6, Math.round(percent / 20) + 1));
    const shadows = [];
    const signX = isLeft ? -1 : 1;

    for (let i = 1; i < steps; i++) {
        shadows.push(`${i * signX * 1.5}px 0px 0 #fafafa`);
    }
    shadows.push(`${steps * signX * 1.5}px 0px 0 #ddd`);

    let blur = 8;
    let alpha = 0.1;

    if (steps === 3) { blur = 10; alpha = 0.15; }
    else if (steps === 4 || steps === 5) { blur = 15; alpha = 0.15; }
    else if (steps === 6) { blur = 20; alpha = 0.2; }

    shadows.push(`${steps * 2 * signX}px 5px ${blur}px rgba(0, 0, 0, ${alpha})`);

    return shadows;
};

const getDynamicBookContentShadow = (currentPage, totalPages) => {
    if (currentPage === 0 || currentPage >= totalPages - 1) {
        return 'none';
    }

    const baseShadows = [
        'inset 0 0 18px 4px rgba(0, 0, 0, 0.05)',
        '0 0 0 1px rgba(0, 0, 0, 0.05)'
    ];

    if (totalPages <= 1) return baseShadows.join(', ');

    const leftPercent = Math.round((currentPage / (totalPages - 1)) * 5) * 20;
    const rightPercent = 100 - leftPercent;

    const leftShadows = getStackShadow(leftPercent, true);
    const rightShadows = getStackShadow(rightPercent, false);

    if (leftShadows.length === 0 && rightShadows.length === 0) {
        return baseShadows.join(', ');
    }

    return [...baseShadows, ...leftShadows, ...rightShadows].join(', ');
};


// --- FORE-EDGE PAGE STACK NAVIGATION ---
const ForeEdgeNavigation = ({ side, totalPages, currentPage, isBookFullscreen, pageFlipRef }) => {
    if (totalPages <= 1) return null;

    const [hoverPos, setHoverPos] = useState(null);
    const [hoverPage, setHoverPage] = useState(null);
    const [isHovering, setIsHovering] = useState(false);
    const containerRef = useRef(null);

    // Dynamic width calculation matching the physical 'thapi' shadow thickness
    const pagesRead = currentPage;
    const pagesUnread = totalPages - currentPage;

    // Do not render the stack hit area if there are no pages on that side
    if (side === 'left' && pagesRead <= 0) return null;
    if (side === 'right' && pagesUnread <= 0) return null;

    // Constrain the hit area strictly to the edge so it never hovers over the book content
    const MAX_STACK_WIDTH = 18;
    const MIN_STACK_WIDTH = 5; // Keep at least a tiny sliver to click when near the end

    let stackWidth;
    if (side === 'left') {
        stackWidth = Math.max(MIN_STACK_WIDTH, (pagesRead / totalPages) * MAX_STACK_WIDTH);
    } else {
        stackWidth = Math.max(MIN_STACK_WIDTH, (pagesUnread / totalPages) * MAX_STACK_WIDTH);
    }

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        // Track horizontal movement across the stack
        const x = e.clientX - rect.left;
        setHoverPos(Math.max(0, Math.min(x, rect.width)));

        const percentage = Math.max(0, Math.min(x / rect.width, 1));

        let targetIndex;
        if (side === 'left') {
            // High accuracy continuous mapping
            targetIndex = Math.floor((percentage * currentPage));
        } else {
            targetIndex = currentPage + Math.floor((percentage * pagesUnread));
        }

        // Ensure within bounds
        targetIndex = Math.max(0, Math.min(targetIndex, totalPages - 1));

        // Show 1-indexed page number in the tooltip
        setHoverPage(targetIndex + 1);
    };

    const handleClick = (e) => {
        if (!containerRef.current || !pageFlipRef?.current) return;
        e.stopPropagation();

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(x / rect.width, 1));

        let targetIndex;
        if (side === 'left') {
            // High accuracy continuous mapping
            targetIndex = Math.floor((percentage * currentPage));
        } else {
            targetIndex = currentPage + Math.floor((percentage * pagesUnread));
        }
        targetIndex = Math.max(0, Math.min(targetIndex, totalPages - 1));

        if (pageFlipRef.current && typeof pageFlipRef.current.flip === 'function') {
            try {
                pageFlipRef.current.flip(targetIndex);
            } catch (e) {
                console.warn('Flip animation failed, turning instantly', e);
                pageFlipRef.current.turnToPage(targetIndex);
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className={`fore-edge-nav-container ${side}-edge ${isBookFullscreen ? 'fullscreen-mode' : 'normal-mode'}`}
            style={{ width: `${stackWidth}px` }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => { setIsHovering(false); setHoverPos(null); }}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
        >
            {/* The hover tooltip indicator pinned to bottom corners */}
            <AnimatePresence>
                {isHovering && hoverPos !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className={`fore-edge-hover-indicator ${side}-tooltip`}
                    >
                        <div className="fore-edge-tooltip">
                            Page {hoverPage}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- MULTI VIEW THUMBNAIL COMPONENT ---
const PdfThumbnail = ({ pdfDoc, pageIndex, isPreviewMode, previewPageList, onClick }) => {
    const canvasRef = useRef(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
        if (!pdfDoc || rendered) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                observer.disconnect();
                let pdfPageNum = pageIndex + 1;

                if (isPreviewMode) {
                    if (pageIndex < previewPageList.length) {
                        pdfPageNum = previewPageList[pageIndex];
                    } else {
                        setRendered(true); // Is buy now page
                        return;
                    }
                }

                pdfDoc.getPage(pdfPageNum).then(page => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const context = canvas.getContext('2d');
                    const viewport = page.getViewport({ scale: 0.6 }); // Thumb size
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    page.render({ canvasContext: context, viewport }).promise.then(() => setRendered(true));
                }).catch(e => console.warn(e));
            }
        });

        if (canvasRef.current) observer.observe(canvasRef.current);
        return () => observer.disconnect();
    }, [pdfDoc, pageIndex, isPreviewMode, previewPageList, rendered]);

    const isBuyNow = isPreviewMode && pageIndex >= previewPageList.length;

    return (
        <div onClick={onClick} className="w-full aspect-[1/1.41] bg-white rounded shadow-md border overflow-hidden relative group-hover:border-[#3D52A0] group-hover:shadow-lg group-hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-center text-gray-400">
            {!rendered && !isBuyNow && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="simple-spinner w-6 h-6 border-[2px]"></div>
                </div>
            )}
            {isBuyNow ? (
                <div className="text-center p-2 bg-gray-900 w-full h-full flex flex-col items-center justify-center text-white">
                    <span className="text-2xl mb-2">🔒</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D52A0]">Buy Now</span>
                </div>
            ) : (
                <canvas ref={canvasRef} className={`w-full h-full object-cover transition-opacity duration-300 ${rendered ? 'opacity-100' : 'opacity-0'}`} />
            )}
        </div>
    );
};

const Real3DReaderPage = () => {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Expose navigate to window for dynamic HTML buttons (End of Preview screen)
    useEffect(() => {
        window.handleReaderBuyClick = (id) => {
            navigate(`/checkout/${id}`);
        };
        return () => {
            delete window.handleReaderBuyClick;
        };
    }, [navigate]);

    // Refs
    const bookContainerRef = useRef(null);
    const pageFlipRef = useRef(null);
    const pdfLoadingTaskRef = useRef(null);
    const pdfDocRef = useRef(null);
    const renderTasksRef = useRef({});
    const shelfScrollRef = useRef(null);

    // State
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [darkMode, setDarkMode] = useState(false);

    // ── DUAL ZOOM with NORMALIZATION ───────────────────────────────────────
    // These BASE values represent scale(1.0) in user-facing terms (displayed as 100%)
    // They are the default "comfortable read" scales for each mode.
    const NORMAL_BASE = 1.5;   // normal mode 100% anchor
    const FULLSCREEN_BASE = 1.9;   // fullscreen mode 100% anchor, decreased by .10 as requested

    const [normalZoom, setNormalZoom] = useState(NORMAL_BASE);
    const [fullscreenZoom, setFullscreenZoom] = useState(FULLSCREEN_BASE);
    const [bookDimensions, setBookDimensions] = useState({ w: 550, h: 800 }); // track unscaled stage size
    // Kept for legacy refs
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [bookmarks, setBookmarks] = useState([]);
    const [pageInput, setPageInput] = useState('');
    const [usePortrait, setUsePortrait] = useState(window.innerWidth < 1000);
    const [isBlurred, setIsBlurred] = useState(false);
    const [isBookFullscreen, setIsBookFullscreen] = useState(false); // Custom book-only fullscreen
    const [viewMode, setViewMode] = useState('double'); // 'single', 'double', 'multi'
    const [isSwitchingView, setIsSwitchingView] = useState(false);

    // Drawing UI State
    const [activeDrawTool, setActiveDrawTool] = useState(null); // 'pen', 'highlighter', null
    const [drawColor, setDrawColor] = useState('#0055ff'); // default blue
    const [drawThickness, setDrawThickness] = useState(4);
    const [showDrawMenu, setShowDrawMenu] = useState(false);
    const [showMobileMore, setShowMobileMore] = useState(false); // Mobile-only slide-up options sheet
    const [isBookReady, setIsBookReady] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const currentStrokeRef = useRef(null); // stores { pageNum, path: [] }
    const canvasContextRef = useRef(null);

    // Highlight State
    const [highlights, setHighlights] = useState([]);
    const [selectedText, setSelectedText] = useState('');
    const [menuPosition, setMenuPosition] = useState(null);
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);
    const [isHighlightEnabled, setIsHighlightEnabled] = useState(false);
    window.EBOOK_HIGHLIGHT_ENABLED = isHighlightEnabled; // Sync for non-react event handlers
    window.EBOOK_DRAW_ACTIVE = !!activeDrawTool;
    const [isSecurityEnabled, setIsSecurityEnabled] = useState(true);
    const [zenMode, setZenMode] = useState(false);
    const [previewPageList, setPreviewPageList] = useState([]);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const autoPlayRef = useRef(null);
    const autoPlayIntervalMs = 3000; // 3 seconds per page
    // 🔥 All Books Showcase (purchased + non-purchased)
    const [allShelfBooks, setAllShelfBooks] = useState([]);
    const [animatingBookId, setAnimatingBookId] = useState(null);

    // --- DERIVED LOADING/TRANSITION STATE ---
    // This prevents stale data from previous books appearing during state updates
    const isTransitioning = !book || String(book._id || book.id) !== String(bookId);
    const actualLoading = loading || isTransitioning;

    // --- VIEW MODE CHANGE HANDLER ---
    const handleViewModeChange = useCallback((mode) => {
        if (mode === viewMode) return;
        setIsBookReady(false);
        setIsSwitchingView(true);
        // Show loading screen
        setLoading(true);
        setLoadingProgress(0);

        // Progressive fake loading for smooth transition
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 30) + 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setViewMode(mode);

                // Keep loading screen up slightly longer so initBook can prep DOM
                setTimeout(() => {
                    setLoading(false);
                    setTimeout(() => setIsSwitchingView(false), 200);
                }, 300);
            }
            setLoadingProgress(progress);
        }, 120);
    }, [viewMode]);

    const handleShelfBookClick = (targetBookId, isPurchased) => {
        if (String(targetBookId) === String(bookId)) {
            document.querySelector('.reader-3d-container')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // All books open in reader — non-purchased will automatically get preview mode (2 pages)
        setAnimatingBookId(targetBookId);

        setTimeout(() => {
            navigate(`/book/${targetBookId}/read-3d`);
            setAnimatingBookId(null);
        }, 800);
    };

    // --- INTERACTIVE PARALLAX ---
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = useCallback((e) => {
        const { clientX, clientY, currentTarget } = e;
        const { width, height } = currentTarget.getBoundingClientRect();
        const x = (clientX / width) - 0.5;
        const y = (clientY / height) - 0.5;
        mouseX.set(x * 100); // Range -50 to 50
        mouseY.set(y * 100);
    }, [mouseX, mouseY]);

    // Background Parallax Transforms
    const sphereX = useTransform(mouseX, [-50, 50], [20, -20]);
    const sphereY = useTransform(mouseY, [-50, 50], [20, -20]);
    const particleX = useTransform(mouseX, [-50, 50], [-10, 10]);

    // Handle Window Resize
    useEffect(() => {
        const handleResize = () => {
            setUsePortrait(window.innerWidth < 1000);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── FULLSCREEN CHANGE LISTENER ─────────────────────────────────────────
    // Catches ESC key exit from browser fullscreen so our state stays in sync.
    useEffect(() => {
        const onFSChange = () => {
            if (!document.fullscreenElement && isBookFullscreen) {
                // ESC pressed — exit our custom fullscreen mode too
                setIsBookFullscreen(false);
                setIsFullscreen(false);
                // normalZoom is intentionally NOT touched here
            }
        };
        document.addEventListener('fullscreenchange', onFSChange);
        return () => document.removeEventListener('fullscreenchange', onFSChange);
    }, [isBookFullscreen]);

    // Auto Play Logic
    useEffect(() => {
        if (isAutoPlaying) {
            autoPlayRef.current = setInterval(() => {
                setCurrentPage(prev => {
                    if (prev >= totalPages - 1) {
                        setIsAutoPlaying(false);
                        return prev;
                    }
                    pageFlipRef.current?.flipNext();
                    return prev;
                });
            }, autoPlayIntervalMs);
        } else {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
                autoPlayRef.current = null;
            }
        }
        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
                autoPlayRef.current = null;
            }
        };
    }, [isAutoPlaying, totalPages]);

    // Re-init on orientation change or initial load completion
    useEffect(() => {
        if (!actualLoading && totalPages > 0 && viewMode !== 'multi') {
            const timer = setTimeout(() => {
                initBook(totalPages);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [loading, totalPages, usePortrait, viewMode]);

    // Re-init when fullscreen mode toggles
    useEffect(() => {
        if (totalPages > 0 && viewMode !== 'multi') {
            setIsBookReady(false); // Reset readiness during transition
            const timer = setTimeout(() => {
                initBook(totalPages, isBookFullscreen);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isBookFullscreen, viewMode]);

    // Load Book Details & Bookmarks
    useEffect(() => {
        // Reset ALL book-related state and refs for new book load to avoid ghost UI or stale data
        setLoading(true);
        setBook(null); // Clear previous book data
        setTotalPages(0);
        setCurrentPage(0);
        setBookmarks([]);
        setHighlights([]);
        setPreviewPageList([]); // Reset preview pages
        setIsBookReady(false); // Book interaction shouldn't be active yet

        // Clear refs
        pdfDocRef.current = null;
        renderTasksRef.current = {}; // CRITICAL: Stop renderer from thinking pages are already done

        // Clean up PageFlip
        if (pageFlipRef.current) {
            try { pageFlipRef.current.destroy(); } catch (e) { }
            pageFlipRef.current = null;
        }

        let isCurrent = true;

        const fetchBook = async () => {
            if (!isCurrent) return;
            try {
                let bookData;

                // Use reader service if logged in to get progress
                if (user) {
                    try {
                        const response = await readerService.getBook(bookId);
                        bookData = response.data;
                    } catch (e) {
                        // Fallback if reader service fails (e.g. not purchased yet)
                        const response = await bookService.getBookById(bookId);
                        bookData = response.data.book || response.data;
                    }
                } else {
                    const response = await bookService.getBookById(bookId);
                    bookData = response.data.book || response.data;
                }

                // Ensure we have a valid isPurchased flag even on fallback
                if (bookData && user) {
                    const priceVal = bookData.retailPrice !== undefined && bookData.retailPrice !== null ? bookData.retailPrice : bookData.price;
                    const isStrictFree = (priceVal !== null && priceVal !== undefined && priceVal !== '' && Number(priceVal) === 0);
                    const isAdmin = user?.role === 'admin';

                    // If not explicitly marked as purchased, check if it's in our shelf-fetched library cache
                    if (bookData.isPurchased !== true && bookData.isPurchased !== 'true') {
                        const shelfInfo = allShelfBooks.find(s => String(s.book?._id || s.book?.id) === String(bookId));
                        if (shelfInfo?.isPurchasedByUser || isStrictFree || isAdmin) {
                            bookData.isPurchased = true;
                        } else {
                            bookData.isPurchased = false; // Explicitly set to false 
                        }
                    }
                }

                if (!isCurrent) return;
                setBook(bookData);

                // Set initial page from progress if available
                if (bookData.lastReadPage && bookData.lastReadPage > 0) {
                    setCurrentPage(bookData.lastReadPage - 1);
                }

                // Restore Progress and Bookmarks
                if (bookData.bookmarks && Array.isArray(bookData.bookmarks)) {
                    // Adapt if bookmarks are simple page numbers (unified version) or objects (detailed version)
                    const adaptedBookmarks = bookData.bookmarks.map(b =>
                        typeof b === 'number' ? { page: b - 1, timestamp: Date.now() } : b
                    );
                    setBookmarks(adaptedBookmarks);
                } else {
                    const savedBookmarks = localStorage.getItem(`bookmarks-${bookId}`);
                    if (savedBookmarks) {
                        setBookmarks(JSON.parse(savedBookmarks));
                    }
                }
            } catch (err) {
                if (isCurrent) {
                    console.error("Failed to fetch book:", err);
                    setLoading(false);
                }
            }
        };

        if (bookId) fetchBook();

        return () => {
            isCurrent = false;
        };
    }, [bookId, navigate, user]);

    // Dedicated Reactive Security Settings Fetcher
    useEffect(() => {
        const fetchSecurity = async () => {
            try {
                const secRes = await settingsService.getSecuritySettings();
                if (secRes.screenshotProtection !== undefined) {
                    setIsSecurityEnabled(secRes.screenshotProtection);
                }
            } catch (e) {
                // Silent error
            }
        };

        fetchSecurity(); // Initial check

        // Re-check whenever window gets focus (Admin toggled setting in another tab)
        window.addEventListener('focus', fetchSecurity);
        return () => window.removeEventListener('focus', fetchSecurity);
    }, []);

    // Fetch Highlights
    useEffect(() => {
        if (!user || !bookId) return;
        const fetchHighlights = async () => {
            try {
                const res = await highlightService.getHighlights(bookId);
                if (res.success) setHighlights(res.data || []);
            } catch (e) { console.error("Highlights fetch error", e); }
        };
        fetchHighlights();
    }, [bookId, user]);



    // 🔥 Fetch ALL Books + Purchased IDs for Shelf Showcase
    useEffect(() => {
        const fetchShelfData = async () => {
            try {
                // Always fetch all books (even if not logged in)
                const allRes = await bookService.getBooks({ limit: 100 });
                const allBooksData = allRes?.data?.books || allRes?.data || [];

                // Build purchased set if logged in
                let purchasedIds = new Set();
                if (user) {
                    try {
                        const libRes = await readerService.getLibrary();
                        if (libRes.success && Array.isArray(libRes.data)) {
                            libRes.data.forEach(item => {
                                const pid = item.book?._id || item.book?.id;
                                if (pid) purchasedIds.add(String(pid));
                            });
                        }
                    } catch (err) {
                        console.error("Library fetch failed:", err);
                    }
                }

                // Enrich with purchase status and then sort (Subscribed first)
                const enriched = allBooksData.map(b => {
                    const id = String(b._id || b.id);
                    const isFree = b.retailPrice !== null && b.retailPrice !== undefined && Number(b.retailPrice) === 0;
                    const isAdmin = user?.role === 'admin';
                    const owned = purchasedIds.has(id) || isFree || isAdmin;
                    return { book: b, isPurchasedByUser: owned, progress: 0 };
                }).sort((a, b) => {
                    if (a.isPurchasedByUser && !b.isPurchasedByUser) return -1;
                    if (!a.isPurchasedByUser && b.isPurchasedByUser) return 1;
                    return 0;
                });

                setAllShelfBooks(enriched);
            } catch (err) {
                console.error("Shelf data fetch failed:", err);
            }
        };

        fetchShelfData();
    }, [user]);


    // Load PDF
    useEffect(() => {
        // --- DATA CONSISTENCY CHECK ---
        // Crucial: Only load PDF if current 'book' state matches the 'bookId' in URL
        if (!book || String(book._id || book.id) !== String(bookId)) {
            console.log('[PDF] Consistency Check Failed: Book mismatch or null');
            return;
        }

        let isCurrent = true;

        const loadPDF = async () => {
            try {
                if (!isCurrent) return;
                setLoading(true);
                setLoadingProgress(1);

                const apiBase = API_URL.replace(/\/api$/, '');
                let finalPdfUrl = null;

                // --- ROBUST UNIFIED ACCESS CHECK ---
                const priceVal = book.retailPrice !== undefined && book.retailPrice !== null ? book.retailPrice : book.price;
                const isActuallyFree = (priceVal !== null && priceVal !== undefined && priceVal !== '' && Number(priceVal) === 0);
                const isPurchased = !!(book.isPurchased === true || book.isPurchased === 'true');
                const isAdmin = user?.role === 'admin';
                const hasFullAccess = !!(isPurchased || isActuallyFree || isAdmin);

                // 1. If user has full access → try secure download token first
                if (user && hasFullAccess) {
                    try {
                        const tokenRes = await readerService.getDownloadToken(bookId);
                        if (tokenRes.success && tokenRes.data?.downloadUrl) {
                            finalPdfUrl = `${apiBase}${tokenRes.data.downloadUrl}`;
                        }
                    } catch (e) {
                        console.warn('Secure token fetch failed, will fall back to preview stream');
                    }
                }

                // 2. Fallback: always use the streaming endpoint (works for both preview and full)
                if (!finalPdfUrl) {
                    // For non-purchased: preview=true (backend serves full PDF but front-end limits pages shown)
                    // We always use preview=true here because the page-limiting happens on the frontend
                    const previewParam = hasFullAccess ? 'false' : 'true';
                    const uidParam = user?.id ? `&uid=${user.id}` : '';
                    finalPdfUrl = `${apiBase}/api/downloads/stream/${bookId}?preview=${previewParam}${uidParam}`;
                }

                // PDF session initialized

                const loadingTask = pdfjsLib.getDocument({
                    url: finalPdfUrl,
                    withCredentials: true,
                    disableRange: true,
                    disableAutoFetch: true
                });
                pdfLoadingTaskRef.current = loadingTask;

                loadingTask.onProgress = (progress) => {
                    if (progress.total > 0) {
                        const percent = Math.min(100, Math.round((progress.loaded / progress.total) * 100));
                        setLoadingProgress(percent);
                    }
                };

                let pdf;
                try {
                    pdf = await loadingTask.promise;
                } catch (pdfErr) {
                    if (pdfErr.name === 'RenderingCancelledException' || pdfErr.name === 'WorkerTerminatedException') return;

                    // If full-access stream failed (e.g. server rejected), retry with preview=true
                    console.warn('[PDF] Primary load failed, retrying as preview:', pdfErr.message);
                    const uidParam = user?.id ? `&uid=${user.id}` : '';
                    const fallbackUrl = `${apiBase}/api/downloads/stream/${bookId}?preview=true${uidParam}`;

                    const fallbackTask = pdfjsLib.getDocument({
                        url: fallbackUrl,
                        withCredentials: true,
                        disableRange: true,
                        disableAutoFetch: true
                    });
                    pdfLoadingTaskRef.current = fallbackTask;
                    pdf = await fallbackTask.promise;
                }

                if (!isCurrent) return;
                pdfDocRef.current = pdf;

                // Handle Preview Limits
                const isPreviewMode = !hasFullAccess;

                if (isPreviewMode) {
                    // Use previewPages array (new system), fallback to old start/end
                    let adminPages = [];
                    if (Array.isArray(book.previewPages) && book.previewPages.length > 0) {
                        adminPages = book.previewPages.map(Number);
                    } else {
                        const startP = Math.max(1, Number(book.previewStartPage) || 1);
                        const endP = Math.max(1, Number(book.previewEndPage) || 2);
                        adminPages = [startP, endP];
                    }

                    // Always include page 1 (cover) + admin-selected pages
                    const pages = Array.from(new Set([1, ...adminPages]))
                        .filter(p => p <= pdf.numPages)
                        .sort((a, b) => a - b);

                    setPreviewPageList(pages);
                    setTotalPages(pages.length + 1);
                } else {
                    setTotalPages(pdf.numPages);
                }

                setLoading(false);
            } catch (error) {
                if (error.name === 'RenderingCancelledException' || !isCurrent) return;
                console.error('PDF Load Error:', error);
                toast.error('Failed to load PDF. Please try again.');
                setLoading(false);
                navigate(-1);
            }
        };

        loadPDF();

        return () => {
            isCurrent = false;
            // Cancel PDF loading task
            if (pdfLoadingTaskRef.current) {
                try { pdfLoadingTaskRef.current.destroy(); } catch (e) { }
                pdfLoadingTaskRef.current = null;
            }
        };
    }, [book, user, bookId]);

    // Security Features
    useEffect(() => {
        if (!isSecurityEnabled) return;

        const preventDefault = (e) => e.preventDefault();

        // Prevent Right Click
        document.addEventListener('contextmenu', preventDefault);

        const handleKeyDown = (e) => {
            // Prevent Ctrl+A, Ctrl+C, Ctrl+X, Ctrl+V
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
                setIsBlurred(true);
                setTimeout(() => setIsBlurred(false), 2000);
                toast.error("⚠️ Screenshot Attempt Detected!", { theme: "dark" });
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'PrintScreen') {
                setIsBlurred(true);
                setTimeout(() => setIsBlurred(false), 2000);
                toast.error("⚠️ Screenshot Attempt Detected!", { theme: "dark" });
                try { navigator.clipboard.writeText(''); } catch (err) { }
            }
        };

        // Auto-Blur on Window Focus Loss (e.g. Snipping Tool opened)
        const handleWindowBlur = () => setIsBlurred(true);
        const handleWindowFocus = () => setIsBlurred(false);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);

        // Prevent Copy/Cut/Paste
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
                const isPurchased = !!(book?.isPurchased === true || book?.isPurchased === 'true' || book?.price === 0);
                if (isPurchased) return;
                e.preventDefault();
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
    }, [book, isSecurityEnabled]);

    // Clear blur if security is disabled
    useEffect(() => {
        if (!isSecurityEnabled) {
            setIsBlurred(false);
        }
    }, [isSecurityEnabled]);

    // Initialize PageFlip
    const initBook = (numPages, inFullscreen = false) => {
        if (!bookContainerRef.current) return;

        // CRITICAL: Reset render tasks whenever we rebuild the DOM
        renderTasksRef.current = {};
        bookContainerRef.current.innerHTML = '';

        for (let i = 0; i < numPages; i++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = `page ${i === 0 ? 'page-cover' : 'page-content'}`;
            pageDiv.dataset.density = i === 0 || i === numPages - 1 ? 'hard' : 'soft';
            pageDiv.dataset.pageIndex = i;

            pageDiv.innerHTML = `
                <div class="bookmark-ribbon-static" style="display: none;">
                    <span class="ribbon-text">${i + 1}</span>
                </div>
                <div class="page-content-wrapper relative w-full h-full">
                    <div class="skeleton-loader">
                         <div class="simple-spinner"></div>
                    </div>
                </div>
                <!-- Drawing Canvas Overlay -->
                <canvas class="drawing-layer absolute top-0 left-0 w-full h-full z-20"></canvas>
            `;
            bookContainerRef.current.appendChild(pageDiv);
        }

        if (pageFlipRef.current) {
            try { pageFlipRef.current.destroy(); } catch (e) { }
        }

        try {
            const isMobile = window.innerWidth < 1000;
            const forceSingle = viewMode === 'single' || isMobile;
            let pageW, pageH;

            if (inFullscreen) {
                // Fullscreen: fill the viewport below the toolbar
                const toolbarH = 68;
                const availH = window.innerHeight - toolbarH - 32; // small top/bottom gap
                const availW = window.innerWidth - 100; // space for side arrows

                // Height-first: each page fills available height
                pageH = Math.floor(availH);
                pageW = Math.floor(pageH / 1.41); // A4 ratio

                // If both pages overflow width, constrain by width instead
                if (!forceSingle && pageW * 2 > availW) {
                    pageW = Math.floor(availW / 2);
                    pageH = Math.floor(pageW * 1.41);
                } else if (forceSingle && pageW > availW) {
                    pageW = Math.floor(availW);
                    pageH = Math.floor(pageW * 1.41);
                }
            } else {
                // Normal mode: use 94vw container, but also constrain by viewport height
                const isTinyMobile = window.innerWidth < 480;
                const containerW = Math.min(window.innerWidth * 0.96, 1600);
                const availH = window.innerHeight - 100; // Leave space for toolbar and padding

                // Base calculation from width
                let tempW = forceSingle
                    ? Math.min(window.innerWidth * (isTinyMobile ? 0.92 : 0.88), 500)
                    : Math.floor(containerW / 2);
                let tempH = Math.floor(tempW * 1.41);

                // Height Constraint: If book is too tall for viewport, shrink it
                if (tempH > availH * 0.85) {
                    tempH = Math.floor(availH * 0.85);
                    tempW = Math.floor(tempH / 1.41);
                }

                pageW = tempW;
                pageH = tempH;
            }

            // Save dimensions for layout calculations
            setBookDimensions({ w: pageW, h: pageH });

            const pageFlip = new PageFlip(bookContainerRef.current, {
                width: pageW,
                height: pageH,
                size: 'stretch',
                minWidth: 250,
                maxWidth: 1200,
                minHeight: 350,
                maxHeight: 1600,
                // --- SMOOTH REALISTIC FLIP ANIMATION ---
                maxShadowOpacity: 0.25,
                drawShadow: true,
                flippingTime: 1100,
                // ----------------------------------------
                showCover: true,
                mobileScrollSupport: true,
                usePortrait: forceSingle,
                startPage: currentPage,
                useMouseEvents: true, // Re-enabled to support dragging/swiping
                showPageCorners: false,
                swipeDistance: 20
            });

            pageFlip.loadFromHTML(bookContainerRef.current.querySelectorAll('.page'));

            pageFlip.on('flip', (e) => {
                const newPage = e.data;
                setCurrentPage(newPage);
                renderNearbyPages(newPage);
            });

            pageFlipRef.current = pageFlip;

            // ── SINGLE-CLICK / TAP TO FLIP ──────────────────────────────────
            // Tap LEFT half  → flip to previous page
            // Tap RIGHT half → flip to next page
            // Works on both touch (mobile) and mouse (desktop)
            {
                const el = bookContainerRef.current;

                // Remove old handlers
                if (el._tapStartHandler) { el.removeEventListener('pointerdown', el._tapStartHandler); }
                if (el._tapEndHandler) { el.removeEventListener('pointerup', el._tapEndHandler); }
                if (el._dblClickHandler) { el.removeEventListener('dblclick', el._dblClickHandler); }

                let tapStartX = 0, tapStartY = 0, tapStartTime = 0;

                const tapStartHandler = (e) => {
                    tapStartX = e.clientX;
                    tapStartY = e.clientY;
                    tapStartTime = Date.now();
                };

                const tapEndHandler = (e) => {
                    if (!pageFlipRef.current) return;

                    // 1. DRIPPING GUARD: If already flipping, don't trigger another one
                    if (pageFlipRef.current.getState() !== 'read') return;

                    const now = Date.now();
                    const dx = Math.abs(e.clientX - tapStartX);
                    const dy = Math.abs(e.clientY - tapStartY);
                    const dt = now - tapStartTime;

                    // IMPORTANT: If movement is significant, it's a DRAG.
                    // Return early and do NOT call stopPropagation so the library handles the drag.
                    if (dx > 10 || dy > 10 || dt > 600) return;

                    // 2. COOLDOWN: Prevent rapid accidental taps
                    // Increased to 800ms for better stability
                    if (el._lastFlipTime && (now - el._lastFlipTime < 800)) return;

                    // 3. UI/GUARD CHECKS
                    if (window.EBOOK_DRAW_ACTIVE || window.EBOOK_HIGHLIGHT_ENABLED) return;
                    const tag = e.target?.tagName?.toLowerCase();
                    if (['button', 'a', 'input', 'select', 'textarea', 'svg', 'path'].includes(tag)) return;
                    if (e.target?.closest('button, a, input, [role="button"]')) return;

                    // 4. IT'S A PURE TAP: Handle it here and STOP propagation
                    // This prevents the library from seeing the click and triggering a second flip.
                    e.stopPropagation();
                    // if (e.cancelable) e.preventDefault(); // Don't prevent default, might break focus

                    const rect = el.getBoundingClientRect();
                    const x = e.clientX - rect.left;

                    el._lastFlipTime = now;

                    if (x < rect.width / 2) {
                        pageFlipRef.current?.flipPrev();
                    } else {
                        pageFlipRef.current?.flipNext();
                    }
                };

                // 5. CLICK INTERCEPTOR: Prevent browser 'click' from triggering library flip 
                // if our pointerup handler already did it.
                const clickHandler = (e) => {
                    const now = Date.now();
                    if (el._lastFlipTime && (now - el._lastFlipTime < 800)) {
                        e.stopPropagation();
                    }
                };

                if (el) {
                    el.addEventListener('pointerdown', tapStartHandler, { passive: true });
                    el.addEventListener('pointerup', tapEndHandler, { passive: true });
                    el.addEventListener('click', clickHandler, { capture: true });
                    el._tapStartHandler = tapStartHandler;
                    el._tapEndHandler = tapEndHandler;
                    el._clickHandler = clickHandler;
                }
            }

            setTimeout(() => {
                renderNearbyPages(currentPage);
            }, 100);

            setIsBookReady(true);
        } catch (e) {
            console.error('PageFlip init failed:', e);
            setIsBookReady(false);
        }
    };

    const syncBookmarksToDOM = useCallback(() => {
        const bookmarkedPages = bookmarks.map(b => b.page);
        // Bookmark icons are handled via page references or DOM nodes if available
        document.querySelectorAll('[data-page-index]').forEach(pageDiv => {
            const index = parseInt(pageDiv.dataset.pageIndex);
            const ribbon = pageDiv.querySelector('.bookmark-ribbon-static');
            if (ribbon) {
                ribbon.style.display = bookmarkedPages.includes(index) ? 'flex' : 'none';
            }
        });
    }, [bookmarks]);

    const handleClearPageHighlights = useCallback(async (pageNum) => {
        if (!window.confirm("Clear all highlights on this page?")) return;
        const pageHighlights = highlights.filter(h => (h.position?.pageNumber || h.pageNumber) === pageNum);

        // Optimistic UI update
        setHighlights(prev => prev.filter(h => (h.position?.pageNumber || h.pageNumber) !== pageNum));

        // Background API Delete
        for (const h of pageHighlights) {
            try { await highlightService.deleteHighlight(h.id || h._id); } catch (e) { console.error(e); }
        }
        toast.success("Page highlights cleared");
    }, [highlights]);

    const renderNearbyPages = useCallback(async (currentIndex) => {
        if (!pdfDocRef.current) return;

        // Ensure bookmarks are synced even if render is cached
        syncBookmarksToDOM();

        const pagesToRender = [currentIndex];
        if (currentIndex + 1 < totalPages) pagesToRender.push(currentIndex + 1);

        // Look ahead
        if (currentIndex + 2 < totalPages) pagesToRender.push(currentIndex + 2);
        if (currentIndex + 3 < totalPages) pagesToRender.push(currentIndex + 3);

        // Look behind
        if (currentIndex > 0) pagesToRender.push(currentIndex - 1);

        for (const i of pagesToRender) {
            await renderPageAtIndex(i);
        }
    }, [totalPages, bookmarks, highlights]);

    const renderPageAtIndex = async (index) => {
        if (!book || !pdfDocRef.current) return;

        // Use consistent access check
        const priceVal = book.retailPrice !== undefined ? book.retailPrice : book.price;
        const isFree = priceVal !== null && priceVal !== undefined && Number(priceVal) === 0;
        const isPurchased = !!(book.isPurchased === true || book.isPurchased === 'true' || isFree || user?.role === 'admin');
        const isPreviewMode = !isPurchased;

        // Handle "Buy Now" Page
        if (isPreviewMode && index === totalPages - 1) {
            const pageContainer = document.querySelector(`[data-page-index="${index}"] .page-content-wrapper`);
            if (!pageContainer || renderTasksRef.current[index] === 'done') return;

            pageContainer.innerHTML = '';
            const buyContainer = document.createElement('div');
            buyContainer.className = 'flex flex-col items-center justify-center h-full bg-[#1a1a2e] text-white p-8 text-center relative z-[60]';

            const lockIcon = document.createElement('div');
            lockIcon.className = 'text-4xl text-[#7091E6] mb-4';
            lockIcon.innerText = '🔒';

            const title = document.createElement('h2');
            title.className = 'text-2xl font-bold font-serif mb-2 text-white drop-shadow-sm';
            title.innerText = 'End of Preview';

            const desc = document.createElement('p');
            desc.className = 'text-gray-300 mb-6 max-w-xs text-sm leading-relaxed';
            desc.innerText = `Purchase the full book to unlock all ${pdfDocRef.current.numPages} pages and support the author.`;

            const buyBtn = document.createElement('button');
            buyBtn.className = 'px-8 py-3.5 bg-[#7091E6] text-white border-2 border-[#7091E6] hover:bg-transparent hover:text-[#7091E6] font-bold text-sm tracking-widest uppercase transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(112,145,230,0.5)] rounded-full cursor-pointer pointer-events-auto relative z-[70]';
            buyBtn.innerText = 'BUY FULL VERSION';
            buyBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.handleReaderBuyClick) {
                    window.handleReaderBuyClick(bookId);
                } else {
                    navigate(`/checkout/${bookId}`);
                }
            };

            buyContainer.appendChild(lockIcon);
            buyContainer.appendChild(title);
            buyContainer.appendChild(desc);
            buyContainer.appendChild(buyBtn);

            pageContainer.appendChild(buyContainer);
            renderTasksRef.current[index] = 'done';
            return;
        }

        let pdfPageNum;
        if (isPreviewMode) {
            if (index < previewPageList.length) {
                pdfPageNum = previewPageList[index];
            } else {
                return; // Should have been caught by "Buy Now" check
            }
        } else {
            pdfPageNum = index + 1;
        }
        if (pdfPageNum > pdfDocRef.current.numPages) return;

        const pageDiv = document.querySelector(`[data-page-index="${index}"]`);
        if (!pageDiv) return;

        const pageContainer = pageDiv.querySelector('.page-content-wrapper');
        if (!pageContainer) return;

        // If already rendered, just exit (syncBookmarksToDOM handles the ribbon)
        if (renderTasksRef.current[index] === 'done' && pageContainer.querySelector('canvas')) {
            return;
        }

        // Avoid parallel duplicate renders
        if (renderTasksRef.current[index] === 'rendering') return;

        try {
            renderTasksRef.current[index] = 'rendering';
            const page = await pdfDocRef.current.getPage(pdfPageNum);

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const isMobile = window.innerWidth < 1000;
            const targetScale = isMobile ? 1.5 : 2.0;
            const viewport = page.getViewport({ scale: targetScale });

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = '100%';
            canvas.style.height = '100%';

            await page.render({ canvasContext: context, viewport }).promise;

            // Clear and rebuild content
            pageContainer.innerHTML = '';
            pageContainer.appendChild(canvas);

            // --- HIGHLIGHTS & TEXT LAYER ---
            try {
                // Determine Visual Scale (Container = 550 or 400px fixed width, height = 800 or 580)
                const containerW = isMobile ? 400 : 550;
                const containerH = isMobile ? 580 : 800; // Fixed dimensions from PageFlip config

                // Get native viewport to calculate scale factors
                const unscaledViewport = page.getViewport({ scale: 1 });
                const scaleX = containerW / unscaledViewport.width;
                const scaleY = containerH / unscaledViewport.height;

                // Text Layer Container
                const textLayerDiv = document.createElement('div');
                textLayerDiv.className = 'textLayer absolute inset-0 z-20';
                // Stop PageFlip drag if Highlight Mode or Draw Mode is ON
                textLayerDiv.onmousedown = (e) => { if (window.EBOOK_HIGHLIGHT_ENABLED || window.EBOOK_DRAW_ACTIVE) e.stopPropagation(); };
                textLayerDiv.ontouchstart = (e) => { if (window.EBOOK_HIGHLIGHT_ENABLED || window.EBOOK_DRAW_ACTIVE) e.stopPropagation(); };

                textLayerDiv.style.width = `${containerW}px`;
                textLayerDiv.style.height = `${containerH}px`;
                // Scale text layer content to match stretched dimensions
                // PDF.js typically renders square pixels, so we pick scaleX and stretch Y via CSS
                textLayerDiv.style.setProperty('--scale-factor', scaleX);
                textLayerDiv.style.transform = `scaleY(${scaleY / scaleX})`;
                textLayerDiv.style.transformOrigin = 'top left';
                pageContainer.appendChild(textLayerDiv);

                // Render Text (Robust Hybrid)
                const textContent = await page.getTextContent();
                let rendered = false;

                if (pdfjsLib.renderTextLayer) {
                    try {
                        await pdfjsLib.renderTextLayer({
                            textContentSource: textContent,
                            container: textLayerDiv,
                            viewport: page.getViewport({ scale: scaleX }),
                            textDivs: []
                        }).promise;
                        rendered = true;
                    } catch (e) { console.warn("Standard renderTextLayer failed", e); }
                }

                // Fallback: Manual Render if standard failed or library missing
                if (!rendered || textLayerDiv.childNodes.length === 0) {
                    console.log("Using Manual Text Render Fallback");
                    const viewport = page.getViewport({ scale: scaleX });
                    textContent.items.forEach(item => {
                        if (!item.str || !item.str.trim()) return;

                        const span = document.createElement('span');
                        span.textContent = item.str + ' ';
                        span.style.position = 'absolute';
                        span.style.color = 'transparent';
                        span.style.cursor = 'text';
                        span.style.whiteSpace = 'pre';
                        span.style.pointerEvents = 'auto'; // Ensure clickable

                        // Transform calculation
                        let tx;
                        if (pdfjsLib.Util && pdfjsLib.Util.transform) {
                            tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
                        } else {
                            // Simple approximation
                            const k = scaleX;
                            tx = [
                                item.transform[0] * k, item.transform[1], item.transform[2], item.transform[3] * k,
                                item.transform[4] * k,
                                viewport.height - (item.transform[5] * k)
                            ];
                        }

                        // Font size vertical component
                        const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3])) || 12; // fallback

                        span.style.left = `${tx[4]}px`;
                        span.style.top = `${tx[5] - fontHeight}px`;
                        span.style.fontSize = `${fontHeight}px`;
                        span.style.fontFamily = 'serif';
                        span.style.transformOrigin = '0% 0%';

                        textLayerDiv.appendChild(span);
                    });
                }

                // Render Existing Highlights
                const pageHighlights = highlights.filter(h => (h.position?.pageNumber || h.pageNumber) === pdfPageNum);
                pageHighlights.forEach(h => {
                    (h.position?.rects || h.rects || []).forEach(rect => {
                        const hlDiv = document.createElement('div');
                        hlDiv.className = 'absolute z-10 highlight-rect';
                        hlDiv.style.left = `${rect.left}%`;
                        hlDiv.style.top = `${rect.top}%`;
                        hlDiv.style.width = `${rect.width}%`;
                        hlDiv.style.height = `${rect.height}%`;
                        hlDiv.style.backgroundColor = h.color || '#ffeb3b';
                        hlDiv.style.opacity = '0.3';
                        hlDiv.style.mixBlendMode = 'multiply';
                        pageContainer.appendChild(hlDiv);
                    });
                });

                // Clear Button (Per Page)
                if (user && pageHighlights.length > 0) {
                    const clearBtn = document.createElement('button');
                    clearBtn.className = 'absolute top-3 right-3 z-30 p-2 bg-red-500/90 text-white rounded-full shadow-lg transition-all hover:scale-110 clear-btn';
                    clearBtn.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="12" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a24 24 0 0 0-21.5 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"></path></svg>';
                    clearBtn.title = "Clear Text Highlights";
                    clearBtn.onclick = (e) => { e.stopPropagation(); handleClearPageHighlights(pdfPageNum); };
                    pageContainer.appendChild(clearBtn);
                }

            } catch (err) {
                console.warn("Text/Highlight Layer Error:", err);
            }

            // --- REALISM LAYERS ---

            // 1. Paper Texture (Grain)
            const texture = document.createElement('div');
            texture.className = 'page-texture';
            pageContainer.appendChild(texture);

            // 2. Spine Shadow (Curvature)
            // Even index = Right Page (Spine on Left) | Odd index = Left Page (Spine on Right)
            const isRight = index % 2 === 0;
            const spineShadow = document.createElement('div');
            spineShadow.className = isRight ? 'page-spine-shadow-left' : 'page-spine-shadow-right';
            pageContainer.appendChild(spineShadow);

            // 3. Lighting Sheen (Gradient)
            const lighting = document.createElement('div');
            lighting.className = 'page-lighting-overlay';
            pageContainer.appendChild(lighting);

            // 4. Border ( Subtle Edge)
            const border = document.createElement('div');
            border.className = 'page-border-in';
            pageContainer.appendChild(border);

            // 5. Gloss for cover (Index 0)
            if (index === 0) {
                const gloss = document.createElement('div');
                gloss.className = 'cover-gloss';
                pageContainer.appendChild(gloss);
            }

            renderTasksRef.current[index] = 'done';
        } catch (e) {
            console.error(`Error rendering page ${index}:`, e);
            renderTasksRef.current[index] = null;
        }
    };

    // ── NORMALIZED DUAL ZOOM HANDLER ───────────────────────────────────────
    // delta is a float fraction of the BASE (e.g. 0.1 = 10%).
    // Step size is proportional to BASE so +10% always means +10% of 100%.
    // Clamp is expressed in BASE multiples:
    //   Normal:     50% – 250%  →  NORMAL_BASE * [0.5, 2.5]
    //   Fullscreen: 50% – 300%  →  FULLSCREEN_BASE * [0.5, 3.0]
    const handleZoom = (delta) => {
        if (isBookFullscreen) {
            const step = FULLSCREEN_BASE * delta;
            const min = FULLSCREEN_BASE * 0.5;
            const max = FULLSCREEN_BASE * 3.0;
            setFullscreenZoom(prev => +Math.min(max, Math.max(min, prev + step)).toFixed(3));
        } else {
            const step = NORMAL_BASE * delta;
            const min = NORMAL_BASE * 0.5;
            const max = NORMAL_BASE * 2.5;
            setNormalZoom(prev => +Math.min(max, Math.max(min, prev + step)).toFixed(3));
        }
    };

    const toggleBookmark = (pageIndex) => {
        if (!user) {
            toast.info('Please login to add bookmarks');
            return;
        }
        const targetPage = typeof pageIndex === 'number' ? pageIndex : currentPage;
        let newBookmarks = [];
        const isCurrentBookmarked = bookmarks.some(b => b.page === targetPage);

        if (isCurrentBookmarked) {
            toast.info('Bookmark removed');
        } else {
            newBookmarks = [{ page: targetPage, timestamp: Date.now(), label: `Page ${targetPage + 1}` }];
            toast.success(`Bookmarked page ${targetPage + 1}`);
        }

        setBookmarks(newBookmarks);
        localStorage.setItem(`bookmarks-${bookId}`, JSON.stringify(newBookmarks));

        // Immediate save for single bookmark policy
        readerService.updateProgress(bookId, {
            page: currentPage + 1,
            totalPages: totalPages,
            bookmarks: newBookmarks.map(b => b.page + 1)
        }).catch(err => console.error("Failed to save bookmark", err));
    };

    // Watch for bookmark changes to update UI instantly
    useEffect(() => {
        if (!loading && totalPages > 0) {
            renderNearbyPages(currentPage);
        }
    }, [bookmarks, currentPage, renderNearbyPages, loading, totalPages]);

    const jumpToPage = (pageNum) => {
        if (!pageFlipRef.current) return;
        const targetIdx = Math.max(0, Math.min(totalPages - 1, pageNum - 1));

        console.log(`🚀 Jumping to page: ${pageNum}, targetIdx: ${targetIdx}`);

        // Use flip for animation, fallback to turnToPage if it fails
        try {
            pageFlipRef.current.flip(targetIdx);
        } catch (e) {
            console.warn('Flip animation failed, turning instantly', e);
            pageFlipRef.current.turnToPage(targetIdx);
        }

        // Update state and render
        setCurrentPage(targetIdx);

        // Small delay to let page-flip settle DOM clones
        setTimeout(() => {
            renderNearbyPages(targetIdx);
        }, 150);
    };

    // Update Progress on Page Change
    useEffect(() => {
        if (!book || totalPages === 0 || loading) return;

        const updateReadingProgress = async () => {
            try {
                // Only update progress if book is purchased or price is 0
                const isPurchased = book.isPurchased === true || book.isPurchased === 'true' || book.price === 0;
                if (!isPurchased) return;

                // Calculate percentage (currentPage is 0-indexed, so +1)
                const percentage = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

                await readerService.updateProgress(bookId, {
                    page: currentPage + 1,
                    totalPages: totalPages,
                    progress: parseFloat(percentage.toFixed(2)),
                    bookmarks: bookmarks.map(b => b.page + 1)
                });
            } catch (error) {
                // Silently fail progress updates to avoid annoying toasts during reading
                console.error("Failed to update progress", error);
            }
        };

        // Debounce: Wait 3 seconds after landing on a page before saving
        const timer = setTimeout(updateReadingProgress, 3000);
        return () => clearTimeout(timer);

    }, [currentPage, bookId, totalPages, loading, book]);

    // --- HIGHLIGHT CREATION LOGIC ---
    const handleTextSelection = useCallback(() => {
        if (!user || !isHighlightEnabled) {
            setShowHighlightMenu(false);
            return;
        }

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const text = selection.toString().trim();
        if (!text) {
            setShowHighlightMenu(false);
            return;
        }

        const range = selection.getRangeAt(0);
        // Only show menu if inside a text layer
        if (!range.commonAncestorContainer.parentElement?.closest('.textLayer')) {
            setShowHighlightMenu(false);
            return;
        }

        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setMenuPosition({
            top: rect.top - 10,
            left: rect.left + (rect.width / 2)
        });
        setShowHighlightMenu(true);
    }, []);

    useEffect(() => {
        document.addEventListener('selectionchange', handleTextSelection);
        return () => document.removeEventListener('selectionchange', handleTextSelection);
    }, [handleTextSelection]);

    const handleAddHighlight = async (color) => {
        if (!user || !selectedText || !bookId) return;

        try {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            const range = selection.getRangeAt(0);

            // Get context (Page Index)
            const textLayer = range.commonAncestorContainer.parentElement.closest('.textLayer');
            const pageWrapper = textLayer?.parentElement; // .page-content-wrapper
            const pageDiv = pageWrapper?.parentElement; // .page
            if (!pageDiv) return;

            const pageIndex = parseInt(pageDiv.dataset.pageIndex);
            const pageNum = pageIndex + 1; // 1-based

            // Calculate Relative Rects
            const pageRect = pageWrapper.getBoundingClientRect();
            const rects = Array.from(range.getClientRects()).map(r => ({
                left: ((r.left - pageRect.left) / pageRect.width) * 100,
                top: ((r.top - pageRect.top) / pageRect.height) * 100,
                width: (r.width / pageRect.width) * 100,
                height: (r.height / pageRect.height) * 100
            }));

            // ERASER MODE
            if (color === 'eraser') {
                // Find overlaps
                const toRemove = highlights.filter(h => {
                    let pos = h.position;
                    if (typeof pos === 'string') { try { pos = JSON.parse(pos); } catch (e) { pos = {}; } }
                    pos = pos || {};
                    const hPage = pos.pageNumber || h.pageNumber;
                    if (hPage !== pageNum) return false;

                    const hRects = pos.rects || h.rects || [];
                    return rects.some(sRect =>
                        hRects.some(hr => {
                            const overlapX = Math.max(0, Math.min(sRect.left + sRect.width, hr.left + hr.width) - Math.max(sRect.left, hr.left));
                            const overlapY = Math.max(0, Math.min(sRect.top + sRect.height, hr.top + hr.height) - Math.max(sRect.top, hr.top));
                            // Eraser sensitivity
                            return (overlapX * overlapY) > 0.5;
                        })
                    );
                });

                if (toRemove.length > 0) {
                    setHighlights(prev => prev.filter(h => !toRemove.find(r => (r.id || r._id) === (h.id || h._id))));
                    // Delete in background
                    for (const h of toRemove) {
                        const hId = h.id || h._id;
                        if (hId) {
                            highlightService.deleteHighlight(hId).catch(console.error);
                        }
                    }
                    toast.success("Highlights erased");
                }
                setShowHighlightMenu(false);
                window.getSelection().removeAllRanges();
                return;
            }

            const highlightData = {
                bookId: parseInt(bookId),
                content: selectedText,
                color,
                position: { pageNumber: pageNum, rects }
            };

            const tempId = Date.now();
            setHighlights(prev => [...prev, { ...highlightData, id: tempId }]);
            setShowHighlightMenu(false);
            window.getSelection().removeAllRanges();

            const res = await highlightService.addHighlight(highlightData);
            if (!res.success) {
                setHighlights(prev => prev.filter(h => h.id !== tempId));
                toast.error("Failed to save highlight");
            } else {
                // Update with real ID
                setHighlights(prev => prev.map(h => h.id === tempId ? res.data : h));
            }
        } catch (e) {
            console.error(e);
            toast.error("Error saving highlight");
        }
    };

    // Scroll Library Shelf
    const scrollShelf = (direction) => {
        if (shelfScrollRef.current) {
            shelfScrollRef.current.scrollBy({ left: direction === 'left' ? -350 : 350, behavior: 'smooth' });
        }
    };

    // --- DRAWING BEHAVIOR & RESTORATION ---

    // 1) Sync pointer events and custom cursors based on whether drawing is active
    useEffect(() => {
        const canvases = document.querySelectorAll('.drawing-layer');
        let cursorStyle = 'auto';
        if (activeDrawTool === 'pen') {
            cursorStyle = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'white\' stroke=\'black\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'M21.17 2.83a3 3 0 0 0-4.24 0L2 17.76V22h4.24l14.93-14.93a3 3 0 0 0 0-4.24z\'/><path d=\'M16.5 6.5l2 2\'/></svg>") 2 22, crosshair';
        } else if (activeDrawTool === 'highlighter') {
            cursorStyle = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'20\' viewBox=\'0 0 12 20\'><rect x=\'1\' y=\'1\' width=\'10\' height=\'18\' fill=\'none\' stroke=\'black\' stroke-width=\'1.5\' stroke-dasharray=\'2,3\'/></svg>") 6 10, crosshair';
        } else if (activeDrawTool === 'eraser') {
            cursorStyle = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'white\' stroke=\'black\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21\'/><path d=\'M22 21H7\'/><path d=\'m5 11 9 9\'/></svg>") 2 22, crosshair';
        }

        canvases.forEach(c => {
            c.style.pointerEvents = activeDrawTool ? 'auto' : 'none';
            c.style.cursor = cursorStyle;
            if (activeDrawTool) {
                c.onclick = (e) => e.stopPropagation();
                c.ondblclick = (e) => e.stopPropagation();
            } else {
                c.onclick = null;
                c.ondblclick = null;
            }
        });
    }, [activeDrawTool, loading, totalPages, viewMode]);

    // 2) Redraw all strokes whenever zoom, size, highlights, or page changes
    useEffect(() => {
        if (!isBookReady) return;
        const canvases = document.querySelectorAll('.drawing-layer');
        canvases.forEach(canvas => {
            const pageDiv = canvas.closest('.page');
            if (!pageDiv) return;

            const pageIndex = parseInt(pageDiv.dataset.pageIndex, 10);
            const pageNum = pageIndex + 1;

            const ctx = canvas.getContext('2d');
            // Sync pixel dimensions with CSS size
            if (canvas.width !== canvas.clientWidth && canvas.clientWidth > 0) canvas.width = canvas.clientWidth;
            if (canvas.height !== canvas.clientHeight && canvas.clientHeight > 0) canvas.height = canvas.clientHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const pageDrawings = highlights.filter(h => {
                let pos = h.position;
                // Defensive parsing if position is stored as a string
                if (typeof pos === 'string') {
                    try { pos = JSON.parse(pos); } catch (e) { return false; }
                }
                pos = pos || {};
                return (pos.pageNumber === pageNum || h.pageNumber === pageNum) && pos.drawData;
            });

            // Draw Highlighters first (so they go under text or other elements nicely)
            pageDrawings.forEach(highlight => {
                let pos = highlight.position;
                if (typeof pos === 'string') {
                    try { pos = JSON.parse(pos); } catch (e) { return; }
                }
                pos = pos || {};
                const drawData = pos.drawData;
                if (!drawData || !drawData.path || drawData.path.length < 2) return;
                if (drawData.tool !== 'highlighter') return;

                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = drawData.color;
                ctx.globalCompositeOperation = 'multiply';
                ctx.globalAlpha = 0.4;
                ctx.lineWidth = drawData.thickness * 3;

                ctx.beginPath();
                ctx.moveTo(drawData.path[0].x * canvas.width, drawData.path[0].y * canvas.height);
                for (let i = 1; i < drawData.path.length; i++) {
                    ctx.lineTo(drawData.path[i].x * canvas.width, drawData.path[i].y * canvas.height);
                }
                ctx.stroke();
            });

            // Draw Pens on top (fully solid)
            pageDrawings.forEach(highlight => {
                let pos = highlight.position;
                if (typeof pos === 'string') {
                    try { pos = JSON.parse(pos); } catch (e) { return; }
                }
                pos = pos || {};
                const drawData = pos.drawData;
                if (!drawData || !drawData.path || drawData.path.length < 2) return;
                if (drawData.tool !== 'pen') return;

                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = drawData.color;
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1.0;
                ctx.lineWidth = drawData.thickness;

                ctx.beginPath();
                ctx.moveTo(drawData.path[0].x * canvas.width, drawData.path[0].y * canvas.height);
                for (let i = 1; i < drawData.path.length; i++) {
                    ctx.lineTo(drawData.path[i].x * canvas.width, drawData.path[i].y * canvas.height);
                }
                ctx.stroke();
            });

            // Reset back default
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
        });
    }, [highlights, viewMode, totalPages, loading, normalZoom, fullscreenZoom, isBookReady, currentPage, isBookFullscreen]);

    // 3) Attach drawing event listeners
    useEffect(() => {
        const container = bookContainerRef.current;
        if (!container) return;

        let currentPath = [];

        const getCoords = (e, canvas) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) / (rect.width || 1),
                y: (clientY - rect.top) / (rect.height || 1)
            };
        };

        const handlePointerDown = (e) => {
            if (!activeDrawTool) return;
            const target = e.target;
            if (!target.classList.contains('drawing-layer')) return;

            // Capture events forcefully before PageFlip flips
            e.preventDefault();
            e.stopPropagation();

            setIsDrawing(true);

            const activeCanvasCtx = target.getContext('2d');
            const activePageIndex = parseInt(target.closest('.page')?.dataset.pageIndex, 10);

            if (target.width !== target.clientWidth) target.width = target.clientWidth;
            if (target.height !== target.clientHeight) target.height = target.clientHeight;

            const coords = getCoords(e, target);
            currentPath = [coords];

            if (activeDrawTool === 'eraser') {
                // Eraser doesn't draw a path visually on the canvas right now
                // We'll just collect the path and delete intersecting strokes on pointerUp
                canvasContextRef.current = { ctx: null, target, pageIndex: activePageIndex, tool: activeDrawTool, color: drawColor, thickness: drawThickness };
                return;
            }

            activeCanvasCtx.lineCap = 'round';
            activeCanvasCtx.lineJoin = 'round';
            activeCanvasCtx.strokeStyle = drawColor;

            if (activeDrawTool === 'highlighter') {
                activeCanvasCtx.globalCompositeOperation = 'multiply';
                activeCanvasCtx.globalAlpha = 0.4;
                activeCanvasCtx.lineWidth = drawThickness * 3;
            } else {
                activeCanvasCtx.globalCompositeOperation = 'source-over';
                activeCanvasCtx.globalAlpha = 1.0;
                activeCanvasCtx.lineWidth = drawThickness;
            }

            activeCanvasCtx.beginPath();
            activeCanvasCtx.moveTo(coords.x * target.width, coords.y * target.height);

            canvasContextRef.current = { ctx: activeCanvasCtx, target, pageIndex: activePageIndex, tool: activeDrawTool, color: drawColor, thickness: drawThickness };
        };

        const handlePointerMove = (e) => {
            if (!isDrawing || !canvasContextRef.current) return;
            e.preventDefault();
            e.stopPropagation();

            const { ctx, target, tool } = canvasContextRef.current;
            const coords = getCoords(e, target);
            currentPath.push(coords);

            if (tool !== 'eraser' && ctx) {
                ctx.lineTo(coords.x * target.width, coords.y * target.height);
                ctx.stroke();
            }
        };

        const handlePointerUp = async (e) => {
            if (!isDrawing) return;
            setIsDrawing(false);
            e.preventDefault();
            e.stopPropagation();

            if (currentPath.length > 1 && canvasContextRef.current) {
                const { pageIndex, tool, color, thickness, target } = canvasContextRef.current;

                // --- ERASER LOGIC ---
                if (tool === 'eraser') {
                    const canvasW = target.width;
                    const canvasH = target.height;
                    const pageNum = pageIndex + 1;

                    // Simple bounding box collision for eraser
                    const eraserThick = 20; // Size of eraser 'hitbox' 

                    const toRemove = highlights.filter(h => {
                        let pos = h.position;
                        if (typeof pos === 'string') { try { pos = JSON.parse(pos); } catch (e) { pos = {}; } }
                        pos = pos || {};
                        const hPage = pos.pageNumber || h.pageNumber;

                        if (hPage !== pageNum || !pos.drawData) return false;

                        const hPath = pos.drawData.path || [];
                        // Check if any point in the eraser path overlaps with any point in the drawing path
                        return currentPath.some(ep => {
                            const eX = ep.x * canvasW;
                            const eY = ep.y * canvasH;

                            return hPath.some(hp => {
                                const hX = hp.x * canvasW;
                                const hY = hp.y * canvasH;
                                const distSq = (eX - hX) * (eX - hX) + (eY - hY) * (eY - hY);
                                return distSq < (eraserThick * eraserThick);
                            });
                        });
                    });

                    if (toRemove.length > 0) {
                        setHighlights(prev => prev.filter(h => !toRemove.find(r => (r.id || r._id) === (h.id || h._id))));
                        for (const h of toRemove) {
                            const hId = h.id || h._id;
                            if (hId) {
                                highlightService.deleteHighlight(hId).catch(console.error);
                            }
                        }
                    }
                    canvasContextRef.current = null;
                    currentPath = [];
                    return;
                }

                // --- DRAW LOGIC ---
                const strokeData = {
                    type: 'draw',
                    tool: tool,
                    color: color,
                    thickness: thickness,
                    path: currentPath
                };

                const highlightData = {
                    bookId: parseInt(bookId),
                    content: '',
                    color: color,
                    position: { pageNumber: pageIndex + 1, drawData: strokeData }
                };

                const tempId = Date.now();
                setHighlights(prev => [...prev, { ...highlightData, id: tempId }]);

                try {
                    const res = await highlightService.addHighlight(highlightData);
                    if (res.success) {
                        setHighlights(prev => prev.map(h => h.id === tempId ? res.data : h));
                    }
                } catch (err) {
                    console.error('Failed to save drawing', err);
                    toast.error("Failed to save drawing");
                }
            }

            canvasContextRef.current = null;
            currentPath = [];
        };

        // Use capture phase to intercept flip events
        container.addEventListener('touchstart', handlePointerDown, { passive: false, capture: true });
        container.addEventListener('touchmove', handlePointerMove, { passive: false, capture: true });
        container.addEventListener('touchend', handlePointerUp, { capture: true });
        container.addEventListener('touchcancel', handlePointerUp, { capture: true });

        container.addEventListener('mousedown', handlePointerDown, { capture: true });
        container.addEventListener('mousemove', handlePointerMove, { capture: true });
        window.addEventListener('mouseup', handlePointerUp, { capture: true });

        return () => {
            container.removeEventListener('touchstart', handlePointerDown, { capture: true });
            container.removeEventListener('touchmove', handlePointerMove, { capture: true });
            container.removeEventListener('touchend', handlePointerUp, { capture: true });
            container.removeEventListener('touchcancel', handlePointerUp, { capture: true });

            container.removeEventListener('mousedown', handlePointerDown, { capture: true });
            container.removeEventListener('mousemove', handlePointerMove, { capture: true });
            window.removeEventListener('mouseup', handlePointerUp, { capture: true });
        };
    }, [activeDrawTool, drawColor, drawThickness, bookId, isDrawing]);


    return (
        <div className={`min-h-screen w-full relative overflow-hidden font-sans select-none ${darkMode ? 'text-white' : 'text-gray-900'} ${isBlurred ? 'blur-md' : ''} ${isHighlightEnabled ? 'highlight-mode' : ''}`} style={{ backgroundColor: darkMode ? '#050505' : '#f0f0f0', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>


            {/* --- UTILITY BAR --- */}
            {!isBookFullscreen && (
                <div className={`relative w-full px-8 py-1 flex items-center border-b transition-colors duration-300 ${darkMode ? 'bg-black/20 border-white/5' : 'bg-white/40 border-black/5'}`} style={{ minHeight: '36px' }}>
                    {/* Left: Exit button */}
                    <div className="flex items-center gap-4 z-10">
                        <button onClick={() => {
                            if (isBookFullscreen) {
                                setIsBookFullscreen(false);
                                setIsFullscreen(false);
                                document.exitFullscreen?.().catch(() => { });
                            }
                            navigate('/reader/library');
                        }} className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#3D52A0] hover:text-[#ff6b52] transition-colors">
                            <FaArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform" /> Exit
                        </button>
                    </div>

                    {/* Center: Book Title */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-20">
                        <h2 className={`font-serif font-bold text-xs tracking-wide truncate max-w-[200px] md:max-w-md pointer-events-auto ${darkMode ? 'text-white/80' : 'text-gray-900/80'}`}>{book?.title}</h2>
                        {(() => {
                            const priceVal = book?.retailPrice !== undefined && book?.retailPrice !== null ? book?.retailPrice : book?.price;
                            const isActuallyFree = (priceVal !== null && priceVal !== undefined && priceVal !== '' && Number(priceVal) === 0);
                            const isActuallyPurchased = !!(book?.isPurchased === true || book?.isPurchased === 'true' || isActuallyFree || user?.role === 'admin');

                            if (!isActuallyPurchased) {
                                return (
                                    <span className="bg-[#3D52A0] text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ml-2 pointer-events-auto">Preview</span>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            )}

            {/* ================= REAL GLASS BOOKSHELF — hidden in book-fullscreen ================= */}
            {allShelfBooks.length > 0 && !isBookFullscreen && (
                <div className="w-full px-3 md:px-12 mt-0 -mb-2" style={{ position: 'relative', zIndex: 10 }}>
                    <div
                        className="relative rounded-t-none rounded-b-2xl p-4 pt-2 transition-all duration-500"
                        style={{
                            background: darkMode
                                ? 'radial-gradient(circle at 50% -20%, #1e293b 0%, #0f172a 60%, #020617 100%)'
                                : 'radial-gradient(circle at 50% -20%, #ffffff 0%, #f8fafc 60%, #e2e8f0 100%)',
                            borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'}`,
                            borderBottom: `1px solid ${darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)'}`,
                            boxShadow: darkMode
                                ? '0 30px 60px -10px rgba(0,0,0,0.8), inset 0 2px 10px rgba(255,255,255,0.05)'
                                : '0 25px 50px -12px rgba(0,0,0,0.15), inset 0 2px 10px rgba(255,255,255,1)',
                        }}
                    >
                        {/* Dramatic lighting overlay to give shelf depth */}
                        <div className="absolute inset-0 pointer-events-none"
                            style={{
                                background: darkMode
                                    ? 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)'
                                    : 'linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.03) 100%)'
                            }}
                        />
                        {/* Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-3">
                            <div className="flex items-center gap-1.5">
                                <FaBookOpen style={{ color: '#3D52A0', fontSize: '15px' }} />
                                <span
                                    className="text-[11px] font-bold uppercase tracking-widest"
                                    style={{ color: darkMode ? '#ffffff' : '#374151' }}
                                >MY LIBRARY</span>
                                <span
                                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                    style={{
                                        backgroundColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                                        color: darkMode ? 'rgba(255,255,255,0.7)' : '#6b7280'
                                    }}
                                >{allShelfBooks.length} Books</span>
                                <span
                                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                    style={{
                                        backgroundColor: 'rgba(34,197,94,0.15)',
                                        color: '#16a34a'
                                    }}
                                >{allShelfBooks.filter(b => b.isPurchasedByUser).length} Subscribed</span>
                            </div>
                            <span
                                className="text-[9px] uppercase tracking-widest hidden sm:block"
                                style={{ color: darkMode ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}
                            >Tap to switch book</span>
                        </div>

                        {/* Shelf Scroll Area */}
                        <div className="relative group/shelf flex items-center px-1 md:px-4">
                            {/* Left Scroll Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); scrollShelf('left'); }}
                                className={`absolute left-[-8px] md:left-[-16px] z-40 p-1 md:p-2 opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-125 drop-shadow-md ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                                    }`}
                                style={{ top: 'calc(50% - 8px)', transform: 'translateY(-50%)' }}
                                title="Scroll Left"
                            >
                                <FaChevronLeft size={18} />
                            </button>

                            <div ref={shelfScrollRef} className="flex items-end gap-[2px] overflow-x-auto overflow-y-visible pb-6 pt-10 scroll-smooth w-full px-20 md:px-24 no-scrollbar perspective-3d relative z-20" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {allShelfBooks.map((item, index) => {
                                    const libBook = item.book;
                                    if (!libBook) return null;

                                    const image =
                                        libBook.coverImage?.url ||
                                        libBook.coverImage ||
                                        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200";

                                    const targetId = libBook._id || libBook.id;
                                    const isActive = String(targetId) === String(bookId);
                                    const isOwned = item.isPurchasedByUser;

                                    const isAnimating = animatingBookId === targetId;

                                    // It's expanded (showing cover) ONLY if it's currently the active reading book
                                    const isExpanded = isActive;

                                    const progress = Math.round(item.progress || 0);
                                    const title = libBook.title || 'Untitled';

                                    // Elegant realistic spine colors matching the reference picture
                                    const spineColors = ['#1F4E5B', '#8E44AD', '#D35400', '#2C3E50', '#C0392B', '#16A085', '#27AE60', '#F39C12', '#34495E'];
                                    const spineColor = spineColors[index % spineColors.length];

                                    // All books same height for uniform shelf look
                                    const isMobileScreen = window.innerWidth < 768;
                                    const bookHeight = isMobileScreen ? 110 : 150;
                                    const spineWidth = isMobileScreen
                                        ? 24 + (index % 3) * 4   // 24, 28, 32 on mobile
                                        : 35 + (index % 3) * 6;  // 35, 41, 47 on desktop
                                    const coverWidth = isMobileScreen ? 65 : 95;

                                    // For 3D Pop-Out, expand to cover width while animating
                                    const currentWidth = (isExpanded || isAnimating) ? coverWidth : spineWidth;

                                    return (
                                        <div
                                            key={targetId}
                                            onClick={(e) => { e.stopPropagation(); handleShelfBookClick(targetId, isOwned); }}
                                            className="relative cursor-pointer group flex-shrink-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] preserve-3d"
                                            style={{
                                                width: `${currentWidth}px`,
                                                height: `${bookHeight}px`,
                                                transformOrigin: 'bottom center',
                                                transform: isAnimating
                                                    ? 'translateZ(90px) translateY(-15px) rotateY(-2deg) scale(1.05)'
                                                    : isExpanded
                                                        ? 'translateZ(10px) translateY(-10px)'
                                                        : 'translateZ(0) translateY(0)',
                                                margin: (isExpanded || isAnimating) ? '0 15px' : '0px',
                                                zIndex: isAnimating ? 100 : isExpanded ? 50 : 10,
                                            }}
                                        >
                                            {/* 3D Book Volume (Spine OR Cover wrapper) */}
                                            <div
                                                className="w-full h-full relative transition-all duration-500 group-hover:-translate-y-2 preserve-3d"
                                                style={{
                                                    boxShadow: isAnimating
                                                        ? '20px 30px 40px rgba(0,0,0,0.7), inset 3px 0 8px rgba(255,255,255,0.4), inset -1px 0 2px rgba(0,0,0,0.8)'
                                                        : isExpanded
                                                            ? '10px 15px 25px rgba(0,0,0,0.5), inset 3px 0 8px rgba(255,255,255,0.3), inset -1px 0 2px rgba(0,0,0,0.8)'
                                                            : '-3px 3px 10px rgba(0,0,0,0.5), inset 2px 0 5px rgba(255,255,255,0.1), inset -2px 0 4px rgba(0,0,0,0.4)',
                                                    backgroundColor: spineColor,
                                                    borderRadius: (isExpanded || isAnimating) ? '3px 5px 5px 3px' : '3px'
                                                }}
                                            >
                                                {/* Cover Image */}
                                                <img
                                                    src={image}
                                                    alt={title}
                                                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none"
                                                    style={{ opacity: (isExpanded || isAnimating) ? 1 : 0 }}
                                                />

                                                {/* Default Spine Appearance */}
                                                <div
                                                    className="absolute inset-0 flex flex-col items-center justify-between py-3 transition-opacity duration-700 pointer-events-none"
                                                    style={{
                                                        opacity: (isExpanded || isAnimating) ? 0 : 1,
                                                        background: 'linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.3) 100%)'
                                                    }}
                                                >
                                                    {/* Top spine ridges */}
                                                    <div className="w-full flex justify-center opacity-30">
                                                        <div className="w-[80%] h-[3px] border-t border-b border-white"></div>
                                                    </div>

                                                    {/* Vertical Title */}
                                                    <div
                                                        className="flex-1 flex items-center justify-center overflow-hidden w-full px-1"
                                                    >
                                                        <span className="text-[10px] sm:text-[11px] font-serif font-bold tracking-widest text-[#f5f5f5] uppercase drop-shadow-md truncate max-h-full"
                                                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                                        >
                                                            {title}
                                                        </span>
                                                    </div>

                                                    {/* Bottom spine ridges */}
                                                    <div className="w-full flex justify-center opacity-30">
                                                        <div className="w-[80%] h-[3px] border-t border-b border-white"></div>
                                                    </div>
                                                </div>

                                                {/* Removed spinner for 3D Pop-Out effect */}

                                                {/* Currently Reading Floating Badge */}
                                                {isActive && (
                                                    <div
                                                        className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-20"
                                                        style={{
                                                            background: 'linear-gradient(to bottom, #3D52A0, #e6391a)',
                                                            border: '1px solid rgba(255,255,255,0.2)'
                                                        }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                                                        READING
                                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: '#e6391a', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}></div>
                                                    </div>
                                                )}

                                                {/* 🔥 PURCHASED / NOT PURCHASED Mark */}
                                                {!isActive && isOwned && (
                                                    <div
                                                        className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-20"
                                                        style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
                                                    >
                                                        ✓ SUBSCRIBED
                                                    </div>
                                                )}
                                                {!isActive && !isOwned && (
                                                    <div
                                                        className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-20"
                                                        style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                                                    >
                                                        🔒 BUY
                                                    </div>
                                                )}

                                                {/* Lock overlay on non-purchased books (spine view) */}
                                                {!isOwned && !isExpanded && (
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                                                        style={{ background: 'rgba(0,0,0,0.35)' }}
                                                    >
                                                        <span style={{ fontSize: '14px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>🔒</span>
                                                    </div>
                                                )}

                                                {/* Reading Progress Ribbon on Spine */}
                                                {progress > 0 && !isExpanded && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-1 z-20 overflow-hidden bg-black/80">
                                                        <div className="h-full" style={{ width: `${progress}%`, backgroundColor: '#3D52A0', boxShadow: '0 0 4px #3D52A0' }} />
                                                    </div>
                                                )}

                                                {/* Reading Progress Ribbon on Bottom when expanded */}
                                                {progress > 0 && isExpanded && !isActive && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-1 z-20 overflow-hidden bg-black/80 rounded-br-[3px] rounded-bl-[5px]">
                                                        <div className="h-full" style={{ width: `${progress}%`, backgroundColor: '#3D52A0', boxShadow: '0 0 4px #3D52A0' }} />
                                                    </div>
                                                )}

                                            </div>

                                            {/* Hover Tooltip for Title (Elegant Glassmorphic Style) */}
                                            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-14 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full pointer-events-none whitespace-nowrap z-50 transition-all duration-400 ease-out transform -translate-y-3 group-hover:translate-y-0 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-xl bg-black/50 border border-white/10 flex items-center justify-center">
                                                <p className="text-[10px] sm:text-[11px] font-bold text-white tracking-widest uppercase truncate max-w-[150px] sm:max-w-[200px] drop-shadow-md">
                                                    {title}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Scroll Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); scrollShelf('right'); }}
                                className={`absolute right-[-8px] md:right-[-16px] z-40 p-1 md:p-2 opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-125 drop-shadow-md ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                                    }`}
                                style={{ top: 'calc(50% - 8px)', transform: 'translateY(-50%)' }}
                                title="Scroll Right"
                            >
                                <FaChevronRight size={18} />
                            </button>
                        </div>

                        {/* Wooden Shelf Base */}
                        <div
                            className="absolute bottom-0 left-0 right-0 h-3 rounded-b-2xl"
                            style={{
                                background: darkMode
                                    ? 'linear-gradient(to bottom, #4b2e1a, #2b1a0f)'
                                    : 'linear-gradient(to bottom, #d2a679, #a97142)'
                            }}
                        />
                    </div>
                </div>
            )}
            {/* --- GOD RAYS & ATMOSPHERE --- hidden in book fullscreen */}
            {!isBookFullscreen && (
                <motion.div
                    style={{ x: sphereX, y: sphereY }}
                    className={`absolute inset-0 transition-colors duration-700 pointer-events-none overflow-hidden`}
                >
                    <div className={`absolute inset-0 bg-transparent`} />
                    <Sphere delay={0} size={400} left="10%" top="-10%" color={darkMode ? "bg-emerald-900" : "bg-emerald-200"} />
                    <Sphere delay={2} size={300} left="80%" top="60%" color={darkMode ? "bg-blue-900" : "bg-blue-200"} />
                    <Sphere delay={4} size={250} left="40%" top="30%" color={darkMode ? "bg-purple-900" : "bg-purple-200"} />
                </motion.div>
            )}

            {!isBookFullscreen && <ParticleBackground darkMode={darkMode} />}

            {/* Background Pattern */}
            {!isBookFullscreen && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
                    style={{ backgroundImage: `radial-gradient(circle, ${darkMode ? '#ffffff' : '#000000'} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
                </div>
            )}

            {/* --- MAIN STICKY TOOLBAR --- */}
            <motion.div
                animate={{ y: zenMode ? -100 : 0, opacity: zenMode ? 0 : 1 }}
                transition={{ duration: 0.5 }}
                className={`sticky top-0 left-0 right-0 z-50 flex items-center backdrop-blur-xl border-b transition-colors duration-300 ${darkMode ? 'bg-black/60 border-white/8' : 'bg-white/80 border-black/8'}`}
            >
                {/* ====== MOBILE TOP HEADER (app-style) ====== */}
                <div className={`md:hidden w-full flex items-center justify-between px-3 py-2.5 ${actualLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}>
                    {/* Left: Back + Title */}
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={() => navigate(-1)}
                            className={`flex-shrink-0 p-1.5 rounded-full active:scale-90 transition-transform ${darkMode ? 'text-white' : 'text-gray-800'}`}
                        >
                            <FaChevronLeft size={18} />
                        </button>
                        <div className="min-w-0">
                            <p className={`text-[11px] font-bold tracking-widest uppercase truncate ${darkMode ? 'text-white/40' : 'text-gray-400'}`}>Reading</p>
                            <p className={`text-sm font-bold truncate leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{book?.title || 'Book'}</p>
                        </div>
                    </div>
                    {/* Right: Page indicator + More button */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-white/10 text-white/70' : 'bg-black/8 text-gray-600'}`}>
                            {currentPage + 1}<span className="opacity-40">/{totalPages}</span>
                        </span>
                        <button
                            onClick={() => setShowMobileMore(prev => !prev)}
                            className={`p-2 rounded-full active:scale-90 transition-transform ${darkMode ? 'text-white' : 'text-gray-800'}`}
                        >
                            <FaEllipsisV size={16} />
                        </button>
                    </div>
                </div>

                {/* DESKTOP: Full toolbar */}
                <div className={`hidden md:flex items-center gap-4 w-full justify-center px-8 py-2 ${actualLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
                    {(() => {
                        const priceVal = book?.retailPrice !== undefined && book?.retailPrice !== null ? book?.retailPrice : book?.price;
                        const isActuallyFree = (priceVal !== null && priceVal !== undefined && priceVal !== '' && Number(priceVal) === 0);
                        const isActuallyPurchased = !!(book?.isPurchased === true || book?.isPurchased === 'true' || isActuallyFree || user?.role === 'admin');

                        if (!isActuallyPurchased) {
                            return (
                                <button
                                    onClick={() => navigate(`/checkout/${bookId}`)}
                                    className="hidden lg:block px-3 py-1.5 bg-[#3D52A0] hover:bg-white hover:text-black text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg shadow-lg shadow-[#3D52A0]/10 mr-4"
                                >
                                    Buy Full Version
                                </button>
                            );
                        }
                        return null;
                    })()}
                    {/* Previous Button (Normal Mode Only) */}
                    {!isBookFullscreen && (
                        <button
                            onClick={() => pageFlipRef.current?.flipPrev()}
                            title="Previous Page"
                            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all border ${darkMode
                                ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-[#3D52A0] hover:bg-[#3D52A0]'
                                : 'bg-gray-100 border-black/5 text-gray-500 hover:text-white hover:border-[#3D52A0] hover:bg-[#3D52A0]'
                                } disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-inherit`}
                            disabled={currentPage === 0}>
                            <FaChevronLeft size={16} />
                        </button>
                    )}
                    {/* View Mode Switcher */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={() => handleViewModeChange('single')}
                            className={`flex flex-col items-center justify-center w-[46px] h-[46px] rounded-full transition-all ${viewMode === 'single'
                                ? 'bg-[#3D52A0] text-white shadow-md shadow-[#3D52A0]/30'
                                : darkMode
                                    ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333] hover:text-white border border-white/5'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black border border-black/5'
                                }`}
                            title="Single Page View"
                        >
                            <FaRegSquare size={14} className="mb-0.5" />
                            <span className="text-[7.5px] font-bold tracking-widest uppercase">Single</span>
                        </button>
                        <button
                            onClick={() => handleViewModeChange('double')}
                            className={`flex flex-col items-center justify-center w-[46px] h-[46px] rounded-full transition-all ${viewMode === 'double'
                                ? 'bg-[#3D52A0] text-white shadow-md shadow-[#3D52A0]/30'
                                : darkMode
                                    ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333] hover:text-white border border-white/5'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black border border-black/5'
                                }`}
                            title="Double Page View"
                        >
                            <FaColumns size={14} className="mb-0.5" />
                            <span className="text-[7.5px] font-bold tracking-widest uppercase">Double</span>
                        </button>
                        <button
                            onClick={() => handleViewModeChange('multi')}
                            className={`flex flex-col items-center justify-center w-[46px] h-[46px] rounded-full transition-all ${viewMode === 'multi'
                                ? 'bg-[#3D52A0] text-white shadow-md shadow-[#3D52A0]/30'
                                : darkMode
                                    ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333] hover:text-white border border-white/5'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black border border-black/5'
                                }`}
                            title="Grid / Multi Page View"
                        >
                            <FaThLarge size={14} className="mb-0.5" />
                            <span className="text-[7.5px] font-bold tracking-widest uppercase">Grid</span>
                        </button>
                    </div>

                    {/* Auto Play Button */}
                    <button
                        onClick={() => setIsAutoPlaying(prev => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${isAutoPlaying
                            ? 'bg-[#3D52A0] border-[#3D52A0] text-white shadow-lg shadow-[#3D52A0]/40 animate-pulse'
                            : (darkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-[#3D52A0] hover:border-[#3D52A0] hover:text-white' : 'bg-gray-100 border-black/10 text-gray-600 hover:bg-[#3D52A0] hover:border-[#3D52A0] hover:text-white')
                            }`}
                        title={isAutoPlaying ? 'Stop Auto Play' : 'Auto Play Pages'}
                        disabled={currentPage >= totalPages - 1 && !isAutoPlaying}
                    >
                        {isAutoPlaying ? <FaPause size={11} /> : <FaPlay size={11} />}
                        <span className="hidden sm:inline">{isAutoPlaying ? 'Stop' : 'Auto'}</span>
                    </button>
                    {/* TOP PAGE JUMP CONTROL */}
                    <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-lg border ${darkMode
                        ? "bg-white/5 border-white/10 text-white"
                        : "bg-gray-100 border-black/10 text-gray-900"
                        }`}>
                        <span className="text-xs font-semibold opacity-60">PAGE</span>

                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={pageInput || (currentPage + 1)}
                            onChange={(e) => setPageInput(e.target.value)}
                            className="w-12 text-center bg-transparent border-b border-[#3D52A0] text-[#3D52A0] outline-none text-sm"
                        />

                        <span className="text-xs opacity-40">/ {totalPages}</span>

                        <button
                            onClick={() => {
                                if (pageInput) {
                                    jumpToPage(parseInt(pageInput));
                                    setPageInput('');
                                }
                            }}
                            className="px-2 py-1 text-xs rounded-md bg-[#3D52A0] text-white hover:bg-white hover:text-black transition-all"
                        >
                            GO
                        </button>
                    </div>

                    {/* Bookmark Add Button (after GO) */}
                    {user && (
                        <button
                            onClick={() => toggleBookmark(currentPage)}
                            title={bookmarks.some(b => b.page === currentPage) ? 'Remove Bookmark from this page' : 'Add Bookmark to this page'}
                            className={`relative group flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 ${bookmarks.some(b => b.page === currentPage)
                                ? 'bg-[#3D52A0] border-[#3D52A0] text-white shadow-lg shadow-[#3D52A0]/30'
                                : darkMode
                                    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-[#3D52A0] hover:border-[#3D52A0] hover:text-white'
                                    : 'bg-gray-100 border-black/10 text-gray-600 hover:bg-[#3D52A0] hover:border-[#3D52A0] hover:text-white'
                                }`}
                        >
                            {/* Bookmark + Plus icon */}
                            {bookmarks.some(b => b.page === currentPage) ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                    <path d="M5 2a2 2 0 0 0-2 2v18l9-4 9 4V4a2 2 0 0 0-2-2H5zm4.5 9.5v-3h1.5v3h3v1.5h-3v3h-1.5v-3h-3V11.5h3z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                    <line x1="12" y1="8" x2="12" y2="14" />
                                    <line x1="9" y1="11" x2="15" y2="11" />
                                </svg>
                            )}
                            <span className="hidden sm:inline">
                                {bookmarks.some(b => b.page === currentPage) ? 'Saved' : 'Mark'}
                            </span>
                            {bookmarks.some(b => b.page === currentPage) && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border-2 border-[#3D52A0] animate-ping" />
                            )}
                        </button>
                    )}
                    {/* Legacy Highlight Button Removed */}

                    {/* Draw Menu Toggle */}
                    {user && (
                        <div className="relative">
                            <div className={`flex items-center rounded-xl overflow-hidden transition-all border ${showDrawMenu || activeDrawTool
                                ? 'bg-[#3D52A0] border-[#3D52A0] text-white shadow-lg shadow-[#3D52A0]/30'
                                : (darkMode ? 'bg-white/5 border-white/10 hover:bg-[#3D52A0] text-gray-400 hover:text-white hover:border-[#3D52A0]' : 'bg-gray-100 border-black/5 hover:bg-[#3D52A0] text-gray-500 hover:text-white hover:border-[#3D52A0]')
                                }`}>
                                <button
                                    onClick={() => {
                                        if (activeDrawTool) setActiveDrawTool(null);
                                        else setShowDrawMenu(!showDrawMenu); // Open menu if not active
                                    }}
                                    className="p-2 w-10 h-10 flex items-center justify-center border-r border-black/10 dark:border-white/10"
                                    title="Draw Tool"
                                >
                                    {activeDrawTool === 'pen' ? <FaPenNib size={15} /> : activeDrawTool === 'highlighter' ? <FaHighlighter size={15} /> : activeDrawTool === 'eraser' ? <FaEraser size={15} /> : <FaPenNib size={15} className="opacity-60" />}
                                </button>
                                <button
                                    onClick={() => setShowDrawMenu(!showDrawMenu)}
                                    className="px-1.5 h-10 flex flex-col justify-center items-center opacity-80 hover:opacity-100"
                                >
                                    <span className="text-[9px] font-bold leading-none mb-0.5 mt-0.5">DRAW</span>
                                    <FaChevronDown size={8} />
                                </button>
                            </div>

                            {/* Draw Settings Menu */}
                            {showDrawMenu && (
                                <div className={`absolute top-12 left-0 w-64 p-4 rounded-xl shadow-2xl z-50 animate-fade-in ${darkMode ? 'bg-[#222] border border-white/10 shadow-black/50' : 'bg-white border border-gray-200 shadow-gray-300'}`}>
                                    {/* Tool Selection */}
                                    <div className="flex gap-1 mb-4 p-1 rounded-lg bg-black/5 dark:bg-white/5 overflow-hidden">
                                        <button
                                            onClick={() => setActiveDrawTool(prev => prev === 'pen' ? null : 'pen')}
                                            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition ${activeDrawTool === 'pen' ? 'bg-[#3D52A0] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                        >
                                            <FaPenNib size={10} /> Pen
                                        </button>
                                        <button
                                            onClick={() => setActiveDrawTool(prev => prev === 'highlighter' ? null : 'highlighter')}
                                            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition ${activeDrawTool === 'highlighter' ? 'bg-[#3D52A0] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                        >
                                            <FaHighlighter size={10} /> Highl
                                        </button>
                                        <button
                                            onClick={() => setActiveDrawTool(prev => prev === 'eraser' ? null : 'eraser')}
                                            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition ${activeDrawTool === 'eraser' ? 'bg-[#3D52A0] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                        >
                                            <FaEraser size={10} /> Erase
                                        </button>
                                    </div>

                                    <h4 className={`text-xs font-bold mb-2 uppercase tracking-wide opacity-50 ${darkMode ? 'text-white' : 'text-black'}`}>Colors</h4>
                                    <div className="grid grid-cols-6 gap-2 mb-4">
                                        {DRAW_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => { setDrawColor(c); if (!activeDrawTool) setActiveDrawTool('pen'); setShowDrawMenu(false); }}
                                                className={`w-6 h-6 rounded-full border border-black/20 relative flex items-center justify-center hover:scale-110 transition`}
                                                style={{ backgroundColor: c }}
                                            >
                                                {drawColor === c && <div className="absolute inset-0 border-[2px] border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] rounded-full pointer-events-none" />}
                                            </button>
                                        ))}
                                    </div>

                                    <h4 className={`text-xs font-bold mb-2 uppercase tracking-wide opacity-50 ${darkMode ? 'text-white' : 'text-black'}`}>Thickness</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                        <input
                                            type="range"
                                            min="1" max="15"
                                            value={drawThickness}
                                            onChange={(e) => { setDrawThickness(Number(e.target.value)); if (!activeDrawTool) setActiveDrawTool('pen'); }}
                                            onMouseUp={() => setShowDrawMenu(false)}
                                            onTouchEnd={() => setShowDrawMenu(false)}
                                            className="flex-1 accent-[#3D52A0] h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Zoom Controls — percentage is relative to BASE scale, not raw CSS scale */}
                    <div title="Zoom" className={`hidden md:flex items-center gap-1 rounded-lg p-1 border ${darkMode ? 'border-white/10 bg-white/5' : 'border-black/5 bg-gray-100'}`}>
                        <button onClick={() => handleZoom(-0.1)} title="Zoom Out (-10%)" className="p-2 hover:text-[#3D52A0] transition-colors"><FaSearchMinus size={14} /></button>
                        {/* Click the % to reset to 100% (= BASE scale) */}
                        <button
                            onClick={() => {
                                if (isBookFullscreen) setFullscreenZoom(FULLSCREEN_BASE);
                                else setNormalZoom(NORMAL_BASE);
                            }}
                            title="Click to reset zoom to 100%"
                            className={`text-xs font-mono w-10 text-center transition-colors rounded ${Math.round((isBookFullscreen ? fullscreenZoom / FULLSCREEN_BASE : normalZoom / NORMAL_BASE) * 100) !== 100
                                ? 'text-[#3D52A0] hover:text-white'
                                : 'hover:text-[#3D52A0]'
                                }`}
                        >
                            {Math.round((isBookFullscreen ? fullscreenZoom / FULLSCREEN_BASE : normalZoom / NORMAL_BASE) * 100)}%
                        </button>
                        <button onClick={() => handleZoom(0.1)} title="Zoom In (+10%)" className="p-2 hover:text-[#3D52A0] transition-colors"><FaSearchPlus size={14} /></button>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all border ${darkMode
                            ? 'bg-white/5 border-white/10 hover:bg-[#3D52A0] text-gray-400 hover:text-white hover:border-[#3D52A0]'
                            : 'bg-gray-100 border-black/5 hover:bg-[#3D52A0] text-gray-500 hover:text-white hover:border-[#3D52A0]'}`}>
                        {darkMode ? <FaSun className="text-yellow-400" size={16} /> : <FaMoon size={16} />}
                    </button>

                    {/* Bookmark List Dropdown (Total Bookmarks) */}

                    {user && (
                        <div className="relative">
                            <button
                                onClick={() => setShowBookmarks(!showBookmarks)}
                                title={`All Bookmarks (${bookmarks.length})`}
                                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 ${showBookmarks
                                    ? 'bg-[#3D52A0] border-[#3D52A0] text-white shadow-lg shadow-[#3D52A0]/30'
                                    : darkMode
                                        ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-[#3D52A0] hover:text-white hover:border-[#3D52A0]'
                                        : 'bg-gray-100 border-black/10 text-gray-600 hover:bg-[#3D52A0] hover:text-white hover:border-[#3D52A0]'
                                    }`}
                            >
                                {/* Bookmark-list icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                                    <path d="M8 2a2 2 0 0 0-2 2v15l6-2.7 6 2.7V4a2 2 0 0 0-2-2H8zm0 2h8v12.3l-4-1.8-4 1.8V4z" />
                                    <rect x="9" y="6" width="6" height="1.5" rx="0.5" />
                                    <rect x="9" y="9" width="4" height="1.5" rx="0.5" />
                                </svg>
                                {/* Numeric count badge */}
                                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-black rounded-full px-1 border transition-all ${showBookmarks
                                    ? 'bg-white text-[#3D52A0] border-white/30'
                                    : bookmarks.length > 0
                                        ? 'bg-[#3D52A0] text-white border-[#3D52A0]'
                                        : darkMode ? 'bg-white/10 text-gray-400 border-white/10' : 'bg-black/8 text-gray-500 border-black/10'
                                    }`}>
                                    {bookmarks.length}
                                </span>
                            </button>

                            {/* Dropdown Panel */}
                            {showBookmarks && (
                                <div className={`absolute right-0 top-14 w-72 rounded-xl shadow-2xl p-4 animate-fade-in border origin-top-right backdrop-blur-3xl z-[60] 
                                    ${darkMode ? 'bg-black/80 border-white/10 text-white' : 'bg-white/90 border-black/5 text-gray-900'}`}>
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-500/20">
                                        <h3 className="font-bold text-sm uppercase tracking-wider">Bookmarks</h3>
                                        <span className="text-xs opacity-50">{bookmarks.length} Saved</span>
                                    </div>
                                    {bookmarks.length === 0 ? (
                                        <div className="text-center py-6 opacity-40 text-sm">
                                            <FaBookmark className="mx-auto mb-2 text-xl" />
                                            <p>No bookmarks yet</p>
                                        </div>
                                    ) : (
                                        <ul className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                                            {bookmarks.map((b, i) => (
                                                <li key={i} className="group flex items-center justify-between p-2 rounded-lg hover:bg-[#3D52A0]/10 cursor-pointer transition-colors"
                                                    onClick={() => { jumpToPage(b.page + 1); setShowBookmarks(false); }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#3D52A0]/20 flex items-center justify-center text-[#3D52A0] text-xs font-bold">
                                                            {b.page + 1}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium group-hover:text-[#3D52A0] transition-colors">Page {b.page + 1}</span>
                                                            <span className="text-[10px] opacity-40">{new Date(b.timestamp).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleBookmark(b.page); }}
                                                        className="p-1.5 rounded-full hover:bg-black/20 dark:hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all text-xs"
                                                        title="Remove Bookmark"
                                                    >
                                                        ✕
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                    )}
                    {/* Next Button (Normal Mode Only) */}
                    {!isBookFullscreen && (
                        <button
                            onClick={() => pageFlipRef.current?.flipNext()}
                            title="Next Page"
                            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all border ${darkMode
                                ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-[#3D52A0] hover:bg-[#3D52A0]'
                                : 'bg-gray-100 border-black/5 text-gray-500 hover:text-white hover:border-[#3D52A0] hover:bg-[#3D52A0]'
                                } disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-inherit`}
                            disabled={currentPage >= totalPages - 1}>
                            <FaChevronRight size={16} />
                        </button>
                    )}

                    {/* Fullscreen Book  Mode */}
                    <button
                        onClick={() => {
                            const next = !isBookFullscreen;
                            setIsBookFullscreen(next);
                            setIsFullscreen(next);
                            if (next) {
                                // Reset fullscreen zoom to its BASE (= 100%) on every entry
                                setFullscreenZoom(FULLSCREEN_BASE);
                                document.documentElement.requestFullscreen?.().catch(() => { });
                            } else {
                                document.exitFullscreen?.().catch(() => { });
                                // normalZoom untouched — user's normal-mode zoom is preserved
                            }
                        }}
                        title={isBookFullscreen ? 'Exit Fullscreen' : 'Fullscreen — Show book only'}
                        className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all border ${isBookFullscreen
                            ? 'bg-[#3D52A0] border-[#3D52A0] text-white shadow-lg shadow-[#3D52A0]/30'
                            : (darkMode ? 'bg-white/5 border-white/10 hover:bg-[#3D52A0] text-gray-400 hover:text-white hover:border-[#3D52A0]' : 'bg-gray-100 border-black/5 hover:bg-[#3D52A0] text-gray-500 hover:text-white hover:border-[#3D52A0]')}`}
                    >
                        {isBookFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
                    </button>
                </div>
            </motion.div>

            {/* ====== MOBILE: SLIDE-UP MORE SHEET ====== */}
            {showMobileMore && !actualLoading && (
                <>
                    {/* backdrop */}
                    <div className="md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileMore(false)} />
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className={`md:hidden fixed bottom-0 left-0 right-0 z-[61] rounded-t-3xl pb-safe ${darkMode ? 'bg-[#18181b] border-t border-white/10' : 'bg-white border-t border-black/10'} shadow-2xl`}
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className={`w-10 h-1 rounded-full ${darkMode ? 'bg-white/20' : 'bg-black/20'}`} />
                        </div>
                        <p className={`text-center text-[11px] font-bold tracking-widest uppercase mb-3 ${darkMode ? 'text-white/40' : 'text-gray-400'}`}>More Options</p>

                        <div className="px-5 pb-6 space-y-3">
                            {/* Row 1: Dark Mode, Autoplay, Fullscreen */}
                            <div className="grid grid-cols-3 gap-3">
                                <button onClick={() => { setDarkMode(!darkMode); }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${darkMode ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-gray-100 text-gray-600 border border-black/5'}`}>
                                    {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                                    <span className="text-[10px] font-bold">{darkMode ? 'Light' : 'Dark'}</span>
                                </button>
                                <button onClick={() => { setIsAutoPlaying(p => !p); setShowMobileMore(false); }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${isAutoPlaying ? 'bg-[#3D52A0]/15 text-[#3D52A0] border border-[#3D52A0]/30' : (darkMode ? 'bg-white/5 text-white/60 border border-white/10' : 'bg-gray-100 text-gray-600 border border-black/5')}`}>
                                    {isAutoPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
                                    <span className="text-[10px] font-bold">{isAutoPlaying ? 'Stop' : 'Autoplay'}</span>
                                </button>
                                <button onClick={() => { const next = !isBookFullscreen; setIsBookFullscreen(next); setIsFullscreen(next); if (next) { setFullscreenZoom(FULLSCREEN_BASE); document.documentElement.requestFullscreen?.().catch(() => { }); } else { document.exitFullscreen?.().catch(() => { }); } setShowMobileMore(false); }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${isBookFullscreen ? 'bg-[#3D52A0]/15 text-[#3D52A0] border border-[#3D52A0]/30' : (darkMode ? 'bg-white/5 text-white/60 border border-white/10' : 'bg-gray-100 text-gray-600 border border-black/5')}`}>
                                    {isBookFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
                                    <span className="text-[10px] font-bold">{isBookFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
                                </button>
                            </div>

                            {/* Row 2: View Modes */}
                            <div className="grid grid-cols-3 gap-3">
                                {['single', 'double', 'multi'].map(mode => (
                                    <button key={mode} onClick={() => { handleViewModeChange(mode); setShowMobileMore(false); }}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${viewMode === mode
                                            ? 'bg-[#3D52A0] text-white border border-[#3D52A0]'
                                            : (darkMode ? 'bg-white/5 text-white/60 border border-white/10' : 'bg-gray-100 text-gray-600 border border-black/5')
                                            }`}>
                                        {mode === 'single' ? <FaRegSquare size={20} /> : mode === 'double' ? <FaColumns size={20} /> : <FaThLarge size={20} />}
                                        <span className="text-[10px] font-bold capitalize">{mode}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Row 3: Draw + Zoom stepper */}
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { setShowDrawMenu(true); setShowMobileMore(false); }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${activeDrawTool ? 'bg-[#3D52A0]/15 text-[#3D52A0] border border-[#3D52A0]/30' : (darkMode ? 'bg-white/5 text-white/60 border border-white/10' : 'bg-gray-100 text-gray-600 border border-black/5')}`}>
                                    <FaPenNib size={20} />
                                    <span className="text-[10px] font-bold">Draw</span>
                                </button>

                                {/* Zoom inline stepper — no window.prompt (breaks fullscreen!) */}
                                <div className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-black/5'
                                    }`}>
                                    <div className="flex items-center gap-2 w-full justify-center">
                                        <button
                                            onClick={() => handleZoom(-0.1)}
                                            className={`w-8 h-8 rounded-xl font-bold text-xl flex items-center justify-center active:scale-90 transition-transform ${darkMode ? 'bg-white/15 text-white' : 'bg-black/10 text-gray-800'}`}
                                        >−</button>
                                        <span className={`text-[13px] font-black font-mono min-w-[40px] text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                            {Math.round((isBookFullscreen ? fullscreenZoom / FULLSCREEN_BASE : normalZoom / NORMAL_BASE) * 100)}%
                                        </span>
                                        <button
                                            onClick={() => handleZoom(0.1)}
                                            className={`w-8 h-8 rounded-xl font-bold text-xl flex items-center justify-center active:scale-90 transition-transform ${darkMode ? 'bg-white/15 text-white' : 'bg-black/10 text-gray-800'}`}
                                        >+</button>
                                    </div>
                                    <span className={`text-[9px] font-bold ${darkMode ? 'text-white/40' : 'text-gray-400'}`}>Zoom</span>
                                </div>
                            </div>

                            {/* Buy Now (if not purchased) */}
                            {(() => {
                                const priceVal = book?.retailPrice !== undefined && book?.retailPrice !== null ? book?.retailPrice : book?.price;
                                const isActuallyFree = (priceVal !== null && priceVal !== undefined && priceVal !== '' && Number(priceVal) === 0);
                                const isActuallyPurchased = !!(book?.isPurchased === true || book?.isPurchased === 'true' || isActuallyFree || user?.role === 'admin');
                                if (!isActuallyPurchased) return (
                                    <button onClick={() => navigate(`/checkout/${bookId}`)} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#3D52A0] to-[#7091E6] text-white font-bold text-sm tracking-wide active:scale-95 transition-transform">
                                        🛒 Buy Full Version
                                    </button>
                                );
                                return null;
                            })()}
                        </div>
                    </motion.div>
                </>
            )}

            {/* ====== MOBILE BOTTOM NAV BAR (5 tabs) ====== */}
            {!actualLoading && !zenMode && !isBookFullscreen && (
                <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around backdrop-blur-2xl border-t ${darkMode ? 'bg-[#0f0f0f]/90 border-white/8' : 'bg-white/95 border-black/8'}`}
                    style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)', paddingTop: '6px' }}>

                    {/* Prev */}
                    <button onClick={() => pageFlipRef.current?.flipPrev()} disabled={currentPage === 0}
                        className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl active:scale-90 transition-transform ${currentPage === 0 ? 'opacity-25' : ''} ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        <FaChevronLeft size={20} />
                        <span className="text-[9px] font-semibold">Prev</span>
                    </button>

                    {/* Bookmark */}
                    <button onClick={() => user && toggleBookmark(currentPage)}
                        className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl active:scale-90 transition-transform ${bookmarks.some(b => b.page === currentPage) ? 'text-[#3D52A0]' : (darkMode ? 'text-white/50' : 'text-gray-500')
                            }`}>
                        <svg viewBox="0 0 24 24" fill={bookmarks.some(b => b.page === currentPage) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" width="20" height="20"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                        <span className="text-[9px] font-semibold">Save</span>
                    </button>

                    {/* Center: Page pill (tap to jump) */}
                    <button onClick={() => { const p = window.prompt(`Go to page (1–${totalPages}):`, currentPage + 1); if (p && !isNaN(p)) jumpToPage(parseInt(p)); }}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl active:scale-90 transition-transform`}>
                        <span className={`text-base font-black font-mono leading-none ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentPage + 1}</span>
                        <span className={`text-[9px] font-semibold ${darkMode ? 'text-white/40' : 'text-gray-400'}`}>of {totalPages}</span>
                    </button>

                    {/* Grid */}
                    <button onClick={() => handleViewModeChange(viewMode === 'multi' ? 'single' : 'multi')}
                        className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl active:scale-90 transition-transform ${viewMode === 'multi' ? 'text-[#3D52A0]' : (darkMode ? 'text-white/50' : 'text-gray-500')}`}>
                        <FaThLarge size={19} />
                        <span className="text-[9px] font-semibold">Grid</span>
                    </button>

                    {/* Next */}
                    <button onClick={() => pageFlipRef.current?.flipNext()} disabled={currentPage >= totalPages - 1}
                        className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl active:scale-90 transition-transform ${currentPage >= totalPages - 1 ? 'opacity-25' : ''} ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        <FaChevronRight size={20} />
                        <span className="text-[9px] font-semibold">Next</span>
                    </button>
                </div>
            )}

            {/* ====== MOBILE FULLSCREEN: Floating Zoom + Exit Controls ====== */}
            {!actualLoading && isBookFullscreen && (
                <div className="md:hidden fixed bottom-6 right-4 z-50 flex flex-col items-center gap-2">
                    {/* Zoom pill */}
                    <div className={`flex items-center gap-1 px-2 py-1.5 rounded-2xl shadow-2xl backdrop-blur-xl border ${darkMode ? 'bg-black/70 border-white/15 text-white' : 'bg-white/90 border-black/10 text-gray-800'
                        }`}>
                        <button
                            onClick={() => handleZoom(-0.1)}
                            className="w-8 h-8 rounded-xl font-bold text-xl flex items-center justify-center active:scale-90 transition-transform"
                        >−</button>
                        <span className="text-xs font-black font-mono min-w-[42px] text-center">
                            {Math.round(fullscreenZoom / FULLSCREEN_BASE * 100)}%
                        </span>
                        <button
                            onClick={() => handleZoom(0.1)}
                            className="w-8 h-8 rounded-xl font-bold text-xl flex items-center justify-center active:scale-90 transition-transform"
                        >+</button>
                    </div>
                    {/* Exit fullscreen */}
                    <button
                        onClick={() => { setIsBookFullscreen(false); setIsFullscreen(false); document.exitFullscreen?.().catch(() => { }); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl shadow-xl backdrop-blur-xl text-xs font-bold border active:scale-90 transition-transform ${darkMode ? 'bg-black/70 border-white/15 text-white/80' : 'bg-white/90 border-black/10 text-gray-700'
                            }`}
                    >
                        <FaCompress size={12} /> Exit
                    </button>
                </div>
            )}

            {/* ===== LOADING STATE (Overlay replacing book stage) ===== */}
            {actualLoading && (
                <div
                    className={`w-full flex-1 flex flex-col items-center flex-shrink-0 ${isBookFullscreen ? 'justify-center absolute top-[68px] bottom-0 left-0 right-0 z-40 bg-zinc-100 dark:bg-[#1a1a1a]' : 'justify-start pt-4 pb-8'}`}
                    style={{ minHeight: isBookFullscreen ? 'calc(100vh - 68px)' : '60vh' }}
                >
                    <div className="relative flex items-center justify-center w-28 h-28 mb-6">
                        {/* Spinning Circle */}
                        <div className="absolute inset-0 border-4 border-[#3D52A0]/20 border-t-[#3D52A0] rounded-full animate-spin"></div>
                        {/* Static Book Icon matching text color */}
                        <FaBookOpen className="text-5xl text-[#3D52A0] drop-shadow-md" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold tracking-tight mb-2 text-[#3D52A0] text-center px-4">
                        {isSwitchingView ? "Changing View Mode..." : (isTransitioning ? "Preparing Book..." : "Opening Book...")}
                    </h2>
                    <div className="w-64 h-1 bg-[#3D52A0]/20 rounded-full mt-6 overflow-hidden shadow-inner flex-shrink-0">
                        <div className="h-full bg-[#3D52A0] transition-all duration-300" style={{ width: `${loadingProgress || (isTransitioning ? 30 : 0)}%` }}></div>
                    </div>
                    <p className={`text-xs mt-3 uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-500 font-bold'}`}>
                        {loadingProgress || (isTransitioning ? 30 : 0)}% {isSwitchingView ? "Complete" : "Loaded"}
                    </p>
                </div>
            )}

            {/* ===== NORMAL MODE: 3D BOOK STAGE (original layout) ===== */}
            {!isBookFullscreen && !actualLoading && viewMode !== 'multi' && (
                <div
                    className="w-full flex items-start justify-center perspective-3d reader-3d-container pt-12"
                    onClick={(e) => {
                        // Close draw menu if clicking anywhere outside the toolbar area in the reader
                        if (showDrawMenu && !e.target.closest('.toolbar-container')) {
                            setShowDrawMenu(false);
                        }
                    }}
                    style={{
                        height: !isBookFullscreen ? `${(bookDimensions.h * normalZoom) + 35}px` : 'auto',
                        background: darkMode
                            ? 'radial-gradient(circle at center, #1a1a1a 0%, #050505 100%)'
                            : 'radial-gradient(circle at center, #f0f0f0 0%, #e0e0e0 100%)',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                >
                    <div
                        className="relative transition-transform duration-500 ease-out preserve-3d"
                        style={{ transform: `scale(${normalZoom}) translateZ(0)`, transformOrigin: 'top center' }}
                    >
                        <div
                            ref={bookContainerRef}
                            className={`relative z-10 transition-shadow duration-300`}
                            style={{
                                willChange: 'transform',
                                transform: 'translateZ(0)',
                                boxShadow: getDynamicBookContentShadow(currentPage, totalPages)
                            }}
                        ></div>
                        <ForeEdgeNavigation side="left" totalPages={totalPages} currentPage={currentPage} isBookFullscreen={false} pageFlipRef={pageFlipRef} />
                        <ForeEdgeNavigation side="right" totalPages={totalPages} currentPage={currentPage} isBookFullscreen={false} pageFlipRef={pageFlipRef} />
                    </div>
                </div>
            )}

            {/* ===== FULLSCREEN MODE: Fixed overlay, fills screen natively (no scroll) ===== */}
            {isBookFullscreen && !loading && viewMode !== 'multi' && (
                <div
                    className="perspective-3d reader-3d-container"
                    onClick={(e) => {
                        if (showDrawMenu && !e.target.closest('.toolbar-container')) {
                            setShowDrawMenu(false);
                        }
                    }}
                    style={{
                        position: 'fixed',
                        top: '68px',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        background: darkMode
                            ? 'radial-gradient(circle at center, #1a1a1a 0%, #050505 100%)'
                            : 'radial-gradient(circle at center, #f0f0f0 0%, #e0e0e0 100%)'
                    }}
                >
                    <div
                        className="preserve-3d"
                        style={{
                            transform: `scale(${fullscreenZoom}) translateZ(0)`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s ease-out',
                            willChange: 'transform',
                        }}
                    >
                        <div
                            ref={bookContainerRef}
                            className={`relative z-10 transition-shadow duration-300`}
                            style={{
                                transform: 'translateZ(0)',
                                boxShadow: getDynamicBookContentShadow(currentPage, totalPages)
                            }}
                        ></div>
                        <ForeEdgeNavigation side="left" totalPages={totalPages} currentPage={currentPage} isBookFullscreen={true} pageFlipRef={pageFlipRef} />
                        <ForeEdgeNavigation side="right" totalPages={totalPages} currentPage={currentPage} isBookFullscreen={true} pageFlipRef={pageFlipRef} />
                    </div>
                </div>
            )}

            {/* ===== MULTI GRID VIEW ===== */}
            {!actualLoading && viewMode === 'multi' && (
                <div className={`w-full flex-1 pt-8 pb-12 px-8 overflow-y-auto custom-scrollbar`} style={{ minHeight: 'calc(100vh - 100px)' }}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 max-w-[1400px] mx-auto w-full">
                        {(() => {
                            const priceVal = book?.retailPrice !== undefined && book?.retailPrice !== null ? book?.retailPrice : book?.price;
                            const isActuallyFree = (priceVal !== null && priceVal !== undefined && priceVal !== '' && Number(priceVal) === 0);
                            const isActuallyPurchased = !!(book?.isPurchased === true || book?.isPurchased === 'true' || isActuallyFree || user?.role === 'admin');

                            // Determine how many grid items to show
                            const displayCount = !isActuallyPurchased ? (previewPageList.length + 1) : totalPages;

                            return Array.from({ length: displayCount }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col items-center group cursor-pointer"
                                >
                                    <PdfThumbnail
                                        pdfDoc={pdfDocRef.current}
                                        pageIndex={i}
                                        isPreviewMode={!isActuallyPurchased}
                                        previewPageList={previewPageList}
                                        onClick={() => {
                                            // Jump directly to the selected page, and restore the default double view mode
                                            handleViewModeChange('double');
                                            setTimeout(() => jumpToPage(i + 1), 500); // 500ms delay to allow view mode switch UI to complete
                                        }}
                                    />
                                    <span className="text-xs font-bold mt-3 opacity-60 group-hover:text-[#3D52A0] group-hover:opacity-100 transition-colors uppercase tracking-widest">
                                        {(!isActuallyPurchased && i >= previewPageList.length) ? 'Full Version' : `Page ${i + 1}`}
                                    </span>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}


            {/* ===== SIDE NAV ARROWS (Visible only in fullscreen mode per user request) ===== */}
            {!actualLoading && viewMode !== 'multi' && isBookFullscreen && (
                <>
                    {/* LEFT arrow */}
                    <button
                        onClick={() => pageFlipRef.current?.flipPrev()}
                        disabled={currentPage === 0}
                        title="Previous Page"
                        className={`reader-nav-btn left-nav hidden md:flex ${currentPage === 0 ? 'disabled' : ''}`}
                        style={{
                            position: isBookFullscreen ? 'fixed' : 'absolute',
                            left: '20px',
                            top: isBookFullscreen ? '50%' : `calc(24px + ${(bookDimensions.h * normalZoom) / 2}px)`,
                            transform: 'translateY(-50%)',
                        }}
                    >
                        <FaChevronLeft />
                    </button>

                    {/* RIGHT arrow */}
                    <button
                        onClick={() => pageFlipRef.current?.flipNext()}
                        disabled={currentPage >= totalPages - 1}
                        title="Next Page"
                        className={`reader-nav-btn right-nav hidden md:flex ${currentPage >= totalPages - 1 ? 'disabled' : ''}`}
                        style={{
                            position: isBookFullscreen ? 'fixed' : 'absolute',
                            right: '20px',
                            top: isBookFullscreen ? '50%' : `calc(24px + ${(bookDimensions.h * normalZoom) / 2}px)`,
                            transform: 'translateY(-50%)',
                        }}
                    >
                        <FaChevronRight />
                    </button>
                </>
            )}


            {/* --- BOTTOM CONTROLS (Floating Pill) --- */}


            {/* Exit Zen Mode Button */}
            <AnimatePresence>
                {zenMode && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setZenMode(false)}
                        className="fixed top-6 right-6 z-[60] p-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full shadow-lg hover:bg-[#3D52A0] transition-colors"
                        title="Exit Zen Mode"
                    >
                        <FaEye />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Highlight Creation Menu */}
            <AnimatePresence>
                {showHighlightMenu && menuPosition && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            position: 'fixed',
                            top: menuPosition.top,
                            left: menuPosition.left,
                            transform: 'translate(-50%, -100%)',
                            zIndex: 9999
                        }}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 pointer-events-auto"
                    >
                        {['#ffeb3b', '#81c784', '#64b5f6', '#e57373'].map(color => (
                            <button
                                key={color}
                                onClick={() => handleAddHighlight(color)}
                                className="w-6 h-6 rounded-full border border-black/10 hover:scale-125 transition-transform"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                        <button
                            onClick={() => handleAddHighlight('eraser')}
                            className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Eraser: Remove overlapping highlights"
                        >
                            <FaEraser />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Styles */}
            <style>{`
                .highlight-mode .clear-btn { opacity: 1 !important; pointer-events: auto; }
                .clear-btn { opacity: 0; pointer-events: none; }
                .highlight-mode .textLayer { pointer-events: auto !important; cursor: text; }
                .textLayer { pointer-events: none; }
                .textLayer ::selection { background: rgba(255, 235, 59, 0.4); color: transparent; }
                .textLayer span { cursor: text; }

                .perspective-3d { perspective: 2000px; }
                .preserve-3d { transform-style: preserve-3d; }

                /* ============================================================
                   SMOOTH 3D FLIP ANIMATION — GPU composited, no repaint lag
                   The page-flip library uses its own canvas for shadows.
                   We MUST NOT add CSS filter/paint-heavy rules on .stf__parent
                   or .stf__item — those cause per-frame GPU repaint = jank.
                   ============================================================ */

                /* Isolate the book into its own compositing layer (smooth!) */
                .stf__parent {
                    isolation: isolate;
                    transform: translateZ(0);       /* Force GPU layer */
                    border-radius: 3px;
                }

                /* The book pages — let page-flip control all transforms */
                .stf__item {
                    border-radius: 2px;
                    transform: translateZ(0);       /* GPU layer, no extra paint */
                }

                /* Shadow canvas drawn by page-flip — must not be intercepted */
                .stf__block {
                    pointer-events: none;
                }
                
                /* ============================================================
                   DISABLE HOVER CORNER PEEL / FOLD PREVIEW
                   ============================================================ */
                /* Rather than CSS overrides, we utilize showPageCorners: false 
                   in the PageFlip configuration. This allows the primary drag-to-flip 
                   shadows to remain intact without drawing the corner hover instances. */


                /* ============================================================
                   PAGE APPEARANCE — Clean, no shadows
                   ============================================================ */

                /* -------------------------------------------------------------
                   REALISTIC 3D SPINE CURVATURE & LIGHTING
                   ------------------------------------------------------------- */
                .page {
                    background-color: ${darkMode ? '#1e1e1e' : '#fffdf8'};
                    overflow: hidden;
                    /* Base page drop shadow */
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }
                .page-cover {
                    background-color: ${darkMode ? '#0a0a0a' : '#111'};
                    color: white;
                }

                /* --- LEFT PAGE (Even) --- */
                .stf__block:nth-child(2n) .page-content-wrapper {
                    /* Soft gradient: deeper at spine, fading to flat paper */
                    background: linear-gradient(to right, 
                        ${darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.15)'} 0%, 
                        ${darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'} 3%, 
                        transparent 15%, 
                        transparent 85%, 
                        ${darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)'} 100%
                    ), ${darkMode ? '#1e1e1e' : '#fffdf8'};
                    
                    /* Very subtle inner shadow for depth, no 3D transforms */
                    box-shadow: inset -5px 0 10px -5px rgba(0,0,0,0.1);
                }

                /* --- RIGHT PAGE (Odd) --- */
                .stf__block:nth-child(2n+1) .page-content-wrapper {
                     /* Soft gradient: deeper at spine, fading to flat paper */
                     background: linear-gradient(to left, 
                        ${darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.15)'} 0%, 
                        ${darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'} 3%, 
                        transparent 15%, 
                        transparent 85%, 
                        ${darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)'} 100%
                    ), ${darkMode ? '#1e1e1e' : '#fffdf8'};
                    
                    /* Very subtle inner shadow for depth, no 3D transforms */
                    box-shadow: inset 5px 0 10px -5px rgba(0,0,0,0.1);
                }

                /* Deep crease shadow directly over the binding */
                .page-spine-shadow-left {
                    display: block !important;
                    background: linear-gradient(to left, rgba(0,0,0,0.6) 0%, transparent 15px) !important;
                }
                .page-spine-shadow-right{
                    display: block !important;
                    background: linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 15px) !important;
                }
                
                /* LIGHTING OVERLAY (Subtle vertical curve highlight) */
                .page-lighting-overlay  { display: block !important; }
                
                /* INNER BORDER (To define page edges cleanly) */
                .page-border-in         { display: none !important; }
                
                /* RESTORE PAPER TEXTURE & COVER GLOSS */
                .page-texture           { display: block !important; }
                .cover-gloss            { display: block !important; }

                .page-content-wrapper {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    /* Global page shadow to give depth to the cut edges */
                    box-shadow: inset 0 0 12px rgba(0,0,0,0.04);
                }

                /* Skeleton Loader / Page Loader Container */
                .skeleton-loader {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: ${darkMode ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
                    z-index: 5;
                }

                /* Spinner */
                .simple-spinner {
                    width: 40px; 
                    height: 40px; 
                    border: 4px solid rgba(61, 82, 160, 0.15);
                    border-radius: 50%; 
                    border-top-color: #3D52A0;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Bookmark ribbon */
                .bookmark-ribbon-static {
                    position: absolute; top: 0; right: 25px;
                    width: 42px; height: 110px;
                    background: linear-gradient(to bottom, #3D52A0, #7091E6, #8B5CF6);
                    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 88%, 0 100%);
                    z-index: 100; cursor: pointer;
                    box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.5);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    animation: ribbon-drop 0.7s cubic-bezier(0.23, 1, 0.32, 1);
                    display: flex; align-items: flex-end; justify-content: center;
                    padding-bottom: 25px;
                    pointer-events: none;
                }
                .ribbon-text {
                    color: white; font-size: 11px; font-weight: 900;
                    font-family: serif; text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }
                @keyframes ribbon-drop {
                    from { transform: translateY(-110%); opacity: 0; }
                    to   { transform: translateY(0);     opacity: 1; }
                }
                .bookmark-ribbon-static:hover {
                    transform: translateY(8px) scale(1.1);
                    filter: brightness(1.2);
                }
                .bookmark-ribbon-static::after {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                    pointer-events: none;
                }

                /* Smooth scroll for custom scrollbar */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(61, 82, 160, 0.4); border-radius: 99px; }

                /* --- FORE-EDGE STACK NAVIGATION (Transparent overlay over original thapi) --- */
                .fore-edge-nav-container {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    z-index: 40;
                    cursor: pointer; /* Hand cursor to indicate scrubbing per user request */
                    background: transparent; /* Return to original visual style (pure box-shadow thapi) */
                }

                .fore-edge-nav-container.right-edge {
                    right: 0; 
                }

                .fore-edge-nav-container.left-edge {
                    left: 0; 
                }

                /* Hover Tooltip Indicator (Page X pinned to bottom outer corners) */
                .fore-edge-hover-indicator {
                    position: absolute;
                    bottom: 15px; /* Pinned near bottom */
                    pointer-events: none;
                    z-index: 50;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .right-tooltip {
                    left: 100%; /* Float right of the right strip (baar ki oor) */
                    margin-left: 10px;
                }

                .left-tooltip {
                    right: 100%; /* Float left of the left strip (baar ki oor) */
                    margin-right: 10px;
                }
                
                .fore-edge-tooltip {
                    background-color: ${darkMode ? 'rgba(30, 35, 48, 0.95)' : 'rgba(255, 255, 255, 0.95)'}; 
                    color: ${darkMode ? 'white' : '#333'};
                    font-size: 11px; /* Very small text as requested */
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 4px;
                    white-space: nowrap;
                    border: 1px solid ${darkMode ? '#444' : '#ddd'};
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    letter-spacing: 0.2px;
                }

                /* --- PREMIUM READER NAVIGATION BUTTONS --- */
                .reader-nav-btn {
                    z-index: 60;
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 24px;
                    color: white;
                    background: rgba(15, 23, 42, 0.45);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                    position: relative;
                }

                .reader-nav-btn.disabled {
                    opacity: 0.15;
                    cursor: not-allowed;
                    pointer-events: none;
                }

                .reader-nav-btn:not(.disabled):hover {
                    transform: translateY(-50%) scale(1.15);
                    background: linear-gradient(135deg, #3D52A0, #8B5CF6);
                    border-color: rgba(255, 255, 255, 0.3);
                    box-shadow: 0 20px 40px -10px rgba(61, 82, 160, 0.5), 0 0 20px rgba(139, 92, 246, 0.3);
                    color: white !important;
                }

                .reader-nav-btn::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.5s;
                }

                .reader-nav-btn:not(.disabled):hover::after {
                    opacity: 1;
                }

                .reader-nav-btn svg {
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                    transition: transform 0.3s ease;
                }

                .reader-nav-btn.left-nav:hover svg {
                    transform: translateX(-3px);
                }

                .reader-nav-btn.right-nav:hover svg {
                    transform: translateX(3px);
                }

                /* ============================================================
                   MOBILE RESPONSIVENESS
                   ============================================================ */
                @media (max-width: 768px) {
                    /* Add bottom padding so book content isn't hidden behind the mobile nav pill */
                    .reader-3d-container {
                        padding-bottom: 68px !important;
                    }

                    /* CRITICAL: Force-hide the circular prev/next nav arrows on mobile.
                       CSS 'display: flex' in .reader-nav-btn was overriding Tailwind's 'hidden' class. */
                    .reader-nav-btn {
                        display: none !important;
                    }

                    /* Compact skeleton spinner on small screens */
                    .simple-spinner {
                        width: 28px;
                        height: 28px;
                    }

                    /* Fore-edge navigation strips should be thinner on mobile */
                    .fore-edge-nav-container {
                        display: none;
                    }

                    /* Bookmark ribbon — smaller on mobile */
                    .bookmark-ribbon-static {
                        width: 32px;
                        height: 84px;
                        right: 14px;
                    }
                }

                @media (max-width: 480px) {
                    .reader-3d-container {
                        padding-top: 10px !important;
                        padding-bottom: 68px !important;
                    }
                }
            `}</style>

        </div>
    );
};

export default Real3DReaderPage;
