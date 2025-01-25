const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Tenant = require('../models/tenant.model');
const { ValidationSchema } = require('../models/validation-schema.model');
const jwtService = require('./jwt.service');

class AuthService {
    /**
     * Hash a password
     */
    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    /**
     * Verify password
     */
    static async verifyPassword(password, user) {
        try {
            console.log('Verifying password:', {
                hasPassword: !!user.password,
                passwordLength: password?.length,
                storedPasswordLength: user.password?.length
            });
            const isValid = await user.comparePassword(password);
            console.log('Password verification result:', { isValid });
            return isValid;
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }

    /**
     * Generate a password reset token
     */
    static async generatePasswordResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Generate JWT tokens for a user
     */
    static generateTokens(user, tenant) {
        return jwtService.generateAuthToken(user._id, tenant.jwtSecret);
    }

    /**
     * Generate a random token/code
     */
    static async generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate a magic link token
     */
    static async generateMagicLinkToken(tenantId, { email, phone }) {
        // Check if email or phone is provided
        if (!email && !phone) {
            throw new Error('Email or phone is required');
        }

        // Find or create user by email or phone
        let user;
        const checkUser = await User.findOne({
            tenantId,
            $or: [
                { email },
                { phone }
            ]
        });
        if (!checkUser) {
            if (email) {
                user = await this.createUser(tenantId, {
                    tenantId,
                    email,
                });
            } else if (phone) {
                user = await this.createUser(tenantId, {
                    tenantId,
                    phone,
                });
            }
        } else {
            user = checkUser;
        }

        // Save token to user
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
        user.authMethods.magicLink.verificationToken = token;
        user.authMethods.magicLink.verificationTokenExpiry = expiry;
        await user.save();

        return {
            user,
            token
        };
    }

    /**
     * Verify a magic link token
     */
    static async verifyMagicLinkToken(tenantId, token) {
        // Check if token is provided
        if (!token) {
            throw new Error('Token is required');
        }

        // Find user by token
        const user = await User.findOne({
            tenantId,
            'authMethods.magicLink.verificationToken': token
        });
        if (!user) {
            throw new Error('Invalid magic link token');
        }

        // Check if token has expired
        const currentTime = new Date();
        if (
            user.authMethods.magicLink.verificationTokenExpiry
            && currentTime > user.authMethods.magicLink.verificationTokenExpiry
        ) {
            throw new Error('Magic link token has expired');
        }

        // Get tenant
        const tenant = await Tenant.findOne({ _id: tenantId });
        if (!tenant) {
            throw new Error('Tenant not found');
        }

        // Generate tokens
        const tokens = this.generateTokens(user, tenant);
        if (!tokens) {
            throw new Error('Failed to generate tokens');
        }

        // Reset magic link token
        user.authMethods.magicLink.verificationToken = null;
        user.authMethods.magicLink.verificationTokenExpiry = null;
        await user.save();

        // Return user and tokens
        return {
            user,
            tokens
        };
    }

    /**
     * Generate a numeric code for SMS
     */
    static generateNumericCode(length = 6) {
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        return Math.floor(Math.random() * (max - min + 1) + min).toString();
    }

    /**
     * Generate a verification code for SMS
     */
    static async generateSMSCode(tenantId, phone) {
        // Check phone number is valid
        if (!phone) {
            throw new Error('Invalid phone number');
        }

        // Find or create user by phone
        let user;
        const checkUser = await User.findOne({
            tenantId,
            phone
        });
        if (!checkUser) {
            user = await this.createUser(tenantId, {
                tenantId,
                phone,
            });
        } else {
            user = checkUser;
        }

        // Save code to user
        const code = this.generateNumericCode();
        const expiry = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes
        user.authMethods.phoneSMS.verificationCode = code;
        user.authMethods.phoneSMS.verificationCodeExpiry = expiry;
        await user.save();

        return {
            user,
            code
        };
    }

    /**
     * Verify an SMS code
     */
    static async verifySMSCode(tenantId, phone, code) {
        // Check if code is provided
        if (!code) {
            throw new Error('Code is required');
        }

        // Find user by phone
        const user = await User.findOne({
            tenantId,
            phone,
            'authMethods.phoneSMS.verificationCode': code
        });
        if (!user) {
            throw new Error('User not found');
        }

        // Check if code has expired
        const currentTime = new Date();
        if (
            user.authMethods.phoneSMS.verificationCodeExpiry
            && currentTime > user.authMethods.phoneSMS.verificationCodeExpiry
        ) {
            throw new Error('SMS code has expired');
        }

        // Get tenant
        const tenant = await Tenant.findOne({ _id: tenantId });
        if (!tenant) {
            throw new Error('Tenant not found');
        }

        // Generate tokens
        const tokens = this.generateTokens(user, tenant);
        if (!tokens) {
            throw new Error('Failed to generate tokens');
        }

        // Reset SMS code
        user.authMethods.phoneSMS.verified = true;
        user.authMethods.phoneSMS.verificationCode = null;
        user.authMethods.phoneSMS.verificationCodeExpiry = null;
        await user.save();

        // Return user and tokens
        return { user, tokens };
    }

    /**
     * Check if a user is allowed to login
     */
    static async validateLoginAttempt(user, ip) {
        if (!user) return { allowed: false, error: 'Invalid credentials' };
        if (user.status !== 'active') return { allowed: false, error: 'Account is not active' };
        const failedAttempts = user.security?.failedLoginAttempts || 0;
        if (failedAttempts >= 5) return { allowed: false, error: 'Account is locked due to too many failed attempts' };

        return { allowed: true };
    }

    /**
     * Handle successful login
     */
    static async handleSuccessfulLogin(user, ip) {
        // Reset failed login attempts and update login info
        user.security = {
            ...user.security,
            failedLoginAttempts: 0,
            lastSuccessfulLogin: new Date(),
            lastIp: ip
        };
        await user.save();
    }

    /**
     * Handle failed login
     */
    static async handleFailedLogin(user) {
        // Increment failed login attempts
        user.security = {
            ...user.security,
            failedLoginAttempts: (user.security?.failedLoginAttempts || 0) + 1,
            lastFailedLogin: new Date()
        };
        await user.save();
    }

    /**
     * Refresh access and refresh tokens
     */
    static async refreshTokens(refreshToken, tenant) {
        try {
            // Verify the refresh token
            const decoded = await jwtService.verifyToken(refreshToken, tenant.jwtSecret);
            if (!decoded || decoded.type !== 'refresh') {
                throw new Error('Invalid refresh token');
            }

            // Find the user
            const user = await User.findOne({ _id: decoded.userId, tenantId: tenant._id });
            if (!user) {
                throw new Error('User not found');
            }

            // Generate new tokens with explicit types
            const tokens = await jwtService.generateAuthToken(decoded.userId, tenant.jwtSecret, {
                expiresIn: '1h',
                refreshExpiresIn: '7d'
            });

            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                type: 'Bearer'
            };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * Validate access token
     */
    static async validateToken(accessToken, tenant) {
        try {
            // Verify the refresh token
            const decoded = await jwtService.verifyToken(accessToken, tenant.jwtSecret);
            if (!decoded || decoded.type !== 'access') {
                throw new Error('Invalid access token');
            }

            // Find the user
            const user = await User.findOne({ _id: decoded.userId, tenantId: tenant._id });
            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            throw new Error('Invalid access token');
        }
    }

    /**
     * Revoke a refresh token
     * In a production environment, you would typically blacklist the token
     */
    static async revokeToken(token, tenant) {
        try {
            // Verify the token
            const decoded = await jwtService.verifyToken(token, tenant.jwtSecret);

            // Check the token type
            if (decoded.type === 'access') {
                console.log('Revoking access token');
                // Handle access token revocation logic here
            } else if (decoded.type === 'refresh') {
                console.log('Revoking refresh token');
                // Handle refresh token revocation logic here
            } else {
                throw new Error('Unknown token type');
            }

            /* TODO: Implement token revocation logic */
            /* In a production environment, you would add the token to a blacklist here */

            return true;
        } catch (error) {
            console.error('Token revocation error:', error);
            // Don't throw an error for invalid tokens during logout
            return true;
        }
    }

    /**
     * Get user profile
     */
    static async getUserProfile(tenantId, userId) {
        const user = await User.findOne({ _id: userId, tenantId });
        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            profile: Object.fromEntries(user.profile || new Map()) // Convert Map to plain object
        };
    }

    /**
     * Update user profile
     */
    static async updateUserProfile(tenantId, userId, updates) {
        const user = await User.findOne({
            _id: userId,
            tenantId
        });
        if (!user) {
            throw new Error('User not found');
        }

        // Get tenant validation schema
        const getValidationSchema = await ValidationSchema.findOne({ tenantId });
        if (!getValidationSchema) {
            throw new Error('Validation rules not found');
        }
        console.log('getValidationSchema', getValidationSchema);

        // Update allowed fields
        if (updates.displayName) user.displayName = updates.displayName;
        if (updates.profile) {
            if (!user.profile) {
                user.profile = new Map();
            }
            Object.entries(updates.profile).forEach(([key, value]) => {
                user.profile.set(key, value);
            });
        }

        await user.save();
        return this.getUserProfile(tenantId, userId);
    }

    /**
     * Update user password
     */
    static async updatePassword(user, newPassword) {
        user.password = newPassword;
        await user.save();
    }

    /**
     * Create a new user
     */
    static async createUser(tenantId, data) {
        // User data
        const userData = {
            tenantId: data.tenantId || tenantId,
            roles: ['user'],
            status: 'active',
        };
        if (data.email) {
            userData.email = data.email;
        }
        if (data.password) {
            userData.password = data.password;
        }
        if (data.phone) {
            userData.phone = data.phone;
        }
        if (data.displayName) {
            userData.displayName = data.displayName;
        }
        if (data.authMethods) {
            if (data.authMethods.emailPassword) {
                userData.authMethods.emailPassword = data.authMethods.emailPassword;
            }
            if (data.authMethods.phoneSMS) {
                userData.authMethods.phoneSMS = data.authMethods.phoneSMS;
            }
        }

        // Create user with auth method data
        const user = new User(userData);

        await user.save();
        return user;
    }

    /**
     * Find user by auth method
     */
    static async findUserByAuth(tenantId, method, identifier) {
        const query = { tenantId };

        switch (method) {
            case 'emailPassword':
                query['authMethods.emailPassword'] = identifier.toLowerCase();
                break;
            case 'phoneSMS':
                query['authMethods.phoneSMS.phone'] = identifier;
                break;
            case 'socialGoogle':
                query['authMethods.socialGoogle.id'] = identifier;
                break;
        }

        return User.findOne(query);
    }

    /**
     * Delete user account
     */
    static async deleteUser(tenantId, userId) {
        const user = await User.findOne({
            _id: userId,
            status: 'active',
            tenantId
        });

        if (!user) {
            throw new Error('User not found');
        }

        user.status = 'deleted';
        await user.save();
        return true;
    }
}

module.exports = AuthService; 