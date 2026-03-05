import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FaTrash, FaShoppingCart, FaCreditCard, FaLock, FaBook, FaShieldAlt } from 'react-icons/fa';
import { paymentService } from '../services/payment';
import toast from '../utils/sweetalert';
import { useState, useEffect } from 'react';
import settingsService from '../services/settingsService';
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

const CartPage = () => {
    const { cartItems, removeFromCart, clearCart, fetchCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [gstRate, setGstRate] = useState(18);

    useEffect(() => {
        settingsService.getGST()
            .then(data => { if (data.gst !== undefined) setGstRate(data.gst); })
            .catch(err => console.log('GST fetch error:', err));
    }, []);

    const subtotal = cartItems.reduce((acc, item) => {
        const price = parseFloat(item.book?.retailPrice || 0);
        return acc + (price * item.quantity);
    }, 0);

    const tax = Math.round(subtotal * (gstRate / 100));
    const total = subtotal + tax;

    const handleCheckout = async () => {
        if (cartItems.length === 0) return;
        setProcessing(true);

        try {
            const response = await paymentService.createCartOrder();

            if (!response.success && !response.order) {
                throw new Error(response.message || 'Failed to create order');
            }

            const data = response;

            const options = {
                key: data.key_id,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "BookVerse",
                description: `Cart Checkout (${cartItems.length} items)`,
                image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                order_id: data.order.id,
                modal: {
                    ondismiss: function () {
                        navigate('/payment/failure', {
                            state: {
                                reason: "Payment was cancelled. You can try again whenever you're ready."
                            }
                        });
                    }
                },
                handler: async function (response) {
                    try {
                        const verifyRes = await paymentService.verifyCartPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.success) {
                            toast.success('Payment Successful!');
                            clearCart();
                            navigate('/reader/library');
                        }
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone || ""
                },
                theme: {
                    color: "#3D52A0"
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', async function (response) {
                console.error('❌ Payment failed:', response.error);
                try {
                    await paymentService.handleFailure({
                        razorpay_order_id: data.order.id,
                        reason: response.error.description || 'Payment failed'
                    });
                } catch (err) {
                    console.error('Failed to report payment failure:', err);
                }

                navigate('/payment/failure', {
                    state: {
                        reason: response.error.description || "Your payment was declined by the bank."
                    }
                });
            });

            rzp.on('modal.closed', async function () {
                console.log('User closed the checkout modal');
                try {
                    await paymentService.handleFailure({
                        razorpay_order_id: data.order.id,
                        reason: 'User closed the payment modal'
                    });
                } catch (err) {
                    console.error('Failed to report payment cancellation:', err);
                }

                navigate('/payment/failure', {
                    state: {
                        reason: "Payment was cancelled. You can try again whenever you're ready."
                    }
                });
            });

            rzp.open();

        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Checkout failed');
        } finally {
            setProcessing(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in bg-white dark:bg-[#121212]">
                <div className="w-24 h-24 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-8 text-gray-300">
                    <FaShoppingCart className="text-4xl" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-md leading-relaxed">
                    Looks like you haven't added any books to your cart yet. Explore our collection of premium titles.
                </p>
                <button
                    onClick={() => navigate('/reader/dashboard')}
                    className="px-8 py-3 bg-[#3D52A0] hover:bg-black text-white font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#3D52A0]/30"
                >
                    Browse Books
                </button>
            </div>
        );
    }

    const darkMode = document.documentElement.classList.contains('dark');

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] pb-20 relative font-sans selection:bg-[#3D52A0] selection:text-white overflow-hidden">
            {/* Atmospheric Background */}
            <Sphere delay={0} size={400} left="-10%" top="-10%" color={darkMode ? "bg-[#3D52A0]/20" : "bg-[#3D52A0]/10"} />
            <Sphere delay={2} size={300} left="85%" top="40%" color={darkMode ? "bg-[#8B5CF6]/20" : "bg-[#8B5CF6]/10"} />
            <ParticleBackground />

            <div className="container mx-auto px-8 pt-12 pb-24 max-w-7xl relative z-10 animate-fade-in">
                {/* Editorial Header */}
                <div className="mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <span className="h-px w-8 bg-[#3D52A0]/30" />
                            <span className="text-[#3D52A0] dark:text-[#7091E6] font-black tracking-[0.4em] text-[10px] uppercase">
                                Your Shopping Bag
                            </span>
                        </div>

                        <h1 className="text-6xl md:text-7xl font-serif font-black text-gray-900 dark:text-white tracking-tighter leading-none mt-2">
                            <span className="text-[#3D52A0]">Your</span> Cart
                        </h1>
                    </motion.div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                    {/* Cart Items */}
                    <div className="flex-1 space-y-8">
                        <AnimatePresence>
                            {cartItems.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl p-8 rounded-3xl border border-black/10 dark:border-white/10 flex gap-8 items-center transition-all duration-500 hover:shadow-2xl group relative overflow-hidden"
                                >
                                    {/* 3D Book Display */}
                                    <div className="w-28 h-40 flex-shrink-0 relative perspective-1000 group-hover:z-20">
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            className="w-full h-full relative transition-all duration-500 shadow-2xl rounded-sm overflow-hidden border border-white/20"
                                        >
                                            <img
                                                src={item.book?.coverImage?.url || item.book?.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200'}
                                                alt={item.book?.title}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Shine effect */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.div>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[#3D52A0]/60 dark:text-[#7091E6]/60 font-black tracking-[0.3em] text-[8px] uppercase">Premium Title</span>
                                            <div className="h-[0.5px] flex-1 bg-gradient-to-r from-[#3D52A0]/30 to-transparent" />
                                        </div>
                                        <h3 className="text-3xl font-serif font-black text-gray-900 dark:text-white group-hover:text-[#3D52A0] transition-colors cursor-pointer leading-tight tracking-tight" onClick={() => navigate(`/book/${item.bookId}`)}>
                                            {item.book?.title}
                                        </h3>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em]">
                                            {item.book?.author}
                                        </p>
                                        <div className="pt-6 flex items-center justify-between">
                                            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#3D52A0] to-[#7091E6] font-serif tracking-tighter">
                                                ₹{item.book?.retailPrice}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item.bookId)}
                                        className="p-4 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all duration-300 border border-transparent hover:border-red-100 dark:hover:border-red-900/20"
                                        title="Remove from cart"
                                    >
                                        <FaTrash className="text-lg" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary - High End Glass */}
                    <div className="w-full lg:w-[400px]">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/40 dark:bg-white/[0.03] backdrop-blur-3xl p-10 rounded-[40px] border border-black/10 dark:border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] sticky top-24"
                        >
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-blue-50 dark:bg-white/5 rounded-2xl">
                                    <FaShoppingCart className="text-[#3D52A0] text-xl" />
                                </div>
                                <h2 className="text-2xl font-serif font-black text-gray-900 dark:text-white">
                                    Order Summary
                                </h2>
                            </div>

                            <div className="space-y-6 mb-10">
                                <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 text-[13px] font-black uppercase tracking-[0.2em]">
                                    <span>Subtotal ({cartItems.length} items)</span>
                                    <span className="text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 text-[13px] font-black uppercase tracking-[0.2em]">
                                    <span>GST ({gstRate}%)</span>
                                    <span className="text-gray-900 dark:text-white">₹{tax.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                                <div className="flex justify-between items-end">
                                    <span className="text-gray-500 dark:text-gray-400 text-[13px] font-black uppercase tracking-[0.2em]">Total Amount</span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-4xl font-black font-serif text-[#3D52A0] tracking-tighter">₹{total.toFixed(2)}</span>
                                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">Inclusive of all taxes</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={processing}
                                className="relative w-full py-6 bg-[#3D52A0] text-white font-black text-[13px] uppercase tracking-[0.3em] rounded-2xl overflow-hidden group/btn shadow-2xl shadow-[#3D52A0]/30 transition-all duration-500 hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-70"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                                {processing ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    <>
                                        <FaLock className="text-xs" /> Pay Now
                                    </>
                                )}
                            </button>

                            <div className="mt-8 flex items-center justify-center gap-3 py-4 border-t border-gray-100/50 dark:border-white/5">
                                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                                    <FaCreditCard className="text-[#3D52A0]/60" /> Encrypted Payment
                                </div>
                                <div className="w-1 h-1 rounded-full bg-gray-300 mx-1" />
                                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                                    <FaShieldAlt className="text-[#3D52A0]/60" /> 100% Secure
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
