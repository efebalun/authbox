const JWTService = require('../services/jwt.service');
const User = require('../models/user.model');

const authenticateAdmin__False = async (req, res, next) => {
    try {
        const token = JWTService.extractTokenFromHeader(req);
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }
        console.log('token', token);

        // For testing environment, accept test token
        if (process.env.NODE_ENV === 'development' && token === 'test-admin-token') {
            return next();
        }

        const decoded = await JWTService.verifyToken(token, process.env.ADMIN_JWT_SECRET);
        if (!decoded || decoded.type !== 'admin') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid admin token'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid admin token'
        });
    }
};

const authenticateAdmin = async (req, res, next) => {
    try {
        const token = JWTService.extractTokenFromHeader(req);
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        const decoded = await JWTService.verifyToken(token, req.tenant.jwtSecret);
        if (!decoded || decoded.type !== 'access') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token'
            });
        }

        const user = await User.findOne({
            _id: decoded.userId,
            tenantId: req.tenant._id,
            roles: { $in: ['admin'] }
        }).select('-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -verificationCode -verificationCodeExpiry');

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Your account is not authorized to access this resource'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
};

const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
        }

        if (!req.user.roles?.includes('admin')) {
            return res.status(403).json({
                status: 'error',
                message: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    authenticateAdmin,
    requireAdmin
}; 