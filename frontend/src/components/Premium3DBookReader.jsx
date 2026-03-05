import { useEffect, useRef, useState } from 'react';
import { PageFlip } from 'page-flip';
import * as pdfjsLib from 'pdfjs-dist';
import { FaChevronLeft, FaChevronRight, FaMoon, FaSun, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';

// Use local worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const Premium3DBookReader = ({ pdfUrl, bookTitle = "Book" }) => {
    const bookRef = useRef(null);
    const pageFlipRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [darkMode, setDarkMode] = useState(false);
    const [pageInput, setPageInput] = useState('');
    const [zoom, setZoom] = useState(1.0);

    useEffect(() => {
        if (pdfUrl) {
            loadPDF();
        }
        return () => {
            if (pageFlipRef.current) {
                try {
                    pageFlipRef.current.destroy();
                } catch (e) {
                    console.log('Cleanup error:', e);
                }
            }
        };
    }, [pdfUrl]); // Load only once on mount

    const loadPDF = async () => {
        try {
            setLoading(true);
            const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
            setTotalPages(pdf.numPages);

            const pages = [];
            for (let i = 1; i <= Math.min(pdf.numPages, 2); i++) { // Limit to 2 pages for 3D preview as requested
                const page = await pdf.getPage(i);
                const canvas = await renderPage(page);
                pages.push(canvas);
            }

            setTimeout(() => initPageFlip(pages), 100);
            setLoading(false);
        } catch (error) {
            console.error('PDF Load Error:', error);
            setLoading(false);
        }
    };

    const renderPage = async (page) => {
        const viewport = page.getViewport({ scale: 2.0 }); // Render at fixed high quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        return canvas;
    };

    const initPageFlip = (pages) => {
        if (!bookRef.current || pages.length === 0) return;

        bookRef.current.innerHTML = '';
        pages.forEach((canvas) => {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'stf__item';
            pageDiv.style.backgroundColor = darkMode ? '#1e293b' : '#ffffff';
            pageDiv.appendChild(canvas);
            bookRef.current.appendChild(pageDiv);
        });

        try {
            pageFlipRef.current = new PageFlip(bookRef.current, {
                width: 550,  // Width of single page
                height: 733, // Height of page
                size: 'stretch',
                minWidth: 315,
                maxWidth: 1000,
                minHeight: 420,
                maxHeight: 1350,
                showCover: false,  // Disable cover mode to show double pages
                mobileScrollSupport: false,
                swipeDistance: 30,
                startPage: 0,
                drawShadow: true,
                flippingTime: 800,
                useMouseEvents: true,
                autoSize: true,
                maxShadowOpacity: 0.5,
                showPageCorners: true,
                disableFlipByClick: false
            });

            pageFlipRef.current.loadFromHTML(document.querySelectorAll('.stf__item'));

            pageFlipRef.current.on('flip', (e) => {
                setCurrentPage(e.data);
            });
        } catch (error) {
            console.error('PageFlip init error:', error);
        }
    };

    const nextPage = () => pageFlipRef.current?.flipNext();
    const prevPage = () => pageFlipRef.current?.flipPrev();
    const jumpToPage = (page) => {
        const pageNum = parseInt(page);
        if (pageNum >= 0 && pageNum < totalPages) {
            pageFlipRef.current?.flip(pageNum);
        }
    };

    return (
        <div className={`h-screen w-full flex flex-col justify-between ${darkMode ? 'bg-slate-900' : 'bg-slate-50'} transition-colors duration-500 overflow-hidden`}>

            {/* Top Controls */}
            <div className="w-full p-4 flex justify-between items-center z-10 bg-white/10 backdrop-blur-md shadow-sm">
                <h1 className={`text-xl font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{bookTitle}</h1>

                <div className="flex gap-2">
                    <button
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                        className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-gray-900 hover:bg-gray-100'} shadow transition-all`}
                        title="Zoom Out"
                    >
                        <FaSearchMinus />
                    </button>
                    <span className={`flex items-center px-2 font-mono text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                        className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-gray-900 hover:bg-gray-100'} shadow transition-all`}
                        title="Zoom In"
                    >
                        <FaSearchPlus />
                    </button>
                    <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-gray-900 hover:bg-gray-100'} shadow transition-all`}>
                        {darkMode ? <FaSun /> : <FaMoon />}
                    </button>
                </div>
            </div>

            {/* Book Container - Flex-1 to take available space */}
            <div className="flex-1 relative w-full flex items-center justify-center overflow-auto p-4 bg-gray-500/5">
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loading book...</p>
                    </div>
                ) : (
                    <div
                        className="transition-transform duration-200 ease-out origin-top-center shadow-2xl"
                        style={{ transform: `scale(${zoom})` }}
                    >
                        <div ref={bookRef} className="book-container"></div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="w-full p-4 flex justify-between items-center z-10 bg-white/10 backdrop-blur-md shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <button onClick={prevPage} disabled={currentPage === 0} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-gray-900 hover:bg-gray-100'} shadow transition-all flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed`}>
                    <FaChevronLeft /> Prev
                </button>

                <div className="flex items-center gap-4">
                    <span className={`${darkMode ? 'text-white' : 'text-gray-900'} font-bold whitespace-nowrap`}>
                        {currentPage + 1} / {totalPages}
                    </span>
                    <div className="hidden sm:flex items-center gap-2">
                        <input
                            type="number"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && jumpToPage(pageInput - 1)}
                            placeholder="Page"
                            className={`w-16 px-2 py-1 rounded text-center ${darkMode ? 'bg-slate-800 text-white border-slate-600' : 'bg-white text-gray-900 border-gray-300'} border outline-none focus:border-blue-500`}
                        />
                        <button
                            onClick={() => jumpToPage(pageInput - 1)}
                            className={`px-3 py-1 rounded font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm`}
                        >
                            Go
                        </button>
                    </div>
                </div>

                <button onClick={nextPage} disabled={currentPage >= totalPages - 1} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-gray-900 hover:bg-gray-100'} shadow transition-all flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed`}>
                    Next <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default Premium3DBookReader;
