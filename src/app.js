const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { createRateLimiter } = require('./middleware/rate-limit.middleware');
const {
    sanitizeRequest,
    deviceFingerprint,
    securityHeaders,
    sqlInjectionProtection,
    requestSizeLimiter,
    detectSuspiciousActivity
} = require('./middleware/security.middleware');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const systemRoutes = require('./routes/system.routes');

const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Security middleware
app.use(requestSizeLimiter);
app.use(securityHeaders);
app.use(sanitizeRequest);
app.use(sqlInjectionProtection);
app.use(deviceFingerprint);
app.use(detectSuspiciousActivity);

// Create rate limiters
const loginRateLimiter = createRateLimiter({ points: 5, duration: 60, type: 'login' });
const registerRateLimiter = createRateLimiter({ points: 3, duration: 60, type: 'register' });
const forgotPasswordRateLimiter = createRateLimiter({ points: 3, duration: 60, type: 'forgot-password' });
const systemRateLimiter = createRateLimiter({ points: 100, duration: 60, type: 'system' });

// Apply rate limiting before routes
app.use('/auth/login', loginRateLimiter);
app.use('/auth/register', registerRateLimiter);
app.use('/auth/forgot-password', forgotPasswordRateLimiter);
app.use('/system', systemRateLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/system', systemRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Don't expose error details in production
    const message = process.env.NODE_ENV === 'production' 
        ? 'Something went wrong!'
        : err.message;

    res.status(err.status || 500).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// Database connection with retry logic
const connectWithRetry = async (uri, retries = 5, delay = 5000) => {
    try {
        if (mongoose.connection.readyState === 1) {
            return; // Already connected
        }
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        if (retries === 0) {
            console.error('MongoDB connection failed after retries:', error);
            process.exit(1);
        }
        console.log(`MongoDB connection failed. Retrying in ${delay}ms...`);
        setTimeout(() => connectWithRetry(uri, retries - 1, delay), delay);
    }
};

// Graceful shutdown
const gracefulShutdown = async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Export app and connection function
module.exports = {
    app,
    connectWithRetry
}; 