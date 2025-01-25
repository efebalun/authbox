const AuthService = require('../../services/auth.service');
const EmailService = require('../../services/email.service');
const User = require('../../models/user.model');

class EmailPasswordController {
    constructor() {
        // Bind instance methods to ensure proper 'this' context
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.verifyEmail = this.verifyEmail.bind(this);
        this.requestPasswordReset = this.requestPasswordReset.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
    }

    /**
     * Register a new user with email and password
     */
    async register(req, res) {
        try {
            const { email, password, phone, displayName } = req.body;
            const tenant = req.tenant;

            console.log('Registration attempt:', {
                email,
                displayName,
                tenantId: tenant._id,
                validationSchema: tenant.validationSchema
            });

            // Validate email format
            const isValidEmail = email && email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            console.log('Email validation:', { email, isValid: isValidEmail });

            if (!isValidEmail) {
                console.log('Invalid email format');
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid email format'
                });
            }

            // Validate password strength
            const passwordPolicy = tenant.validationSchema.authMethods.emailPassword.passwordPolicy;
            console.log('Password policy:', passwordPolicy);

            const validations = {
                minLength: password.length >= passwordPolicy.minLength,
                hasLowercase: passwordPolicy.requireLowercase ? /[a-z]/.test(password) : true,
                hasUppercase: passwordPolicy.requireUppercase ? /[A-Z]/.test(password) : true,
                hasNumbers: passwordPolicy.requireNumbers ? /\d/.test(password) : true,
                hasSpecialChars: passwordPolicy.requireSpecialChars ? /[@$!%*?&]/.test(password) : true
            };

            console.log('Password validation:', validations);

            const isValidPassword = Object.values(validations).every(Boolean);
            if (!isValidPassword) {
                const failedChecks = Object.entries(validations)
                    .filter(([, valid]) => !valid)
                    .map(([check]) => check);

                console.log('Password validation failed:', failedChecks);
                return res.status(400).json({
                    status: 'error',
                    message: `Password does not meet the required strength criteria: ${failedChecks.join(', ')}`
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({
                tenantId: tenant._id,
                email
            });
            console.log('Existing user check:', { exists: !!existingUser });

            if (existingUser) {
                console.log('Email already registered');
                return res.status(400).json({
                    status: 'error',
                    message: 'Email already registered'
                });
            }

            // Create user
            const userData = {
                tenantId: tenant._id,
                email,
                password,
                displayName,
            };
            console.log('Creating user with data:', {
                ...userData,
            });

            const user = await AuthService.createUser(tenant._id, userData);
            console.log('User created:', {
                userId: user._id,
                email: user.email,
                hashedPassword: user.password
            });

            // Generate tokens
            const tokens = AuthService.generateTokens(user, tenant);
            console.log('Tokens generated successfully');

            // Send verification email if required
            let verificationToken;
            if (tenant.validationSchema.authMethods.emailPassword.emailVerification.required) {
                console.log('Email verification required, generating token');
                verificationToken = await AuthService.generateToken();
                user.authMethods.emailPassword.verificationToken = verificationToken;
                await user.save();
                // TODO: Send verification email
            }

            const response = {
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        displayName: user.displayName,
                        roles: user.roles,
                        authMethods: {
                            emailPassword: {
                                verified: user.authMethods.emailPassword.verified
                            }
                        }
                    },
                    tokens: {
                        ...tokens,
                    }
                }
            };

            if (verificationToken) {
                response.data.tokens.verificationToken = verificationToken;
            }

            res.status(201).json(response);
        } catch (error) {
            console.error('Registration error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Login with email and password
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const { tenant } = req;

            // Find user by email
            const user = await User.findOne({
                tenantId: tenant._id,
                email: email
            });
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            // Validate login attempt
            const validation = await AuthService.validateLoginAttempt(user, req.ip);
            if (!validation.allowed) {
                return res.status(401).json({
                    status: 'error',
                    message: validation.error
                });
            }

            // Verify password
            const isValid = await AuthService.verifyPassword(password, user);
            if (!isValid) {
                await AuthService.handleFailedLogin(user);
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            // Generate tokens
            const tokens = AuthService.generateTokens(user, tenant);

            // Handle successful login
            await AuthService.handleSuccessfulLogin(user, req.ip);

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        displayName: user.displayName,
                        roles: user.roles
                    },
                    tokens: {
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        type: tokens.type
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify email with token
     */
    async verifyEmail(req, res) {
        try {
            const { token } = req.params;
            const tenant = req.tenant;

            // Find user with token
            const user = await User.findOne({
                tenantId: tenant._id,
                'authMethods.emailPassword.verificationToken': token
            });

            if (!user) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid verification token'
                });
            }

            // Mark email as verified
            user.authMethods.emailPassword.verified = true;
            user.authMethods.emailPassword.verificationToken = undefined;
            user.authMethods.emailPassword.verificationTokenExpiry = undefined;
            await user.save();

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        email: user.authMethods.emailPassword.email,
                        displayName: user.displayName,
                        verified: true
                    }
                }
            });
        } catch (error) {
            console.error('Email verification error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            const tenant = req.tenant;

            // Find user by email
            const user = await User.findOne({
                tenantId: tenant._id,
                email: email
            });
            if (!user) {
                return res.status(200).json({
                    status: 'success',
                    message: 'If an account exists with this email, a password reset link has been sent'
                });
            }

            // Generate reset token
            const resetToken = await AuthService.generatePasswordResetToken();
            user.authMethods.emailPassword.resetToken = resetToken;
            user.authMethods.emailPassword.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
            await user.save();

            // Send password reset email
            await EmailService.sendPasswordResetEmail(
                user,
                resetToken,
                tenant
            );

            res.json({
                status: 'success',
                data: {
                    message: 'Password reset email sent',
                    ...(process.env.NODE_ENV === 'development' ? { resetToken } : {})
                }
            });
        } catch (error) {
            console.error('Password reset request error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to process password reset request'
            });
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            const tenant = req.tenant;

            // Find user by reset token
            const user = await User.findOne({
                tenantId: tenant._id,
                'authMethods.emailPassword.resetToken': token,
                'authMethods.emailPassword.resetTokenExpiry': { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid or expired reset token'
                });
            }

            // Validate password strength
            const validations = {
                minLength: password.length >= 6,
                hasLowercase: /[a-z]/.test(password),
                hasUppercase: /[A-Z]/.test(password),
                hasNumbers: /\d/.test(password),
                hasSpecialChars: /[!@#$%^&*]/.test(password)
            };

            if (!Object.values(validations).every(Boolean)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Password does not meet strength requirements',
                    validations
                });
            }

            // Update password
            user.password = password;
            user.authMethods.emailPassword.resetToken = undefined;
            user.authMethods.emailPassword.resetTokenExpiry = undefined;
            await user.save();

            res.json({
                status: 'success',
                message: 'Password reset successfully'
            });
        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to reset password'
            });
        }
    }
}

module.exports = new EmailPasswordController(); 