const crypto = require('crypto');
const UAParser = require('ua-parser-js');

/**
 * Request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
    const sanitize = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove potential XSS content
                obj[key] = obj[key]
                    .replace(/[<>]/g, '')  // Remove < and >
                    .replace(/javascript:/gi, '')  // Remove javascript: protocol
                    .replace(/data:/gi, '')  // Remove data: protocol
                    .trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
};

/**
 * Device fingerprinting middleware
 */
const deviceFingerprint = async (req, res, next) => {
    try {
        const ua = new UAParser(req.headers['user-agent']);
        const ipAddress = req.ip;
        
        // Create device fingerprint
        const fingerprint = {
            ip: ipAddress,
            userAgent: req.headers['user-agent'],
            browser: ua.getBrowser(),
            engine: ua.getEngine(),
            os: ua.getOS(),
            device: ua.getDevice(),
            headers: {
                accept: req.headers.accept,
                language: req.headers['accept-language'],
                encoding: req.headers['accept-encoding'],
                timezone: req.headers['x-timezone']
            }
        };

        // Generate hash of the fingerprint
        const fingerprintHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(fingerprint))
            .digest('hex');

        // Attach to request
        req.deviceFingerprint = {
            hash: fingerprintHash,
            details: fingerprint
        };

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
    // CORS headers will be handled by cors middleware
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Only set HSTS in production
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
};

/**
 * SQL Injection protection middleware
 */
const sqlInjectionProtection = (req, res, next) => {
    const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|WHERE)\b)|(['"])/gi;
    
    const checkForSQLInjection = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string' && sqlPattern.test(obj[key])) {
                return true;
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (checkForSQLInjection(obj[key])) return true;
            }
        }
        return false;
    };

    if (
        checkForSQLInjection(req.body) ||
        checkForSQLInjection(req.query) ||
        checkForSQLInjection(req.params)
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid input detected'
        });
    }

    next();
};

/**
 * Request size limiter middleware
 */
const requestSizeLimiter = (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'], 10);
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (contentLength > maxSize) {
        return res.status(413).json({
            status: 'error',
            message: 'Request entity too large'
        });
    }

    next();
};

/**
 * Suspicious activity detection middleware
 */
const detectSuspiciousActivity = async (req, res, next) => {
    try {
        const suspiciousPatterns = {
            headers: {
                // Suspicious user agent patterns
                userAgent: /bot|crawler|spider|hack|sqlmap|nikto|nessus/i,
                // Missing or suspicious accept headers
                accept: /^$/
            },
            // Suspicious query patterns
            query: /(union.*select|' ?or ?'|exec.*\(|eval.*\()/i,
            // Suspicious paths
            path: /\.(php|asp|aspx|jsp|cgi|env|git|sql|bak|old|backup)$/i
        };

        // Check user agent
        if (suspiciousPatterns.headers.userAgent.test(req.headers['user-agent'])) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }

        // Check query string
        if (req.query && suspiciousPatterns.query.test(JSON.stringify(req.query))) {
            return res.status(403).json({
                status: 'error',
                message: 'Invalid request'
            });
        }

        // Check path
        if (suspiciousPatterns.path.test(req.path)) {
            return res.status(404).json({
                status: 'error',
                message: 'Not found'
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sanitizeRequest,
    deviceFingerprint,
    securityHeaders,
    sqlInjectionProtection,
    requestSizeLimiter,
    detectSuspiciousActivity
}; 