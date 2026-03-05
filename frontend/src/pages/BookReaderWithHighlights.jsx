// Premium PDF Reader with Highlighting - v2.0
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaSearchMinus, FaSearchPlus, FaExpand, FaCompress,
    FaTrash, FaUndo, FaRedo, FaSpinner, FaDownload, FaCheckCircle, FaHighlighter
} from 'react-icons/fa';
import toast from '../utils/sweetalert';
import settingsService from '../services/settingsService';
import { PdfLoader, PdfHighlighter, Highlight, Popup, AreaHighlight } from 'react-pdf-highlighter';
import { pdfjs } from 'react-pdf';
import readerService from '../services/readerService';
import bookService from '../services/bookService';
import highlightService from '../services/highlightService';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/constants';
import 'react-pdf-highlighter/dist/style.css';
import '../styles/Tip.css';
import '../styles/Highlight.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Spinner = () => (
    <div className="flex flex-col items-center justify-center h-full w-full text-blue-600">
        <FaSpinner className="animate-spin text-4xl mb-3" />
        <span className="text-sm font-semibold tracking-wide text-gray-500">Loading Document...</span>
    </div>
);

const BookReaderWithHighlights = () => {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [book, setBook] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [highlights, setHighlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scale, setScale] = useState(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [catalogUrl, setCatalogUrl] = useState(null);
    const [isHighlightMode, setIsHighlightMode] = useState(false);

    // Highlight Mode
    const [history, setHistory] = useState([]);
    const [historyPointer, setHistoryPointer] = useState(-1);

    const isPurchased = book?.isPurchased;

    // --- Data Fetching ---
    useEffect(() => {
        const fetchBook = async () => {
            try {
                setLoading(true);
                let data = null;
                if (user) {
                    const response = await readerService.getBook(bookId);
                    if (response.success) data = response.data;
                } else {
                    const response = await bookService.getBookById(bookId);
                    const bookData = response.data?.book || response.book || response.data;
                    if (bookData) {
                        data = { ...bookData, isPurchased: false, fileUrl: bookData.fileUrl || bookData.pdfUrl };
                    }
                }

                if (data) {
                    setBook(data);
                    const apiBase = API_URL.replace(/\/api$/, '');

                    if (user && (data.isPurchased || data.price === 0)) {
                        try {
                            const tokenResponse = await readerService.getDownloadToken(bookId);
                            if (tokenResponse.success && tokenResponse.data?.downloadUrl) {
                                setPdfUrl(`${apiBase}${tokenResponse.data.downloadUrl}`);
                            }
                        } catch (error) {
                            console.error('Token error:', error);
                        }
                    } else {
                        let streamingUrl = `/api/downloads/stream/${bookId}?preview=true`;
                        if (user?.id) streamingUrl += `&uid=${user.id}`;
                        setPdfUrl(`${apiBase}${streamingUrl}`);
                    }
                }
            } catch (err) {
                console.error('Error fetching book:', err);
                toast.error('Failed to load book');
            } finally {
                setLoading(false);
            }
        };
        if (bookId) fetchBook();
    }, [bookId, user]);

    useEffect(() => {
        const fetchHighlights = async () => {
            if (!user || !isPurchased) return;
            try {

                const response = await highlightService.getHighlights(bookId);
                console.log('Loaded Highlights Response:', response);

                let rawHighlights = [];
                if (Array.isArray(response)) {
                    rawHighlights = response;
                } else if (response.data && Array.isArray(response.data)) {
                    rawHighlights = response.data;
                } else if (response.highlights && Array.isArray(response.highlights)) {
                    rawHighlights = response.highlights;
                }

                if (rawHighlights.length > 0) {
                    const transformed = rawHighlights.map(h => ({
                        id: h.id,
                        content: h.content?.startsWith('data:image') ? { image: h.content } : { text: h.content },
                        position: h.position,
                        comment: { text: h.comment || '', emoji: "" },
                        color: h.color || '#fef08a'
                    }));
                    setHighlights(transformed);
                }
            } catch (error) {
                console.error('Error fetching highlights:', error);
            }
        };
        fetchHighlights();
    }, [bookId, user, isPurchased]);

    useEffect(() => {
        settingsService.getCatalogUrl()
            .then(data => { if (data.url) setCatalogUrl(data.url); })
            .catch(() => { });
    }, []);

    // --- Handlers ---
    const addHighlight = useCallback(async (highlight, isRedo = false) => {
        if (!user || !isPurchased) {
            toast.warning('Please purchase to highlight');
            return;
        }

        // Deep clone position to avoid reference issues
        const safePosition = JSON.parse(JSON.stringify(highlight.position));

        try {
            const contentStr = highlight.content?.text || highlight.content?.image || highlight.content;
            console.log('Payload:', {
                bookId,
                contentLength: contentStr?.length,
                position: safePosition
            });

            const response = await highlightService.addHighlight({
                bookId,
                content: contentStr,
                position: safePosition,
                comment: highlight.comment?.text || '',
                color: '#fef08a'
            });

            console.log('Server Response:', response);

            // Backend returns the highlight object directly OR a success wrapper
            if (response && (response.id || response.success)) {
                // Extract real ID (handle both formats)
                const realId = response.id || response.data?.id;

                const newHighlight = {
                    id: realId,
                    content: highlight.content,
                    position: safePosition,
                    comment: { text: highlight.comment?.text || highlight.comment || '', emoji: '' },
                    color: '#fef08a'
                };

                // Defer state update to allow selection cleanup to finish
                setTimeout(() => {
                    setHighlights(prev => [...prev, newHighlight]);
                }, 0);

                if (!isRedo) {
                    const action = { type: 'ADD', highlight: newHighlight };
                    setHistory(prev => [...prev.slice(0, historyPointer + 1), action].slice(-30));
                    setHistoryPointer(prev => prev + 1);
                }
            } else {
                throw new Error(response?.message || 'Failed to save');
            }
        } catch (error) {
            console.error('Highlight Save Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to save highlight';
            toast.error(errorMsg);
        }
    }, [bookId, user, isPurchased, historyPointer]);

    const deleteHighlight = useCallback(async (id, isUndo = false) => {
        try {
            const deleted = highlights.find(h => h.id === id);
            setHighlights(prev => prev.filter(h => h.id !== id));
            await highlightService.deleteHighlight(id);

            if (!isUndo && deleted) {
                const action = { type: 'DELETE', highlight: deleted };
                setHistory(prev => [...prev.slice(0, historyPointer + 1), action].slice(-30));
                setHistoryPointer(prev => prev + 1);
            }
        } catch (error) {
            toast.error('Failed to delete highlight');
        }
    }, [highlights, historyPointer]);

    const performUndo = () => {
        if (historyPointer < 0) return;
        const action = history[historyPointer];
        if (action.type === 'ADD') deleteHighlight(action.highlight.id, true);
        else if (action.type === 'DELETE') addHighlight(action.highlight, true);
        setHistoryPointer(prev => prev - 1);
    };

    const performRedo = () => {
        if (historyPointer >= history.length - 1) return;
        const action = history[historyPointer + 1];
        if (action.type === 'ADD') addHighlight(action.highlight, true);
        else if (action.type === 'DELETE') deleteHighlight(action.highlight.id, true);
        setHistoryPointer(prev => prev + 1);
    };

    const toggleFull = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    if (loading) return <div className="h-screen w-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center"><Spinner /></div>;

    return (
        <div className="h-screen w-full flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden relative font-sans">
            {/* Premium Header with Gradient */}
            <header className="h-20 flex-shrink-0 flex items-center justify-between px-8 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 dark:from-emerald-700 dark:via-green-700 dark:to-teal-700 shadow-xl z-50 relative overflow-hidden">
                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
                </div>

                <div className="flex items-center gap-5 relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white transition-all active:scale-95 shadow-lg border border-white/20"
                    >
                        <FaArrowLeft className="text-lg" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-white truncate max-w-md text-lg md:text-xl leading-tight drop-shadow-sm">
                            {book?.title}
                        </h1>
                        <span className="text-xs text-white/90 font-medium tracking-wide flex items-center gap-2 mt-0.5">
                            <span className="w-1 h-1 bg-white/60 rounded-full"></span>
                            {book?.author || 'Reading Mode'}
                        </span>
                    </div>
                    {isPurchased && (
                        <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 text-xs font-black px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-pulse">
                            <FaCheckCircle className="text-xs" /> SUBSCRIBED
                        </span>
                    )}
                </div>

                {/* Centered Toolbar - Premium Floating Design */}
                <div className="hidden md:flex items-center gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <button
                        onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 transition-all active:scale-95 shadow-sm"
                    >
                        <FaSearchMinus size={16} />
                    </button>
                    <span className="w-16 text-center text-sm font-bold text-gray-900 dark:text-white select-none tabular-nums px-2">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 transition-all active:scale-95 shadow-sm"
                    >
                        <FaSearchPlus size={16} />
                    </button>


                </div>

                <div className="flex items-center gap-3 relative z-10">
                    {/* Highlight controls temporarily disabled */}
                    <button
                        onClick={toggleFull}
                        className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white transition-all active:scale-95 shadow-lg border border-white/20"
                    >
                        {isFullscreen ? <FaCompress className="text-lg" /> : <FaExpand className="text-lg" />}
                    </button>
                </div>
            </header>


            {/* Reader Content - Premium Design with Robust Centering Logic */}
            <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0a0a0a] relative">
                {/* 
                    Wrapper Logic:
                    - min-w-full: Ensures it fills viewport width.
                    - w-fit: Allows it to grow BEYOND viewport width if content is larger (handling zoom).
                    - flex justify-center: Centers content when it is smaller than viewport, 
                      but aligns properly when it matches w-fit (preventing left-clip).
                */}
                <div className="min-h-full min-w-full w-fit flex justify-center py-4 px-8 mx-auto">
                    {pdfUrl ? (
                        <PdfLoader url={pdfUrl} beforeLoad={<Spinner />}>
                            {(pdfDocument) => (
                                <div
                                    className={`shadow-[0_25px_80px_-20px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_80px_-20px_rgba(0,0,0,0.8)] bg-white rounded-lg border border-gray-200 dark:border-gray-800 flex-shrink-0 transition-[width] duration-200 ease-out relative w-full md:w-[var(--pdf-width)] max-w-none ${isHighlightMode ? '' : 'select-none'}`}
                                    style={{
                                        '--pdf-width': `${800 * scale}px`
                                    }}
                                >
                                    <PdfHighlighter
                                        pdfDocument={pdfDocument}
                                        enableAreaSelection={(event) => event.altKey}
                                        onScrollChange={() => { }}
                                        scrollRef={() => { }}
                                        onSelectionFinished={(position, content, hideTipAndSelection, transformSelection) => {
                                            // Disabled
                                            hideTipAndSelection();
                                            return null;
                                        }}
                                        highlightTransform={(highlight, index, setTip, hideTip, viewportToScaled, screenshot, isScrolledTo) => {
                                            const component = highlight.content?.image
                                                ? <AreaHighlight isScrolledTo={isScrolledTo} highlight={highlight} onChange={() => { }} />
                                                : <Highlight isScrolledTo={isScrolledTo} position={highlight.position} comment={highlight.comment} />;

                                            return (
                                                <Popup
                                                    popupContent={
                                                        <button onClick={() => deleteHighlight(highlight.id)} className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xl transform transition-all active:scale-95">
                                                            <FaTrash size={11} /> Delete Highlight
                                                        </button>
                                                    }
                                                    onMouseOver={(popupContent) => setTip(highlight, () => popupContent)}
                                                    onMouseOut={hideTip}
                                                    key={index}
                                                >
                                                    {component}
                                                </Popup>
                                            );
                                        }}
                                        highlights={[]}
                                    />
                                </div>
                            )}
                        </PdfLoader>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-20">
                            <div className="w-20 h-20 border-4 border-gray-300 dark:border-gray-700 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
                            <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">Initializing Reader...</span>
                            <span className="text-sm text-gray-500 dark:text-gray-500 mt-2">Please wait while we load your book</span>
                        </div>
                    )}
                </div>

                {/* Premium Preview Notice for Non-Purchased Books */}
                {!isPurchased && !loading && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 backdrop-blur-2xl border-2 border-amber-200 dark:border-amber-700/50 pl-8 pr-3 py-3 rounded-2xl shadow-2xl flex items-center gap-5 z-[60] hover:scale-105 transition-all duration-300 max-w-2xl w-[90%] md:w-auto">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                <span className="font-black text-gray-900 dark:text-white text-base tracking-tight">Preview Mode Active</span>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium line-clamp-1 md:line-clamp-none">You're viewing limited content • Purchase to unlock highlighting</span>
                        </div>
                        <button
                            onClick={() => navigate(`/checkout/${bookId}`)}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 md:px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                        >
                            <FaCheckCircle className="text-sm" /> <span className="hidden md:inline">Unlock Full Book</span><span className="md:hidden">Unlock</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookReaderWithHighlights;
