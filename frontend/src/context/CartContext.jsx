import { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart, clearCart as apiClearCart } from '../services/cartService';
import toast from '../utils/sweetalert';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch cart when user logs in
    useEffect(() => {
        if (isAuthenticated && user?.role === 'reader') {
            fetchCart();
        } else {
            setCartItems([]);
        }
    }, [isAuthenticated, user]);

    const fetchCart = async () => {
        try {
            const response = await getCart();
            if (response.success && Array.isArray(response.data)) {
                console.log('🛒 Cart Updated:', response.data.length, 'items');
                setCartItems(response.data);
            } else {
                setCartItems([]);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            setCartItems([]); // Reset on error to be safe
        }
    };

    const addToCart = async (bookId) => {
        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            return;
        }
        try {
            const response = await apiAddToCart(bookId);
            if (response.success) {
                // Fetch the complete cart again to ensure state is perfectly synced with database
                await fetchCart();
                toast.success('Added to cart');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to add to cart');
        }
    };

    const removeFromCart = async (bookId) => {
        try {
            await apiRemoveFromCart(bookId);
            // Fetch latest cart state from server after removal
            await fetchCart();
            toast.success('Removed from cart');
        } catch (error) {
            toast.error('Failed to remove from cart');
        }
    };

    const clearCart = async () => {
        const previousItems = cartItems;
        setCartItems([]); // Optimistic clear
        try {
            await apiClearCart();
            toast.success('Cart cleared');
        } catch (error) {
            setCartItems(previousItems); // Rollback on error
            toast.error('Failed to clear cart');
        }
    };

    const isInCart = (bookId) => {
        if (!bookId || !cartItems || cartItems.length === 0) return false;

        const targetId = String(bookId).trim();
        if (targetId === 'undefined' || targetId === 'null' || targetId === '') return false;

        return cartItems.some(item => {
            const itemBookId = String(item.bookId || item.id).trim();
            return itemBookId === targetId;
        });
    };

    const value = {
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        fetchCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
