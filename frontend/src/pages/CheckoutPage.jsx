import { useState, useEffect } from 'react';
import settingsService from '../services/settingsService';
import { useParams, useNavigate } from 'react-router-dom';
import paymentService from '../services/payment';
import bookService from '../services/bookService';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/sweetalert';
import { FaLock, FaCreditCard, FaShieldAlt, FaSun, FaMoon, FaArrowLeft, FaCheckCircle, FaDownload } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

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

const CheckoutPage = () => {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { darkMode, toggleTheme } = useTheme();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [gstRate, setGstRate] = useState(18);

    useEffect(() => {
        settingsService.getGST()
            .then(data => { if (data.gst !== undefined) setGstRate(data.gst); })
            .catch(err => console.log('GST fetch error:', err));
    }, []);

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const response = await bookService.getBookById(bookId);
                const bookData = response.data?.book || response.book || response.data || response;
                if (!bookData) throw new Error('Book data is missing');
                setBook(bookData);
            } catch (error) {
                console.error('Error loading book:', error);
                toast.error('Failed to load book details');
            } finally {
                setLoading(false);
            }
        };
        if (bookId) fetchBook();
    }, [bookId]);

    const handlePayment = async () => {
        setProcessing(true);
        try {
            const response = await paymentService.createOrder(bookId);
            const data = response;
            if (!data.success) throw new Error('Order creation failed');

            const options = {
                key: data.key_id,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Charotar Publishing House",
                description: `Purchase: ${book.title}`,
                image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                order_id: data.order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await paymentService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookId: book.id
                        });
                        if (verifyRes.success) {
                            toast.success('Payment Successful!');
                            navigate('/payment/success', { replace: true, state: { book } });
                        }
                    } catch (error) {
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.phone || ""
                },
                theme: { color: "#3D52A0" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            toast.error(error.message || 'Payment failed');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
            <div className="animate-spin w-12 h-12 border-4 border-[#3D52A0] border-t-transparent rounded-full"></div>
        </div>
    );

    if (!book) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
            <h2 className="text-2xl font-black font-serif mb-4">Book not found</h2>
            <button onClick={() => navigate('/')} className="px-8 py-3 bg-[#3D52A0] text-white rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform">Go Home</button>
        </div>
    );

    const price = Number(book.retailPrice) || 0;
    const gstAmount = (price * gstRate) / 100;
    const totalAmount = price + gstAmount;

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#050505] transition-colors duration-500 overflow-hidden flex items-center justify-center p-6">
            <Sphere delay={0} size={500} left="-10%" top="-10%" color="bg-[#3D52A0]/10" />
            <Sphere delay={2} size={400} left="80%" top="30%" color="bg-[#8B5CF6]/10" />
            <ParticleBackground />

            <div className="container max-w-5xl relative z-10 flex flex-col gap-10 animate-fade-in">

                {/* Back Link */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="w-fit flex items-center gap-2.5 text-[#3D52A0] dark:text-[#7091E6] font-black uppercase tracking-[0.3em] text-[8px] group transition-all"
                >
                    <div className="p-1.5 bg-white/50 dark:bg-white/5 rounded-full border border-white dark:border-white/10 group-hover:bg-[#3D52A0] group-hover:text-white transition-all shadow-xl">
                        <FaArrowLeft size={10} />
                    </div>
                    <span>Return to Shop</span>
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                    {/* Visual Side (Left) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-5 flex flex-col"
                    >
                        <div className="flex-1 bg-white/60 dark:bg-white/5 backdrop-blur-3xl rounded-[32px] p-8 border border-white dark:border-white/10 shadow-2xl relative overflow-hidden group">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#3D52A0]/20 to-transparent blur-3xl rounded-full"></div>

                            <div className="flex flex-col items-center relative z-10">
                                {/* 3D Hovering Cover */}
                                <div className="perspective-1000 mb-6">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="relative w-40 aspect-[2/3] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] rounded-lg overflow-hidden transition-all duration-700"
                                    >
                                        <div className="absolute left-0 top-0 w-1.5 h-full bg-black/20 z-20 pointer-events-none"></div>
                                        <img
                                            src={book.coverImage?.url || book.coverImage || 'https://via.placeholder.com/300x450'}
                                            alt={book.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </motion.div>
                                </div>

                                <h3 className="text-2xl font-serif font-black text-center text-gray-900 dark:text-white mb-2 tracking-tight leading-tight">
                                    {book.title}
                                </h3>
                                <p className="text-[10px] font-black text-[#3D52A0] dark:text-[#7091E6] tracking-[0.4em] uppercase mb-6">
                                    {book.author}
                                </p>

                                <div className="w-full pt-6 border-t border-black/5 dark:border-white/5">
                                    <p className="text-gray-500 dark:text-gray-400 text-xs italic leading-relaxed text-center font-medium max-w-xs mx-auto">
                                        "{book.description ? book.description.substring(0, 80) + '...' : 'Unlock this premium content and start reading instantly.'}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Checkout Side (Right) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-7 flex flex-col"
                    >
                        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white dark:border-white/10 shadow-3xl flex flex-col h-full overflow-hidden">
                            <div className="p-8 lg:p-10 flex-1">
                                <div className="flex items-center justify-between mb-8">
                                    <h1 className="text-3xl lg:text-4xl font-serif font-black text-gray-900 dark:text-white tracking-tighter">
                                        Checkout
                                    </h1>
                                    <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center border border-green-500/20 shadow-xl">
                                        <FaShieldAlt size={18} />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Order Summary */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="w-6 h-[1.5px] bg-[#3D52A0]"></span>
                                            <h3 className="text-[12px] font-black text-[#3D52A0] dark:text-[#7091E6] uppercase tracking-[0.3em]">Order Summary</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-white/5 rounded-[20px] p-6 border border-black/5 dark:border-white/5 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[11px]">Subtotal</span>
                                                <span className="font-black text-gray-900 dark:text-white">₹{price.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[11px]">GST ({gstRate}%)</span>
                                                <span className="font-black text-gray-900 dark:text-white">₹{gstAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="h-px bg-black/[0.03] dark:bg-white/[0.03] my-4"></div>
                                            <div className="flex justify-between items-end">
                                                <span className="font-serif font-black text-2xl text-gray-900 dark:text-white">Total</span>
                                                <span className="font-black text-4xl text-transparent bg-clip-text bg-gradient-to-r from-[#3D52A0] to-[#7091E6]">₹{totalAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Details */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="w-6 h-[1.5px] bg-[#8B5CF6]"></span>
                                            <h3 className="text-[12px] font-black text-[#8B5CF6] uppercase tracking-[0.3em]">Customer Details</h3>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-white/5 rounded-[20px] p-4 border border-black/5 dark:border-white/5 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D52A0] to-[#7091E6] flex items-center justify-center text-white text-md font-black shadow-lg">
                                                {user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-md font-black text-gray-900 dark:text-white tracking-tight">{user?.name || 'Guest User'}</p>
                                                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">{user?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Pay Button */}
                            <div className="p-8 lg:p-10 bg-slate-50/50 dark:bg-white/5 border-t border-black/5 dark:border-white/10 relative overflow-hidden">
                                <div className="flex justify-center">
                                    <button
                                        onClick={handlePayment}
                                        disabled={processing}
                                        className="w-full max-w-sm py-[25px] bg-gradient-to-r from-[#3D52A0] via-[#4F46E5] to-[#7091E6] text-white rounded-[24px] font-black text-[15px] uppercase tracking-[0.4em] transition-all duration-500 flex items-center justify-center gap-4 shadow-[0_20px_40px_-10px_rgba(61,82,160,0.4)] hover:shadow-[0_30px_60px_-15px_rgba(61,82,160,0.6)] group/btn hover:scale-[1.02] active:scale-95 overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 skew-x-[-15deg]"></div>
                                        {processing ? (
                                            <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <>
                                                <span className="relative z-10">Pay Now</span>
                                                <FaLock size={18} className="group-hover/btn:scale-125 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-4 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-500">
                                    <FaCreditCard size={24} className="text-gray-600 dark:text-white" />
                                    <div className="h-4 w-[1px] bg-gray-400"></div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 dark:text-white">Secured by Razorpay</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .shadow-3xl { box-shadow: 0 50px 100px -20px rgba(0,0,0,0.2); }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default CheckoutPage;
