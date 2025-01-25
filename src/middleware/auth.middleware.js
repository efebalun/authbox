const User = require('../models/user.model');
const JWTService = require('../services/jwt.service');

const authenticate = async (req, res, next) => {
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
            tenantId: req.tenant._id
        }).select('-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -verificationCode -verificationCodeExpiry');

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found'
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

const verifyRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({
                status: 'error',
                message: 'No refresh token provided'
            });
        }

        const decoded = await JWTService.verifyToken(refreshToken, req.tenant.jwtSecret);
        if (!decoded || decoded.type !== 'refresh') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid refresh token'
            });
        }

        const user = await User.findOne({
            _id: decoded.userId,
            tenantId: req.tenant._id
        }).select('-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -verificationCode -verificationCodeExpiry');

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid refresh token'
        });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const token = JWTService.extractTokenFromHeader(req);
        if (!token) {
            return next();
        }

        const decoded = await JWTService.verifyToken(token, req.tenant.jwtSecret);
        if (!decoded || decoded.type !== 'access') {
            return next();
        }

        const user = await User.findOne({
            _id: decoded.userId,
            tenantId: req.tenant._id
        }).select('-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -verificationCode -verificationCodeExpiry');

        if (user) {
            req.user = user;
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticate,
    verifyRefreshToken,
    optionalAuth,
}; 