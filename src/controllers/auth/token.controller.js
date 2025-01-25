const AuthService = require('../../services/auth.service');

class TokenController {
    constructor() {
        // Bind instance methods to ensure proper 'this' context
        this.refresh = this.refresh.bind(this);
        this.validate = this.validate.bind(this);
        this.revoke = this.revoke.bind(this);
        this.logout = this.logout.bind(this);
    }

    /**
     * Refresh access token using refresh token
     */
    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            const tenant = req.tenant;

            // Validate refresh token and generate new tokens
            const tokens = await AuthService.refreshTokens(refreshToken, tenant);

            res.json({
                status: 'success',
                data: {
                    tokens
                }
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Validate access token
     */
    async validate(req, res) {
        try {
            const { accessToken } = req.body;
            const tenant = req.tenant;

            // Validate token and get user info
            const user = await AuthService.validateToken(accessToken, tenant);

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        displayName: user.displayName
                    }
                }
            });
        } catch (error) {
            console.error('Token validation error:', error);
            res.status(401).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Revoke refresh token
     */
    async revoke(req, res) {
        try {
            const { token } = req.body;
            const tenant = req.tenant;

            // Revoke refresh token
            await AuthService.revokeToken(token, tenant);

            res.json({
                status: 'success',
                message: 'Token revoked successfully'
            });
        } catch (error) {
            console.error('Token revocation error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Logout user and revoke tokens
     */
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            const tenant = req.tenant;
            const accessToken = req.headers.authorization?.split(' ')[1];

            // Revoke both access and refresh tokens if provided
            const promises = [];
            if (refreshToken) {
                promises.push(AuthService.revokeToken(refreshToken, tenant));
            }
            if (accessToken) {
                promises.push(AuthService.revokeToken(accessToken, tenant));
            }

            if (promises.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No tokens provided for revocation'
                });
            }

            await Promise.all(promises);

            res.json({
                status: 'success',
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

module.exports = new TokenController(); 