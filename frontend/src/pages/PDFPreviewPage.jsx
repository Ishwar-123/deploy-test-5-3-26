import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { Document, Page, pdfjs } from 'react-pdf';
import bookService from '../services/bookService';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker - using local version from node_modules
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const PDFPreviewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [numPages, setNumPages] = useState(null);
    const [pdfError, setPdfError] = useState(false);

    useEffect(() => {
        // Automatically redirect to the new Unified Reader
        navigate(`/reader/read/${id}`, { replace: true });
        // fetchBookDetails(); // Disable fetching here as we redirect
    }, [id, navigate]);

    const fetchBookDetails = async () => {
        try {
            setLoading(true);
            const data = await bookService.getBookById(id);
            const bookData = data.data.book || data.data;
            setBook(bookData);
        } catch (error) {
            // Error handled by state
        } finally {
            setLoading(false);
        }
    };

    const onDocumentLoadSuccess = ({ numPages: pages }) => {
        setNumPages(pages);
        setPdfError(false);
    };

    const onDocumentLoadError = (error) => {
        setPdfError(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Loading preview...</p>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center p-8">
                    <FaExclamationTriangle className="text-6xl text-yellow-500 mx-auto mb-4" />
                    <p className="text-xl text-gray-900 dark:text-white font-bold mb-4">Book not found</p>
                    <button
                        onClick={() => window.close()}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all"
                    >
                        Close Tab
                    </button>
                </div>
            </div>
        );
    }

    // Prevent copy, paste, and keyboard shortcuts
    const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    const handleCopy = (e) => {
        e.preventDefault();
        toast.warning('Copying is disabled in preview mode');
        return false;
    };

    const handleKeyDown = (e) => {
        // Prevent Ctrl+A (Select All), Ctrl+C (Copy), Ctrl+X (Cut), Ctrl+V (Paste)
        if (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'x' || e.key === 'v')) {
            e.preventDefault();
            if (e.key === 'a') {
                toast.warning('Text selection is disabled in preview mode');
            } else {
                toast.warning('Copying is disabled in preview mode');
            }
            return false;
        }
    };

    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col"
            onContextMenu={handleContextMenu}
            onCopy={handleCopy}
            onCut={handleCopy}
            onPaste={handleCopy}
            onKeyDown={handleKeyDown}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => window.close()}
                                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                                title="Close Tab"
                            >
                                <FaArrowLeft />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold">📖 Book Preview</h1>
                                <p className="text-sm text-green-100 mt-1 line-clamp-1">{book.title}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(`/book/${id}`)}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-all"
                        >
                            View Details
                        </button>
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center font-medium">
                        ⚠️ Preview limited to pages {book.previewStartPage || 1} & {book.previewEndPage || 2} only • Purchase to read the full {book.pageCount || '100+'} pages
                    </p>
                </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 bg-gray-100 dark:bg-slate-800 overflow-auto flex items-center justify-center p-4">
                {book.fileUrl && !pdfError ? (
                    <div className="bg-white dark:bg-slate-700 shadow-2xl rounded-lg overflow-hidden">
                        <Document
                            file={book.fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                                <div className="flex items-center justify-center p-20">
                                    <div className="text-center">
                                        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
                                    </div>
                                </div>
                            }
                        >
                            {/* Show admin-selected preview pages (only 2 specific pages) */}
                            <div className="space-y-4 p-4">
                                {(() => {
                                    const page1 = book.previewStartPage || 1;
                                    const page2 = book.previewEndPage || 2;
                                    const previewPages = [page1, page2]; // Only these 2 specific pages
                                    const pages = [];

                                    previewPages.forEach((pageNum, index) => {
                                        const isLastPage = index === previewPages.length - 1;
                                        pages.push(
                                            <div key={pageNum}>
                                                <div className={`${!isLastPage ? 'border-b-4 border-gray-300 dark:border-gray-600 pb-4' : ''}`}>
                                                    <div className="text-center mb-2">
                                                        <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-bold rounded">
                                                            Page {index + 1} of 2
                                                        </span>
                                                    </div>
                                                    <Page
                                                        pageNumber={pageNum}
                                                        renderTextLayer={false}
                                                        renderAnnotationLayer={false}
                                                        className="pdf-page"
                                                        width={Math.min(window.innerWidth - 100, 800)}
                                                        onContextMenu={(e) => e.preventDefault()}
                                                    />
                                                </div>

                                                {/* Purchase CTA after last preview page */}
                                                {isLastPage && (
                                                    <div className="mt-8 p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800 text-center">
                                                        <div className="mb-4">
                                                            <span className="text-4xl">🔒</span>
                                                        </div>
                                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                                            Want to Read More?
                                                        </h3>
                                                        <p className="text-gray-700 dark:text-gray-300 mb-2 text-lg">
                                                            Purchase subscription to read the full book
                                                        </p>
                                                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                                                            Get access to all {book.pageCount || '100+'} pages and enjoy unlimited reading
                                                        </p>
                                                        <button
                                                            onClick={() => navigate(`/book/${id}`)}
                                                            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                                        >
                                                            📚 Purchase Now - ₹{book.retailPrice || '299'}
                                                        </button>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                                                            ✨ Instant access • Read on any device • Lifetime ownership
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });

                                    return pages;
                                })()}
                            </div>
                        </Document>
                    </div>
                ) : (
                    <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md">
                        <FaExclamationTriangle className="text-6xl text-yellow-500 mx-auto mb-4" />
                        <p className="text-gray-900 dark:text-white text-xl font-bold mb-2">
                            PDF Preview Not Available
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {pdfError
                                ? 'Failed to load PDF. The file may be corrupted or inaccessible.'
                                : 'This book doesn\'t have a preview available.'}
                        </p>
                        <button
                            onClick={() => navigate(`/book/${id}`)}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all"
                        >
                            View Book Details
                        </button>
                    </div>
                )}
            </div>

            {/* Custom CSS for PDF */}
            <style>{`
                .pdf-page canvas {
                    max-width: 100%;
                    height: auto !important;
                }
                .react-pdf__Page {
                    display: flex;
                    justify-content: center;
                }
                
                /* Disable text selection and copying */
                .react-pdf__Page__textContent,
                .react-pdf__Page__annotations {
                    user-select: none !important;
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    pointer-events: none !important;
                }
                
                /* Prevent right-click context menu */
                .react-pdf__Page {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    -khtml-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
            `}</style>
        </div>
    );
};

export default PDFPreviewPage;
