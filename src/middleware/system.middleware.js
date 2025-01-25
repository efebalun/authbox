const JWTService = require('../services/jwt.service');

const authenticateSystem = async (req, res, next) => {
    try {
        const token = JWTService.extractTokenFromHeader(req);
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        // For testing environment, accept test token
        if (process.env.NODE_ENV === 'development' && token === 'test-system-token') {
            return next();
        }

        const decoded = await JWTService.verifyToken(token, process.env.SYSTEM_JWT_SECRET);
        if (!decoded || decoded.type !== 'system') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid system token'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid system token'
        });
    }
};

module.exports = {
    authenticateSystem
}; 