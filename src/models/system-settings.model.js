const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    maintenance: {
        isEnabled: { type: Boolean, default: false },
        message: String
    },
    defaultTenantSettings: {
        features: {
            registration: { type: Boolean, default: true },
            login: { type: Boolean, default: true },
            passwordReset: { type: Boolean, default: true },
            userMetadata: { type: Boolean, default: true },
            customBranding: { type: Boolean, default: false },
            apiKeys: { type: Boolean, default: false },
            webhooks: { type: Boolean, default: false }
        }
    },
    emailTemplates: {
        welcome: {
            subject: String,
            body: String,
            defaultLocale: { type: String, default: 'en' }
        },
        resetPassword: {
            subject: String,
            body: String,
            defaultLocale: { type: String, default: 'en' }
        },
        emailVerification: {
            subject: String,
            body: String,
            defaultLocale: { type: String, default: 'en' }
        }
    },
    security: {
        maxTenantsPerIP: { type: Number, default: 5 },
        maxUsersPerTenant: { type: Number, default: 1000 },
        allowedOrigins: [String],
        rateLimits: {
            tenantCreation: { type: Number, default: 10 }, // per day
            userRegistration: { type: Number, default: 100 } // per day per tenant
        }
    },
    billing: {
        currency: { type: String, default: 'USD' },
        freeTier: {
            enabled: { type: Boolean, default: true },
            maxUsers: { type: Number, default: 5 }
        }
    }
}, {
    timestamps: true,
    collection: 'system_settings'
});

// Ensure only one document exists
systemSettingsSchema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        if (count > 0) {
            throw new Error('Only one system settings document can exist');
        }
    }
    next();
});

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings; 