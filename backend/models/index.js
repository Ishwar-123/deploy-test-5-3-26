// Import all models
import User from './User.js';
import Book from './Book.js';
import Order from './Order.js';
import Package from './Package.js';
import Subscription from './Subscription.js';
import Payment from './Payment.js';
import ReaderLibrary from './ReaderLibrary.js';
import VendorInventory from './VendorInventory.js';
import Institution from './Institution.js';
import License from './License.js';
import Notification from './Notification.js';
import BookSubmission from './BookSubmission.js';
import DownloadLog from './DownloadLog.js';
import CartItem from './CartItem.js';
import WishlistItem from './WishlistItem.js';
import Highlight from './Highlight.js';
import Setting from './Setting.js';
import LoginLog from './LoginLog.js';
import Review from './Review.js';
import ReviewHelpful from './ReviewHelpful.js';
import ReviewReport from './ReviewReport.js';

// Define relationships
const setupAssociations = () => {
    // User relationships
    User.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
    User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
    User.hasMany(ReaderLibrary, { foreignKey: 'userId', as: 'library' });
    User.hasMany(VendorInventory, { foreignKey: 'vendorId', as: 'inventory' });
    User.belongsTo(Institution, { foreignKey: 'institutionId', as: 'institution' });
    User.hasMany(DownloadLog, { foreignKey: 'userId', as: 'downloads' });
    User.hasMany(CartItem, { foreignKey: 'userId', as: 'cart' });
    User.hasMany(WishlistItem, { foreignKey: 'userId', as: 'wishlist' });
    User.hasMany(Highlight, { foreignKey: 'userId', as: 'highlights' });
    // User.hasMany(LoginLog, { foreignKey: 'email', sourceKey: 'email', as: 'loginLogs' });

    // Order relationships
    Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
    Order.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
    Order.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });

    // Book relationships
    Book.hasMany(ReaderLibrary, { foreignKey: 'bookId', as: 'readers' });
    Book.hasMany(VendorInventory, { foreignKey: 'itemId', as: 'vendorStock' });
    Book.hasMany(DownloadLog, { foreignKey: 'bookId', as: 'downloads' });
    Book.hasMany(CartItem, { foreignKey: 'bookId', as: 'inCarts' });
    Book.hasMany(WishlistItem, { foreignKey: 'bookId', as: 'wishedBy' });
    Book.hasMany(Highlight, { foreignKey: 'bookId', as: 'highlights' });

    // Subscription relationships
    Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Subscription.belongsTo(Package, { foreignKey: 'packageId', as: 'package' });

    // ReaderLibrary relationships
    ReaderLibrary.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    ReaderLibrary.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

    // VendorInventory relationships
    VendorInventory.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
    VendorInventory.belongsTo(Book, { foreignKey: 'itemId', as: 'book' });

    // Institution relationships
    Institution.hasMany(User, { foreignKey: 'institutionId', as: 'users' });

    // License relationships
    License.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

    // DownloadLog relationships
    DownloadLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    DownloadLog.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

    // Cart relationships
    CartItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    CartItem.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

    // Wishlist relationships
    WishlistItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    WishlistItem.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

    // Highlight relationships
    Highlight.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Highlight.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

    // Review relationships
    Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Review.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });
    User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
    Book.hasMany(Review, { foreignKey: 'bookId', as: 'reviews' });

    // Review Helpful relationships
    ReviewHelpful.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    ReviewHelpful.belongsTo(Review, { foreignKey: 'reviewId', as: 'review' });
    User.hasMany(ReviewHelpful, { foreignKey: 'userId', as: 'helpfulReviews' });
    Review.hasMany(ReviewHelpful, { foreignKey: 'reviewId', as: 'helpfuls' });

    // Review Report relationships
    ReviewReport.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    ReviewReport.belongsTo(Review, { foreignKey: 'reviewId', as: 'review' });
    User.hasMany(ReviewReport, { foreignKey: 'userId', as: 'reportedReviews' });
    Review.hasMany(ReviewReport, { foreignKey: 'reviewId', as: 'reports' });

    // Payment relationships
    Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
    User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
    Order.hasOne(Payment, { foreignKey: 'orderId', as: 'paymentDetails' });
};

// Initialize associations
setupAssociations();

// Export all models
export {
    User,
    Book,
    Order,
    Package,
    Subscription,
    Payment,
    ReaderLibrary,
    VendorInventory,
    Institution,
    License,
    Notification,
    BookSubmission,
    DownloadLog,
    CartItem,
    WishlistItem,
    Highlight,
    Setting,
    LoginLog,
    Review,
    ReviewHelpful,
    ReviewReport
};

export default {
    User,
    Book,
    Order,
    Package,
    Subscription,
    Payment,
    ReaderLibrary,
    VendorInventory,
    Institution,
    License,
    Notification,
    BookSubmission,
    DownloadLog,
    CartItem,
    WishlistItem,
    Highlight,
    Setting,
    LoginLog,
    Review,
    ReviewHelpful,
    ReviewReport
};
