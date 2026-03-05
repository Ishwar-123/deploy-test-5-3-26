import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { initSocket } from './utils/socket.js';

// Load environment variables
dotenv.config();

// Import database connection
import connectDB from './config/database.js';

// Import error handlers
import { errorHandler, notFound } from './utils/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import vendorRoutes from './routes/vendor.js';
import readerRoutes from './routes/reader.js';
import bookRoutes from './routes/books.js';
import uploadRoutes from './routes/upload.js';
import storageRoutes from './routes/storage.js';
import paymentRoutes from './routes/payment.js';
import aiRoutes from './routes/ai.js';
import downloadRoutes from './routes/downloads.js';
import cartRoutes from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';
import highlightRoutes from './routes/highlight.js';
import settingsRoutes from './routes/settings.js';
import reviewRoutes from './routes/reviews.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Trust proxy for correct IP detection
app.set('trust proxy', 1);

// CORS configuration - Allow multiple origins
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://ebookcph.vercel.app', // Explicitly allow current Vercel URL
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Connect to database
connectDB();

// Initialize models and associations
import './models/index.js';

// Security middleware
// Security middleware - Configure Helmet to allow PDF loading
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false // Disable CSP for demo/dev to avoid worker blocking issues
}));

// Global Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000, // Reasonable limit for global API
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.includes('/api/downloads') || req.path.includes('/uploads')
});
app.use('/api', limiter);

// 🔐 Brute-force protection for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 attempts
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.'
    }
});


// OTP specific rate limiter (To prevent OTP Bombing)
const otpLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 5, // Limit each IP to 5 OTP requests per window
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again after 30 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply OTP and Login security limiters
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/login-otp/request', otpLimiter);
app.use('/api/auth/pin/verify', loginLimiter);
app.use('/api/auth/pin/setup', loginLimiter);
app.use('/api/auth/pin/forgot', otpLimiter);


// CORS header handled at top


// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
    // Swagger UI documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('📖 Swagger documentation available at http://localhost:5000/api-docs');
}

// Serve ONLY cover images and profile pictures publicly (NOT PDFs)
// PDFs are served through secure download routes with authentication
app.use('/uploads/covers', (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(path.join(__dirname, 'uploads', 'covers')));

app.use('/uploads/profiles', (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(path.join(__dirname, 'uploads', 'profiles')));

// NOTE: PDFs are NOT publicly accessible. They are served through 
// secure download/stream routes in /api/downloads.

// Base API route
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'eBook Publication System API is online'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/reader', readerRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/downloads', downloadRoutes); // Secure PDF download routes
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);

// Ignore favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'eBook Publication System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            admin: '/api/admin',
            vendor: '/api/vendor',
            reader: '/api/reader',
            books: '/api/books'
        }
    });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📚 eBook Publication System API Server                 ║
║   ⚡ Real-time (Socket.io) Enabled                        ║
║                                                           ║
║   🚀 Server running on port ${PORT}                       ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   📡 API: http://localhost:${PORT}/api                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

export default app;
