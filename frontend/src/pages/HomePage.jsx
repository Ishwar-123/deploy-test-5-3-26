import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaCloudDownloadAlt, FaShieldAlt, FaMobileAlt, FaStar,
    FaEye, FaFacebookF, FaTwitter,
    FaInstagram, FaYoutube, FaMapMarkerAlt, FaEnvelope, FaPhone,
    FaCheckCircle, FaChevronLeft, FaChevronRight, FaShoppingCart, FaCartPlus, FaCartArrowDown
} from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import bookService from '../services/bookService';
import readerService from '../services/readerService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import { motion, AnimatePresence } from 'framer-motion';

// Slider Images
import slide1 from '../assets/slider/slide1.png';
import slide2 from '../assets/slider/slide2.png';
import slide3 from '../assets/slider/slide3.png';
import slide4 from '../assets/slider/slide4.jpg';
import slide5 from '../assets/slider/slide5.png';
import slide6 from '../assets/slider/slide6.png';
import slide7 from '../assets/slider/slide7.png';
import slide8 from '../assets/slider/slide8.png';
import slide9 from '../assets/slider/slide9.png';

// --- GLOWING PARTICLE BACKGROUND COMPONENT ---
const ParticleBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-blue-500/10 dark:bg-white/5"
                    initial={{
                        x: Math.random() * 100 + "%",
                        y: Math.random() * 100 + "%",
                        scale: Math.random() * 0.5 + 0.5,
                        opacity: Math.random() * 0.3 + 0.1
                    }}
                    animate={{
                        y: [null, (Math.random() * 10 - 5) + "%"],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        width: Math.random() * 4 + 2 + 'px',
                        height: Math.random() * 4 + 2 + 'px',
                        filter: 'blur(1px)'
                    }}
                />
            ))}
        </div>
    );
};

// --- ATMOSPHERIC ELEMENTS ---
const Sphere = ({ delay, size, left, top, color }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
            y: [0, 30, 0]
        }}
        transition={{
            duration: 8,
            delay,
            repeat: Infinity,
            ease: "easeInOut"
        }}
        className={`absolute rounded-full blur-[80px] pointer-events-none z-0 ${color}`}
        style={{ width: size, height: size, left, top }}
    />
);

const HomePage = ({ hideNavbar = false, hideFooter = false }) => {
    const navigate = useNavigate();

    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [featuredBooks, setFeaturedBooks] = useState([]);
    const [bestSellingBooks, setBestSellingBooks] = useState([]);
    const [ownedBookIds, setOwnedBookIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const fetchUserLibrary = async () => {
        try {
            const response = await readerService.getLibrary();
            if (response.success && response.data) {
                const ids = new Set(response.data.map(item => item.book?._id || item.book?.id));
                setOwnedBookIds(ids);
            }
        } catch (error) {
            console.error("Error fetching library:", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchUserLibrary();
        } else {
            setOwnedBookIds(new Set());
        }
    }, [user]);

    const TypewriterText = ({ text, isActive }) => {
        const [displayText, setDisplayText] = useState('');

        useEffect(() => {
            if (!isActive) {
                setDisplayText('');
                return;
            }

            let i = 0;
            const typingInterval = setInterval(() => {
                if (i < text.length) {
                    setDisplayText(text.substring(0, i + 1));
                    i++;
                } else {
                    clearInterval(typingInterval);
                }
            }, 50); // Speed of typing

            return () => clearInterval(typingInterval);
        }, [text, isActive]);

        return (
            <span>
                {displayText}
                {isActive && displayText.length < text.length && <span className="animate-pulse border-r-4 border-current ml-1"></span>}
            </span>
        );
    };

    const NextArrow = ({ onClick }) => (
        <button onClick={onClick} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-[#1f2937]/20 hover:bg-[#1f2937]/30 dark:bg-white/20 dark:hover:bg-white/30 text-[#3D52A0] dark:text-white rounded-full transition-all backdrop-blur-md shadow-sm">
            <FaChevronRight className="text-xl pl-1" />
        </button>
    );

    const PrevArrow = ({ onClick }) => (
        <button onClick={onClick} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-[#1f2937]/20 hover:bg-[#1f2937]/30 dark:bg-white/20 dark:hover:bg-white/30 text-[#3D52A0] dark:text-white rounded-full transition-all backdrop-blur-md shadow-sm">
            <FaChevronLeft className="text-xl pr-1" />
        </button>
    );

    const sliderSettings = {
        dots: true,
        infinite: true,
        speed: 800,
        slidesToShow: 1,
        autoplay: true,
        autoplaySpeed: 2500,
        pauseOnHover: false,
        pauseOnFocus: false,
        beforeChange: (current, next) => setCurrentSlide(next),
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        appendDots: (dots) => (
            <div style={{ bottom: '10px' }}>
                <ul className="flex justify-center gap-2"> {dots} </ul>
            </div>
        ),
        customPaging: () => (
            <div className="w-3 h-3 rounded-full bg-[#3D52A0]/40 dark:bg-white/40 hover:bg-[#3D52A0] dark:hover:bg-white transition-all duration-300" />
        ),
    };

    const heroSlides = [
        {
            badge: "CIVIL ENGINEERING SPECIAL",
            title: "Master Advance \nSurveying & Levelling",
            subtitle: "By Rangwala",
            description: "The definitive guide to modern surveying techniques. Access the digital edition of India's most trusted engineering textbook.",
            images: [slide1, slide2, slide5],
            bgColor: "bg-transparent"
        },
        {
            badge: "STRUCTURAL DESIGN",
            title: "Reinforced \nConcrete Design",
            subtitle: "By Dr. H. J. Shah",
            description: "Deep dive into structural analysis and concrete design. The 13th edition features comprehensive modules for the modern engineer.",
            images: [slide2, slide3, slide1],
            bgColor: "bg-transparent"
        },
        {
            badge: "ENGINEERING GRAPHICS",
            title: "Precision \nMachine Drawing",
            subtitle: "By N. D. Bhatt",
            description: "The gold standard in engineering drawing for over 52 editions. Learn the projection methods and CAD modules used by professionals.",
            images: [slide3, slide4, slide2],
            bgColor: "bg-transparent"
        },
        {
            badge: "INFRASTRUCTURE",
            title: "Expert Highway \nEngineering",
            subtitle: "By Rangwala",
            description: "Comprehensive coverage of transportation engineering and highway design. Perfect for academics and industry professionals alike.",
            images: [slide4, slide5, slide3],
            bgColor: "bg-transparent"
        },
        {
            badge: "ENGINEERING BASICS",
            title: "Elements of \nCivil Engineering",
            subtitle: "By Dr. Anurag A. Kandya",
            description: "Build a strong foundation in civil engineering principles. Accessible, thorough, and updated for the current university curriculum.",
            images: [slide5, slide6, slide1],
            bgColor: "bg-transparent"
        },
        {
            badge: "STRUCTURAL ANALYSIS",
            title: "Structures \nin Practice",
            subtitle: "By Gautam H. Oza",
            description: "A comprehensive look at structural engineering applications in real-world scenarios. Essential for practicing engineers.",
            images: [slide6, slide7, slide2],
            bgColor: "bg-transparent"
        },
        {
            badge: "TRANSPORTATION",
            title: "Railway \nEngineering",
            subtitle: "By Rangwala",
            description: "Detailed study of railway planning, construction, and maintenance. Master the technical aspects of modern rail systems.",
            images: [slide7, slide8, slide4],
            bgColor: "bg-transparent"
        },
        {
            badge: "MARINE & UNDERGROUND",
            title: "Harbour, Dock \n& Tunnel Engineering",
            subtitle: "By R. Srinivasan",
            description: "Technical depth in marine infrastructure and tunneling projects. An indispensable resource for civil and structural students.",
            images: [slide8, slide9, slide5],
            bgColor: "bg-transparent"
        },
        {
            badge: "BRIDGE CONSTRUCTION",
            title: "Bridge \nEngineering",
            subtitle: "By Rangwala",
            description: "Explore the art and science of bridge design and construction. Updated with the latest industry standards and techniques.",
            images: [slide9, slide1, slide3],
            bgColor: "bg-transparent"
        }
    ];

    useEffect(() => {
        fetchBooks();
        fetchFeaturedBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const data = await bookService.getBooks({ limit: 8 });
            setBooks(data.data.books || []);
        } catch (error) {
            console.error('Failed to fetch books', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFeaturedBooks = async () => {
        try {
            // Fetch all books for the curated collection (remove strict limit)
            const data = await bookService.getBooks({ limit: 100, sort: '-createdAt' });
            setFeaturedBooks(data.data.books || []);

            // Still keep a small subset for "Trending"
            const bestSellingData = await bookService.getBooks({ limit: 4, sort: '-averageRating' });
            setBestSellingBooks(bestSellingData.data.books || []);
        } catch (error) {
            console.error('Failed to fetch books:', error);
        }
    };

    // Custom Components for this Design

    const BookGridItem = ({ book, sale = false, isOwned = false }) => {
        const { addToCart, removeFromCart, isInCart } = useCart();
        const inCart = isInCart(book._id || book.id);

        const handleCartToggle = (e) => {
            e.stopPropagation();
            if (inCart) {
                removeFromCart(book._id || book.id);
            } else {
                addToCart(book._id || book.id);
            }
        };

        const title = book.title || "Untitled Book";
        const author = book.author || "Unknown Author";
        const price = book.retailPrice || 0;
        const rating = book.averageRating || 5;
        const image = book.coverImage?.url || book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop';

        return (
            <div
                className="group cursor-pointer flex flex-col h-full relative transition-all duration-700 hover:-translate-y-3 bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl rounded-[2rem] border border-black/5 dark:border-white/5 shadow-xl shadow-black/5 hover:shadow-[#3D52A0]/20 overflow-hidden"
                onClick={() => navigate(`/book/${book._id || book.id}`)}
            >
                {/* Book Cover Container */}
                <div className="relative w-full aspect-[2/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

                    {/* Gradient Overlay for better contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {!isOwned && (
                        <div className="absolute top-3 right-3 bg-gradient-to-tr from-[#3D52A0] to-[#7091E6] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider z-20 shadow-md flex items-center gap-1.5">
                            Buy Now
                        </div>
                    )}

                    {isOwned && (
                        <div className="absolute top-3 right-3 bg-gradient-to-tr from-[#10B981] to-[#34D399] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider z-20 shadow-md flex items-center gap-1.5">
                            <FaCheckCircle className="text-[10px]" /> Subscribed
                        </div>
                    )}

                    {/* View Details Hover Button */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={() => navigate(`/book/${book._id || book.id}`)}
                            className="py-2.5 px-6 bg-white/90 backdrop-blur-sm text-[#3D52A0] hover:bg-[#3D52A0] hover:text-white dark:bg-[#1a1a2e]/90 dark:text-[#7091E6] dark:hover:bg-[#7091E6] dark:hover:text-white transition-all duration-300 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.2)] transform translate-y-4 group-hover:translate-y-0"
                        >
                            <FaEye className="text-sm" /> View Details
                        </button>
                    </div>
                </div>

                {/* Text Content Area */}
                <div className="p-4 flex flex-col justify-between flex-grow bg-white dark:bg-[#1a1a2e] relative z-10 before:absolute before:inset-0 before:bg-gradient-to-t before:from-[#EDE8F5]/30 before:to-transparent dark:before:from-[#1a1a2e]/50 before:pointer-events-none">
                    <div className="text-center mb-3 relative z-20">
                        <h3 className="text-[17px] font-serif font-extrabold text-[#1f2937] dark:text-[#EDE8F5] mb-1 leading-snug group-hover:text-[#3D52A0] dark:group-hover:text-[#7091E6] transition-colors line-clamp-1 w-full tracking-tight">
                            {title}
                        </h3>
                        {book.subtitle && (
                            <p className="text-[11px] font-serif italic text-gray-400 dark:text-gray-500 mb-1 line-clamp-1">{book.subtitle}</p>
                        )}
                        <p className="text-[12px] text-slate-500 dark:text-[#8697C4] uppercase tracking-widest truncate w-full font-bold">
                            {author}
                        </p>
                    </div>
                    <div className="flex items-center justify-between w-full mt-auto pt-6 border-t border-black/5 dark:border-white/5 relative z-20">
                        <div className="flex flex-col">
                            <div className="text-2xl font-black text-[#3D52A0] dark:text-[#7091E6] font-serif tracking-tighter">
                                ₹{price}
                            </div>
                            <div className="flex items-center gap-[2px] mt-1">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar key={i} className={`text-[10px] transition-colors ${i < rating ? 'text-[#f59e0b]' : 'text-gray-200 dark:text-gray-700'}`} />
                                ))}
                            </div>
                        </div>

                        {!isOwned && (
                            <button
                                onClick={handleCartToggle}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${inCart
                                    ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                                    : 'bg-[#3D52A0]/5 dark:bg-white/5 text-[#3D52A0] dark:text-[#7091E6] hover:bg-[#3D52A0] hover:text-white'
                                    }`}
                                title={inCart ? "Remove from Cart" : "Add to Cart"}
                            >
                                {inCart ? <FaShoppingCart size={18} /> : <FaCartPlus size={18} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] font-sans selection:bg-[#3D52A0] selection:text-white relative overflow-hidden transition-colors duration-700">
            {!hideNavbar && (
                <>
                    <TopBar />
                    <Navbar />
                </>
            )}

            {/* Atmospheric Background */}
            <Sphere delay={0} size={500} left="-10%" top="-10%" color="bg-[#3D52A0]/10 dark:bg-[#3D52A0]/20" />
            <Sphere delay={2} size={400} left="80%" top="15%" color="bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/20" />
            <Sphere delay={4} size={300} left="10%" top="60%" color="bg-[#10B981]/10 dark:bg-[#10B981]/10" />
            <ParticleBackground />

            {/* Hero Section Slider */}
            <div className="relative overflow-hidden group mb-12 lg:mb-16 z-10">
                <Slider {...sliderSettings}>
                    {heroSlides.map((slide, index) => (
                        <div key={index} className="outline-none">
                            <div className={`relative w-full ${slide.bgColor}`}>
                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-0">
                                    <div className="grid md:grid-cols-2 gap-8 items-center min-h-[calc(100vh-130px)] lg:min-h-[calc(100vh-160px)]">
                                        <div className="text-center md:text-left z-10 order-2 md:order-1 px-4">
                                            <div className="flex items-center gap-4 mb-6 justify-center md:justify-start">
                                                <span className="h-px w-8 bg-[#3D52A0]/30" />
                                                <span className="text-[#3D52A0] dark:text-[#7091E6] font-black tracking-[0.4em] text-[10px] uppercase">
                                                    {slide.badge}
                                                </span>
                                                <span className="h-px w-8 bg-[#3D52A0]/30" />
                                            </div>
                                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif font-black text-gray-900 dark:text-white mb-6 leading-[1.05] tracking-tight min-h-[160px] md:min-h-[200px] lg:min-h-[240px]">
                                                {slide.title.split('\n').map((line, i) => (
                                                    <span key={i} className="block">
                                                        <TypewriterText text={line} isActive={index === currentSlide} />
                                                    </span>
                                                ))}
                                            </h1>
                                            {slide.subtitle && (
                                                <p className="text-[#7091E6] dark:text-[#ADBBDA] text-xl md:text-2xl font-serif italic font-bold mb-6 tracking-tight">
                                                    {slide.subtitle}
                                                </p>
                                            )}
                                            <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed font-medium tracking-tight">
                                                {slide.description}
                                            </p>
                                            <button
                                                onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}
                                                className="px-12 py-5 bg-[#3D52A0] text-white hover:bg-[#7091E6] font-black text-sm tracking-[0.2em] uppercase transition-all duration-500 hover:-translate-y-1 shadow-xl shadow-[#3D52A0]/20 rounded-2xl relative overflow-hidden group/btn"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                                                Start Reading
                                            </button>
                                        </div>

                                        <div className="relative z-10 flex justify-center md:justify-end order-1 md:order-2 mb-10 md:mb-0 px-4">
                                            <div className="relative w-full max-w-lg perspective-1000">
                                                {/* Dynamic styling for hero images */}
                                                <div className="relative h-[350px] md:h-[450px] w-full flex items-center justify-center">
                                                    <img
                                                        src={slide.images[0]}
                                                        style={{ animationDelay: '0s' }}
                                                        className="absolute animate-float-fast h-64 md:h-[400px] w-auto object-cover shadow-2xl z-20 rounded-sm transform hover:scale-105 transition-transform duration-500 border border-white/20"
                                                        alt="Main Book"
                                                    />

                                                    <img
                                                        src={slide.images[1]}
                                                        style={{ animationDelay: '1s' }}
                                                        className="absolute animate-float-fast h-56 md:h-80 w-auto object-cover shadow-xl z-10 -left-2 md:-left-16 transform -rotate-6 rounded-sm brightness-90 hidden sm:block"
                                                        alt="Side Book 1"
                                                    />
                                                    <img
                                                        src={slide.images[2]}
                                                        style={{ animationDelay: '2s' }}
                                                        className="absolute animate-float-fast h-56 md:h-80 w-auto object-cover shadow-xl z-10 -right-2 md:-right-16 transform rotate-6 rounded-sm brightness-90 hidden sm:block"
                                                        alt="Side Book 2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Background Shape */}
                                <div className="absolute top-0 right-0 w-2/5 h-full bg-[#8697C4]/20 dark:bg-[#3D52A0]/10 transform skew-x-12 origin-top-right -z-0 hidden lg:block pointer-events-none"></div>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>

            {/* Features Bar */}
            <div className="relative z-10 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: FaShieldAlt, title: "Secure Payment", desc: "100% Encrypted Transactions" },
                            { icon: FaCloudDownloadAlt, title: "Instant Access", desc: "Read immediately after purchase" },
                            { icon: FaMobileAlt, title: "Read Anywhere", desc: "Compatible with all devices" }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl p-8 rounded-3xl border border-black/5 dark:border-white/5 flex items-center gap-6 group hover:-translate-y-1 transition-all duration-500 shadow-xl shadow-black/5">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#3D52A0] to-[#7091E6] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#3D52A0]/20 group-hover:scale-110 transition-transform duration-500">
                                    <feature.icon className="text-2xl" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-1">{feature.title}</h4>
                                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Customer's Favourite */}
            <section id="shop" className="py-24 bg-white/40 dark:bg-black/10 border-b border-[#8697C4]/10 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="w-12 h-[2px] bg-[#3D52A0]"></span>
                                <span className="text-[#3D52A0] dark:text-[#7091E6] font-black tracking-[0.3em] text-[10px] uppercase">
                                    Our Top Picks
                                </span>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-serif font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                                Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#10B981] animate-gradient-x">Collection</span>
                            </h2>
                        </div>
                        <button
                            onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}
                            className="px-10 py-5 bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-xl shadow-black/5 hover:-translate-y-1"
                        >
                            View Full Library
                        </button>
                    </div>

                    {/* Category Filter Bar */}
                    <div className="flex flex-wrap items-center gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar">
                        {['All', 'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Computer Science & IT', 'Architecture'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${selectedCategory === cat
                                    ? 'bg-[#3D52A0] text-white border-[#3D52A0] shadow-lg shadow-[#3D52A0]/20'
                                    : 'bg-white/40 dark:bg-white/5 text-slate-500 dark:text-[#8697C4] border-slate-200 dark:border-white/10 hover:border-[#3D52A0] hover:text-[#3D52A0]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                        {featuredBooks.length > 0 ? (
                            featuredBooks
                                .filter(book => selectedCategory === 'All' || book.category === selectedCategory)
                                .map((book, index) => (
                                    <BookGridItem
                                        key={book._id || book.id}
                                        book={book}
                                        sale={true}
                                        isOwned={ownedBookIds.has(book._id || book.id)}
                                    />
                                ))
                        ) : (
                            <div className="col-span-4 py-10 text-center">
                                <div className="animate-spin w-8 h-8 border-4 border-[#3AAFA9] border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading library contents...</p>
                            </div>
                        )}
                        {featuredBooks.length > 0 && featuredBooks.filter(book => selectedCategory === 'All' || book.category === selectedCategory).length === 0 && (
                            <div className="col-span-4 py-20 text-center animate-fade-in">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaBook className="text-slate-300 dark:text-slate-700 text-3xl" />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2">No Books Found</h3>
                                <p className="text-slate-500 dark:text-[#8697C4] text-sm tracking-tight">Stay tuned! We're adding new titles to the {selectedCategory} category soon.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Promotional Banners */}
            <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Big Banner - Now a Quotes Slider */}
                    <div className="md:col-span-3 relative bg-gradient-to-br from-[#3D52A0] to-[#7091E6] rounded-[2rem] overflow-hidden h-72 sm:h-96 flex items-center justify-center px-8 sm:px-16 shadow-2xl group/banner transition-all duration-700 hover:shadow-[#3D52A0]/30 shadow-[#3D52A0]/20">
                        <div className="absolute inset-0">
                            <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(#EDE8F5 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
                        </div>

                        <div className="relative z-10 w-full max-w-6xl text-center px-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide % 6}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    transition={{ duration: 1.2, ease: "anticipate" }}
                                    className="space-y-8"
                                >
                                    {[
                                        { text: "“A room without books is like a body without a soul.”", author: "Marcus Tullius Cicero" },
                                        { text: "“Reading is essential for those who seek to rise above the ordinary.”", author: "Jim Rohn" },
                                        { text: "“Books are a uniquely portable magic.”", author: "Stephen King" },
                                        { text: "“The more that you read, the more things you will know.”", author: "Dr. Seuss" },
                                        { text: "“Classic - a book which people praise and don't read.”", author: "Mark Twain" },
                                        { text: "“There is no friend as loyal as a book.”", author: "Ernest Hemingway" }
                                    ].map((quote, idx) => (
                                        idx === (currentSlide % 6) && (
                                            <div key={idx} className="flex flex-col items-center gap-6">
                                                <h3 className="text-2xl md:text-4xl lg:text-5xl font-serif text-white font-black leading-[1.2] tracking-tight max-w-[95%]">
                                                    {quote.text}
                                                </h3>
                                                <div className="flex flex-col items-center">
                                                    <span className="w-10 h-px bg-white/30 mb-4"></span>
                                                    <p className="text-white/60 italic text-lg md:text-xl font-serif tracking-widest uppercase text-[10px]">
                                                        {quote.author}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Decoration */}
                        <div className="hidden sm:block absolute right-[-50px] bottom-[-50px] w-80 h-80 bg-white opacity-10 rounded-full blur-[100px]"></div>
                        <div className="hidden sm:block absolute left-[-50px] top-[-50px] w-64 h-64 bg-white opacity-10 rounded-full blur-[80px]"></div>
                    </div>
                </div>
            </div>

            {/* Bestselling Books */}
            <section id="bestsellers" className="py-24 bg-white/40 dark:bg-black/10 border-t border-[#8697C4]/10 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="w-12 h-[2px] bg-[#3D52A0]"></span>
                                <span className="text-[#3D52A0] dark:text-[#7091E6] font-black tracking-[0.3em] text-[10px] uppercase">
                                    Popular Picks
                                </span>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-serif font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                                Trending <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7091E6] via-[#3D52A0] to-[#8B5CF6] animate-gradient-x">Now</span>
                            </h2>
                        </div>
                        <button className="px-10 py-5 bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-xl shadow-black/5 hover:-translate-y-1">
                            View All Bestsellers
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                        {bestSellingBooks.length > 0 ? (
                            bestSellingBooks.map((book, index) => (
                                <BookGridItem
                                    key={book._id || book.id}
                                    book={book}
                                    sale={index % 2 !== 0}
                                    isOwned={ownedBookIds.has(book._id || book.id)}
                                />
                            ))
                        ) : (
                            <div className="col-span-4 py-10 text-center">
                                <p className="text-gray-500">Curating bestsellers...</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Large Library Section */}
            <div className="relative z-10 py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <div className="order-2 md:order-1 space-y-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-12 h-[2px] bg-[#3D52A0]"></span>
                                    <span className="text-[#3D52A0] dark:text-[#7091E6] font-black tracking-[0.3em] text-[10px] uppercase">
                                        Next-Gen Reading
                                    </span>
                                </div>
                                <h2 className="text-5xl md:text-6xl font-serif font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                                    The Future of <br /> Immersive Reading
                                </h2>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-xl font-medium tracking-tight">
                                Traditional physical books meet digital innovation. Our cutting-edge 3D engine gives your reading a new dimension—sync notes, cross-device flow, and a personalized sanctuary built just for you.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                                {[
                                    { text: 'Real-time 3D Engine', icon: FaCheckCircle },
                                    { text: 'Cross-Device Continuity', icon: FaCheckCircle },
                                    { text: 'Intelligent Curation', icon: FaCheckCircle },
                                    { text: 'Secure Digital Vault', icon: FaCheckCircle },
                                    { text: 'Smart Annotations', icon: FaCheckCircle },
                                    { text: 'Global Reader Access', icon: FaCheckCircle }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300 font-black uppercase tracking-widest group">
                                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-125 transition-transform duration-500">
                                            <item.icon className="text-xs" />
                                        </div>
                                        {item.text}
                                    </div>
                                ))}
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}
                                className="px-12 py-5 bg-[#3D52A0] text-white hover:bg-[#7091E6] font-black text-[11px] tracking-[0.3em] uppercase transition-all duration-500 hover:-translate-y-1 shadow-xl shadow-[#3D52A0]/20 rounded-2xl relative overflow-hidden group/btn3"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn3:animate-shimmer" />
                                Explore Categories
                            </motion.button>
                        </div>

                        <div className="relative order-1 md:order-2 perspective-1000">
                            <div className="relative w-full h-[500px] flex items-center justify-center group/device">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#3D52A0]/20 to-transparent blur-3xl rounded-full scale-110 opacity-50 group-hover/device:opacity-70 transition-opacity duration-1000"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80"
                                    className="relative z-10 rounded-2xl shadow-2xl max-h-[450px] w-auto animate-float transition-all duration-1000 border border-black/5"
                                    alt="Library Device"
                                />
                                <div className="absolute top-10 right-10 -z-0 w-3/4 h-3/4 border border-[#3D52A0]/30 rounded-2xl transform translate-x-4 translate-y-4 group-hover/device:translate-x-6 group-hover/device:translate-y-6 transition-transform duration-1000"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HomePage;
