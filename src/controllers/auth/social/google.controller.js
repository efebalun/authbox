const crypto = require('crypto');
const AuthService = require('../../../services/auth.service');
const SocialGoogleService = require('../../../services/social/google.service');

class SocialGoogleController {
    constructor() {
        // Bind instance methods to ensure proper 'this' context
        this.initiate = this.initiate.bind(this);
        this.callback = this.callback.bind(this);
    }

    /**
     * Initiate Google OAuth flow
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async initiate(req, res) {
        try {
            const { tenant } = req;

            // Check if Google OAuth is enabled for tenant
            if (!tenant.validationSchema.authMethods.social?.google?.enabled) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Google authentication is not enabled'
                });
            }

            // Generate state parameter for security
            const state = crypto.randomBytes(32).toString('hex');
            
            // Store state in session for verification during callback
            req.session.oauthState = state;

            // Generate authorization URL
            const authUrl = SocialGoogleService.generateAuthUrl(state);

            return res.status(200).json({
                status: 'success',
                data: { authUrl }
            });
        } catch (error) {
            console.error('Google OAuth initiation error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to initiate Google authentication'
            });
        }
    }

    /**
     * Handle Google OAuth callback
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async callback(req, res) {
        try {
            const { tenant } = req;
            const { code, state } = req.query;

            // Verify state parameter
            if (!state || state !== req.session.oauthState) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid state parameter'
                });
            }

            // Clear state from session
            delete req.session.oauthState;

            // Exchange authorization code for tokens
            const tokens = await SocialGoogleService.getToken(code);

            // Get user profile
            const profile = await SocialGoogleService.getUserProfile(tokens.access_token);

            // Find or create user
            let user = await AuthService.findUserByAuth('socialGoogle', profile.googleId);

            if (!user) {
                // Create new user
                user = await AuthService.createUser(tenant._id, {
                    email: profile.email,
                    displayName: profile.displayName,
                    authMethods: {
                        socialGoogle: {
                            id: profile.googleId,
                            verified: profile.verifiedEmail
                        }
                    },
                    profile: {
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        avatar: profile.avatar,
                        locale: profile.locale
                    }
                });
            }

            // Generate authentication tokens
            const authTokens = await AuthService.generateTokens(user, tenant);

            return res.status(200).json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        displayName: user.displayName,
                        email: profile.email,
                        avatar: user.avatar
                    },
                    tokens: authTokens
                }
            });
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to complete Google authentication'
            });
        }
    }
}

module.exports = new SocialGoogleController(); 