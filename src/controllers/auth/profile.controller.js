const AuthService = require('../../services/auth.service');

class ProfileController {
    constructor() {
        // Bind instance methods to ensure proper 'this' context
        this.getProfile = this.getProfile.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.deleteAccount = this.deleteAccount.bind(this);
    }

    /**
     * Get user profile
     */
    async getProfile(req, res) {
        try {
            const tenant = req.tenant;
            const userId = req.user.id;

            // Get user profile with custom fields
            const user = await AuthService.getUserProfile(tenant._id, userId);

            res.json({
                status: 'success',
                data: {
                    id: user._id,
                    email: user.email,
                    phone: user.phone,
                    displayName: user.displayName,
                    profile: user.profile
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(req, res) {
        try {
            const updates = req.body;
            const tenant = req.tenant;
            const userId = req.user.id;

            // Update user profile
            const user = await AuthService.updateUserProfile(tenant._id, userId, updates);

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        phone: user.phone,
                        displayName: user.displayName,
                        profile: user.profile
                    }
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Delete user account
     */
    async deleteAccount(req, res) {
        try {
            const tenant = req.tenant;
            const userId = req.user.id;

            // Delete user account
            await AuthService.deleteUser(tenant._id, userId);

            res.json({
                status: 'success',
                message: 'Account deleted successfully'
            });
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

module.exports = new ProfileController(); 