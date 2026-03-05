import { useState } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaDownload, FaExclamationTriangle } from 'react-icons/fa';

const PDFPreviewModal = ({ pdfUrl, bookTitle, onClose }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('google'); // 'google' or 'direct'
    const maxPages = 2; // Preview limited to 2 pages

    const goToPrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, maxPages));
    };

    // Get PDF URL for different viewers
    const getPdfViewerUrl = () => {
        if (!pdfUrl) return '';

        // Clean URL
        const cleanUrl = pdfUrl.startsWith('http') ? pdfUrl : `http://localhost:5000${pdfUrl}`;

        if (viewMode === 'google') {
            // Use Google Docs Viewer (works better with CORS)
            return `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}&embedded=true&page=${currentPage}`;
        } else {
            // Direct PDF with page hash
            return `${cleanUrl}#page=${currentPage}`;
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            {/* Modal Container */}
            <div className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold">📖 Book Preview</h2>
                        <p className="text-sm text-green-100 mt-1 line-clamp-1">{bookTitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <button
                            onClick={() => setViewMode(viewMode === 'google' ? 'direct' : 'google')}
                            className="px-3 py-1.5 text-xs bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                            title="Switch viewer"
                        >
                            {viewMode === 'google' ? '🔄 Direct' : '🔄 Google'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                        >
                            <FaTimes className="text-lg" />
                        </button>
                    </div>
                </div>

                {/* Preview Notice */}
                <div className="px-6 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center font-medium">
                        ⚠️ Preview limited to first 2 pages only • Purchase to read the full book
                    </p>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-800 flex items-center justify-center relative">
                    {pdfUrl ? (
                        <>
                            <iframe
                                src={getPdfViewerUrl()}
                                className="w-full h-full border-0"
                                title={`${bookTitle} - Page ${currentPage}`}
                                onError={() => {
                                    console.error('❌ PDF failed to load');
                                }}
                            />

                            {/* Loading Overlay */}
                            <div className="absolute inset-0 bg-gray-100 dark:bg-slate-800 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300" id="pdf-loader">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-600 dark:text-gray-400">Loading PDF preview...</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-8">
                            <FaExclamationTriangle className="text-6xl text-yellow-500 mx-auto mb-4" />
                            <p className="text-gray-900 dark:text-white text-xl font-bold mb-2">
                                PDF Preview Not Available
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                This book doesn't have a preview available
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all"
                            >
                                Close Preview
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer - Navigation */}
                {pdfUrl && (
                    <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={goToPrevPage}
                                disabled={currentPage === 1}
                                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <FaChevronLeft className="text-sm" /> Previous
                            </button>

                            <div className="text-center">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        Page {currentPage} of {maxPages}
                                    </span>
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">
                                        PREVIEW
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Using {viewMode === 'google' ? 'Google Docs' : 'Direct'} Viewer
                                </p>
                            </div>

                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === maxPages}
                                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2 shadow-sm"
                            >
                                Next <FaChevronRight className="text-sm" />
                            </button>
                        </div>

                        {/* Info Text */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                                💡 <span className="font-semibold">Tip:</span> If PDF doesn't load, try switching the viewer using the 🔄 button above
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Click outside to close */}
            <div
                className="absolute inset-0 -z-10"
                onClick={onClose}
            ></div>
        </div>
    );
};

export default PDFPreviewModal;
