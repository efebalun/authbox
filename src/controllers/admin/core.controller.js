const User = require('../../models/user.model');
const JWTService = require('../../services/jwt.service');

class AdminCoreController {
    constructor() {
        this.getTenantSettings = this.getTenantSettings.bind(this);
        this.updateTenantSettings = this.updateTenantSettings.bind(this);
        this.getTenantStats = this.getTenantStats.bind(this);
        this.updateEmailTemplates = this.updateEmailTemplates.bind(this);
    }

    /**
     * Generate an admin token
     */
    async generateAdminToken(req, res, next) {
        try {
            const { secret } = req.body;
    
            if (!secret || secret !== process.env.ADMIN_API_SECRET) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid admin API secret'
                });
            }
    
            const token = await JWTService.generateAdminToken();
    
            res.json({
                status: 'success',
                data: {
                    token
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get tenant settings
     */
     async getTenantSettings(req, res) {
        try {
            // Remove sensitive data
            const tenantResponse = req.tenant.toObject();
            delete tenantResponse.jwtSecret;

            res.json({
                status: 'success',
                data: tenantResponse
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    };

    /**
     * Update tenant settings
     */
     async updateTenantSettings(req, res) {
        try {
            const { settings, features, emailSettings } = req.body;

            // Update settings
            if (settings) {
                Object.assign(req.tenant.settings, settings);
            }

            // Update features (preserving core features)
            if (features) {
                req.tenant.features = {
                    ...features,
                    registration: true,
                    login: true,
                    passwordReset: true
                };
            }

            // Update email settings
            if (emailSettings) {
                Object.assign(req.tenant.emailSettings, emailSettings);
            }

            await req.tenant.save();

            // Remove sensitive data
            const tenantResponse = req.tenant.toObject();
            delete tenantResponse.jwtSecret;

            res.json({
                status: 'success',
                data: tenantResponse
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    };

    /**
     * Get tenant statistics
     */
     async getTenantStats(req, res) {
        try {
            const stats = {
                users: {
                    total: await User.countDocuments({ tenantId: req.tenant._id }),
                    active: await User.countDocuments({ 
                        tenantId: req.tenant._id, 
                        'status.isActive': true 
                    }),
                    verified: await User.countDocuments({ 
                        tenantId: req.tenant._id, 
                        'status.isEmailVerified': true 
                    })
                },
                loginAttempts: await User.countDocuments({
                    tenantId: req.tenant._id,
                    'security.loginAttempts': { $gt: 0 }
                }),
                lockedAccounts: await User.countDocuments({
                    tenantId: req.tenant._id,
                    'security.lockedUntil': { $gt: new Date() }
                })
            };

            res.json({
                status: 'success',
                data: stats
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    };

    /**
     * Update email templates
     */
     async updateEmailTemplates(req, res) {
        try {
            const { templates } = req.body;

            if (!req.tenant.emailSettings) {
                req.tenant.emailSettings = {};
            }
            if (!req.tenant.emailSettings.templates) {
                req.tenant.emailSettings.templates = {};
            }

            Object.assign(req.tenant.emailSettings.templates, templates);
            await req.tenant.save();

            res.json({
                status: 'success',
                data: req.tenant.emailSettings.templates
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    };
}

module.exports = new AdminCoreController(); 