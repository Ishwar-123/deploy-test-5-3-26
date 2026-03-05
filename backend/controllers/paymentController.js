import Razorpay from 'razorpay';
import crypto from 'crypto';
import Book from '../models/Book.js';
import ReaderLibrary from '../models/ReaderLibrary.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Package from '../models/Package.js';
import Subscription from '../models/Subscription.js';
import VendorInventory from '../models/VendorInventory.js';
import CartItem from '../models/CartItem.js';
import WishlistItem from '../models/WishlistItem.js';
import Setting from '../models/Setting.js';
import Payment from '../models/Payment.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '../utils/emailService.js';

// Helper to get GST Rate from DB
const getGSTRate = async () => {
    try {
        const setting = await Setting.findOne({ where: { key: 'gst_percentage' } });
        return setting ? parseFloat(setting.value) : 18;
    } catch (err) {
        return 18; // Default fallback
    }
};

// Helper to get instance
const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

/**
 * @desc    Create Razorpay Subscription Order
 * @route   POST /api/payment/subscription-order
 * @access  Private
 */
export const createSubscriptionOrder = asyncHandler(async (req, res) => {
    try {
        const { packageId, billingCycle } = req.body;

        console.log('📝 Create Sub Order:', { packageId, billingCycle, userId: req.user.id });

        const plan = await Package.findByPk(packageId);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        let price = 0;
        if (billingCycle === 'monthly') price = plan.monthlyPrice;
        else if (billingCycle === 'yearly') price = plan.yearlyPrice;
        else if (billingCycle === 'lifetime') price = plan.lifetimePrice;
        else return res.status(400).json({ success: false, message: 'Invalid billing cycle' });

        if (price <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid price for selected cycle' });
        }

        const gstRate = await getGSTRate();
        const tax = Math.round(price * (gstRate / 100));
        const totalAmount = price + tax;

        const options = {
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `sub_${Date.now()}_${req.user.id.toString().slice(-5)}`,
            payment_capture: 1 // Auto-capture payment
        };

        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create(options);
        console.log('✅ Razorpay Sub order created:', order.id);

        // Pre-create Order Record
        const orderRecord = await Order.create({
            customerId: req.user.id,
            customerName: req.user.name,
            customerEmail: req.user.email,
            orderType: 'subscription',
            total: totalAmount,
            tax: tax,
            subtotal: price,
            status: 'pending',
            paymentStatus: 'pending',
            isPaid: false,
            razorpayOrderId: order.id,
            items: [{
                packageId: plan.id,
                name: plan.name,
                billingCycle: billingCycle,
                price: price
            }]
        });

        // Log the payment attempt for Auth Monitor
        await Payment.create({
            userId: req.user.id,
            orderId: orderRecord.id,
            amount: totalAmount,
            currency: 'INR',
            status: 'pending',
            paymentGateway: 'razorpay',
            razorpayOrderId: order.id,
            metadata: {
                type: 'subscription',
                packageId,
                billingCycle
            }
        });

        res.json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('❌ Razorpay Sub Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Verify Subscription Payment
 * @route   POST /api/payment/verify-subscription
 * @access  Private
 */
export const verifySubscriptionPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId, billingCycle } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        const plan = await Package.findByPk(packageId);
        if (!plan) throw new Error('Plan not found');

        let price = 0;
        if (billingCycle === 'monthly') price = plan.monthlyPrice;
        else if (billingCycle === 'yearly') price = plan.yearlyPrice;
        else if (billingCycle === 'lifetime') price = plan.lifetimePrice;

        const gstRate = await getGSTRate();
        const tax = Math.round(price * (gstRate / 100));
        const totalAmount = price + tax;

        // Update Order
        let orderId;
        const existingOrder = await Order.findOne({ where: { razorpayOrderId: razorpay_order_id } });
        if (existingOrder) {
            await existingOrder.update({
                orderNumber: existingOrder.orderNumber || `SUB-${Date.now()}`,
                paymentStatus: 'completed',
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                isPaid: true,
                paidAt: new Date(),
                paymentMethod: 'razorpay'
            });
            orderId = existingOrder.id;

            // Update associated payment log
            await Payment.update({
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature
            }, {
                where: { orderId: existingOrder.id }
            });
        } else {
            // Fallback
            const fallbackOrder = await Order.create({
                orderNumber: `SUB-${Date.now()}`,
                customerId: req.user.id,
                customerName: req.user.name,
                customerEmail: req.user.email,
                orderType: 'subscription',
                subtotal: price,
                tax,
                total: totalAmount,
                status: 'completed',
                paymentStatus: 'completed',
                isPaid: true,
                paidAt: new Date(),
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                items: [{
                    packageId: plan.id,
                    name: plan.name,
                    billingCycle,
                    price
                }]
            });
            orderId = fallbackOrder.id;

            // Update associated payment log by razorpayOrderId as order link might be missing or different
            await Payment.update({
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                orderId: fallbackOrder.id // Link it now if it was missing
            }, {
                where: { razorpayOrderId: razorpay_order_id }
            });
        }

        // 2. Create Subscription
        const startDate = new Date();
        const endDate = new Date();
        if (billingCycle === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
        else if (billingCycle === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
        else if (billingCycle === 'lifetime') endDate.setFullYear(endDate.getFullYear() + 100);

        await Subscription.create({
            userId: req.user.id,
            packageId: plan.id,
            orderId: orderId,
            billingCycle,
            status: 'active',
            startDate,
            endDate,
            amount: totalAmount,
            nextBillingDate: billingCycle !== 'lifetime' ? endDate : null
        });

        // 3. Update user
        await User.update({
            isVerified: plan.hasVerifiedBadge || false,
            currentPlanName: plan.name
        }, {
            where: { id: req.user.id }
        });

        // 4. Send Confirmation Email + Admin Notification
        try {
            const finalOrder = await Order.findByPk(orderId);
            if (finalOrder) {
                const orderData = finalOrder.get({ plain: true });
                // Email to buyer
                sendOrderConfirmationEmail(req.user.email, req.user.name, orderData).catch(err => {
                    console.error('Email error:', err);
                });
                // Email to admin
                sendAdminNotificationEmail(orderData, req.user.name, req.user.email).catch(err => {
                    console.error('Admin notification error:', err);
                });
            }
        } catch (mailErr) {
            console.error('Failed to prepare receipt email:', mailErr);
        }

        res.json({ success: true, message: "Subscription activated successfully" });
    } else {
        res.status(400);
        throw new Error("Invalid payment signature");
    }
});

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payment/order
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res) => {
    try {
        const { bookId } = req.body;

        console.log('📝 Create Order Request:', {
            bookId,
            userId: req.user?.id,
            userEmail: req.user?.email
        });

        if (!bookId) {
            return res.status(400).json({ success: false, message: 'Book ID is required' });
        }

        const book = await Book.findByPk(bookId);

        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        // Check if already purchased
        const existingLibraryEntry = await ReaderLibrary.findOne({
            where: {
                userId: req.user.id,
                bookId: bookId
            }
        });

        if (existingLibraryEntry) {
            return res.status(400).json({
                success: false,
                message: 'You already own this book'
            });
        }

        const gstRate = await getGSTRate();
        const tax = Math.round(book.retailPrice * (gstRate / 100));
        const totalAmount = book.retailPrice + tax;

        console.log('💰 Payment Details:', {
            itemPrice: book.retailPrice,
            tax,
            total: totalAmount
        });

        const options = {
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `rcpt_${Date.now()}_${req.user.id.toString().slice(-5)}`,
            payment_capture: 1 // Auto-capture payment
        };

        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create(options);

        console.log('✅ Razorpay order created:', order.id);

        // CREATE ORDER RECORD IN DB (Status: pending)
        const orderRecord = await Order.create({
            customerId: req.user.id,
            customerName: req.user.name,
            customerEmail: req.user.email,
            orderType: 'book',
            subtotal: book.retailPrice,
            total: totalAmount,
            tax: tax,
            status: 'pending',
            paymentStatus: 'pending',
            isPaid: false,
            razorpayOrderId: order.id,
            items: [{
                bookId: book.id,
                title: book.title,
                price: book.retailPrice,
                coverImage: book.coverImage
            }]
        });

        // Log the payment attempt for Auth Monitor
        await Payment.create({
            userId: req.user.id,
            orderId: orderRecord.id,
            amount: totalAmount,
            currency: 'INR',
            status: 'pending',
            paymentGateway: 'razorpay',
            razorpayOrderId: order.id,
            metadata: {
                type: 'book_purchase',
                bookId,
                title: book.title
            }
        });

        res.json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('❌ Razorpay Order Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Payment Gateway Error'
        });
    }
});

/**
 * @desc    Verify Razorpay Payment
 * @route   POST /api/payment/verify
 * @access  Private
 */
export const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        const book = await Book.findByPk(bookId);
        if (!book) {
            res.status(404);
            throw new Error('Book not found during verification');
        }

        const gstRate = await getGSTRate();
        const tax = Math.round(book.retailPrice * (gstRate / 100));
        const totalAmount = book.retailPrice + tax;

        // Check vendor inventory (if applicable)
        const vendorStock = await VendorInventory.findOne({
            where: {
                itemId: bookId,
                itemType: 'book', // Ensure we look for books
                quantityAvailable: { [Op.gt]: 0 }
            }
        });

        let vendorId = null;
        if (vendorStock) {
            vendorId = vendorStock.vendorId;
            // Decrement stock
            await VendorInventory.update({
                quantityAvailable: vendorStock.quantityAvailable - 1,
                quantitySold: vendorStock.quantitySold + 1
            }, {
                where: { id: vendorStock.id }
            });
        }

        // Update Existing Order Record
        let currentOrderId;
        const existingOrder = await Order.findOne({
            where: { razorpayOrderId: razorpay_order_id }
        });

        if (existingOrder) {
            await existingOrder.update({
                orderNumber: existingOrder.orderNumber || `ORD-${Date.now()}`,
                vendorId: vendorId,
                paymentStatus: 'completed',
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                isPaid: true,
                paidAt: new Date()
            });
            currentOrderId = existingOrder.id;

            // Update associated payment log
            await Payment.update({
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature
            }, {
                where: { orderId: existingOrder.id }
            });
        } else {
            // Fallback if order wasn't pre-created (unlikely with recent change)
            const fallbackOrder = await Order.create({
                orderNumber: `ORD-${Date.now()}`,
                customerId: req.user.id,
                customerName: req.user.name,
                customerEmail: req.user.email,
                vendorId: vendorId,
                orderType: 'book',
                items: [{
                    bookId: book.id,
                    title: book.title,
                    price: book.retailPrice,
                }],
                subtotal: book.retailPrice,
                tax,
                total: totalAmount,
                paymentMethod: 'razorpay',
                paymentStatus: 'completed',
                status: 'completed',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                isPaid: true,
                paidAt: new Date()
            });
            currentOrderId = fallbackOrder.id;

            // Update associated payment log
            await Payment.update({
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                orderId: fallbackOrder.id
            }, {
                where: { razorpayOrderId: razorpay_order_id }
            });
        }

        // Add to Reader Library
        await ReaderLibrary.create({
            userId: req.user.id,
            bookId: bookId,
            orderId: currentOrderId,
            purchaseDate: new Date()
        });

        // Update book stats
        const currentStats = book.stats || {};
        await Book.update({
            stats: {
                ...currentStats,
                totalSales: (currentStats.totalSales || 0) + 1
            },
            totalRevenue: (book.totalRevenue || 0) + book.retailPrice
        }, {
            where: { id: bookId }
        });

        // Send Confirmation Email + Admin Notification
        try {
            const finalOrder = await Order.findByPk(currentOrderId);
            if (finalOrder) {
                const orderData = finalOrder.get({ plain: true });
                // Email to buyer
                sendOrderConfirmationEmail(req.user.email, req.user.name, orderData).catch(err => {
                    console.error('Email error:', err);
                });
                // Email to admin
                sendAdminNotificationEmail(orderData, req.user.name, req.user.email).catch(err => {
                    console.error('Admin notification error:', err);
                });
            }
        } catch (mailErr) {
            console.error('Failed to prepare receipt email:', mailErr);
        }

        res.json({
            success: true,
            message: "Payment verified successfully. Book added to your library!",
            orderId: currentOrderId
        });
    } else {
        res.status(400);
        throw new Error("Invalid payment signature");
    }
});

/**
 * @desc    Get user's orders
 * @route   GET /api/payment/orders
 * @access  Private
 */
export const getUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.findAll({
        where: { customerId: req.user.id },
        order: [['createdAt', 'DESC']],
        limit: 20
    });

    res.json({
        success: true,
        data: orders
    });
});

/**
 * @desc    Get single order
 * @route   GET /api/payment/orders/:id
 * @access  Private
 */
export const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findOne({
        where: {
            id: req.params.id,
            customerId: req.user.id
        }
    });

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    res.json({
        success: true,
        data: order
    });
});

/**
 * @desc    Create Razorpay Cart Order
 * @route   POST /api/payment/cart-order
 * @access  Private
 */
export const createCartOrder = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch Cart Items
        const cartItems = await CartItem.findAll({
            where: { userId },
            include: [{
                model: Book,
                as: 'book',
                attributes: ['id', 'title', 'retailPrice', 'averageRating', 'coverImage']
            }]
        });

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Calculate total amount
        let subtotal = 0;
        const items = [];

        for (const item of cartItems) {
            const book = item.book;
            if (!book) continue;

            // Ensure price is a number
            const price = parseFloat(book.retailPrice);
            if (isNaN(price)) continue;

            subtotal += price * item.quantity; // usually quantity is 1 for ebooks

            items.push({
                bookId: book.id,
                title: book.title,
                price: price,
                quantity: item.quantity
            });
        }

        const gstRate = await getGSTRate();
        const tax = Math.round(subtotal * (gstRate / 100));
        const totalAmount = subtotal + tax;

        if (process.env.NODE_ENV === 'development') {
            console.log('💰 Cart Payment Details:', {
                subtotal,
                tax,
                total: totalAmount
            });
        }

        const options = {
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `cart_${Date.now()}_${userId.toString().slice(-5)}`,
            payment_capture: 1
        };

        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create(options);

        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Razorpay Cart order created:', order.id);
        }

        // Pre-create Order Record
        const orderRecord = await Order.create({
            customerId: userId,
            customerName: req.user.name,
            customerEmail: req.user.email,
            orderType: 'mixed',
            total: totalAmount,
            tax: tax,
            subtotal: subtotal,
            status: 'pending',
            paymentStatus: 'pending',
            isPaid: false,
            razorpayOrderId: order.id,
            items: items
        });

        // Log the payment attempt for Auth Monitor
        await Payment.create({
            userId: userId,
            orderId: orderRecord.id,
            amount: totalAmount,
            currency: 'INR',
            status: 'pending',
            paymentGateway: 'razorpay',
            razorpayOrderId: order.id,
            metadata: {
                type: 'cart_purchase',
                itemCount: items.length
            }
        });

        res.json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('❌ Razorpay Cart Order Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Payment Gateway Error'
        });
    }
});

/**
 * @desc    Verify Razorpay Cart Payment
 * @route   POST /api/payment/verify-cart
 * @access  Private
 */
export const verifyCartPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        // Fetch cart items again to process order
        const cartItems = await CartItem.findAll({
            where: { userId },
            include: [{
                model: Book,
                as: 'book',
                attributes: ['id', 'title', 'category', 'retailPrice']
            }]
        });

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty, cannot process order." });
        }

        // Calculate totals again for the record
        let subtotal = 0;
        const orderItems = [];
        const booksToAdd = [];

        for (const item of cartItems) {
            const book = item.book;
            if (!book) continue;

            const price = parseFloat(book.retailPrice);
            subtotal += price * item.quantity;

            orderItems.push({
                bookId: book.id,
                title: book.title,
                category: book.category,
                price: price,
                quantity: item.quantity
            });

            booksToAdd.push({
                userId,
                bookId: book.id,
                purchaseDate: new Date()
            });

            // Update stats
            await Book.update({
                totalSales: sequelize.literal(`totalSales + ${item.quantity}`),
                totalRevenue: sequelize.literal(`totalRevenue + ${price * item.quantity}`)
            }, { where: { id: book.id } });
        }

        const gstRate = await getGSTRate();
        const tax = Math.round(subtotal * (gstRate / 100));
        const totalAmount = subtotal + tax;

        // Update Order
        let currentOrderId;
        const existingOrder = await Order.findOne({ where: { razorpayOrderId: razorpay_order_id } });
        if (existingOrder) {
            await existingOrder.update({
                orderNumber: existingOrder.orderNumber || `ORD-CART-${Date.now()}`,
                paymentStatus: 'completed',
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                isPaid: true,
                paidAt: new Date(),
                paymentMethod: 'razorpay'
            });
            currentOrderId = existingOrder.id;

            // Update associated payment log
            await Payment.update({
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature
            }, {
                where: { orderId: existingOrder.id }
            });
        } else {
            // Fallback (Not pre-created)
            const fallbackOrder = await Order.create({
                orderNumber: `ORD-CART-${Date.now()}`,
                customerId: userId,
                customerName: req.user.name,
                customerEmail: req.user.email,
                orderType: 'mixed',
                items: orderItems,
                subtotal,
                tax,
                total: totalAmount,
                paymentMethod: 'razorpay',
                paymentStatus: 'completed',
                status: 'completed',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                isPaid: true,
                paidAt: new Date()
            });
            currentOrderId = fallbackOrder.id;

            // Update associated payment log
            await Payment.update({
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                orderId: fallbackOrder.id
            }, {
                where: { razorpayOrderId: razorpay_order_id }
            });
        }

        // Add orderId to booksToAdd and add to library
        for (const entry of booksToAdd) {
            try {
                const existing = await ReaderLibrary.findOne({ where: { userId: entry.userId, bookId: entry.bookId } });
                if (!existing) {
                    await ReaderLibrary.create({ ...entry, orderId: currentOrderId });
                }
            } catch (err) {
                console.error("Error adding book to library:", err);
            }
        }

        // Clear Cart
        await CartItem.destroy({ where: { userId } });

        // Send Confirmation Email + Admin Notification
        try {
            const finalOrder = await Order.findByPk(currentOrderId);
            if (finalOrder) {
                const orderData = finalOrder.get({ plain: true });
                // Email to buyer
                sendOrderConfirmationEmail(req.user.email, req.user.name, orderData).catch(err => {
                    console.error('Email error:', err);
                });
                // Email to admin
                sendAdminNotificationEmail(orderData, req.user.name, req.user.email).catch(err => {
                    console.error('Admin notification error:', err);
                });
            }
        } catch (mailErr) {
            console.error('Failed to prepare receipt email:', mailErr);
        }

        res.json({
            success: true,
            message: "Payment verified successfully. Books added to your library!",
            orderId: currentOrderId
        });

    } else {
        res.status(400);
        throw new Error("Invalid payment signature");
    }
});

/**
 * @desc    Create Razorpay Wishlist Order
 * @route   POST /api/payment/wishlist-order
 * @access  Private
 */
export const createWishlistOrder = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch Wishlist Items
        const wishlistItems = await WishlistItem.findAll({
            where: { userId },
            include: [{
                model: Book,
                as: 'book',
                attributes: ['id', 'title', 'retailPrice', 'averageRating', 'coverImage']
            }]
        });

        if (!wishlistItems || wishlistItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Wishlist is empty' });
        }

        // Calculate total amount
        let subtotal = 0;
        const items = [];

        for (const item of wishlistItems) {
            const book = item.book;
            if (!book) continue;

            // Ensure price is a number
            const price = parseFloat(book.retailPrice);
            if (isNaN(price)) continue;

            subtotal += price; // Wishlist usually doesn't have quantity, so just price

            items.push({
                bookId: book.id,
                title: book.title,
                price: price,
                quantity: 1
            });
        }

        const gstRate = await getGSTRate();
        const tax = Math.round(subtotal * (gstRate / 100));
        const totalAmount = subtotal + tax;

        const options = {
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `wishlist_${Date.now()}_${userId.toString().slice(-5)}`,
            payment_capture: 1 // Auto-capture payment
        };

        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create(options);

        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Razorpay Wishlist order created:', order.id);
        }

        // Pre-create Order Record (Pending)
        const orderRecord = await Order.create({
            customerId: userId,
            customerName: req.user.name,
            customerEmail: req.user.email,
            orderType: 'mixed',
            total: totalAmount,
            tax: tax,
            subtotal: subtotal,
            status: 'pending',
            paymentStatus: 'pending',
            isPaid: false,
            razorpayOrderId: order.id,
            items: items
        });

        // Log the payment attempt for Auth Monitor
        await Payment.create({
            userId: userId,
            orderId: orderRecord.id,
            amount: totalAmount,
            currency: 'INR',
            status: 'pending',
            paymentGateway: 'razorpay',
            razorpayOrderId: order.id,
            metadata: {
                type: 'wishlist_purchase',
                itemCount: items.length
            }
        });

        res.json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID,
            items
        });

    } catch (error) {
        console.error('❌ Razorpay Wishlist Order Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Payment Gateway Error'
        });
    }
});

/**
 * @desc    Verify Razorpay Wishlist Payment
 * @route   POST /api/payment/verify-wishlist
 * @access  Private
 */
export const verifyWishlistPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        // Fetch wishlist items again to process order
        const wishlistItems = await WishlistItem.findAll({
            where: { userId },
            include: [{
                model: Book,
                as: 'book',
                attributes: ['id', 'title', 'category', 'retailPrice']
            }]
        });

        if (!wishlistItems || wishlistItems.length === 0) {
            return res.status(400).json({ success: false, message: "Wishlist is empty, cannot process order." });
        }

        // Calculate totals again
        let subtotal = 0;
        const orderItems = [];
        const booksToAdd = [];

        for (const item of wishlistItems) {
            const book = item.book;
            if (!book) continue;

            const price = parseFloat(book.retailPrice);
            subtotal += price;

            orderItems.push({
                bookId: book.id,
                title: book.title,
                category: book.category,
                price: price,
                quantity: 1
            });

            booksToAdd.push({
                userId,
                bookId: book.id,
                purchaseDate: new Date()
            });

            // Update stats
            await Book.update({
                totalSales: sequelize.literal(`totalSales + 1`),
                totalRevenue: sequelize.literal(`totalRevenue + ${price}`)
            }, { where: { id: book.id } });
        }

        const gstRate = await getGSTRate();
        const tax = Math.round(subtotal * (gstRate / 100));
        const totalAmount = subtotal + tax;

        // Update Order Record
        let currentOrderId;
        const existingOrder = await Order.findOne({ where: { razorpayOrderId: razorpay_order_id } });
        if (existingOrder) {
            await existingOrder.update({
                orderNumber: existingOrder.orderNumber || `ORD-WISH-${Date.now()}`,
                paymentStatus: 'completed',
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                isPaid: true,
                paidAt: new Date(),
                paymentMethod: 'razorpay'
            });
            currentOrderId = existingOrder.id;

            // Update associated payment log
            await Payment.update({
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature
            }, {
                where: { orderId: existingOrder.id }
            });
        } else {
            // Fallback
            const fallbackOrder = await Order.create({
                orderNumber: `ORD-WISH-${Date.now()}`,
                customerId: userId,
                customerName: req.user.name,
                customerEmail: req.user.email,
                orderType: 'mixed',
                items: orderItems,
                subtotal,
                tax,
                total: totalAmount,
                paymentMethod: 'razorpay',
                paymentStatus: 'completed',
                status: 'completed',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                isPaid: true,
                paidAt: new Date()
            });
            currentOrderId = fallbackOrder.id;

            // Update associated payment log
            await Payment.update({
                status: 'completed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                orderId: fallbackOrder.id
            }, {
                where: { razorpayOrderId: razorpay_order_id }
            });
        }

        // Add orderId to booksToAdd and add to library
        for (const entry of booksToAdd) {
            try {
                const existing = await ReaderLibrary.findOne({ where: { userId: entry.userId, bookId: entry.bookId } });
                if (!existing) {
                    await ReaderLibrary.create({ ...entry, orderId: currentOrderId });
                }
            } catch (err) {
                console.error("Error adding book to library:", err);
            }
        }

        // Clear Wishlist
        await WishlistItem.destroy({ where: { userId } });

        res.json({
            success: true,
            message: "Payment verified successfully. Books added to your library!",
            orderId: currentOrderId
        });

    } else {
        res.status(400);
        throw new Error("Invalid payment signature");
    }
});

/**
 * @desc    Handle Razorpay Webhook
 * @route   POST /api/payment/webhook
 * @access  Public
 */
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
    // 1. Verify Signature
    const shasum = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET || '123456');
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (process.env.NODE_ENV === 'development') {
        console.log('🔔 Webhook Received:', req.body.event);
    }

    if (digest !== req.headers['x-razorpay-signature']) {
        console.error('❌ Invalid Webhook Signature');
        return res.status(400).json({ status: 'failure', message: 'Invalid signature' });
    }

    const { event, payload } = req.body;

    // 2. Handle 'payment.captured' event
    if (event === 'payment.captured') {
        const payment = payload.payment.entity;
        const orderId = payment.order_id;
        const paymentId = payment.id;
        const email = payment.email;
        const amount = payment.amount / 100; // Amount in rupees

        console.log(`✅ Payment Captured for Order: ${orderId}, Amount: ₹${amount}`);

        // 3. Find existing order by Razorpay Order ID
        let order = await Order.findOne({ where: { razorpayOrderId: orderId } });

        if (order) {
            if (order.status === 'completed' || order.isPaid) {
                console.log('ℹ️ Order already processed via frontend.');
                return res.json({ status: 'ok', message: 'Order already processed' });
            }

            // Update existing order status (if pending)
            console.log('🔄 Updating existing pending order via webhook...');
            order.status = 'completed';
            order.paymentStatus = 'completed';
            order.isPaid = true;
            order.razorpayPaymentId = paymentId;
            order.paidAt = new Date();
            await order.save();

            // Update associated payment log
            await Payment.update({
                status: 'completed',
                razorpayPaymentId: paymentId
            }, {
                where: { orderId: order.id }
            });

            // Handle specific logic based on Order Type
            if (order.orderType === 'subscription') {
                // Activate subscription logic here if not already done
                // (Ideally logic should be in a shared helper function)
                console.log('ℹ️ Subscription order updated via webhook.');
            } else if (order.orderType === 'book' || order.orderType === 'mixed') {
                // Add to library logic here if not already done
                console.log('ℹ️ Book order updated via webhook.');
            }
        } else {
            // 4. Handle "Ghost Orders" (Front-end failed to create order)
            // Ideally we need metadata in Razorpay order creation to reconstruct the order here.
            // For now, we log it. In production, pass 'notes' with bookId/userId during order creation.
            console.warn(`⚠️ Order record not found for ${orderId}. Frontend might have failed before creating order record.`);
        }
    }

    res.json({ status: 'ok' });
});
/**
 * @desc    Handle Payment Failure/Cancellation
 * @route   POST /api/payment/failure
 * @access  Private
 */
export const handlePaymentFailure = asyncHandler(async (req, res) => {
    const { razorpay_order_id, reason } = req.body;

    console.log(`❌ Payment Failed for Order: ${razorpay_order_id}. Reason: ${reason}`);

    if (razorpay_order_id) {
        const order = await Order.findOne({ where: { razorpayOrderId: razorpay_order_id } });
        if (order) {
            await order.update({
                status: 'cancelled',
                paymentStatus: 'failed',
                notes: reason || 'Payment cancelled by user'
            });

            // Update associated payment log
            await Payment.update({
                status: 'failed',
                metadata: {
                    ...(await Payment.findOne({ where: { orderId: order.id } }))?.metadata,
                    failureReason: reason || 'User cancelled'
                }
            }, {
                where: { orderId: order.id }
            });
        }
    }

    res.json({ success: true, message: 'Failure recorded' });
});
