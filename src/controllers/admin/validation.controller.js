const { ValidationSchema } = require('../../models/validation-schema.model');

class AdminValidationController {
    constructor() {
        // Bind instance methods to ensure proper 'this' context
        this.getSchema = this.getSchema.bind(this);
        this.addCustomField = this.addCustomField.bind(this);
        this.updateAuthMethods = this.updateAuthMethods.bind(this);
    }

    /**
     * Get validation schema for tenant
     */
    async getSchema(req, res, next) {
        try {
            const { tenant } = req;

            let schema = await ValidationSchema.findOne({ tenantId: tenant._id });

            if (!schema) {
                schema = await ValidationSchema.create({
                    tenantId: tenant._id,
                    authMethods: {
                        emailPassword: {
                            enabled: true,
                            passwordPolicy: {
                                minLength: 6,
                                requireUppercase: true,
                                requireLowercase: true,
                                requireNumbers: true,
                                requireSpecialChars: true
                            }
                        }
                    }
                });
            }

            res.json({
                status: 'success',
                data: schema
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Add custom field to validation schema
     */
    async addCustomField(req, res, next) {
        try {
            const { tenant } = req;
            const { field, type, label, required, options } = req.body;

            const schema = await ValidationSchema.findOne({ tenantId: tenant._id });

            if (!schema) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Validation schema not found'
                });
            }

            // Add custom field
            schema.customFields.push({
                field,
                type,
                label,
                required: required || false,
                options: options || {}
            });

            await schema.save();

            res.status(201).json({
                status: 'success',
                data: schema
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update auth methods configuration
     */
    async updateAuthMethods(req, res, next) {
        try {
            const { tenant } = req;
            const updates = req.body;

            const schema = await ValidationSchema.findOne({ tenantId: tenant._id });

            if (!schema) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Validation schema not found'
                });
            }

            // Update auth methods
            schema.authMethods = {
                ...schema.authMethods,
                ...updates
            };

            await schema.save();

            res.json({
                status: 'success',
                data: schema
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminValidationController(); 