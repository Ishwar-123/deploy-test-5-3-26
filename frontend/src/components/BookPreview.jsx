import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaLock, FaSpinner } from 'react-icons/fa';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BookPreview = ({ fileUrl, onBuy }) => {
    const [numPages, setNumPages] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageWidth, setPageWidth] = useState(400);
    const containerRef = useRef(null);

    useEffect(() => {
        const observeTarget = containerRef.current;
        if (!observeTarget) return;

        const resizeObserver = new ResizeObserver((entries) => {
            // Use the first entry
            const entry = entries[0];
            if (entry) {
                // Subtract padding (32px from p-4) to avoid overflow
                setPageWidth(entry.contentRect.width - 32);
            }
        });

        resizeObserver.observe(observeTarget);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setLoading(false);
    }

    return (
        <div ref={containerRef} className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-xl min-h-[400px] w-full">
            {loading && (
                <div className="flex items-center gap-2 text-blue-600 mb-4">
                    <FaSpinner className="animate-spin" />
                    <span className="text-sm font-bold">Loading Preview...</span>
                </div>
            )}

            <div className={`relative max-w-full shadow-lg rounded-sm overflow-hidden ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={null}
                    error={
                        <div className="text-red-500 p-4 bg-red-50 rounded-lg text-sm font-bold">
                            Failed to load book preview.
                        </div>
                    }
                    className="flex flex-col gap-4"
                >
                    {/* Render Page 1 */}
                    <div className="bg-white shadow-sm">
                        <Page
                            pageNumber={1}
                            width={pageWidth}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            devicePixelRatio={Math.min(window.devicePixelRatio || 1, 3)}
                        />
                    </div>

                    {/* Render Page 2 (with blur if needed, or just show it) */}
                    <div className="bg-white shadow-sm relative group">
                        <Page
                            pageNumber={2}
                            width={pageWidth}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            devicePixelRatio={Math.min(window.devicePixelRatio || 1, 3)}
                        />

                        {/* Lock Overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-100 via-gray-100/90 to-transparent flex flex-col items-center justify-end pb-8 text-center pt-20">
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-sm mx-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-600">
                                    <FaLock className="text-lg" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">To Continue Reading</h3>
                                <p className="text-xs text-gray-500 mb-4 px-2">Purchase the full version to unlock all pages.</p>
                                <button
                                    onClick={onBuy}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                </Document>
            </div>

            {!loading && (
                <div className="mt-4 text-gray-400 text-xs font-medium">
                    Previewing 2 of {numPages} pages
                </div>
            )}
        </div>
    );
};

export default BookPreview;
