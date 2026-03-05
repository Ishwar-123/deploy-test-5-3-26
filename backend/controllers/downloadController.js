import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Book, User, ReaderLibrary, Subscription, Package, DownloadLog } from '../models/index.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to check if user has access to book
const checkBookAccess = async (userId, bookId) => {
    try {
        const book = await Book.findByPk(bookId);

        if (!book) {
            return { hasAccess: false, reason: 'Book not found' };
        }

        // Check if book is free
        if (book.price === 0 || book.price === null) {
            return { hasAccess: true, book };
        }

        // Check if user has purchased the book
        const libraryEntry = await ReaderLibrary.findOne({
            where: {
                userId,
                bookId
            }
        });

        if (libraryEntry) {
            return { hasAccess: true, book, source: 'purchase' };
        }

        // Check if user has active subscription that includes this book
        const activeSubscription = await Subscription.findOne({
            where: {
                userId,
                status: 'active',
                endDate: {
                    [Op.gt]: new Date()
                }
            },
            include: [{
                model: Package,
                as: 'package'
            }]
        });

        if (activeSubscription) {
            // If subscription exists and is active, grant access
            // You can add more logic here to check if specific book is included in package
            return { hasAccess: true, book, source: 'subscription' };
        }

        return { hasAccess: false, reason: 'No active purchase or subscription' };
    } catch (error) {
        console.error('Error checking book access:', error);
        return { hasAccess: false, reason: 'Error checking access' };
    }
};

// Generate temporary signed URL
const generateSignedUrl = (bookId, userId) => {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now

    const data = `${bookId}-${userId}-${expiresAt}`;
    const signature = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');

    return {
        token: signature,
        expiresAt,
        bookId,
        userId
    };
};

// Verify signed URL
const verifySignedUrl = (token, bookId, userId, expiresAt) => {
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    // Check if expired
    if (Date.now() > expiresAt) {
        return false;
    }

    const data = `${bookId}-${userId}-${expiresAt}`;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');

    return token === expectedSignature;
};

/**
 * @desc    Request download token for a book
 * @route   POST /api/downloads/request/:bookId
 * @access  Private
 */
export const requestDownloadToken = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user.id;

        // Check if user has access to this book
        const accessCheck = await checkBookAccess(userId, bookId);

        if (!accessCheck.hasAccess) {
            return res.status(403).json({
                success: false,
                message: accessCheck.reason || 'You do not have access to this book'
            });
        }

        // Generate signed URL
        const signedData = generateSignedUrl(bookId, userId);

        res.json({
            success: true,
            message: 'Download token generated',
            data: {
                token: signedData.token,
                expiresAt: signedData.expiresAt,
                downloadUrl: `/api/downloads/stream/${bookId}?token=${signedData.token}&expires=${signedData.expiresAt}&uid=${userId}`
            }
        });
    } catch (error) {
        console.error('Error requesting download token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate download token'
        });
    }
};

/**
 * @desc    Stream/Download book file with authentication
 * @route   GET /api/downloads/stream/:bookId
 * @access  Private (with signed token)
 */
export const streamBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        const { token, expires, uid, preview } = req.query;

        // Get book details first (needed for free check)
        const book = await Book.findByPk(bookId);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        const isBookFree = (book.retailPrice !== null && book.retailPrice !== undefined && Number(book.retailPrice) === 0) ||
            (book.price !== null && book.price !== undefined && Number(book.price) === 0);

        // Allow preview access without token (preview=true OR free book)
        if (preview !== 'true' && !isBookFree) {
            // Verify token for full access authentication
            if (!token || !expires || !uid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid download link'
                });
            }

            const isValid = verifySignedUrl(token, bookId, uid, parseInt(expires));

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Download link expired or invalid'
                });
            }
        }

        // Determine correct file path based on URL
        let filePath;
        const filename = path.basename(book.fileUrl);
        const rootUploadsDir = path.join(__dirname, '..', 'uploads');

        if (book.fileUrl.includes('/uploads/pdfs/')) {
            filePath = path.join(rootUploadsDir, 'pdfs', filename);
        } else if (book.fileUrl.includes('/uploads/books/')) {
            filePath = path.join(rootUploadsDir, 'books', filename);
        } else {
            // Default/Fallback: check books first, then pdfs
            filePath = path.join(rootUploadsDir, 'books', filename);
            if (!fs.existsSync(filePath)) {
                filePath = path.join(rootUploadsDir, 'pdfs', filename);
            }
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('[Download] File not found:', filePath);
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }

        // Get file stats
        const stats = fs.statSync(filePath);

        // Log download - Only if we have a userId
        if (uid) {
            try {
                await DownloadLog.create({
                    userId: parseInt(uid),
                    bookId: bookId,
                    downloadType: req.query.download === 'true' ? 'download' : 'view',
                    ipAddress: req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    fileSize: stats.size
                });
            } catch (logError) {
                console.error('Error logging download:', logError.message);
                // Continue even if logging fails
            }
        }

        // Set CORS headers for PDF Viewer
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        // Set headers for PDF streaming
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', stats.size);

        // If download parameter is true, force download
        if (req.query.download === 'true') {
            res.setHeader('Content-Disposition', `attachment; filename="${book.title}.pdf"`);
        } else {
            res.setHeader('Content-Disposition', `inline; filename="${book.title}.pdf"`);
        }

        // Prevent caching of sensitive content
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error streaming file'
                });
            }
        });

    } catch (error) {
        console.error('Error streaming book:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to stream book'
            });
        }
    }
};

/**
 * @desc    Get download history for a user
 * @route   GET /api/downloads/history
 * @access  Private
 */
export const getDownloadHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;

        const downloads = await DownloadLog.findAndCountAll({
            where: { userId },
            include: [{
                model: Book,
                as: 'book',
                attributes: ['id', 'title', 'author', 'coverImage']
            }],
            order: [['downloadedAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                downloads: downloads.rows,
                total: downloads.count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Error fetching download history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch download history'
        });
    }
};

/**
 * @desc    Get download analytics (Admin only)
 * @route   GET /api/downloads/analytics
 * @access  Private/Admin
 */
export const getDownloadAnalytics = async (req, res) => {
    try {
        const { bookId, startDate, endDate } = req.query;

        const whereClause = {};

        if (bookId) {
            whereClause.bookId = bookId;
        }

        if (startDate && endDate) {
            whereClause.downloadedAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const analytics = await DownloadLog.findAll({
            where: whereClause,
            attributes: [
                'bookId',
                [sequelize.fn('COUNT', sequelize.col('id')), 'downloadCount'],
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('userId'))), 'uniqueUsers']
            ],
            include: [{
                model: Book,
                as: 'book',
                attributes: ['id', 'title', 'author']
            }],
            group: ['bookId', 'book.id'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
        });

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching download analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics'
        });
    }
};

export default {
    requestDownloadToken,
    streamBook,
    getDownloadHistory,
    getDownloadAnalytics
};
