import express from 'express';
import { uploadPDF, uploadCover, uploadProfile, getFileUrl, deleteFile } from '../config/localStorage.js';
import { protect, adminOnly } from '../middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @desc    Upload PDF/EPUB file
 * @route   POST /api/upload/pdf
 * @access  Private/Admin
 */
router.post('/pdf', adminOnly, uploadPDF.single('pdf'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileUrl = getFileUrl(req.file.filename, 'book');

        res.json({
            success: true,
            message: 'PDF uploaded successfully',
            data: {
                url: fileUrl,
                filename: req.file.filename,
                size: req.file.size,
                path: req.file.path
            }
        });
    } catch (error) {
        console.error('PDF upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Upload cover image
 * @route   POST /api/upload/cover
 * @access  Private/Admin
 */
router.post('/cover', adminOnly, uploadCover.single('cover'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileUrl = getFileUrl(req.file.filename, 'cover');

        res.json({
            success: true,
            message: 'Cover image uploaded successfully',
            data: {
                url: fileUrl,
                filename: req.file.filename,
                size: req.file.size,
                path: req.file.path
            }
        });
    } catch (error) {
        console.error('Cover upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Upload multiple cover images
 * @route   POST /api/upload/cover/multiple
 * @access  Private/Admin
 */
router.post('/cover/multiple', adminOnly, (req, res) => {
    // uploadCover is mulch configuration for 'covers' directory
    const upload = uploadCover.array('covers', 10);

    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        try {
            const uploadedFiles = req.files.map(file => ({
                url: getFileUrl(file.filename, 'cover'),
                filename: file.filename,
                size: file.size
            }));

            res.json({
                success: true,
                message: `${req.files.length} cover images uploaded successfully`,
                data: { files: uploadedFiles }
            });
        } catch (error) {
            console.error('Multiple cover upload error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

/**
 * @desc    Upload profile picture
 * @route   POST /api/upload/profile
 * @access  Private
 */
router.post('/profile', uploadProfile.single('profile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileUrl = getFileUrl(req.file.filename, 'profile');

        res.json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: {
                url: fileUrl,
                filename: req.file.filename,
                size: req.file.size,
                path: req.file.path
            }
        });
    } catch (error) {
        console.error('Profile upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Upload multiple files (PDF + Cover)
 * @route   POST /api/upload/book
 * @access  Private/Admin
 */
router.post('/book', adminOnly, (req, res) => {
    const upload = uploadPDF.fields([
        { name: 'pdf', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]);

    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        try {
            const response = {
                success: true,
                message: 'Files uploaded successfully',
                data: {}
            };

            if (req.files.pdf && req.files.pdf[0]) {
                const pdfUrl = getFileUrl(req.files.pdf[0].filename, 'book');
                response.data.pdf = {
                    url: pdfUrl,
                    filename: req.files.pdf[0].filename,
                    size: req.files.pdf[0].size
                };
            }

            if (req.files.cover && req.files.cover[0]) {
                const coverUrl = getFileUrl(req.files.cover[0].filename, 'cover');
                response.data.cover = {
                    url: coverUrl,
                    filename: req.files.cover[0].filename,
                    size: req.files.cover[0].size
                };
            }

            res.json(response);
        } catch (error) {
            console.error('Book upload error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
});

/**
 * @desc    Delete file from local storage
 * @route   POST /api/upload/delete
 * @access  Private/Admin
 */
router.post('/delete', adminOnly, async (req, res) => {
    try {
        const { fileUrl, filename } = req.body;

        if (!fileUrl && !filename) {
            return res.status(400).json({
                success: false,
                message: 'File URL or filename required'
            });
        }

        // Extract filename from URL if provided
        let fileToDelete = filename;
        if (fileUrl && !filename) {
            const urlParts = fileUrl.split('/');
            fileToDelete = urlParts[urlParts.length - 1];
        }

        // Determine file type from URL
        let fileType = 'pdf';
        if (fileUrl) {
            if (fileUrl.includes('/covers/')) fileType = 'cover';
            else if (fileUrl.includes('/profiles/')) fileType = 'profile';
        }

        // Construct file path
        const uploadsDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadsDir, `${fileType}s`, fileToDelete);

        // Delete file
        const deleted = deleteFile(filePath);

        if (deleted) {
            res.json({
                success: true,
                message: 'File deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
