const twilio = require('twilio');

class SmsService {
    constructor() {
        if (process.env.NODE_ENV === 'development') {
            // Mock SMS service for testing
            this.client = {
                messages: {
                    create: async () => ({ sid: 'test-sid' })
                }
            };
        } else {
            this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        }
    }

    /**
     * Send an SMS message
     * @param {string} to - Recipient phone number
     * @param {string} message - Message content
     * @returns {Promise<object>} Twilio response
     */
    async sendSms(to, message) {
        try {
            const response = await this.client.messages.create({
                body: message,
                to: to,
                from: process.env.TWILIO_PHONE_NUMBER
            });
            return response;
        } catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }

    /**
     * Send verification code via SMS
     * @param {string} to - Recipient phone number
     * @param {string} code - Verification code
     * @returns {Promise<object>} Twilio response
     */
    async sendVerificationCode(to, code) {
        const message = `Your verification code is: ${code}. Valid for 10 minutes.`;
        return this.sendSms(to, message);
    }

    /**
     * Send login code via SMS
     * @param {string} to - Recipient phone number
     * @param {string} code - Login code
     * @returns {Promise<object>} Twilio response
     */
    async sendLoginCode(to, code) {
        const message = `Your login code is: ${code}. Valid for 5 minutes.`;
        return this.sendSms(to, message);
    }

    /**
     * Send password reset code via SMS
     * @param {string} to - Recipient phone number
     * @param {string} code - Reset code
     * @returns {Promise<object>} Twilio response
     */
    async sendPasswordResetCode(to, code) {
        const message = `Your password reset code is: ${code}. Valid for 15 minutes.`;
        return this.sendSms(to, message);
    }

    /**
     * Send magic link via SMS
     */
    async sendMagicLinkSMS(to, token) {
        const message = `Your magic link is: ${token}. Valid for 15 minutes.`;
        return this.sendSms(to, message);
    }
}

module.exports = new SmsService(); 