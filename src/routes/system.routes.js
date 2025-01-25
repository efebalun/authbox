const express = require('express');
const router = express.Router();

/* MIDDLEWARE */

const { authenticateSystem } = require('../middleware/system.middleware');
const { createRateLimiter } = require('../middleware/rate-limit.middleware');

// Rate limiters
const tenantRateLimiter = createRateLimiter({ points: 10, duration: 60, type: 'tenant' });
const settingsRateLimiter = createRateLimiter({ points: 100, duration: 60, type: 'settings' });

/* CONTROLLERS */

const coreController = require('../controllers/system/core.controller');
const tenantController = require('../controllers/system/tenant.controller');

/* ROUTES */

// System token
router.post('/token', coreController.generateSystemToken);

// System settings
router.get('/settings', authenticateSystem, settingsRateLimiter, coreController.getSettings);
router.put('/settings', authenticateSystem, settingsRateLimiter, coreController.updateSettings);

// Email templates
router.get('/email-templates', authenticateSystem, coreController.getEmailTemplates);
router.put('/email-templates', authenticateSystem, coreController.updateEmailTemplates);

// System statistics
router.get('/stats', authenticateSystem, coreController.getSystemStats);

// System maintenance
router.get('/logs', authenticateSystem, coreController.getSystemLogs);
router.post('/backup', authenticateSystem, coreController.triggerBackup);

// Tenant management
router.post('/tenants', authenticateSystem, tenantRateLimiter, tenantController.createTenant);
router.get('/tenants', authenticateSystem, tenantRateLimiter, tenantController.listTenants);
router.get('/tenants/:id', authenticateSystem, tenantRateLimiter, tenantController.getTenant);
router.put('/tenants/:id', authenticateSystem, tenantRateLimiter, tenantController.updateTenant);
router.delete('/tenants/:id', authenticateSystem, tenantRateLimiter, tenantController.deactivateTenant);
router.get('/tenants/:id/stats', authenticateSystem, tenantController.getTenantStats);

// User management
router.get('/tenants/:id/users', authenticateSystem, tenantRateLimiter, tenantController.listTenantUsers);
router.delete('/tenants/:id/users', authenticateSystem, tenantRateLimiter, tenantController.deleteTenantUsers);
router.put('/tenants/:id/users/:userId', authenticateSystem, tenantRateLimiter, tenantController.updateTenantUser);

// Validation schema
router.get('/tenants/:tenantId/validation-schema', authenticateSystem, tenantController.getValidationSchema);
router.post('/tenants/:tenantId/validation-schema', authenticateSystem, tenantController.updateValidationSchema);
router.put('/tenants/:tenantId/validation-schema', authenticateSystem, tenantController.updateValidationSchema);

// Export router
module.exports = router; 