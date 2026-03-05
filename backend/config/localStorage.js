import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const booksDir = path.join(uploadsDir, 'books');
const coversDir = path.join(uploadsDir, 'covers');
const profilesDir = path.join(uploadsDir, 'profiles');

[uploadsDir, booksDir, coversDir, profilesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// Storage for PDF/EPUB files
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, booksDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `book-${uniqueSuffix}${ext}`);
    }
});

// Storage for cover images
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, coversDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `cover-${uniqueSuffix}${ext}`);
    }
});

// Storage for profile images
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profilesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `profile-${uniqueSuffix}${ext}`);
    }
});

// File filter for PDFs/EPUB
const pdfFileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/epub+zip'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and EPUB files are allowed'), false);
    }
};

// File filter for images
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
    }
};

// Multer upload instances
export const uploadPDF = multer({
    storage: pdfStorage,
    fileFilter: pdfFileFilter,
    limits: {
        fileSize: 200 * 1024 * 1024 // 200MB limit for PDFs
    }
});

export const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for images
    }
});

export const uploadProfile = multer({
    storage: profileStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit for profile images
    }
});

// Helper function to get file URL
export const getFileUrl = (filename, type = 'book') => {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const folder = type === 'book' ? 'books' : type === 'cover' ? 'covers' : 'profiles';
    return `${baseUrl}/uploads/${folder}/${filename}`;
};

// Helper function to delete file
export const deleteFile = (filepath) => {
    try {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log(`✅ Deleted file: ${filepath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error deleting file: ${filepath}`, error);
        return false;
    }
};

// Alias for backward compatibility
export const uploadCover = uploadImage;

export default {
    uploadPDF,
    uploadImage,
    uploadCover,
    uploadProfile,
    getFileUrl,
    deleteFile
};
