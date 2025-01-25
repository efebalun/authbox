const rateLimit = require('express-rate-limit');

/**
 * Create a rate limiter middleware
 */
const createRateLimiter = ({ points = 100, duration = 60, type = 'general' }) => {
    return rateLimit({
        windowMs: duration * 1000,
        max: points,
        statusCode: 429,
        message: {
            status: 'error',
            message: 'Too many requests, please try again later'
        },
        keyGenerator: (req) => {
            // Use IP + tenant ID as key for rate limiting
            const tenantId = req.tenant ? req.tenant._id.toString() : 'no-tenant';
            return `${req.ip}-${tenantId}`;
        }
    });
};

module.exports = {
    createRateLimiter
}; 