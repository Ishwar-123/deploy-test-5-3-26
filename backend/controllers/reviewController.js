import Review from '../models/Review.js';
import ReviewHelpful from '../models/ReviewHelpful.js';
import ReviewReport from '../models/ReviewReport.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import { sequelize } from '../config/database.js';

// @desc    Create or update a review
// @route   POST /api/reviews
// @access  Private (User)
export const createOrUpdateReview = async (req, res) => {
    try {
        const { bookId, rating, reviewText } = req.body;
        const userId = req.user.id;

        // Validate rating
        if (!rating || rating < 0.5 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 0.5 and 5'
            });
        }

        // Check if book exists
        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check if user already has a review for this book
        let review = await Review.findOne({
            where: { userId, bookId }
        });

        if (review) {
            // Update existing review
            review.rating = rating;
            review.reviewText = reviewText || review.reviewText;
            review.isAdminEdited = false; // Reset admin edit flag when user edits
            await review.save();

            // Recalculate book ratings
            await updateBookRatings(bookId);

            return res.status(200).json({
                success: true,
                message: 'Review updated successfully',
                data: review
            });
        } else {
            // Create new review
            review = await Review.create({
                userId,
                bookId,
                rating,
                reviewText: reviewText || ''
            });

            // Recalculate book ratings
            await updateBookRatings(bookId);

            return res.status(201).json({
                success: true,
                message: 'Review created successfully',
                data: review
            });
        }
    } catch (error) {
        console.error('Create/Update Review Error:', error);

        // Handle unique constraint violation
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this book'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create/update review',
            error: error.message
        });
    }
};

// @desc    Get all reviews for a book
// @route   GET /api/reviews/:bookId
// @access  Public
export const getBookReviews = async (req, res) => {
    try {
        const { bookId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'latest'; // latest, highest, lowest

        // Build sort order
        let order = [['createdAt', 'DESC']];
        if (sortBy === 'highest') {
            order = [['rating', 'DESC'], ['createdAt', 'DESC']];
        } else if (sortBy === 'lowest') {
            order = [['rating', 'ASC'], ['createdAt', 'DESC']];
        } else if (sortBy === 'helpful') {
            order = [['helpfulCount', 'DESC'], ['createdAt', 'DESC']];
        }

        // Get reviews with user information
        const { count, rows: reviews } = await Review.findAndCountAll({
            where: {
                bookId,
                isHidden: false // Only show non-hidden reviews to public
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'profilePicture']
            }],
            order,
            limit,
            offset
        });

        // Check if current user found them helpful
        if (req.user) {
            const reviewIds = reviews.map(r => r.id);
            const helpfuls = await ReviewHelpful.findAll({
                where: {
                    userId: req.user.id,
                    reviewId: reviewIds
                },
                attributes: ['reviewId']
            });

            const helpfulMap = new Set(helpfuls.map(h => h.reviewId));

            reviews.forEach(review => {
                review.dataValues.isHelpful = helpfulMap.has(review.id);
            });
        }

        // Get rating statistics
        const ratingStats = await getRatingStatistics(bookId);

        res.status(200).json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalReviews: count,
                    hasMore: offset + reviews.length < count
                },
                ratingStats
            }
        });
    } catch (error) {
        console.error('Get Book Reviews Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
};

// @desc    Get user's review for a specific book
// @route   GET /api/reviews/user/:bookId
// @access  Private
export const getUserReviewForBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user.id;

        const review = await Review.findOne({
            where: { userId, bookId }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'No review found'
            });
        }

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Get User Review Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review',
            error: error.message
        });
    }
};

// @desc    Delete user's own review
// @route   DELETE /api/reviews/:id
// @access  Private (User)
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const review = await Review.findOne({
            where: { id, userId }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or unauthorized'
            });
        }

        const bookId = review.bookId;
        await review.destroy();

        // Recalculate book ratings
        await updateBookRatings(bookId);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete Review Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
        });
    }
};

// @desc    Admin: Get all reviews with filters
// @route   GET /api/admin/reviews
// @access  Private (Admin)
export const getAllReviewsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { bookId, rating, search, sortBy } = req.query;

        // Build where clause
        const where = {};
        if (bookId) where.bookId = bookId;
        if (rating) where.rating = rating;

        // Build order
        let order = [['createdAt', 'DESC']];
        if (sortBy === 'highest') {
            order = [['rating', 'DESC']];
        } else if (sortBy === 'lowest') {
            order = [['rating', 'ASC']];
        }

        // Build include for search
        const include = [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'profilePicture'],
                ...(search && {
                    where: {
                        name: { [sequelize.Sequelize.Op.like]: `%${search}%` }
                    }
                })
            },
            {
                model: Book,
                as: 'book',
                attributes: ['id', 'title', 'author', 'coverImage']
            }
        ];

        const { count, rows: reviews } = await Review.findAndCountAll({
            where,
            include,
            order,
            limit,
            offset
        });

        res.status(200).json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalReviews: count
                }
            }
        });
    } catch (error) {
        console.error('Get All Reviews Admin Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
};

// @desc    Admin: Update any review
// @route   PUT /api/admin/reviews/:id
// @access  Private (Admin)
export const updateReviewAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, reviewText, isFeatured, isVerified } = req.body;

        const review = await Review.findByPk(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Update fields
        if (rating !== undefined) {
            if (rating < 0.5 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 0.5 and 5'
                });
            }
            review.rating = rating;
        }

        if (reviewText !== undefined) review.reviewText = reviewText;
        if (isFeatured !== undefined) review.isFeatured = isFeatured;
        if (isVerified !== undefined) review.isVerified = isVerified;

        // Mark as admin edited if rating or text changed
        if (rating !== undefined || reviewText !== undefined) {
            review.isAdminEdited = true;
        }

        await review.save();

        // Recalculate book ratings if rating changed
        if (rating !== undefined) {
            await updateBookRatings(review.bookId);
        }

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: review
        });
    } catch (error) {
        console.error('Update Review Admin Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review',
            error: error.message
        });
    }
};

// @desc    Admin: Toggle review visibility
// @route   PATCH /api/admin/reviews/hide/:id
// @access  Private (Admin)
export const toggleReviewVisibility = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findByPk(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        review.isHidden = !review.isHidden;
        await review.save();

        res.status(200).json({
            success: true,
            message: `Review ${review.isHidden ? 'hidden' : 'shown'} successfully`,
            data: review
        });
    } catch (error) {
        console.error('Toggle Review Visibility Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle review visibility',
            error: error.message
        });
    }
};

// @desc    Admin: Delete any review
// @route   DELETE /api/admin/reviews/:id
// @access  Private (Admin)
export const deleteReviewAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findByPk(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        const bookId = review.bookId;
        await review.destroy();

        // Recalculate book ratings
        await updateBookRatings(bookId);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete Review Admin Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
        });
    }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
export const markReviewHelpful = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const review = await Review.findByPk(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        const existing = await ReviewHelpful.findOne({ where: { userId, reviewId: id } });

        if (existing) {
            await existing.destroy();
            review.helpfulCount = Math.max(0, review.helpfulCount - 1);
            await review.save();
            return res.status(200).json({
                success: true,
                message: 'Removed helpful vote',
                data: { helpfulCount: review.helpfulCount, isHelpful: false }
            });
        } else {
            await ReviewHelpful.create({ userId, reviewId: id });
            review.helpfulCount += 1;
            await review.save();
            return res.status(200).json({
                success: true,
                message: 'Marked as helpful',
                data: { helpfulCount: review.helpfulCount, isHelpful: true }
            });
        }
    } catch (error) {
        console.error('Mark Review Helpful Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark review as helpful',
            error: error.message
        });
    }
};

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private
export const reportReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const review = await Review.findByPk(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        const existing = await ReviewReport.findOne({ where: { userId, reviewId: id } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already reported this review' });
        }

        await ReviewReport.create({ userId, reviewId: id });
        review.reportCount += 1;
        await review.save();

        res.status(200).json({
            success: true,
            message: 'Review reported successfully'
        });
    } catch (error) {
        console.error('Report Review Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report review',
            error: error.message
        });
    }
};

// ... existing code

// @desc    Admin: Create a review for any user/book
// @route   POST /api/admin/reviews/create
// @access  Private (Admin)
export const createReviewAdmin = async (req, res) => {
    try {
        const { bookId, userId, rating, reviewText, isVerified, isFeatured } = req.body;

        // Validate basic fields
        if (!bookId || !userId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Please provide bookId, userId, and rating'
            });
        }

        if (rating < 0.5 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 0.5 and 5'
            });
        }

        // Check if book exists
        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check for existing review by this user for this book
        const existingReview = await Review.findOne({
            where: { userId, bookId }
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'This user has already reviewed this book'
            });
        }

        // Create review
        const review = await Review.create({
            userId,
            bookId,
            rating,
            reviewText: reviewText || '',
            isVerified: isVerified || false,
            isFeatured: isFeatured || false,
            isAdminEdited: true // Flag as admin created/edited
        });

        // Recalculate book ratings
        await updateBookRatings(bookId);

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: review
        });
    } catch (error) {
        console.error('Create Review Admin Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create review',
            error: error.message
        });
    }
};

// Start of helper functions (verify existing position)
// Helper function to update book ratings

async function updateBookRatings(bookId) {
    try {
        const stats = await Review.findAll({
            where: {
                bookId,
                isHidden: false
            },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
            ],
            raw: true
        });

        const avgRating = parseFloat(stats[0]?.avgRating || 0).toFixed(1);
        const totalReviews = parseInt(stats[0]?.totalReviews || 0);

        await Book.update(
            {
                averageRating: avgRating,
                totalReviews: totalReviews
            },
            { where: { id: bookId } }
        );
    } catch (error) {
        console.error('Update Book Ratings Error:', error);
    }
}

// Helper function to get rating statistics
async function getRatingStatistics(bookId) {
    try {
        const ratingDistribution = await Review.findAll({
            where: {
                bookId,
                isHidden: false
            },
            attributes: [
                'rating',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['rating'],
            raw: true
        });

        // Create distribution object with all ratings (1-5)
        const distribution = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        };

        // Calculate real total reviews and total stars from raw data
        let totalReviews = 0;
        let totalStars = 0;

        ratingDistribution.forEach(item => {
            const rawRating = parseFloat(item.rating);
            const count = parseInt(item.count);

            totalReviews += count;
            totalStars += rawRating * count;

            // Map to nearest whole number bucket for the graph (1-5)
            const bucket = Math.max(1, Math.min(5, Math.round(rawRating)));
            distribution[bucket] += count;
        });

        let averageRating = totalReviews > 0 ? (totalStars / totalReviews).toFixed(1) : 0;

        return {
            averageRating: parseFloat(averageRating),
            totalReviews,
            distribution
        };
    } catch (error) {
        console.error('Get Rating Statistics Error:', error);
        return {
            averageRating: 0,
            totalReviews: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
    }
}
