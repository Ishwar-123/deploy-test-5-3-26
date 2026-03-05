import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Helper function to get directory size
const getDirectorySize = (dirPath) => {
    let totalSize = 0;
    let fileCount = 0;

    if (!fs.existsSync(dirPath)) {
        return { size: 0, count: 0 };
    }

    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
            totalSize += stats.size;
            fileCount++;
        }
    });

    return { size: totalSize, count: fileCount };
};

/**
 * @desc    Get local storage stats
 * @route   GET /api/storage/stats
 * @access  Private/Admin
 */
router.get('/stats', async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        const booksDir = path.join(uploadsDir, 'books');
        const coversDir = path.join(uploadsDir, 'covers');
        const profilesDir = path.join(uploadsDir, 'profiles');

        // Get stats for each directory
        const booksStats = getDirectorySize(booksDir);
        const coversStats = getDirectorySize(coversDir);
        const profilesStats = getDirectorySize(profilesDir);

        const totalUsed = booksStats.size + coversStats.size + profilesStats.size;
        const totalFiles = booksStats.count + coversStats.count + profilesStats.count;

        // Get disk space (this is approximate)
        const totalStorage = 100 * 1024 * 1024 * 1024; // 100GB (adjust as needed)
        const usagePercentage = ((totalUsed / totalStorage) * 100).toFixed(2);

        res.json({
            success: true,
            data: {
                storage: {
                    total: totalStorage,
                    used: totalUsed,
                    remaining: totalStorage - totalUsed,
                    usagePercentage: parseFloat(usagePercentage)
                },
                resources: {
                    books: booksStats.count,
                    covers: coversStats.count,
                    profiles: profilesStats.count,
                    total: totalFiles
                },
                breakdown: {
                    books: {
                        size: booksStats.size,
                        count: booksStats.count,
                        sizeFormatted: `${(booksStats.size / (1024 * 1024)).toFixed(2)} MB`
                    },
                    covers: {
                        size: coversStats.size,
                        count: coversStats.count,
                        sizeFormatted: `${(coversStats.size / (1024 * 1024)).toFixed(2)} MB`
                    },
                    profiles: {
                        size: profilesStats.size,
                        count: profilesStats.count,
                        sizeFormatted: `${(profilesStats.size / (1024 * 1024)).toFixed(2)} MB`
                    }
                },
                plan: {
                    plan_name: 'Local Storage',
                    type: 'Self-Hosted'
                }
            }
        });
    } catch (error) {
        console.error('Error fetching storage stats:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch storage stats',
            error: error.toString()
        });
    }
});

/**
 * @desc    Get list of all uploaded files
 * @route   GET /api/storage/files
 * @access  Private/Admin
 */
router.get('/files', async (req, res) => {
    try {
        const { type = 'all', max_results = 50 } = req.query;
        const uploadsDir = path.join(__dirname, '..', 'uploads');

        let files = [];

        const getFilesFromDir = (dirPath, fileType) => {
            if (!fs.existsSync(dirPath)) return [];

            const dirFiles = fs.readdirSync(dirPath);
            return dirFiles.map(filename => {
                const filePath = path.join(dirPath, filename);
                const stats = fs.statSync(filePath);

                return {
                    filename,
                    type: fileType,
                    size: stats.size,
                    sizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    path: filePath
                };
            });
        };

        // Get files based on type
        if (type === 'all' || type === 'book') {
            const booksDir = path.join(uploadsDir, 'books');
            files = [...files, ...getFilesFromDir(booksDir, 'book')];
        }

        if (type === 'all' || type === 'cover') {
            const coversDir = path.join(uploadsDir, 'covers');
            files = [...files, ...getFilesFromDir(coversDir, 'cover')];
        }

        if (type === 'all' || type === 'profile') {
            const profilesDir = path.join(uploadsDir, 'profiles');
            files = [...files, ...getFilesFromDir(profilesDir, 'profile')];
        }

        // Sort by modified date (newest first)
        files.sort((a, b) => b.modified - a.modified);

        // Limit results
        files = files.slice(0, parseInt(max_results));

        res.json({
            success: true,
            data: {
                files,
                count: files.length
            }
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch files'
        });
    }
});

/**
 * @desc    Delete a file
 * @route   DELETE /api/storage/files/:filename
 * @access  Private/Admin
 */
router.delete('/files/:type/:filename', async (req, res) => {
    try {
        const { type, filename } = req.params;
        const uploadsDir = path.join(__dirname, '..', 'uploads');

        let dirPath;
        if (type === 'book') dirPath = path.join(uploadsDir, 'books');
        else if (type === 'cover') dirPath = path.join(uploadsDir, 'covers');
        else if (type === 'profile') dirPath = path.join(uploadsDir, 'profiles');
        else {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type'
            });
        }

        const filePath = path.join(dirPath, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete file'
        });
    }
});

export default router;
