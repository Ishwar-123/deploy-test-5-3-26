import User from '../models/User.js';
import LoginLog from '../models/LoginLog.js';
import Book from '../models/Book.js';
import BookSubmission from '../models/BookSubmission.js';
import Package from '../models/Package.js';
import License from '../models/License.js';
import Order from '../models/Order.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { calculateExpiryDate } from '../utils/helpers.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
    const [
        totalBooks,
        totalVendors,
        totalReaders,
        totalOrders,
        pendingSubmissions,
        activeSubscriptions
    ] = await Promise.all([
        Book.count({ where: { isAvailable: true } }),
        User.count({ where: { role: 'vendor', isActive: true } }),
        User.count({ where: { role: 'reader', isActive: true } }),
        Order.count(),
        BookSubmission.count({ where: { status: 'pending' } }),
        Subscription.count({ where: { status: 'active' } })
    ]);

    // Total revenue using raw query
    const revenueResult = await sequelize.query(
        'SELECT SUM(total) as total FROM orders WHERE paymentStatus = "completed"',
        { type: sequelize.QueryTypes.SELECT }
    );
    const totalRevenue = revenueResult[0]?.total || 0;

    // Recent orders
    const recentOrders = await Order.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{
            model: User,
            as: 'customer',
            attributes: ['name', 'email']
        }],
        attributes: ['orderNumber', 'total', 'status', 'createdAt']
    });

    // Top selling books
    const topBooks = await Book.findAll({
        order: [['totalSales', 'DESC']],
        limit: 5,
        attributes: ['title', 'author', 'totalSales', 'retailPrice']
    });

    res.json({
        success: true,
        data: {
            stats: {
                totalBooks,
                totalVendors,
                totalReaders,
                totalOrders,
                pendingSubmissions,
                activeSubscriptions,
                totalRevenue
            },
            recentOrders,
            topBooks
        }
    });
});

/**
 * @desc    Get all book submissions
 * @route   GET /api/admin/submissions
 * @access  Private/Admin
 */
export const getBookSubmissions = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    const where = status ? { status } : {};

    const submissions = await BookSubmission.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: [{
            model: User,
            as: 'reviewer',
            attributes: ['name']
        }]
    });

    const total = await BookSubmission.count({ where });

    res.json({
        success: true,
        data: {
            submissions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

/**
 * @desc    Approve book submission
 * @route   PUT /api/admin/submissions/:id/approve
 * @access  Private/Admin
 */
export const approveSubmission = asyncHandler(async (req, res) => {
    const { retailPrice, wholesalePrice } = req.body;

    const submission = await BookSubmission.findByPk(req.params.id);

    if (!submission) {
        return res.status(404).json({
            success: false,
            message: 'Submission not found'
        });
    }

    if (submission.status !== 'pending') {
        return res.status(400).json({
            success: false,
            message: 'Submission already processed'
        });
    }

    // Create book from submission
    const book = await Book.create({
        title: submission.title,
        author: submission.author,
        description: submission.description,
        category: submission.category,
        language: submission.language,
        pageCount: submission.pageCount,
        coverImage: submission.coverImage,
        fileUrl: submission.fileUrl,
        fileType: submission.fileType,
        fileSize: submission.fileSize,
        retailPrice: retailPrice || 299,
        wholesalePrice: wholesalePrice || 199,
        submissionId: submission.id,
        isAvailable: true,
        isApproved: true
    });

    // Update submission
    submission.status = 'approved';
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();
    submission.approvedBookId = book.id;
    await submission.save();

    res.json({
        success: true,
        message: 'Book approved and published successfully',
        data: { book }
    });
});

/**
 * @desc    Reject book submission
 * @route   PUT /api/admin/submissions/:id/reject
 * @access  Private/Admin
 */
export const rejectSubmission = asyncHandler(async (req, res) => {
    const { feedback } = req.body;

    const submission = await BookSubmission.findByPk(req.params.id);

    if (!submission) {
        return res.status(404).json({
            success: false,
            message: 'Submission not found'
        });
    }

    submission.status = 'rejected';
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();
    submission.rejectionReason = feedback;
    await submission.save();

    res.json({
        success: true,
        message: 'Submission rejected',
        data: { submission }
    });
});

/**
 * @desc    Get all books
 * @route   GET /api/admin/books
 * @access  Private/Admin
 */
export const getAllBooks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 100, category, search } = req.query;

    let where = {};

    if (category) where.category = category;
    if (search) {
        where[Op.or] = [
            { title: { [Op.like]: `%${search}%` } },
            { author: { [Op.like]: `%${search}%` } },
            { isbn: { [Op.like]: `%${search}%` } }
        ];
    }

    const books = await Book.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (page - 1) * limit
    });

    const total = await Book.count({ where });

    res.json({
        success: true,
        data: {
            books,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

/**
 * @desc    Create new book
 * @route   POST /api/admin/books
 * @access  Private/Admin
 */
export const createBook = asyncHandler(async (req, res) => {
    const book = await Book.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Book created successfully',
        data: { book }
    });
});

/**
 * @desc    Update book
 * @route   PUT /api/admin/books/:id
 * @access  Private/Admin
 */
export const updateBook = asyncHandler(async (req, res) => {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
    }

    // Fix: Handle ISBN unique constraint (convert empty string to null)
    if (req.body.isbn === '') {
        req.body.isbn = null;
    }

    // Feature: Automatic File Cleanup (Delete old files to save space)
    try {
        // Dynamically import fs/path modules (following existing pattern)
        const fs = (await import('fs')).default;
        const path = (await import('path')).default;
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // 1. Check if Book PDF is being updated
        if (req.body.fileUrl && req.body.fileUrl !== book.fileUrl) {
            const oldUrl = book.fileUrl;
            // Check if old URL is local (contains /uploads/)
            if (oldUrl && oldUrl.includes('/uploads/')) {
                const urlParts = oldUrl.split('/uploads/');
                if (urlParts.length > 1) {
                    const relativePath = 'uploads/' + urlParts[1];
                    const absolutePath = path.join(__dirname, '..', relativePath);

                    if (fs.existsSync(absolutePath)) {
                        fs.unlinkSync(absolutePath);
                        console.log(`[Admin] Storage Saver: Deleted old book file: ${absolutePath}`);
                    }
                }
            }
        }

        // 2. Check if Cover Image is being updated
        if (req.body.coverImage && req.body.coverImage !== book.coverImage) {
            const oldUrl = book.coverImage;
            if (oldUrl && oldUrl.includes('/uploads/')) {
                const urlParts = oldUrl.split('/uploads/');
                if (urlParts.length > 1) {
                    const relativePath = 'uploads/' + urlParts[1];
                    const absolutePath = path.join(__dirname, '..', relativePath);

                    if (fs.existsSync(absolutePath)) {
                        fs.unlinkSync(absolutePath);
                        console.log(`[Admin] Storage Saver: Deleted old cover image: ${absolutePath}`);
                    }
                }
            }
        }

        // 3. Check if Catalog PDF is being updated
        if (req.body.catalogUrl && req.body.catalogUrl !== book.catalogUrl) {
            const oldUrl = book.catalogUrl;
            if (oldUrl && oldUrl.includes('/uploads/')) {
                const urlParts = oldUrl.split('/uploads/');
                if (urlParts.length > 1) {
                    const relativePath = 'uploads/' + urlParts[1];
                    const absolutePath = path.join(__dirname, '..', relativePath);

                    if (fs.existsSync(absolutePath)) {
                        fs.unlinkSync(absolutePath);
                        console.log(`[Admin] Storage Saver: Deleted old catalog file: ${absolutePath}`);
                    }
                }
            }
        }
    } catch (err) {
        console.error('[Admin] Warning: Old file cleanup failed:', err.message);
        // Continue update even if cleanup fails
    }

    await book.update(req.body);

    res.json({
        success: true,
        message: 'Book updated successfully',
        data: { book }
    });
});

/**
 * @desc    Delete book
 * @route   DELETE /api/admin/books/:id
 * @access  Private/Admin
 */
// @desc    Delete book
// @route   DELETE /api/admin/books/:id
// @access  Private/Admin
// @desc    Delete book
// @route   DELETE /api/admin/books/:id
// @access  Private/Admin
export const deleteBook = asyncHandler(async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        console.log(`[Admin] Deleting book: ${book.title} (ID: ${book.id})`);

        // Manually delete related records to prevent foreign key constraint errors

        // 1. Delete from ReaderLibrary (user access to the book)
        const ReaderLibrary = (await import('../models/ReaderLibrary.js')).default;
        await ReaderLibrary.destroy({
            where: { bookId: book.id }
        });
        console.log(`[Admin] Removed all reader access for book: ${book.title}`);


        // 2. Delete from VendorInventory (vendors who stock the book)
        const VendorInventory = (await import('../models/VendorInventory.js')).default;
        await VendorInventory.destroy({
            where: { itemId: book.id }
        });

        // 3. Delete from DownloadLog (history of downloads)
        const DownloadLog = (await import('../models/DownloadLog.js')).default;
        await DownloadLog.destroy({
            where: { bookId: book.id }
        });

        // 4. Update BookSubmission (if exists, set approvedBookId to null or delete?)
        // Better to set approvedBookId to null to keep submission history but unlink
        const BookSubmission = (await import('../models/BookSubmission.js')).default;
        await BookSubmission.update(
            { approvedBookId: null, status: 'rejected', rejectionReason: 'Published book deleted by admin' },
            { where: { approvedBookId: book.id } }
        );

        // 5. Delete associated files from local storage
        try {
            const fs = (await import('fs')).default;
            const path = (await import('path')).default;
            const { fileURLToPath } = await import('url');

            // Reconstruct __dirname for ES modules
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const uploadsDir = path.join(__dirname, '..', 'uploads');

            if (book.fileUrl && !book.fileUrl.startsWith('http')) {
                // Assuming format like '/uploads/books/filename.pdf'
                const filePath = path.join(path.dirname(uploadsDir), book.fileUrl);
                // Adjust path logic: if fileUrl is "/uploads/books/..." and we are in controller, 
                // root is "..", so path.join(root, fileUrl) should work if fileUrl starts with /

                const absolutePath = path.join(__dirname, '..', book.fileUrl);
                if (fs.existsSync(absolutePath)) {
                    fs.unlinkSync(absolutePath);
                    console.log(`[Admin] Deleted local file: ${absolutePath}`);
                }
            }

            // Check for cover image
            if (book.coverImage && !book.coverImage.startsWith('http') && book.coverImage.startsWith('/uploads')) {
                const absolutePath = path.join(__dirname, '..', book.coverImage);
                if (fs.existsSync(absolutePath)) {
                    fs.unlinkSync(absolutePath);
                    console.log(`[Admin] Deleted local cover: ${absolutePath}`);
                }
            }

        } catch (fileError) {
            console.error('Error deleting local files:', fileError);
            // Continue
        }

        // 6. Delete the book
        await book.destroy();

        res.json({
            success: true,
            message: 'Book and associated records deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete book: ' + error.message
        });
    }
});

/**
 * @desc    Get all vendors
 * @route   GET /api/admin/vendors
 * @access  Private/Admin
 */
export const getAllVendors = asyncHandler(async (req, res) => {
    const vendors = await User.findAll({
        where: { role: 'vendor' },
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password', 'refreshToken'] }
    });

    res.json({
        success: true,
        data: { vendors }
    });
});

/**
 * @desc    Create vendor with license
 * @route   POST /api/admin/vendors
 * @access  Private/Admin
 */
export const createVendor = asyncHandler(async (req, res) => {
    const {
        name,
        email,
        password,
        phone,
        companyName,
        resaleLimit,
        maxRetailPrice,
        validityDays
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        return res.status(400).json({
            success: false,
            message: 'Email already registered'
        });
    }

    // Create vendor user
    const vendor = await User.create({
        name,
        email,
        password,
        phone,
        role: 'vendor',
        isEmailVerified: true,
        vendorDetails: {
            companyName
        }
    });

    // Create license
    const license = await License.create({
        licenseType: 'vendor',
        vendorId: vendor.id,
        licenseNumber: `VL-${Date.now()}-${vendor.id}`,
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + (validityDays || 365) * 24 * 60 * 60 * 1000),
        status: 'active'
    });

    // Update vendor with license
    vendor.vendorDetails = {
        ...vendor.vendorDetails,
        licenseId: license.id
    };
    await vendor.save();

    res.status(201).json({
        success: true,
        message: 'Vendor created successfully',
        data: { vendor, license }
    });
});

/**
 * @desc    Update vendor
 * @route   PUT /api/admin/vendors/:id
 * @access  Private/Admin
 */
export const updateVendor = asyncHandler(async (req, res) => {
    const vendor = await User.findByPk(req.params.id);

    if (!vendor || vendor.role !== 'vendor') {
        return res.status(404).json({
            success: false,
            message: 'Vendor not found'
        });
    }

    const { name, phone, companyName, isActive } = req.body;

    if (name) vendor.name = name;
    if (phone) vendor.phone = phone;
    if (companyName) {
        vendor.vendorDetails = {
            ...vendor.vendorDetails,
            companyName
        };
    }
    if (typeof isActive !== 'undefined') vendor.isActive = isActive;

    await vendor.save();

    res.json({
        success: true,
        message: 'Vendor updated successfully',
        data: { vendor }
    });
});

/**
 * @desc    Grant license to existing unlicensed vendor
 * @route   POST /api/admin/vendors/:id/grant-license
 * @access  Private/Admin
 */
export const grantLicenseToVendor = asyncHandler(async (req, res) => {
    const { resaleLimit, maxRetailPrice, validityDays } = req.body;

    // Use dynamic import for License model to avoid circular dependency issues if any,
    // though usually standard import is fine, but following pattern
    const License = (await import('../models/License.js')).default;
    const User = (await import('../models/User.js')).default;

    const vendor = await User.findByPk(req.params.id);

    if (!vendor || vendor.role !== 'vendor') {
        return res.status(404).json({
            success: false,
            message: 'Vendor not found'
        });
    }

    // Create new license
    const license = await License.create({
        licenseType: 'vendor',
        vendorId: vendor.id,
        licenseNumber: `VL-${Date.now()}-${vendor.id}`,
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + (validityDays || 365) * 24 * 60 * 60 * 1000),
        status: 'active'
    });

    // Update vendor with license ID and limits
    // Storing limits in JSON since License model doesn't have these fields
    let currentDetails = vendor.vendorDetails || {};
    if (typeof currentDetails === 'string') {
        try {
            currentDetails = JSON.parse(currentDetails);
        } catch (e) {
            currentDetails = {};
        }
    }

    const updatedDetails = {
        ...currentDetails,
        licenseId: license.id,
        resaleLimit: parseInt(resaleLimit) || 100,
        maxRetailPrice: parseFloat(maxRetailPrice) || 10000,
        validityDays: parseInt(validityDays) || 365,
        licenseExpiry: license.expiryDate
    };

    // Use User.update to force persist the JSON field correctly
    await User.update({
        vendorDetails: updatedDetails,
        isActive: true
    }, {
        where: { id: vendor.id }
    });

    // Fetch fresh vendor data to return
    const updatedVendor = await User.findByPk(vendor.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
    });

    res.json({
        success: true,
        message: 'License granted successfully',
        data: { vendor: updatedVendor, license }
    });
});


/**
 * @desc    Revoke license from vendor
 * @route   POST /api/admin/vendors/:id/revoke-license
 * @access  Private/Admin
 */
export const revokeLicenseFromVendor = asyncHandler(async (req, res) => {
    // Dynamic imports
    const License = (await import('../models/License.js')).default;
    const User = (await import('../models/User.js')).default;

    const vendor = await User.findByPk(req.params.id);

    if (!vendor || vendor.role !== 'vendor') {
        return res.status(404).json({
            success: false,
            message: 'Vendor not found'
        });
    }

    let details = vendor.vendorDetails || {};
    if (typeof details === 'string') {
        try {
            details = JSON.parse(details);
        } catch (e) {
            details = {};
        }
    }

    const licenseId = details.licenseId;

    if (licenseId) {
        // Update License status in DB
        await License.update(
            { status: 'revoked', expiryDate: new Date() },
            { where: { id: licenseId } }
        );
    }

    // Remove license details from Vendor
    const updatedDetails = { ...details };
    delete updatedDetails.licenseId;
    delete updatedDetails.resaleLimit;
    delete updatedDetails.maxRetailPrice;
    delete updatedDetails.validityDays;
    delete updatedDetails.licenseExpiry;

    // Use User.update to force persist the JSON field correctly
    await User.update({
        vendorDetails: updatedDetails
    }, {
        where: { id: vendor.id }
    });

    res.json({
        success: true,
        message: 'License revoked successfully',
        data: { vendorId: vendor.id }
    });
});


/**
 * @desc    Delete vendor
 * @route   DELETE /api/admin/vendors/:id
 * @access  Private/Admin
 */
export const deleteVendor = asyncHandler(async (req, res) => {
    // Dynamic imports to handle associations
    const User = (await import('../models/User.js')).default;
    const License = (await import('../models/License.js')).default;
    const VendorInventory = (await import('../models/VendorInventory.js')).default;
    const Order = (await import('../models/Order.js')).default;
    const Subscription = (await import('../models/Subscription.js')).default;
    const ReaderLibrary = (await import('../models/ReaderLibrary.js')).default;
    const DownloadLog = (await import('../models/DownloadLog.js')).default;

    const vendorId = req.params.id;
    const vendor = await User.findByPk(vendorId);

    if (!vendor || vendor.role !== 'vendor') {
        return res.status(404).json({
            success: false,
            message: 'Vendor not found'
        });
    }

    // 1. Delete associated data to avoid Foreign Key constraints
    try {
        // Delete License
        await License.destroy({ where: { vendorId } });

        // Delete Inventory
        await VendorInventory.destroy({ where: { vendorId } });

        // Delete Orders where this user is the vendor
        await Order.destroy({ where: { vendorId } });

        // Delete Orders where this user is the customer (just in case they have a reader profile too)
        await Order.destroy({ where: { customerId: vendorId } });

        // Delete Subscriptions
        await Subscription.destroy({ where: { userId: vendorId } });

        // Delete Reader Library entries
        await ReaderLibrary.destroy({ where: { userId: vendorId } });

        // Delete Download Logs
        await DownloadLog.destroy({ where: { userId: vendorId } });

        console.log(`[Admin] Cleanup: Associated data for vendor ${vendorId} deleted.`);
    } catch (cleanupErr) {
        console.error('[Admin] Error during vendor cleanup:', cleanupErr.message);
        // We continue trying to delete the vendor user
    }

    // 2. Finally, delete the vendor user itself
    await vendor.destroy();

    res.json({
        success: true,
        message: 'Vendor deleted successfully along with all associated data'
    });
});




/**
 * @desc    Get all packages
 * @route   GET /api/admin/packages
 * @access  Private/Admin
 */
export const getAllPackages = asyncHandler(async (req, res) => {
    const packages = await Package.findAll({
        order: [['displayOrder', 'ASC']]
    });

    res.json({
        success: true,
        data: { packages }
    });
});

/**
 * @desc    Create package
 * @route   POST /api/admin/packages
 * @access  Private/Admin
 */
export const createPackage = asyncHandler(async (req, res) => {
    const packageExists = await Package.findOne({ where: { name: req.body.name } });

    if (packageExists) {
        return res.status(400).json({
            success: false,
            message: 'Package with this name already exists'
        });
    }

    const package_ = await Package.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Package created successfully',
        data: { package: package_ }
    });
});

/**
 * @desc    Update package
 * @route   PUT /api/admin/packages/:id
 * @access  Private/Admin
 */
export const updatePackage = asyncHandler(async (req, res) => {
    const package_ = await Package.findByPk(req.params.id);

    if (!package_) {
        return res.status(404).json({
            success: false,
            message: 'Package not found'
        });
    }

    await package_.update(req.body);

    res.json({
        success: true,
        message: 'Package updated successfully',
        data: { package: package_ }
    });
});

/**
 * @desc    Delete package
 * @route   DELETE /api/admin/packages/:id
 * @access  Private/Admin
 */
export const deletePackage = asyncHandler(async (req, res) => {
    const package_ = await Package.findByPk(req.params.id);

    if (!package_) {
        return res.status(404).json({
            success: false,
            message: 'Package not found'
        });
    }

    await package_.destroy();

    res.json({
        success: true,
        message: 'Package deleted successfully'
    });
});

/**
 * @desc    Get all readers
 * @route   GET /api/admin/readers
 * @access  Private/Admin
 */
export const getAllReaders = asyncHandler(async (req, res) => {
    const readers = await User.findAll({
        where: { role: 'reader' },
        attributes: { exclude: ['password', 'refreshToken'] },
        order: [['createdAt', 'DESC']]
    });

    res.json({
        success: true,
        data: { readers }
    });
});

/**
 * @desc    Block/Unblock reader
 * @route   PUT /api/admin/readers/:id/toggle-block
 * @access  Private/Admin
 */
export const toggleBlockReader = asyncHandler(async (req, res) => {
    const reader = await User.findByPk(req.params.id);

    if (!reader || reader.role !== 'reader') {
        return res.status(404).json({
            success: false,
            message: 'Reader not found'
        });
    }

    reader.isBlocked = !reader.isBlocked;
    await reader.save();

    res.json({
        success: true,
        message: `Reader ${reader.isBlocked ? 'blocked' : 'unblocked'} successfully`,
        data: { reader }
    });
});

/**
 * @desc    Get all orders
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
export const getAllOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    const where = status ? { status } : {};

    const orders = await Order.findAll({
        where,
        include: [
            {
                model: User,
                as: 'customer',
                attributes: ['name', 'email']
            },
            {
                model: User,
                as: 'vendor',
                attributes: ['name', 'vendorDetails']
            }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (page - 1) * limit
    });

    const total = await Order.count({ where });

    res.json({
        success: true,
        data: {
            orders,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

/**
 * @desc    Get reports/analytics
 * @route   GET /api/admin/reports
 * @access  Private/Admin
 */
export const getReports = asyncHandler(async (req, res) => {
    const { type = 'sales', startDate, endDate } = req.query;
    let reportData = {};

    // Common WHERE clause for dates
    let dateFilter = '';
    const params = [];
    if (startDate) {
        dateFilter += ' AND createdAt >= ?';
        params.push(startDate);
    }
    if (endDate) {
        dateFilter += ' AND createdAt <= ?';
        params.push(endDate);
    }

    if (type === 'sales') {
        const query = `
            SELECT DATE(createdAt) as date, COUNT(*) as totalOrders, SUM(total) as totalRevenue 
            FROM orders 
            WHERE 1=1 ${dateFilter}
            GROUP BY DATE(createdAt) 
            ORDER BY date ASC`;

        const salesData = await sequelize.query(query, {
            replacements: params,
            type: sequelize.QueryTypes.SELECT
        });
        reportData = { salesData };

    } else if (type === 'books') {
        // More professional: Get category performance from ORDERS within date range
        // For backup, we also show total inventory count
        const query = `
             SELECT 
                category, 
                COUNT(*) as totalSold, 
                SUM(price) as totalRevenue 
             FROM (
                SELECT JSON_UNQUOTE(JSON_EXTRACT(item, '$.category')) as category, CAST(JSON_EXTRACT(item, '$.price') AS DECIMAL(10,2)) as price
                FROM orders, JSON_TABLE(items, '$[*]' COLUMNS (item JSON PATH '$')) as jt
                WHERE 1=1 ${dateFilter}
             ) as sales
             WHERE category IS NOT NULL
             GROUP BY category
             ORDER BY totalRevenue DESC`;

        // If JSON_TABLE is not supported (old MySQL), we'll fallback to a simpler books table query
        let booksData;
        try {
            booksData = await sequelize.query(query, {
                replacements: params,
                type: sequelize.QueryTypes.SELECT
            });
        } catch (e) {
            // Fallback to current books snapshot if orders-based category breakdown fails
            booksData = await sequelize.query(
                'SELECT category, COUNT(*) as count, SUM(totalSales) as totalSales, SUM(totalRevenue) as totalRevenue FROM books GROUP BY category ORDER BY totalRevenue DESC',
                { type: sequelize.QueryTypes.SELECT }
            );
        }

        const formattedBooks = booksData.map(b => ({
            ...b,
            count: Number(b.count || b.totalSold || 0),
            totalSales: Number(b.totalSales || b.totalSold || 0),
            totalRevenue: Number(b.totalRevenue || 0)
        }));

        reportData = { booksData: formattedBooks };

    } else if (type === 'vendors') {
        const query = `
            SELECT 
                o.vendorId,
                u.name as vendorName,
                COUNT(*) as totalOrders,
                SUM(o.total) as totalRevenue,
                SUM(o.commission) as totalCommission
            FROM orders o
            JOIN users u ON o.vendorId = u.id
            WHERE o.vendorId IS NOT NULL ${dateFilter}
            GROUP BY o.vendorId, u.name
            ORDER BY totalRevenue DESC`;

        const vendorsData = await sequelize.query(query, {
            replacements: params,
            type: sequelize.QueryTypes.SELECT
        });

        const formattedVendors = vendorsData.map(v => ({
            ...v,
            totalOrders: Number(v.totalOrders),
            totalRevenue: Number(v.totalRevenue),
            totalCommission: Number(v.totalCommission)
        }));

        reportData = { vendorsData: formattedVendors };
    }

    res.json({
        success: true,
        data: reportData
    });
});
/**
 * @desc    Get authentication monitor data
 * @route   GET /api/admin/auth-monitor
 * @access  Private/Admin
 */
export const getAuthMonitorData = asyncHandler(async (req, res) => {
    // 1. Get recent login logs
    const loginLogs = await LoginLog.findAll({
        order: [['createdAt', 'DESC']],
        limit: 50
    });

    // 2. Get users with currently active OTPs
    const activeOTPs = await User.findAll({
        where: {
            [Op.or]: [
                { emailVerificationOTP: { [Op.ne]: null } },
                { phoneVerificationOTP: { [Op.ne]: null } }
            ],
            otpExpiry: { [Op.gt]: new Date() }
        },
        attributes: ['id', 'name', 'email', 'emailVerificationOTP', 'phoneVerificationOTP', 'otpExpiry', 'otpAttempts', 'lockUntil']
    });

    // 3. Get Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
        totalToday: await LoginLog.count({ where: { createdAt: { [Op.gte]: today } } }),
        failedToday: await LoginLog.count({ where: { createdAt: { [Op.gte]: today }, status: 'failed' } }),
        lockedAccounts: await User.count({ where: { lockUntil: { [Op.gt]: new Date() } } }),
        activeSessions: activeOTPs.length
    };

    // 4. Get recent payment attempts
    const paymentLogs = await Payment.findAll({
        order: [['createdAt', 'DESC']],
        limit: 50,
        include: [{
            model: User,
            as: 'user',
            attributes: ['name', 'email']
        }]
    });

    // 5. Build Comprehensive Data
    res.json({
        success: true,
        data: {
            loginLogs,
            activeOTPs,
            paymentLogs,
            stats: {
                ...stats,
                totalPaymentsToday: await Payment.count({ where: { createdAt: { [Op.gte]: today } } }),
                failedPaymentsToday: await Payment.count({ where: { createdAt: { [Op.gte]: today }, status: 'failed' } })
            }
        }
    });
});

/**
 * @desc    Unlock a user account
 * @route   POST /api/admin/auth-monitor/unlock/:id
 * @access  Private/Admin
 */
export const unlockUser = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.lockUntil = null;
    user.otpAttempts = 0;
    await user.save();

    res.json({ success: true, message: 'User account unlocked successfully' });
});

/**
 * @desc    Force expire a user's OTP
 * @route   POST /api/admin/auth-monitor/expire-otp/:id
 * @access  Private/Admin
 */
export const expireOTP = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.otpExpiry = new Date(Date.now() - 1000); // Set to past
    await user.save();

    res.json({ success: true, message: 'OTP expired successfully' });
});
