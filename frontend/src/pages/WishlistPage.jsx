import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FaTrash, FaShoppingCart, FaCreditCard, FaLock, FaBook, FaHeart } from 'react-icons/fa';
import { paymentService } from '../services/payment';
import toast from '../utils/sweetalert';
import { useState, useEffect } from 'react';
import settingsService from '../services/settingsService';

const WishlistPage = () => {
    const { wishlistItems, removeFromWishlist, fetchWishlist } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [gstRate, setGstRate] = useState(18);

    useEffect(() => {
        settingsService.getGST()
            .then(data => { if (data.gst !== undefined) setGstRate(data.gst); })
            .catch(err => console.log('GST fetch error:', err));
    }, []);

    // Calculate totals for Wishlist (acting as Cart)
    const subtotal = wishlistItems.reduce((acc, item) => {
        const price = parseFloat(item.book?.retailPrice || 0);
        return acc + price; // Assuming quantity 1 for wishlist items
    }, 0);

    const tax = Math.round(subtotal * (gstRate / 100));
    const total = subtotal + tax;

    const handleCheckout = async () => {
        if (wishlistItems.length === 0) return;
        setProcessing(true);

        try {
            // 1. Create Wishlist Order
            const response = await paymentService.createWishlistOrder();

            if (!response.success && !response.order) {
                throw new Error(response.message || 'Failed to create order');
            }

            const data = response;

            const options = {
                key: data.key_id,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "BookVerse",
                description: `Wishlist Checkout (${wishlistItems.length} items)`,
                image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                order_id: data.order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await paymentService.verifyWishlistPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.success) {
                            toast.success('Payment Successful!');
                            // fetchWishlist will be called automatically or we can trigger it.
                            // But usually context handles updates. 
                            // VerifyWishlistPayment backend clears the wishlist.
                            // We should refresh context.
                            fetchWishlist();
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
                    color: "#10b981"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error(response.error.description || "Payment failed");
            });
            rzp.open();

        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Checkout failed');
        } finally {
            setProcessing(false);
        }
    };

    if (wishlistItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 text-gray-400">
                    <FaHeart className="text-4xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                    Save books you'd like to read layer.
                </p>
                <button
                    onClick={() => navigate('/reader/dashboard')}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-full font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                >
                    Browse Books
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 max-w-6xl animate-fade-in">
            <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                <FaHeart className="text-red-500" /> Your Wishlist
            </h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Wishlist Items List with Descriptions */}
                <div className="flex-1 space-y-4">
                    {wishlistItems.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 items-start transition-all hover:shadow-md">
                            <img
                                src={item.book?.coverImage?.url || item.book?.coverImage || 'https://via.placeholder.com/100x150'}
                                alt={item.book?.title}
                                className="w-24 h-36 object-cover rounded-lg shadow-sm"
                            />
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{item.book?.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">{item.book?.author}</p>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-300 font-bold uppercase">{item.book?.category || 'General'}</span>
                                    {/* Rating could go here */}
                                </div>
                                <div className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">
                                    ₹{item.book?.retailPrice}
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeFromWishlist(item.bookId); }}
                                className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors self-center"
                                title="Remove from wishlist"
                            >
                                <FaTrash className="text-lg" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Checkout Section (Moved from Cart) */}
                <div className="w-full lg:w-96">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Subtotal ({wishlistItems.length} items)</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>GST ({gstRate}%)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                                <span>Total</span>
                                <span className="text-emerald-600 dark:text-emerald-400">₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={processing}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <FaLock className="text-sm" /> Proceed to Checkout
                                </>
                            )}
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <FaCreditCard /> Secure Payment by Razorpay
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WishlistPage;
