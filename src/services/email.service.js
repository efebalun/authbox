const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

class EmailService {
    constructor() {
        if (process.env.NODE_ENV === 'development') {
            // Mock transporter for testing
            this.transporter = {
                sendMail: async () => ({ messageId: 'test-message-id' })
            };
        } else {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_PORT === '465',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        }
    }

    /**
     * Send email using tenant's template and settings
     */
    async sendEmail(to, subject, template, data, tenant) {
        try {
            // Use tenant's email settings if available, otherwise use system default
            const fromEmail = tenant.emailSettings?.fromEmail || process.env.EMAIL_FROM;
            
            // Compile template with handlebars
            const compiledTemplate = handlebars.compile(template);
            const html = compiledTemplate(data);

            const mailOptions = {
                from: fromEmail,
                to,
                subject,
                html
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(user, verificationToken, tenant) {
        const template = tenant.emailSettings?.templates?.emailVerification || this.getDefaultVerificationTemplate();
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        return this.sendEmail(
            user.email,
            'Verify your email address',
            template,
            {
                name: user.profile?.firstName || user.email,
                tenant: tenant.name,
                verificationUrl,
            },
            tenant
        );
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(user, resetToken, tenant) {
        const template = tenant.emailSettings?.templates?.resetPassword || this.getDefaultResetTemplate();
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        return this.sendEmail(
            user.email,
            'Reset your password',
            template,
            {
                name: user.profile?.firstName || user.email,
                tenant: tenant.name,
                resetUrl,
            },
            tenant
        );
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(user, tenant) {
        const template = tenant.emailSettings?.templates?.welcome || this.getDefaultWelcomeTemplate();
        const loginUrl = `${process.env.FRONTEND_URL}/login`;

        return this.sendEmail(
            user.email,
            `Welcome to ${tenant.name}`,
            template,
            {
                name: user.profile?.firstName || user.email,
                tenant: tenant.name,
                loginUrl,
            },
            tenant
        );
    }

    /**
     * Send magic link email
     */
    async sendMagicLinkEmail(user, tenant, token) {
        const template = tenant.emailSettings?.templates?.magicLink || this.getDefaultMagicLinkTemplate();
        const magicLinkUrl = `${process.env.FRONTEND_URL}/magic-link?token=${token}`;

        return this.sendEmail(
            user.email,
            'Magic Link',
            template,
            {
                name: user.profile?.firstName || user.email,
                tenant: tenant.name,
                magicLinkUrl,
            },
            tenant
        );
    }

    /**
     * Default templates
     */
    getDefaultVerificationTemplate() {
        return `
            <h1>Verify your email address</h1>
            <p>Hi {{name}},</p>
            <p>Please verify your email address by clicking the link below:</p>
            <p><a href="{{verificationUrl}}">Verify Email</a></p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Thanks,<br>{{tenant}} Team</p>
        `;
    }

    getDefaultResetTemplate() {
        return `
            <h1>Reset your password</h1>
            <p>Hi {{name}},</p>
            <p>You requested to reset your password. Click the link below to set a new password:</p>
            <p><a href="{{resetUrl}}">Reset Password</a></p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Thanks,<br>{{tenant}} Team</p>
        `;
    }

    getDefaultWelcomeTemplate() {
        return `
            <h1>Welcome to {{tenant}}</h1>
            <p>Hi {{name}},</p>
            <p>Thank you for joining {{tenant}}. We're excited to have you on board!</p>
            <p>You can now login to your account at: <a href="{{loginUrl}}">{{loginUrl}}</a></p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>{{tenant}} Team</p>
        `;
    }

    getDefaultMagicLinkTemplate() {
        return `
            <h1>Magic Link</h1>
            <p>Hi {{name}},</p>
            <p>Click the link below to login to your account:</p>
            <p><a href="{{magicLinkUrl}}">Login</a></p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Thanks,<br>{{tenant}} Team</p>
        `;
    }
}

module.exports = new EmailService(); 