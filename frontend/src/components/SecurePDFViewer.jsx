import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaTimes, FaChevronLeft, FaChevronRight, FaSearchPlus, FaSearchMinus, FaDownload } from 'react-icons/fa';

// Use jsdelivr CDN which has better CORS support
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const SecurePDFViewer = ({ isOpen, onClose, pdfUrl, bookTitle }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    if (!isOpen) return null;

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        console.log('PDF loaded successfully:', numPages, 'pages');
    };

    const onDocumentLoadError = (error) => {
        console.error('Error loading PDF:', error);
    };

    const goToPrevPage = () => {
        setPageNumber(prev => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setPageNumber(prev => Math.min(prev + 1, numPages));
    };

    const zoomIn = () => {
        setScale(prev => Math.min(prev + 0.2, 2.0));
    };

    const zoomOut = () => {
        setScale(prev => Math.max(prev - 0.2, 0.5));
    };

    // Prevent right-click for security
    const handleContextMenu = (e) => {
        e.preventDefault();
    };

    return (
        <div
            className="fixed inset-0 bg-gradient-to-br from-black/80 via-purple-900/60 to-pink-900/60 backdrop-blur-md flex items-center justify-center z-[300] p-4"
            onContextMenu={handleContextMenu}
        >
            <div className="relative w-full max-w-6xl h-[95vh] animate-scale-in">
                {/* Animated Background */}
                <div className="absolute inset-0 animated-gradient opacity-10 rounded-3xl"></div>

                {/* Main Container */}
                <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-premium h-full flex flex-col">
                    {/* Premium Header */}
                    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-4 shadow-lg flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <span className="text-2xl">📄</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white font-display truncate max-w-md">
                                        {bookTitle || 'PDF Viewer'}
                                    </h2>
                                    <p className="text-white/80 text-sm">
                                        Secure Admin Preview
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all duration-300 hover:scale-110 hover:rotate-90"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                    </div>

                    {/* PDF Controls */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0 flex-wrap">
                        {/* Page Navigation */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={goToPrevPage}
                                disabled={pageNumber <= 1}
                                className="p-2 rounded-lg bg-white border-2 border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                <FaChevronLeft />
                            </button>
                            <span className="px-4 py-2 bg-white rounded-lg border-2 border-purple-200 font-semibold text-gray-700">
                                {pageNumber} / {numPages || '...'}
                            </span>
                            <button
                                onClick={goToNextPage}
                                disabled={pageNumber >= numPages}
                                className="p-2 rounded-lg bg-white border-2 border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                <FaChevronRight />
                            </button>
                        </div>

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={zoomOut}
                                disabled={scale <= 0.5}
                                className="p-2 rounded-lg bg-white border-2 border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                <FaSearchMinus />
                            </button>
                            <span className="px-4 py-2 bg-white rounded-lg border-2 border-blue-200 font-semibold text-gray-700 min-w-[80px] text-center">
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                onClick={zoomIn}
                                disabled={scale >= 2.0}
                                className="p-2 rounded-lg bg-white border-2 border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                <FaSearchPlus />
                            </button>
                        </div>

                        {/* Download Button */}
                        <a
                            href={pdfUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-2"
                        >
                            <FaDownload /> Download
                        </a>
                    </div>

                    {/* PDF Viewer Area */}
                    <div
                        className="flex-1 overflow-auto bg-gray-900 p-4 custom-scrollbar"
                        style={{ userSelect: 'none' }}
                        onContextMenu={handleContextMenu}
                    >
                        <div className="flex justify-center items-start min-h-full">
                            <Document
                                file={pdfUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                loading={
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="loader mb-4"></div>
                                        <p className="text-white text-lg">Loading PDF...</p>
                                    </div>
                                }
                                error={
                                    <div className="flex flex-col items-center justify-center py-20 text-white">
                                        <p className="text-2xl mb-4">⚠️ Failed to load PDF</p>
                                        <p className="text-sm text-gray-400 mb-4">Please check the file URL</p>
                                        <p className="text-xs text-gray-500 max-w-md break-all">{pdfUrl}</p>
                                    </div>
                                }
                                options={{
                                    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                                    cMapPacked: true,
                                }}
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    scale={scale}
                                    className="shadow-2xl"
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    devicePixelRatio={Math.min(window.devicePixelRatio || 1, 3)}
                                    loading={
                                        <div className="flex items-center justify-center w-full h-96 bg-gray-800">
                                            <div className="loader"></div>
                                        </div>
                                    }
                                />
                            </Document>
                        </div>
                    </div>

                    {/* Security Watermark */}
                    <div className="absolute bottom-20 right-8 pointer-events-none opacity-20 select-none">
                        <p className="text-6xl font-bold text-white transform -rotate-45">
                            ADMIN PREVIEW
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurePDFViewer;
