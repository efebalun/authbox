const { OAuth2Client } = require('google-auth-library');

class SocialGoogleService {
    constructor() {
        this.client = new OAuth2Client(
            process.env.GOOGLE_AUTH_CLIENT_ID,
            process.env.GOOGLE_AUTH_CLIENT_SECRET,
            process.env.GOOGLE_AUTH_REDIRECT_URI
        );
    }

    /**
     * Generate OAuth URL for Google authentication
     * @param {string} state - State parameter for security
     * @returns {string} Authorization URL
     */
    generateAuthUrl(state) {
        return this.client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            state: state,
            prompt: 'consent'
        });
    }

    /**
     * Get tokens from authorization code
     * @param {string} code - Authorization code
     * @returns {Promise<Object>} Tokens object
     */
    async getToken(code) {
        try {
            const { tokens } = await this.client.getToken(code);
            return tokens;
        } catch (error) {
            throw new Error(`Failed to get tokens: ${error.message}`);
        }
    }

    /**
     * Get user profile from access token
     * @param {string} accessToken - Access token
     * @returns {Promise<Object>} User profile data
     */
    async getUserProfile(accessToken) {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch user profile: ${response.statusText}`);
            }

            const profile = await response.json();
            return {
                googleId: profile.id,
                email: profile.email,
                displayName: profile.name,
                firstName: profile.given_name,
                lastName: profile.family_name,
                avatar: profile.picture,
                locale: profile.locale,
                verifiedEmail: profile.verified_email
            };
        } catch (error) {
            throw new Error(`Failed to get user profile: ${error.message}`);
        }
    }

    /**
     * Verify ID token
     * @param {string} idToken - ID token to verify
     * @returns {Promise<Object>} Token payload
     */
    async verifyIdToken(idToken) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_AUTH_CLIENT_ID
            });
            return ticket.getPayload();
        } catch (error) {
            throw new Error(`Failed to verify ID token: ${error.message}`);
        }
    }
}

// Export singleton instance
module.exports = new SocialGoogleService(); 