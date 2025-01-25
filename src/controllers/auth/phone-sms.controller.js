const AuthService = require('../../services/auth.service');
const SmsService = require('../../services/sms.service');

class PhoneSMSController {
    constructor() {
        // Bind instance methods to ensure proper 'this' context
        this.requestCode = this.requestCode.bind(this);
        this.verifyCode = this.verifyCode.bind(this);
        this.changePhone = this.changePhone.bind(this);
    }

    /**
     * Request SMS verification code
     */
    async requestCode(req, res) {
        try {
            const { phone } = req.body;
            const tenant = req.tenant;

            // Generate and send verification code
            const { user, code } = await AuthService.generateSMSCode(tenant._id, phone);

            // Send verification code
            await SmsService.sendVerificationCode(tenant._id, phone, code);

            res.json({
                status: 'success',
                message: 'Verification code sent to phone number',
                data: {
                    user: {
                        id: user._id,
                        phone: user.phone,
                        displayName: user.displayName
                    },
                    ...(process.env.NODE_ENV === 'development' ? { code } : {})
                },
            });
        } catch (error) {
            console.error('SMS code request error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Verify SMS code and authenticate user
     */
    async verifyCode(req, res) {
        try {
            const { phone, code } = req.body;
            const tenant = req.tenant;

            // Verify code and get user with tokens
            const { user, tokens } = await AuthService.verifySMSCode(
                tenant._id,
                phone,
                code
            );

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        phone: user.phone,
                        displayName: user.displayName
                    },
                    tokens
                }
            });
        } catch (error) {
            console.error('SMS code verification error:', error);
            res.status(401).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Change phone number
     */
    async changePhone(req, res) {
        try {
            const { phone } = req.body;
            const tenant = req.tenant;
            const userId = req.user.id;

            // Update phone number and send verification code
            const { user, code } = await AuthService.updatePhone(tenant._id, userId, phone);
            await SmsService.sendVerificationCode(tenant._id, phone, code);

            res.json({
                status: 'success',
                message: 'Verification code sent to new phone number',
                data: {
                    user: {
                        id: user._id,
                        phone: user.phone,
                        displayName: user.displayName
                    },
                },
            });
        } catch (error) {
            console.error('Phone number change error:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

module.exports = new PhoneSMSController();