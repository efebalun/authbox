const Tenant = require('../../models/tenant.model');
const User = require('../../models/user.model');
const SystemSettings = require('../../models/system-settings.model');
const DefaultTemplatesService = require('../../services/default-templates.service');
const JWTService = require('../../services/jwt.service');

/**
 * Generate a system token
 */
const generateSystemToken = async (req, res, next) => {
    try {
        const { secret } = req.body;

        if (!secret || secret !== process.env.SYSTEM_API_SECRET) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid system API secret'
            });
        }

        const token = await JWTService.generateSystemToken();

        res.json({
            status: 'success',
            data: {
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get system stats
 */
const getSystemStats = async (req, res, next) => {
    try {
        const [tenantCount, userCount] = await Promise.all([
            Tenant.countDocuments(),
            User.countDocuments()
        ]);

        res.json({
            status: 'success',
            data: {
                stats: {
                    tenants: tenantCount,
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
 * Get system logs
 */
const getSystemLogs = async (req, res, next) => {
    try {
        const { startDate, endDate, level } = req.query;

        // TODO: Implement actual log retrieval logic
        res.json({
            status: 'success',
            data: {
                logs: []
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get system settings
 */
const getSettings = async (req, res, next) => {
    try {
        let settings = await SystemSettings.findOne();

        if (!settings) {
            const defaultTemplates = await DefaultTemplatesService.getDefaultTemplates();
            settings = await SystemSettings.create({
                maintenance: {
                    isEnabled: false,
                    message: 'System is operational'
                },
                defaultTenantSettings: {
                    features: {
                        registration: true,
                        login: true,
                        passwordReset: true,
                        userMetadata: true,
                        customBranding: false,
                        apiKeys: false,
                        webhooks: false
                    }
                },
                emailTemplates: {
                    welcome: {
                        subject: 'Welcome to our platform',
                        body: 'Thank you for joining our platform. We are excited to have you on board!',
                        defaultLocale: 'en'
                    },
                    resetPassword: {
                        subject: 'Password Reset Request',
                        body: 'You have requested to reset your password. Click the link below to proceed.',
                        defaultLocale: 'en'
                    },
                    emailVerification: {
                        subject: 'Verify Your Email',
                        body: 'Please verify your email address by clicking the link below.',
                        defaultLocale: 'en'
                    }
                },
                security: {
                    maxTenantsPerIP: 5,
                    maxUsersPerTenant: 1000,
                    allowedOrigins: [],
                    rateLimits: {
                        tenantCreation: 10,
                        userRegistration: 100
                    }
                },
                billing: {
                    currency: 'USD',
                    freeTier: {
                        enabled: true,
                        maxUsers: 5
                    }
                }
            });
        }

        res.json({
            status: 'success',
            settings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update system settings
 */
const updateSettings = async (req, res, next) => {
    try {
        const settings = await SystemSettings.findOneAndUpdate(
            {},
            req.body,
            { new: true, upsert: true, runValidators: true }
        );

        res.json({
            status: 'success',
            data: {
                settings
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get email templates
 */
const getEmailTemplates = async (req, res, next) => {
    try {
        const settings = await SystemSettings.findOne();
        res.json({
            status: 'success',
            data: {
                templates: settings.emailTemplates
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update email templates
 */
const updateEmailTemplates = async (req, res, next) => {
    try {
        const settings = await SystemSettings.findOne();
        if (!settings) {
            return res.status(404).json({
                status: 'error',
                message: 'System settings not found'
            });
        }

        settings.emailTemplates = {
            ...settings.emailTemplates,
            ...req.body
        };

        await settings.save();

        res.json({
            status: 'success',
            data: {
                templates: settings.emailTemplates
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Trigger system backup
 */
const triggerBackup = async (req, res, next) => {
    try {
        // TODO: Implement actual backup logic
        res.json({
            status: 'success',
            data: {
                message: 'Backup initiated successfully'
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generateSystemToken,
    getSettings,
    updateSettings,
    getEmailTemplates,
    updateEmailTemplates,
    getSystemStats,
    getSystemLogs,
    triggerBackup,
}; 