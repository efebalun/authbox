const jwt = require('jsonwebtoken');

class JWTService {
    static generateAuthToken(userId, tenantSecret, options = {}) {
        const { expiresIn = '1h', refreshExpiresIn = '7d' } = options;

        if (!tenantSecret || typeof tenantSecret !== 'string') {
            throw new Error('Invalid tenant secret');
        }

        const now = Date.now();

        const accessToken = jwt.sign(
            { userId, type: 'access', iat: now },
            tenantSecret,
            { expiresIn }
        );

        const refreshToken = jwt.sign(
            { userId, type: 'refresh', iat: now + 1 },
            tenantSecret,
            { expiresIn: refreshExpiresIn }
        );

        return { 
            accessToken, 
            refreshToken,
            type: 'Bearer'
        };
    }

    static generateSystemToken() {
        if (!process.env.SYSTEM_JWT_SECRET) {
            throw new Error('SYSTEM_JWT_SECRET not configured');
        }

        return jwt.sign(
            { type: 'system' },
            process.env.SYSTEM_JWT_SECRET,
            { expiresIn: '1h' }
        );
    }

    static generateAdminToken() {
        if (!process.env.ADMIN_JWT_SECRET) {
            throw new Error('ADMIN_JWT_SECRET not configured');
        }

        return jwt.sign(
            { type: 'admin' },
            process.env.ADMIN_JWT_SECRET,
            { expiresIn: '1h' }
        );
    }

    static async verifyToken(token, secret) {
        try {
            return jwt.verify(token, secret);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    static extractTokenFromHeader(req) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.split(' ')[1];
    }

    static decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            throw new Error('Invalid token format');
        }
    }
}

module.exports = JWTService; 