const { ValidationSchema } = require('../models/validation-schema.model');

/**
 * Validate password against tenant's requirements
 */
const validatePassword = (password, requirements) => {
    if (!password) return 'Password is required';
    if (password.length < requirements.minLength) {
        return `Password must be at least ${requirements.minLength} characters long`;
    }
    if (requirements.requireNumbers && !/\d/.test(password)) {
        return 'Password must contain at least one number';
    }
    if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return 'Password must contain at least one special character';
    }
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }
    return null;
};

/**
 * Validate data against field rules
 */
const validateField = (value, rule) => {
    if (!value && rule.required) {
        return { isValid: false, message: rule.customMessage || `${rule.field} is required` };
    }

    if (!value && !rule.required) {
        return { isValid: true };
    }

    switch (rule.type) {
        case 'string':
            if (typeof value !== 'string') {
                return { isValid: false, message: `${rule.field} must be a string` };
            }
            if (rule.minLength && value.length < rule.minLength) {
                return { isValid: false, message: `${rule.field} must be at least ${rule.minLength} characters` };
            }
            if (rule.maxLength && value.length > rule.maxLength) {
                return { isValid: false, message: `${rule.field} must be at most ${rule.maxLength} characters` };
            }
            if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
                return { isValid: false, message: `${rule.field} format is invalid` };
            }
            if (rule.enum && !rule.enum.includes(value)) {
                return { isValid: false, message: `${rule.field} must be one of: ${rule.enum.join(', ')}` };
            }
            break;

        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return { isValid: false, message: `${rule.field} must be a valid email` };
            }
            break;

        case 'phone':
            const phoneRegex = /^\+?[\d\s-]{8,}$/;
            if (!phoneRegex.test(value)) {
                return { isValid: false, message: `${rule.field} must be a valid phone number` };
            }
            break;

        case 'file':
            if (!value.mimetype || !rule.fileTypes.includes(value.mimetype)) {
                return { isValid: false, message: `${rule.field} must be one of these types: ${rule.fileTypes.join(', ')}` };
            }
            if (rule.maxFileSize && value.size > rule.maxFileSize) {
                return { isValid: false, message: `${rule.field} must be smaller than ${rule.maxFileSize / (1024 * 1024)}MB` };
            }
            break;
    }

    return { isValid: true };
};

/**
 * Validate authentication method and fields
 */
const validateAuthMethod = (method) => {
    return (req, res, next) => {
        const tenant = req.tenant;
        if (!tenant.validationSchema?.authMethods || !tenant.validationSchema.authMethods[method]?.enabled) {
            return res.status(400).json({
                status: 'error',
                message: `Authentication method '${method}' is not enabled for this tenant`
            });
        }

        // Validate required fields based on auth method
        const errors = [];
        switch (method) {
            case 'emailPassword':
                if (!req.body.email) errors.push('Email is required');
                if (!req.body.password) errors.push('Password is required');
                break;
            case 'phone':
                if (!req.body.phone) errors.push('Phone number is required');
                break;
            case 'magicLink':
                if (!req.body.email && !req.body.phone) {
                    errors.push('Either email or phone is required for magic link');
                }
                break;
            case 'social':
                if (!req.body.provider) errors.push('Social provider is required');
                if (!req.body.token) errors.push('Social token is required');
                break;
        }

        if (errors.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors
            });
        }

        next();
    };
};

/**
 * Middleware for validating registration/profile data
 */
const validateRequest = (type) => {
    return async (req, res, next) => {
        try {
            // Get tenant's validation schema
            const validationSchema = await ValidationSchema.findOne({
                tenantId: req.tenant._id
            });

            if (!validationSchema) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Tenant validation schema not found'
                });
            }

            // For registration, validate auth method first
            if (type === 'registration') {
                const method = req.params.method || 'emailPassword';
                const validateAuth = validateAuthMethod(method);
                
                // Create a mock response object to catch auth validation errors
                const mockRes = {
                    status: (code) => ({
                        json: (data) => {
                            if (code === 400) {
                                return res.status(400).json(data);
                            }
                        }
                    })
                };
                
                // Run auth validation
                await new Promise((resolve) => {
                    validateAuth(req, mockRes, resolve);
                });

                // If password validation is needed
                if (method === 'emailPassword' && req.body.password) {
                    const passwordError = validatePassword(
                        req.body.password,
                        validationSchema.authMethods.emailPassword.passwordPolicy
                    );
                    if (passwordError) {
                        return res.status(400).json({
                            status: 'error',
                            message: 'Validation failed',
                            errors: [passwordError]
                        });
                    }
                }
            }

            // Validate custom fields
            const errors = [];
            const profile = req.body.profile || {};
            validationSchema.customFields.forEach(rule => {
                const value = profile[rule.field];
                const result = validateField(value, rule);
                if (!result.isValid) {
                    errors.push(result.message);
                }
            });

            if (errors.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    validateAuthMethod,
    validateRegistration: validateRequest('registration'),
    validateProfile: validateRequest('profile')
}; 