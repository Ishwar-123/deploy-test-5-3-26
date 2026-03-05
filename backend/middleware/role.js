/**
 * Role-based access control middleware
 */

/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this resource`
            });
        }

        next();
    };
};

/**
 * Admin only access
 */
export const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
    next();
};

/**
 * Vendor only access
 */
export const vendorOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'vendor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Vendor only.'
        });
    }
    next();
};

/**
 * Reader only access
 */
export const readerOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'reader') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Reader only.'
        });
    }
    next();
};

/**
 * Check if user owns the resource
 */
export const checkOwnership = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        // Admin can access everything
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if the resource belongs to the user
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

        if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not own this resource.'
            });
        }

        next();
    };
};
