const AuthService = require('../../services/auth.service');
const EmailService = require('../../services/email.service');
const SmsService = require('../../services/sms.service');

class MagicLinkController {
    constructor() {
        // Bind instance methods to ensure proper 'this' context
        this.requestLink = this.requestLink.bind(this);
        this.verifyLink = this.verifyLink.bind(this);
    }

    /**
     * Request a magic link for authentication
     */
    async requestLink(req, res) {
        try {
            const { email, phone } = req.body;
            const tenant = req.tenant;

            // Generate magic link token
            const { user, token } = await AuthService.generateMagicLinkToken(
                tenant._id,
                { email, phone }
            );

            // Send magic link via email or SMS
            if (email) {
                await EmailService.sendMagicLinkEmail(user, tenant, token);
            } else if (phone) {
                await SmsService.sendMagicLinkSMS(phone, token);
            }

            const data = {
                user: {
                    id: user._id,
                    email: user.email,
                    phone: user.phone,
                    displayName: user.displayName
                },
            };

            if (process.env.NODE_ENV === 'development') {
                data.token = token;
            }

            res.json({
                status: 'success',
                message: `Magic link sent to ${email || phone}`,
                data,
            });
        } catch (error) {
            console.error('Magic link request error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Verify magic link token and authenticate user
     */
    async verifyLink(req, res) {
        try {
            const { token } = req.body;
            const tenant = req.tenant;

            // Verify token and get user with tokens
            const { user, tokens } = await AuthService.verifyMagicLinkToken(
                tenant._id,
                token
            );

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        phone: user.phone,
                        displayName: user.displayName
                    },
                    tokens
                }
            });
        } catch (error) {
            console.error('Magic link verification error:', error);
            res.status(401).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

module.exports = new MagicLinkController(); 