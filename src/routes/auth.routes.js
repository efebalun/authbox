const express = require('express');
const router = express.Router();

/* MIDDLEWARE */

const {
    resolveTenant,
    requireAuthMethod,
} = require('../middleware/tenant.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const {
    validateAuthMethod,
    validateRegistration,
    validateProfile
} = require('../middleware/validation.middleware');

/* CONTROLLERS */

const emailPasswordController = require('../controllers/auth/email-password.controller');
const magicLinkController = require('../controllers/auth/magic-link.controller');
const phoneSMSController = require('../controllers/auth/phone-sms.controller');
const socialController = require('../controllers/auth/social.controller');
const tokenController = require('../controllers/auth/token.controller');
const profileController = require('../controllers/auth/profile.controller');
const socialGoogleController = require('../controllers/auth/social/google.controller');

/* ROUTES */

// Apply tenant resolution to all routes
router.use(resolveTenant);

// Email + Password routes
router.post('/register/email', requireAuthMethod('emailPassword'), validateRegistration, emailPasswordController.register);
router.post('/login/email', requireAuthMethod('emailPassword'), validateAuthMethod('emailPassword'), emailPasswordController.login);
router.post('/verify-email', requireAuthMethod('emailPassword'), emailPasswordController.verifyEmail);
router.post('/reset-password/request', requireAuthMethod('emailPassword'), emailPasswordController.requestPasswordReset);
router.post('/reset-password', requireAuthMethod('emailPassword'), emailPasswordController.resetPassword);

// Magic Link routes
router.post('/magic-link/request', requireAuthMethod('magicLink'), magicLinkController.requestLink);
router.post('/magic-link/verify', requireAuthMethod('magicLink'), magicLinkController.verifyLink);

// Phone + SMS routes
router.post('/sms/request', requireAuthMethod('phoneSMS'), phoneSMSController.requestCode);
router.post('/sms/verify', requireAuthMethod('phoneSMS'), phoneSMSController.verifyCode);
router.post('/phone/change', authenticate, requireAuthMethod('phoneSMS'), phoneSMSController.changePhone);

// Social auth routes
router.get('/social', requireAuthMethod('socialAuth'), socialController.getProviders);

// Google OAuth routes
router.get('/social/google', requireAuthMethod('socialAuth'), socialGoogleController.initiate);
router.get('/social/google/callback', requireAuthMethod('socialAuth'), socialGoogleController.callback);

// Profile routes
router.get('/profile', authenticate, profileController.getProfile);
router.put('/profile', authenticate, validateProfile, profileController.updateProfile);
router.delete('/profile', authenticate, profileController.deleteAccount);

// Token routes
router.post('/token/refresh', tokenController.refresh);
router.post('/token/validate', tokenController.validate);
router.post('/token/revoke', authenticate, tokenController.revoke);

// Logout route
router.post('/logout', authenticate, tokenController.logout);

// Export router
module.exports = router; 