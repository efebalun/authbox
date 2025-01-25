const User = require('../../models/user.model');
const AuthService = require('../../services/auth.service');
const EmailService = require('../../services/email.service');

class AdminUsersController {
    constructor() {
        // Bind instance methods to ensure proper 'this' context
        this.listUsers = this.listUsers.bind(this);
        this.getUser = this.getUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.resetUserPassword = this.resetUserPassword.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
    }

    /**
     * List all users for a tenant
     */
    async listUsers(req, res, next) {
        try {
            const { tenant } = req;
            const { page = 1, limit = 10, search, role, status } = req.query;

            const query = { tenantId: tenant._id };
            if (search) {
                query.$or = [
                    { email: new RegExp(search, 'i') },
                    { displayName: new RegExp(search, 'i') }
                ];
            }
            if (role) query.role = role;
            if (status) query.status = status;

            const users = await User.find(query)
                .select('-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -verificationCode -verificationCodeExpiry')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort('-createdAt');

            const total = await User.countDocuments(query);

            res.json({
                status: 'success',
                data: {
                    users,
                    pagination: {
                        total,
                        page: parseInt(page),
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user details
     */
    async getUser(req, res, next) {
        try {
            const { tenant } = req;
            const { userId } = req.params;

            const user = await User.findOne({
                _id: userId,
                tenantId: tenant._id
            }).select('-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -verificationCode -verificationCodeExpiry');

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            res.json({
                status: 'success',
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user details
     */
    async updateUser(req, res, next) {
        try {
            const { tenant } = req;
            const { userId } = req.params;
            const updates = req.body;

            // Remove sensitive fields from updates
            delete updates.password;
            delete updates.verificationToken;
            delete updates.verificationTokenExpiry;
            delete updates.resetToken;
            delete updates.resetTokenExpiry;
            delete updates.verificationCode;
            delete updates.verificationCodeExpiry;

            const user = await User.findOneAndUpdate(
                { _id: userId, tenantId: tenant._id },
                updates,
                { new: true }
            ).select('-password -verificationToken -verificationTokenExpiry -resetToken -resetTokenExpiry -verificationCode -verificationCodeExpiry');

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            res.json({
                status: 'success',
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reset user's password
     */
    async resetUserPassword(req, res, next) {
        try {
            const { tenant } = req;
            const { userId } = req.params;
            const { newPassword, sendEmail = true } = req.body;

            const user = await User.findOne({
                _id: userId,
                tenantId: tenant._id
            });

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            // Update password
            await AuthService.updatePassword(user, newPassword);

            // Send email notification if requested
            if (sendEmail) {
                await EmailService.sendPasswordChangedEmail(tenant._id, user.email);
            }

            res.json({
                status: 'success',
                message: 'Password reset successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete user
     */
    async deleteUser(req, res, next) {
        try {
            const { tenant } = req;
            const { userId } = req.params;

            const user = await User.findOneAndDelete({
                _id: userId,
                tenantId: tenant._id
            });

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            res.json({
                status: 'success',
                message: 'User deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminUsersController(); 