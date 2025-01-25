const mongoose = require('mongoose');

const socialProviderSchema = new mongoose.Schema({
    provider: {
        type: String,
        enum: ['google', 'facebook', 'github', 'apple'],
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    clientSecret: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        default: false
    }
});

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    domains: [{
        type: String,
        required: true
    }],
    jwtSecret: {
        type: String,
        required: true
    },
    features: {
        // Core features (cannot be disabled)
        registration: { type: Boolean, default: true, immutable: true },
        login: { type: Boolean, default: true, immutable: true },
        passwordReset: { type: Boolean, default: true, immutable: true },
        
        // Optional features
        userMetadata: { type: Boolean, default: true },
        customBranding: { type: Boolean, default: false },
        apiKeys: { type: Boolean, default: false },
        webhooks: { type: Boolean, default: false }
    },
    settings: {
        emailVerificationRequired: { type: Boolean, default: true },
        allowedLoginAttempts: { type: Number, default: 5 },
        lockoutDuration: { type: Number, default: 15 }, // minutes
        sessionDuration: { type: Number, default: 30 }, // days
    },
    branding: {
        logo: String,
        colors: {
            primary: String,
            secondary: String
        }
    },
    emailSettings: {
        fromEmail: String,
        templates: {
            welcome: String,
            resetPassword: String,
            emailVerification: String
        }
    },
    socialProviders: [socialProviderSchema],
    active: {
        type: Boolean,
        default: true
    },
    validationSchema: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ValidationSchema'
    }
}, {
    timestamps: true
});

// Indexes
tenantSchema.index({ slug: 1 });
tenantSchema.index({ domains: 1 });

// Methods
tenantSchema.methods.validatePassword = function(password) {
    const { minLength, requireNumbers, requireSpecialChars } = this.settings.passwordPolicy;
    
    if (password.length < minLength) return false;
    if (requireNumbers && !/\d/.test(password)) return false;
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    
    return true;
};

// Feature check methods
tenantSchema.methods.isFeatureEnabled = function(featureName) {
    return this.features[featureName] === true;
};

tenantSchema.methods.requiresEmailVerification = function() {
    return this.isFeatureEnabled('emailVerification') && this.settings.emailVerificationRequired;
};

tenantSchema.methods.isSocialAuthEnabled = function(provider) {
    if (!this.isFeatureEnabled('socialAuth')) return false;
    const socialProvider = this.socialProviders.find(p => p.provider === provider);
    return socialProvider && socialProvider.enabled;
};

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant; 