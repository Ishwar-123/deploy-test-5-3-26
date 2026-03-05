import { useState, useEffect } from 'react';
import { FaCheck, FaCrown, FaStar, FaRocket, FaShieldAlt, FaGem } from 'react-icons/fa';
import readerService from '../services/readerService';
import api from '../services/api';
import toast from '../utils/sweetalert';
import { paymentService } from '../services/payment';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Preloader from '../components/Preloader';
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

const ReaderPremium = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState('monthly');

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await readerService.getPackages();
            setPackages(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleBuy = async (pkg) => {
        const res = await loadRazorpay();
        if (!res) {
            toast.error('Razorpay SDK failed to load');
            return;
        }

        let cycle = billingCycle;
        let price = 0;

        if (cycle === 'lifetime') {
            if (!pkg.lifetimePrice) {
                toast.error('Lifetime plan not available for this package');
                return;
            }
            price = pkg.lifetimePrice;
        } else if (cycle === 'yearly') {
            price = pkg.yearlyPrice;
        } else {
            price = pkg.monthlyPrice;
        }

        try {
            const orderRes = await api.post('/payment/subscription-order', {
                packageId: pkg.id,
                billingCycle: cycle
            });

            if (!orderRes.success) throw new Error(orderRes.message);

            const { order, key_id } = orderRes;

            const options = {
                key: key_id,
                amount: order.amount,
                currency: order.currency,
                name: "BookVerse Premium",
                description: `Subscribe to ${pkg.name} (${cycle})`,
                image: "https://via.placeholder.com/150",
                order_id: order.id,
                modal: {
                    ondismiss: function () {
                        navigate('/payment/failure', {
                            state: {
                                reason: "Subscription process was cancelled."
                            }
                        });
                    }
                },
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payment/verify-subscription', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            packageId: pkg.id,
                            billingCycle: cycle
                        });

                        if (verifyRes.success) {
                            toast.success('Subscription activated successfully!');
                            await refreshUser();
                            navigate('/reader/profile');
                        } else {
                            toast.error('Payment verification failed');
                        }
                    } catch (err) {
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.phone
                },
                theme: {
                    color: "#3D52A0"
                }
            };

            const rzp1 = new window.Razorpay(options);

            rzp1.on('payment.failed', async function (response) {
                console.error('❌ Payment failed:', response.error);
                try {
                    await paymentService.handleFailure({
                        razorpay_order_id: order.id,
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

            rzp1.on('modal.closed', async function () {
                console.log('User closed the checkout modal');
                try {
                    await paymentService.handleFailure({
                        razorpay_order_id: order.id,
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

            rzp1.open();

        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Subscription initiation failed');
        }
    };

    const getPrice = (pkg) => {
        if (billingCycle === 'monthly') return pkg.monthlyPrice;
        if (billingCycle === 'yearly') return pkg.yearlyPrice;
        if (billingCycle === 'lifetime') return pkg.lifetimePrice || 'N/A';
        return 0;
    };

    // Filter active packages
    const displayPackages = packages.filter(pkg => {
        if (!pkg.isActive) return false;
        if (billingCycle === 'lifetime' && (!pkg.lifetimePrice || pkg.lifetimePrice <= 0)) return false;
        return true;
    });

    const darkMode = document.documentElement.classList.contains('dark');

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] pb-20 relative font-sans selection:bg-[#3D52A0] selection:text-white overflow-hidden">
            <Preloader />

            {/* Atmospheric Background */}
            <Sphere delay={0} size={400} left="-10%" top="-10%" color={darkMode ? "bg-[#3D52A0]/20" : "bg-[#3D52A0]/10"} />
            <Sphere delay={2} size={300} left="85%" top="40%" color={darkMode ? "bg-[#8B5CF6]/20" : "bg-[#8B5CF6]/10"} />
            <ParticleBackground />

            <div className="container mx-auto px-8 pt-12 pb-24 max-w-7xl relative z-10 space-y-24 animate-fade-in">
                {/* Editorial Header */}
                <div className="text-center max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="flex items-center gap-4">
                            <span className="h-px w-8 bg-[#3D52A0]/30" />
                            <span className="text-[#3D52A0] dark:text-[#7091E6] font-black tracking-[0.4em] text-[10px] uppercase">
                                Elevate Your Experience
                            </span>
                            <span className="h-px w-8 bg-[#3D52A0]/30" />
                        </div>

                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                            Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#8B5CF6] animate-gradient-x">Membership</span> Plans
                        </h1>

                        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed tracking-tight">
                            Choose the perfect plan to unlock unlimited reading, exclusive content, and premium features designed for serious readers.
                        </p>
                    </motion.div>

                    {/* Billing Toggle - High End Glass */}
                    <div className="flex justify-center mt-16">
                        <div className="bg-white/40 dark:bg-white/[0.03] backdrop-blur-3xl p-1.5 rounded-full border border-white/40 dark:border-white/10 inline-flex shadow-2xl relative">
                            {['monthly', 'yearly', 'lifetime'].map((cycle) => (
                                <button
                                    key={cycle}
                                    onClick={() => setBillingCycle(cycle)}
                                    className={`relative px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 z-10
                                        ${billingCycle === cycle
                                            ? 'text-white'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                        }
                                    `}
                                >
                                    {billingCycle === cycle && (
                                        <motion.div
                                            layoutId="activeCycle"
                                            className="absolute inset-0 bg-gradient-to-r from-[#3D52A0] to-[#7091E6] rounded-full -z-10 shadow-lg shadow-[#3D52A0]/40"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    {cycle}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-start">
                    {/* Free Plan - Glass UI */}
                    <motion.div
                        whileHover={{ y: -10 }}
                        className="bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-10 border border-white/40 dark:border-white/10 shadow-2xl flex flex-col group relative overflow-hidden transition-all duration-500"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 dark:bg-white/5 rounded-bl-[100px] -mr-10 -mt-10 opacity-50 transition-all group-hover:scale-110" />

                        <div className="mb-10 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3D52A0]/60 dark:text-gray-400 block mb-6">Standard Access</span>
                            <h3 className="text-3xl font-serif font-black text-gray-900 dark:text-white mb-6 leading-tight">Basic Tier</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-gray-900 dark:text-white font-serif tracking-tighter">Free</span>
                                <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">/ Forever</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mt-8 text-sm leading-relaxed font-medium tracking-tight h-12">
                                Ideal for casual readers who want to explore our free collection without commitment.
                            </p>
                        </div>

                        <div className="h-px bg-gray-200/50 dark:bg-white/10 w-full mb-10" />

                        <ul className="space-y-5 mb-12 flex-1 relative z-10">
                            {[
                                { icon: FaCheck, text: "Access to public domain books" },
                                { icon: FaCheck, text: "Pay-per-book for premium titles" },
                                { icon: FaCheck, text: "Standard reading mode" }
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                                        <item.icon className="text-gray-400 text-[10px]" />
                                    </div>
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ul>

                        <button disabled className="w-full py-5 rounded-2xl font-black bg-gray-100 dark:bg-white/5 text-gray-400 text-[10px] uppercase tracking-[0.3em] cursor-default border border-transparent">
                            Current Plan
                        </button>
                    </motion.div>

                    {/* Dynamic Packages - Glass UI */}
                    {displayPackages.map((pkg) => {
                        const isCurrent = user?.currentPlanName === pkg.name;
                        const price = getPrice(pkg);
                        const isRecommended = pkg.isRecommended;

                        return (
                            <motion.div
                                key={pkg.id}
                                whileHover={{ y: -12 }}
                                className={`relative rounded-3xl p-10 flex flex-col transition-all duration-500 group overflow-hidden border
                                    ${isRecommended
                                        ? 'bg-[#111] dark:bg-white text-white dark:text-black border-[#3D52A0] shadow-[0_30px_60px_-15px_rgba(61,82,160,0.4)] scale-105 z-10'
                                        : 'bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl border-white/40 dark:border-white/10 shadow-2xl'
                                    }
                                `}
                            >
                                {isRecommended && (
                                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#3D52A0] via-[#7091E6] to-[#8B5CF6] animate-gradient-x"></div>
                                )}

                                <div className="mb-10 relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] block
                                                ${isRecommended ? 'text-[#7091E6]' : 'text-[#3D52A0]/60 dark:text-gray-400'}
                                            `}>
                                                {isRecommended ? 'Most Popular' : 'Premium Access'}
                                            </span>
                                            <h3 className={`text-3xl font-serif font-black tracking-tight leading-none ${isRecommended ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}`}>
                                                {pkg.name}
                                            </h3>
                                        </div>
                                        {isRecommended && <FaCrown className="text-[#7091E6] text-2xl animate-pulse" />}
                                    </div>

                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-5xl font-black font-serif tracking-tighter ${isRecommended ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}`}>
                                            ₹{price}
                                        </span>
                                        {billingCycle !== 'lifetime' && (
                                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isRecommended ? 'text-white/40 dark:text-black/40' : 'text-gray-400'}`}>
                                                /{billingCycle.replace('ly', '')}
                                            </span>
                                        )}
                                    </div>

                                    <p className={`mt-8 text-sm leading-relaxed font-medium tracking-tight h-12 ${isRecommended ? 'text-white/70 dark:text-black/60' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {pkg.description}
                                    </p>
                                </div>

                                <div className={`h-px w-full mb-10 ${isRecommended ? 'bg-white/10 dark:bg-black/10' : 'bg-gray-200/50 dark:bg-white/10'}`}></div>

                                <ul className="space-y-5 mb-12 flex-1 relative z-10">
                                    {pkg.isUnlimited && (
                                        <li className="flex items-center gap-4 text-sm font-bold">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isRecommended ? 'bg-white/10 dark:bg-black/5' : 'bg-blue-50 dark:bg-white/5'}`}>
                                                <FaGem className="text-[#3D52A0] text-xs" />
                                            </div>
                                            <span className={isRecommended ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}>Unlimited Library Access</span>
                                        </li>
                                    )}
                                    {pkg.hasVerifiedBadge && (
                                        <li className="flex items-center gap-4 text-sm font-bold">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isRecommended ? 'bg-white/10 dark:bg-black/5' : 'bg-blue-50 dark:bg-white/5'}`}>
                                                <FaShieldAlt className="text-[#3D52A0] text-xs" />
                                            </div>
                                            <span className={isRecommended ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}>Verified Reader Badge</span>
                                        </li>
                                    )}
                                    {Array.isArray(pkg.features) && pkg.features.map((feature, i) => (
                                        <li key={i} className={`flex items-center gap-4 text-sm font-medium ${isRecommended ? 'text-white/80 dark:text-black/80' : 'text-gray-600 dark:text-gray-300'}`}>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isRecommended ? 'bg-white/5 dark:bg-black/5' : 'bg-gray-100 dark:bg-white/5'}`}>
                                                <FaCheck className={`text-[10px] ${isRecommended ? 'text-[#3D52A0]' : 'text-green-500'}`} />
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => !isCurrent && handleBuy(pkg)}
                                    disabled={isCurrent}
                                    className={`relative w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 group/btn
                                        ${isCurrent
                                            ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-default'
                                            : isRecommended
                                                ? 'bg-white dark:bg-[#111] text-[#3D52A0] hover:scale-[1.02] shadow-xl overflow-hidden'
                                                : 'bg-[#3D52A0] text-white hover:bg-[#7091E6] hover:scale-[1.02] shadow-xl shadow-[#3D52A0]/20 overflow-hidden'
                                        }
                                    `}
                                >
                                    {!isCurrent && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                                    )}
                                    {isCurrent ? 'Current Plan' : billingCycle === 'lifetime' ? 'Get Lifetime Access' : 'Subscribe Now'}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Trust Section */}
                <div className="mt-32 pt-16 border-t border-white/40 dark:border-white/10 text-center relative">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <p className="text-[#3D52A0]/60 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8">
                            Trusted by over 10,000 premium readers worldwide
                        </p>
                        <div className="flex justify-center gap-2 items-center">
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <FaStar className="text-[#3D52A0] text-sm" />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ReaderPremium;
