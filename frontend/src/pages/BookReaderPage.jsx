import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaArrowLeft, FaSearchMinus, FaSearchPlus, FaExpand, FaCompress, FaBookmark, FaRegBookmark, FaCheckCircle, FaCartPlus, FaShoppingCart, FaStickyNote, FaTimes, FaSave } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from '../utils/sweetalert';
import readerService from '../services/readerService';
import bookService from '../services/bookService';
import highlightService from '../services/highlightService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_URL } from '../utils/constants';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker (Local file in public folder)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const BookReaderPage = () => {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Auth context

    // State
    const [book, setBook] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Auth state - derived from book data
    const isPurchased = book?.isPurchased;
    const [readPages, setReadPages] = useState([]); // Array of read page numbers
    const controlTimeoutRef = useRef(null);

    // Notes feature
    const [notes, setNotes] = useState({}); // { pageNumber: { id, text, createdAt } }
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const [editingPage, setEditingPage] = useState(null);

    // Highlighting feature
    const [highlights, setHighlights] = useState([]); // Array of highlight objects
    const [selectedText, setSelectedText] = useState('');
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    // Fetch book data & Restore Progress
    useEffect(() => {
        const fetchBook = async () => {
            try {
                setLoading(true);
                let data = null;
                console.log(`[BookReader] Fetching book: ${bookId}`);

                if (user) {
                    // Logged in: use readerService (handles progress, purchase status)
                    const response = await readerService.getBook(bookId);
                    if (response.success) {
                        data = response.data;
                    }
                } else {
                    // Guest: use public bookService
                    const response = await bookService.getBookById(bookId);
                    // Handle structure: { data: { book: {...}, hasAccess: ... } }
                    const bookData = response.data?.book || response.book || response.data;
                    if (bookData) {
                        data = {
                            ...bookData,
                            isPurchased: false,
                            fileUrl: bookData.fileUrl || bookData.pdfUrl // Ensure fileUrl is present
                        };
                    }
                }

                if (data) {
                    setBook(data);

                    // Determine API Base for streaming
                    const apiBase = API_URL.replace(/\/api$/, '');

                    // Determine PDF URL
                    if (user && (data.isPurchased || data.price === 0)) {
                        try {
                            const tokenResponse = await readerService.getDownloadToken(bookId);

                            if (tokenResponse.success && tokenResponse.data && tokenResponse.data.downloadUrl) {
                                const relativeUrl = tokenResponse.data.downloadUrl;
                                const fullUrl = `${apiBase}${relativeUrl}`;
                                setPdfUrl(fullUrl);
                            } else {
                                const url = data.fileUrl;
                                setPdfUrl(url?.startsWith('http') ? url : `${apiBase}${url?.startsWith('/') ? '' : '/'}${url}`);
                            }
                        } catch (tokenError) {
                            const url = data.fileUrl;
                            setPdfUrl(url?.startsWith('http') ? url : `${apiBase}${url?.startsWith('/') ? '' : '/'}${url}`);
                        }
                    } else {
                        // User logged in but not purchased OR Guest
                        // Use the secure streaming endpoint with preview=true
                        let streamingUrl = `/api/downloads/stream/${bookId}?preview=true`;
                        if (user?.id) streamingUrl += `&uid=${user.id}`;

                        const fullUrl = `${apiBase}${streamingUrl}`;
                        setPdfUrl(fullUrl);
                    }

                    // Restore last read page if purchased
                    if (data.isPurchased) {
                        if (data.lastReadPage) setPageNumber(data.lastReadPage);
                        if (data.bookmarks && Array.isArray(data.bookmarks)) {
                            setReadPages(data.bookmarks);
                        }
                    }
                } else {
                    throw new Error("Book data not found");
                }
            } catch (err) {
                console.error('Error fetching book:', err);
                toast.error('Failed to load book');
                // Optional: navigate back?
            } finally {
                setLoading(false);
            }
        };

        if (bookId) fetchBook();
    }, [bookId, user]);

    // Save Progress (Debounced)
    useEffect(() => {
        if (!bookId || !isPurchased || !numPages) return;

        const saveTimeout = setTimeout(() => {
            const progress = numPages > 0 ? (readPages.length / numPages) * 100 : 0;
            readerService.updateProgress(bookId, {
                page: pageNumber,
                totalPages: numPages,
                progress: progress,
                bookmarks: readPages // Save read pages as bookmarks
            }).catch(err => console.error("Failed to save progress", err));
        }, 3000);

        return () => clearTimeout(saveTimeout);
    }, [pageNumber, bookId, isPurchased, numPages, readPages]);

    // Fetch Notes
    useEffect(() => {
        const fetchNotes = async () => {
            if (!user || !isPurchased || !bookId) return;

            try {
                const response = await highlightService.getHighlights(bookId);
                if (response.success) {
                    // Convert highlights to notes format
                    const notesMap = {};
                    response.data.forEach(note => {
                        const pageNum = note.position?.pageNumber || note.position;
                        if (pageNum) {
                            notesMap[pageNum] = {
                                id: note.id,
                                text: note.comment || note.content,
                                createdAt: note.createdAt
                            };
                        }
                    });
                    setNotes(notesMap);
                }
            } catch (error) {
                console.error('Error fetching notes:', error);
            }
        };

        fetchNotes();
    }, [bookId, user, isPurchased]);

    // Save/Update Note
    const handleSaveNote = async () => {
        if (!currentNote.trim() || !editingPage) return;

        try {
            const existingNote = notes[editingPage];

            if (existingNote) {
                // Update existing note
                await highlightService.updateHighlight(existingNote.id, {
                    comment: currentNote
                });
                toast.success('Note updated!');
            } else {
                // Create new note
                const response = await highlightService.addHighlight({
                    bookId,
                    content: `Page ${editingPage} note`,
                    position: editingPage,
                    comment: currentNote,
                    color: '#fbbf24'
                });

                if (response.success) {
                    toast.success('Note saved!');
                }
            }

            // Update local state
            setNotes(prev => ({
                ...prev,
                [editingPage]: {
                    id: existingNote?.id || response?.data?.id,
                    text: currentNote,
                    createdAt: new Date().toISOString()
                }
            }));

            setShowNoteModal(false);
            setCurrentNote('');
            setEditingPage(null);
        } catch (error) {
            console.error('Error saving note:', error);
            toast.error('Failed to save note');
        }
    };

    // Delete Note
    const handleDeleteNote = async (pageNum) => {
        const note = notes[pageNum];
        if (!note) return;

        try {
            await highlightService.deleteHighlight(note.id);
            setNotes(prev => {
                const updated = { ...prev };
                delete updated[pageNum];
                return updated;
            });
            toast.success('Note deleted');
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error('Failed to delete note');
        }
    };

    // Open Note Modal
    const openNoteModal = (pageNum) => {
        setEditingPage(pageNum);
        setCurrentNote(notes[pageNum]?.text || '');
        setShowNoteModal(true);
    };

    // Handle Text Selection for Highlighting
    const handleTextSelection = () => {
        if (!isPurchased) {
            toast.warning('Purchase the book to use highlighting');
            return;
        }

        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text.length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            setSelectedText(text);
            setMenuPosition({
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
            setShowHighlightMenu(true);
        } else {
            setShowHighlightMenu(false);
        }
    };

    // Save Highlight
    const saveHighlight = async (color = '#ffeb3b') => {
        if (!selectedText || !isPurchased) return;

        try {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);

            // Create highlight data
            const highlightData = {
                bookId,
                content: selectedText,
                position: {
                    pageNumber: pageNumber,
                    text: selectedText
                },
                comment: '',
                color: color
            };

            const response = await highlightService.addHighlight(highlightData);

            if (response.success) {
                // Add highlight to local state
                setHighlights(prev => [...prev, {
                    id: response.data.id,
                    text: selectedText,
                    color: color,
                    pageNumber: pageNumber
                }]);

                // Apply visual highlight
                const span = document.createElement('span');
                span.style.backgroundColor = color;
                span.style.cursor = 'pointer';
                span.setAttribute('data-highlight-id', response.data.id);
                range.surroundContents(span);

                toast.success('Text highlighted!');
            }
        } catch (error) {
            console.error('Error saving highlight:', error);
            toast.error('Failed to save highlight');
        } finally {
            setShowHighlightMenu(false);
            window.getSelection().removeAllRanges();
        }
    };

    // Fetch Highlights
    useEffect(() => {
        const fetchHighlights = async () => {
            if (!user || !isPurchased || !bookId) return;

            try {
                const response = await highlightService.getHighlights(bookId);
                if (response.success) {
                    setHighlights(response.data.map(h => ({
                        id: h.id,
                        text: h.content,
                        color: h.color || '#ffeb3b',
                        pageNumber: h.position?.pageNumber || h.position
                    })));
                }
            } catch (error) {
                console.error('Error fetching highlights:', error);
            }
        };

        fetchHighlights();
    }, [bookId, user, isPurchased]);

    // Security Features (Prevent Copy/Screenshot behavior)
    useEffect(() => {
        const preventDefault = (e) => e.preventDefault();

        // Disable Right Click
        document.addEventListener('contextmenu', preventDefault);

        // Disable Shortcut Keys (Ctrl+P, Ctrl+S, PrintScreen logic)
        const handleKeyDown = (e) => {
            if (
                e.key === 'PrintScreen' ||
                (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u' || e.key === 'Shift')) ||
                (e.metaKey && e.shiftKey) // Mac Screenshot
            ) {
                e.preventDefault();
                toast.warning("Screenshots/Printing is disabled.");
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', preventDefault);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Handle PDF Load
    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= (numPages || 1)) {
            if (isPurchased || newPage <= 2) {
                setPageNumber(newPage);
            } else {
                toast.warning("Purchase full version to continue reading.");
            }
        }
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



    // Auto-hide controls
    useEffect(() => {
        const resetControls = () => {
            setShowControls(true);
            if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
            controlTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        };

        window.addEventListener('mousemove', resetControls);
        resetControls();

        return () => {
            window.removeEventListener('mousemove', resetControls);
            if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
        };
    }, []);

    // Fullscreen enforcement logic
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div className="h-screen w-screen bg-black overflow-hidden relative print:hidden">
            {/* Watermark Security Layer (Subtle) */}
            <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden opacity-5">
                <div className="w-[150%] h-[150%] -rotate-45 flex flex-wrap gap-20 items-center justify-center -translate-x-1/4 -translate-y-1/4">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <span key={i} className="text-white text-xl font-bold whitespace-nowrap">
                            {localStorage.getItem('userEmail') || 'Protected Content'}
                        </span>
                    ))}
                </div>
            </div>

            {/* Top Toolbar (Glassmorphism) */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ y: -100 }}
                        animate={{ y: 0 }}
                        exit={{ y: -100 }}
                        transition={{ duration: 0.3 }}
                        className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6"
                    >
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/reader/library')} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all">
                                <FaArrowLeft />
                            </button>
                            <h1 className="text-white font-bold opacity-90 truncate max-w-md flex items-center gap-2">
                                {book?.title || 'Reader'}
                                {!isPurchased && (
                                    <span className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-black uppercase rounded tracking-wider">
                                        Preview
                                    </span>
                                )}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                <button onClick={() => setScale(Math.max(0.6, scale - 0.2))} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded"><FaSearchMinus /></button>
                                <span className="w-12 text-center text-sm font-mono text-white/90 flex items-center justify-center">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(Math.min(2.5, scale + 0.2))} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded"><FaSearchPlus /></button>
                            </div>
                            <button onClick={toggleFullscreen} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all">
                                {isFullscreen ? <FaCompress /> : <FaExpand />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main PDF Reader Container with Spotlight Mask */}
            <div
                className="h-full w-full overflow-auto flex justify-center pt-20 pb-24 relative custom-scrollbar bg-black"

            >
                {/* PDF Document (Always rendered but visible only through mask) */}
                {pdfUrl ? (
                    <Document
                        file={pdfUrl}
                        className="flex flex-col items-center min-h-min"
                        onLoadSuccess={onDocumentLoadSuccess}
                        key={pdfUrl}
                        loading={
                            <div className="flex flex-col items-center justify-center h-full text-white/50 gap-4">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm tracking-widest uppercase">Loading Book</span>
                            </div>
                        }
                        error={
                            <div className="flex items-center justify-center h-full text-red-400">
                                Failed to load document
                            </div>
                        }
                    >
                        {Array.from(new Array(numPages || 0), (_, index) => {
                            const pageNum = index + 1;

                            // Content Locking Logic for non-purchased books
                            if (!isPurchased && pageNum > 2) {
                                // Render the lock card ONCE after page 2
                                if (pageNum === 3) {
                                    return (
                                        <div key="premium_lock" className="my-10 p-8 max-w-md mx-auto bg-white border border-gray-200 rounded-xl text-center shadow-xl relative z-10">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl text-gray-500">🔒</div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-3">Locked Content</h2>
                                            <p className="text-gray-500 mb-8 leading-relaxed">Purchase the full book to unlock all remaining pages.</p>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => navigate(`/checkout/${bookId}`)}
                                                    className="w-full py-3.5 bg-blue-600 rounded-xl text-white font-bold tracking-wide hover:bg-blue-700 transition-all active:scale-95"
                                                >
                                                    Unlock Access
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }

                            return (
                                <motion.div
                                    key={`page_${pageNum}`}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "100px" }}
                                    transition={{ duration: 0.5 }}
                                    className="mb-8 relative shadow-2xl shadow-black/50"
                                >
                                    <div key={pageNum} className="my-10 relative group/page">
                                        <div className="absolute -left-12 top-0 flex flex-col items-center gap-2 opacity-0 group-hover/page:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    const isRead = readPages.includes(pageNum);
                                                    if (isRead) {
                                                        setReadPages(prev => prev.filter(p => p !== pageNum));
                                                        toast.info(`Page ${pageNum} unmarked as read`);
                                                    } else {
                                                        setReadPages(prev => [...prev, pageNum]);
                                                        toast.success(`Page ${pageNum} marked as read!`);
                                                    }
                                                }}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${readPages.includes(pageNum) ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}
                                                title={readPages.includes(pageNum) ? "Unmark page" : "Mark as read"}
                                            >
                                                <FaCheckCircle size={14} />
                                            </button>

                                            {/* Note Button - Only for purchased books */}
                                            {isPurchased && (
                                                <button
                                                    onClick={() => openNoteModal(pageNum)}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${notes[pageNum] ? 'bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}
                                                    title={notes[pageNum] ? "Edit note" : "Add note"}
                                                >
                                                    <FaStickyNote size={14} />
                                                </button>
                                            )}

                                            <span className="text-[10px] font-bold text-white/40">P.{pageNum}</span>
                                        </div>
                                        <Page
                                            pageNumber={pageNum}
                                            scale={scale}
                                            className="shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white"
                                            renderTextLayer={true}
                                            renderAnnotationLayer={false}
                                            onMouseUp={handleTextSelection}
                                        />
                                        <div className="mt-4 text-center text-white/20 text-xs font-mono tracking-widest uppercase">
                                            Page {pageNum} of {numPages}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </Document>
                ) : (
                    <div className="flex items-center justify-center h-full text-white/50">No Book Loaded</div>
                )}
            </div>





            {/* Note Modal */}
            <AnimatePresence>
                {showNoteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowNoteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FaStickyNote className="text-yellow-500" />
                                    {notes[editingPage] ? 'Edit Note' : 'Add Note'} - Page {editingPage}
                                </h3>
                                <button
                                    onClick={() => setShowNoteModal(false)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <FaTimes className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <textarea
                                value={currentNote}
                                onChange={(e) => setCurrentNote(e.target.value)}
                                placeholder="Write your note here..."
                                className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                autoFocus
                            />

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleSaveNote}
                                    disabled={!currentNote.trim()}
                                    className="flex-1 py-3 px-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaSave /> Save Note
                                </button>

                                {notes[editingPage] && (
                                    <button
                                        onClick={() => {
                                            handleDeleteNote(editingPage);
                                            setShowNoteModal(false);
                                        }}
                                        className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Highlight Menu */}
            <AnimatePresence>
                {showHighlightMenu && isPurchased && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                            position: 'fixed',
                            left: `${menuPosition.x}px`,
                            top: `${menuPosition.y}px`,
                            transform: 'translate(-50%, -100%)',
                            zIndex: 10000
                        }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-2 flex gap-2"
                    >
                        <button
                            onClick={() => saveHighlight('#ffeb3b')}
                            className="w-8 h-8 rounded bg-yellow-300 hover:bg-yellow-400 transition-colors"
                            title="Yellow highlight"
                        />
                        <button
                            onClick={() => saveHighlight('#86efac')}
                            className="w-8 h-8 rounded bg-green-300 hover:bg-green-400 transition-colors"
                            title="Green highlight"
                        />
                        <button
                            onClick={() => saveHighlight('#fca5a5')}
                            className="w-8 h-8 rounded bg-red-300 hover:bg-red-400 transition-colors"
                            title="Red highlight"
                        />
                        <button
                            onClick={() => saveHighlight('#93c5fd')}
                            className="w-8 h-8 rounded bg-blue-300 hover:bg-blue-400 transition-colors"
                            title="Blue highlight"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default BookReaderPage;
