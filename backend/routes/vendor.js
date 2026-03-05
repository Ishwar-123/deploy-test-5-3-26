import express from 'express';
import { protect } from '../middleware/auth.js';
import { vendorOnly } from '../middleware/role.js';
import VendorInventory from '../models/VendorInventory.js';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';

const router = express.Router();

// All vendor routes require authentication and vendor role
router.use(protect, vendorOnly);

// Dashboard Stats
router.get('/dashboard', async (req, res) => {
    try {
        const vendorId = req.user.id;

        // 1. Total Books in Inventory
        const inventoryCount = await VendorInventory.count({
            where: {
                vendorId,
                quantityAvailable: { [Op.gt]: 0 }
            }
        });

        // 2. Total Sales using raw query
        const salesStats = await sequelize.query(
            'SELECT SUM(total) as totalRevenue, COUNT(*) as totalOrders FROM orders WHERE vendorId = ? AND status IN ("completed", "processing")',
            {
                replacements: [vendorId],
                type: sequelize.QueryTypes.SELECT
            }
        );

        const totalSales = salesStats[0]?.totalRevenue || 0;
        const totalOrders = salesStats[0]?.totalOrders || 0;

        // 3. Followers (Placeholder)
        const followers = 0;

        res.json({
            success: true,
            data: {
                inventoryCount,
                totalSales,
                totalOrders,
                followers
            }
        });
    } catch (error) {
        console.error('Vendor dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get License Info
router.get('/license', async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['vendorDetails']
        });
        res.json({ success: true, license: user.vendorDetails?.licenseId || null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Inventory
router.get('/inventory', async (req, res) => {
    try {
        const inventory = await VendorInventory.findAll({
            where: { vendorId: req.user.id },
            include: [{
                model: Book,
                as: 'book',
                attributes: ['title', 'author', 'coverImage', 'retailPrice', 'wholesalePrice']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, count: inventory.length, data: inventory });
    } catch (error) {
        console.error('Inventory error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Purchase from Admin (Vendor buys stock)
router.post('/purchase', async (req, res) => {
    const { itemId, itemType, quantity } = req.body;

    if (!itemId || !quantity) {
        return res.status(400).json({ success: false, message: 'Item and quantity required' });
    }

    try {
        // 1. Get the Item to check Price
        let item;
        if (itemType === 'book' || !itemType) {
            item = await Book.findByPk(itemId);
        }

        if (!item) {
            throw new Error('Item not found');
        }

        // Wholesale price check
        const purchasePrice = item.wholesalePrice || (item.retailPrice ? item.retailPrice * 0.7 : 100);
        const totalAmount = purchasePrice * quantity;

        // 2. Create Order (Vendor pays Admin)
        const order = await Order.create({
            userId: req.user.id,
            orderType: 'book',
            items: [{
                bookId: item.id,
                title: item.title,
                quantity: quantity,
                price: purchasePrice
            }],
            subtotal: totalAmount,
            total: totalAmount,
            paymentStatus: 'completed',
            status: 'completed'
        });

        // 3. Add/Update Vendor Inventory
        const inventoryItem = await VendorInventory.create({
            vendorId: req.user.id,
            bookId: item.id,
            quantityPurchased: quantity,
            quantityAvailable: quantity,
            purchasePrice: purchasePrice,
            sellingPrice: item.retailPrice,
            orderId: order.id
        });

        res.json({ success: true, message: 'Purchase successful', orderId: order.id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Sell to Reader (Record a sale)
router.post('/sell', async (req, res) => {
    const { inventoryId, quantity, readerId } = req.body;

    if (!inventoryId || !quantity) {
        return res.status(400).json({ success: false, message: 'Inventory ID and quantity required' });
    }

    try {
        const inventory = await VendorInventory.findOne({
            where: {
                id: inventoryId,
                vendorId: req.user.id
            }
        });

        if (!inventory) {
            throw new Error('Inventory item not found');
        }

        // Check stock
        if (inventory.quantityAvailable < quantity) {
            throw new Error('Insufficient stock');
        }

        // Decrement stock
        inventory.quantityAvailable -= quantity;
        inventory.quantitySold = (inventory.quantitySold || 0) + quantity;
        await inventory.save();

        const finalPrice = inventory.sellingPrice * quantity;

        // Create Order Record
        const customerId = readerId || req.user.id;

        const order = await Order.create({
            userId: customerId,
            orderType: 'book',
            items: [{
                bookId: inventory.bookId,
                title: 'Sold Item',
                quantity: quantity,
                price: inventory.sellingPrice
            }],
            subtotal: finalPrice,
            total: finalPrice,
            vendorId: req.user.id,
            paymentStatus: 'completed',
            status: 'completed'
        });

        res.json({
            success: true,
            message: 'Sale recorded successfully',
            newQuantity: inventory.quantityAvailable
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get Sales History
router.get('/sales', async (req, res) => {
    try {
        const sales = await Order.findAll({
            where: { vendorId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json({ success: true, data: sales });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
