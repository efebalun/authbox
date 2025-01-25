const Tenant = require('../models/tenant.model');
const { ValidationSchema } = require('../models/validation-schema.model');

/**
 * Resolves tenant based on domain, tenant ID, or tenant slug from headers
 */
const resolveTenant = async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const tenantSlug = req.headers['x-tenant-slug'];
        const host = req.get('host');

        // Check if tenant ID is required
        if (!tenantId && !tenantSlug && !host) {
            return res.status(400).json({
                status: 'error',
                message: 'Tenant ID is required'
            });
        }

        let tenant;
        if (tenantId) {
            if (!tenantId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid tenant ID'
                });
            }
            tenant = await Tenant.findById(tenantId);
        } else if (tenantSlug) {
            tenant = await Tenant.findOne({ slug: tenantSlug });
        } else if (host) {
            const domain = host.split(':')[0];
            tenant = await Tenant.findOne({ domains: domain });
        }

        if (!tenant) {
            return res.status(400).json({
                status: 'error',
                message: 'Tenant not found'
            });
        }

        // Fetch validation schema
        const validationSchema = await ValidationSchema.findOne({ tenantId: tenant._id });
        if (validationSchema) {
            tenant.validationSchema = validationSchema;
        }

        req.tenant = tenant;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Checks if a specific feature is enabled for the tenant
 */
const requireFeature = (featureName) => {
    return async (req, res, next) => {
        if (!req.tenant) {
            return res.status(500).json({
                status: 'error',
                message: 'Tenant not resolved'
            });
        }

        if (!req.tenant.isFeatureEnabled(featureName)) {
            return res.status(403).json({
                status: 'error',
                message: `Feature '${featureName}' is not enabled for this tenant`
            });
        }

        next();
    };
};

/**
 * Checks if a specific auth method is enabled for the tenant
 */
const requireAuthMethod = (methodName) => {
    return async (req, res, next) => {
        if (!req.tenant) {
            return res.status(500).json({
                status: 'error',
                message: 'Tenant not resolved'
            });
        }

        // Find validation schema
        const validationSchema = await ValidationSchema.findOne({ tenantId: req.tenant._id });
        if (!validationSchema) {
            return res.status(403).json({
                status: 'error',
                message: 'Validation schema not found'
            });
        }

        if (!validationSchema.isAuthMethodEnabled(methodName)) {
            return res.status(403).json({
                status: 'error',
                message: `Auth method '${methodName}' is not enabled for this tenant`
            });
        }

        next();
    };
};
/**
 * Checks if social authentication is enabled for the specific provider
 */
const requireSocialAuth = (provider) => {
    return async (req, res, next) => {
        if (!req.tenant) {
            return res.status(500).json({
                status: 'error',
                message: 'Tenant not resolved'
            });
        }

        if (!req.tenant.isSocialAuthEnabled(provider)) {
            return res.status(403).json({
                status: 'error',
                message: `Social authentication with '${provider}' is not enabled for this tenant`
            });
        }

        next();
    };
};

/**
 * Middleware to check email verification requirement
 */
const checkEmailVerification = async (req, res, next) => {
    if (!req.tenant) {
        return res.status(500).json({
            status: 'error',
            message: 'Tenant not resolved'
        });
    }

    // Set email verification requirement in request
    req.requiresEmailVerification = req.tenant.requiresEmailVerification();
    next();
};

module.exports = {
    resolveTenant,
    requireFeature,
    requireAuthMethod,
    requireSocialAuth,
    checkEmailVerification
}; 