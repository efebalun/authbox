const Tenant = require('../../models/tenant.model');
const User = require('../../models/user.model');
const { ValidationSchema } = require('../../models/validation-schema.model');
const crypto = require('crypto');

/**
 * Get tenant stats
 */
const getTenantStats = async (req, res, next) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) {
            return res.status(404).json({
                status: 'error',
                message: 'Tenant not found'
            });
        }

        const userCount = await User.countDocuments({ tenantId: tenant._id });

        res.json({
            status: 'success',
            data: {
                stats: {
                    users: userCount,
                    lastUpdated: new Date()
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List all tenants
 */
const listTenants = async (req, res, next) => {
    try {
        const tenants = await Tenant.find({}, { jwtSecret: 0 });

        res.json({
            status: 'success',
            data: {
                tenants: tenants.map(tenant => ({
                    _id: tenant._id,
                    name: tenant.name,
                    slug: tenant.slug,
                    domains: tenant.domains,
                    features: tenant.features,
                    active: tenant.active
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a specific tenant
 */
const getTenant = async (req, res, next) => {
    try {
        const tenant = await Tenant.findById(req.params.id, { jwtSecret: 0 });

        if (!tenant) {
            return res.status(404).json({
                status: 'error',
                message: 'Tenant not found'
            });
        }

        res.json({
            status: 'success',
            data: {
                tenant: {
                    _id: tenant._id,
                    name: tenant.name,
                    slug: tenant.slug,
                    domains: tenant.domains,
                    features: tenant.features,
                    active: tenant.active
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new tenant
 */
const createTenant = async (req, res, next) => {
    try {
        const { name, slug, domains, features } = req.body;

        // Generate JWT secret for tenant
        const jwtSecret = crypto.randomBytes(32).toString('hex');

        const tenant = await Tenant.create({
            name,
            slug,
            domains,
            jwtSecret,
            features
        });

        res.status(201).json({
            status: 'success',
            data: {
                tenant: {
                    _id: tenant._id,
                    name: tenant.name,
                    slug: tenant.slug,
                    domains: tenant.domains,
                    features: tenant.features,
                    active: tenant.active
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a tenant
 */
const updateTenant = async (req, res, next) => {
    try {
        const { name, domains, features } = req.body;

        const tenant = await Tenant.findByIdAndUpdate(
            req.params.id,
            { name, domains, features },
            { new: true, runValidators: true }
        );

        if (!tenant) {
            return res.status(404).json({
                status: 'error',
                message: 'Tenant not found'
            });
        }

        res.json({
            status: 'success',
            data: {
                tenant: {
                    _id: tenant._id,
                    name: tenant.name,
                    slug: tenant.slug,
                    domains: tenant.domains,
                    features: tenant.features,
                    active: tenant.active
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Deactivate a tenant
 */
const deactivateTenant = async (req, res, next) => {
    try {
        const tenant = await Tenant.findById(req.params.id);

        if (!tenant) {
            return res.status(404).json({
                status: 'error',
                message: 'Tenant not found'
            });
        }

        tenant.active = false;
        await tenant.save();

        res.json({
            status: 'success',
            message: 'Tenant deactivated successfully',
            data: {
                tenant: {
                    _id: tenant._id,
                    name: tenant.name,
                    slug: tenant.slug,
                    domains: tenant.domains,
                    features: tenant.features,
                    active: tenant.active
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List all users of a tenant
 */
const listTenantUsers = async (req, res, next) => {
    try {
        const users = await User.find({ tenantId: req.params.id }, { password: 0 });

        res.json({
            status: 'success',
            data: {
                users
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete all users of a tenant
 */
const deleteTenantUsers = async (req, res, next) => {
    try {
        await User.deleteMany({ tenantId: req.params.id });
        res.json({
            status: 'success',
            message: 'All users deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a tenant user
 */
const updateTenantUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { roles } = req.body;
        const user = await User.findByIdAndUpdate(userId, { roles }, { new: true });
        res.json({ status: 'success', data: { user } });
    } catch (error) {
        next(error);
    }
};

/**
 * Get validation schema for tenant
 */
const getValidationSchema = async (req, res, next) => {
    try {
        const tenantId = req.params.tenantId;
        const schema = await ValidationSchema.findOne({ tenantId });
        res.json({
            status: 'success',
            data: {
                schema
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create validation schema for tenant
 */
const createValidationSchema = async (req, res, next) => {
    try {
        const tenantId = req.params.tenantId;
        const { authMethods, customFields, groups, sections } = req.body;

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({
                status: 'error',
                message: 'Tenant not found'
            });
        }

        const schema = await ValidationSchema.create({
            tenantId,
            authMethods,
            customFields: customFields || [],
            groups: groups || [],
            sections: sections || []
        });

        res.status(201).json({
            status: 'success',
            data: {
                schema
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update validation schema for tenant
 */
const updateValidationSchema = async (req, res, next) => {
    try {
        const tenantId = req.params.tenantId;
        const { authMethods, customFields, groups, sections } = req.body;

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({
                status: 'error',
                message: 'Tenant not found'
            });
        }

        let schema = await ValidationSchema.findOne({ tenantId });

        if (!schema) {
            schema = await ValidationSchema.create({
                tenantId,
                authMethods: authMethods || [],
                customFields: customFields || [],
                groups: groups || [],
                sections: sections || []
            });
        } else {
            schema = await ValidationSchema.findOneAndUpdate(
                {
                    tenantId
                },
                {
                    authMethods: authMethods || [],
                    customFields: customFields || [],
                    groups: groups || [],
                    sections: sections || []
                },
                { new: true }
            );
        }

        res.json({
            status: 'success',
            data: {
                schema
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTenantStats,
    listTenants,
    getTenant,
    createTenant,
    updateTenant,
    deactivateTenant,
    listTenantUsers,
    deleteTenantUsers,
    updateTenantUser,
    getValidationSchema,
    createValidationSchema,
    updateValidationSchema
}; 