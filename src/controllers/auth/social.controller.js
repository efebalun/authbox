const AuthService = require('../../services/auth.service');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

class SocialController {
    constructor() {
        // Bind instance methods to ensure proper 'this' context
        this.getProviders = this.getProviders.bind(this);
        this.authenticate = this.authenticate.bind(this);
        this.callback = this.callback.bind(this);
    }

    /**
     * Get available social providers
     */
    async getProviders(req, res) {
        try {
            const tenant = req.tenant;
            const providers = await AuthService.getSocialProviders(tenant._id);

            res.json({
                status: 'success',
                data: {
                    providers: providers.map(p => ({
                        provider: p.provider,
                        enabled: p.enabled,
                        clientId: p.clientId
                    }))
                }
            });
        } catch (error) {
            console.error('Get providers error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Authenticate with social provider
     */
    async authenticate(req, res) {
        try {
            const { provider } = req.params;
            const tenant = req.tenant;
            const ip = req.ip;

            // Get authorization URL
            const authUrl = await AuthService.getSocialAuthUrl(tenant._id, provider);

            res.json({
                status: 'success',
                data: {
                    authUrl
                }
            });
        } catch (error) {
            console.error('Social auth error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Handle social provider callback
     */
    async callback(req, res) {
        try {
            const { provider } = req.params;
            const { code } = req.query;
            const tenant = req.tenant;
            const ip = req.ip;

            // Exchange code for tokens and get user info
            const { user, tokens } = await AuthService.handleSocialCallback(tenant._id, provider, code, ip);

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        displayName: user.displayName,
                        socialConnections: user.socialConnections
                    },
                    tokens
                }
            });
        } catch (error) {
            console.error('Social callback error:', error);
            res.status(401).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

module.exports = new SocialController(); 