const express = require('express');
const router = express.Router();

/* MIDDLEWARE */

const { createRateLimiter } = require('../middleware/rate-limit.middleware');
const { authenticateAdmin } = require('../middleware/admin.middleware');
const { resolveTenant } = require('../middleware/tenant.middleware');

// Rate limiters
const userRateLimiter = createRateLimiter({ points: 100, duration: 60, type: 'user' });
const validationRateLimiter = createRateLimiter({ points: 50, duration: 60, type: 'validation' });
const templateRateLimiter = createRateLimiter({ points: 50, duration: 60, type: 'template' });

/* CONTROLLERS */

const coreController = require('../controllers/admin/core.controller');
const usersController = require('../controllers/admin/users.controller');
const validationController = require('../controllers/admin/validation.controller');
const fieldTemplateController = require('../controllers/admin/field-template.controller');

/* ROUTES */

// Apply tenant resolution to all routes
router.use(resolveTenant);

// Admin token
router.post('/token', coreController.generateAdminToken);

// User management routes
router.get('/users', authenticateAdmin, userRateLimiter, usersController.listUsers);
router.get('/users/:userId', authenticateAdmin, userRateLimiter, usersController.getUser);
router.put('/users/:userId', authenticateAdmin, userRateLimiter, usersController.updateUser);
router.post('/users/:userId/reset-password', authenticateAdmin, userRateLimiter, usersController.resetUserPassword);
router.delete('/users/:userId', authenticateAdmin, userRateLimiter, usersController.deleteUser);

// Validation schema routes
router.get('/validation-schema', authenticateAdmin, validationRateLimiter, validationController.getSchema);
router.post('/validation-schema/fields', authenticateAdmin, validationRateLimiter, validationController.addCustomField);
router.put('/validation-schema/auth-methods', authenticateAdmin, validationRateLimiter, validationController.updateAuthMethods);

// Field template routes
router.get('/templates', authenticateAdmin, templateRateLimiter, fieldTemplateController.listTemplates);
router.post('/templates', authenticateAdmin, templateRateLimiter, fieldTemplateController.createTemplate);
router.get('/templates/:templateId', authenticateAdmin, templateRateLimiter, fieldTemplateController.getTemplate);
router.put('/templates/:templateId', authenticateAdmin, templateRateLimiter, fieldTemplateController.updateTemplate);
router.post('/templates/:templateId/apply', authenticateAdmin, templateRateLimiter, fieldTemplateController.applyTemplate);
router.delete('/templates/:templateId', authenticateAdmin, templateRateLimiter, fieldTemplateController.deleteTemplate);

// Export router
module.exports = router; 