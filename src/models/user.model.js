const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        trim: true,
        minlength: 6
    },
    phone: {
        type: String,
        trim: true,
        lowercase: true
    },
    displayName: {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    avatar: {
        url: String,
        publicId: String, // For cloud storage reference
        provider: {
            type: String,
            enum: ['local', 'cloudinary', 'social', null],
            default: null
        },
        updatedAt: Date
    },
    profile: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    authMethods: {
        emailPassword: {
            verified: {
                type: Boolean,
                default: false
            },
            verificationToken: String,
            verificationTokenExpiry: Date,
            resetToken: String,
            resetTokenExpiry: Date
        },
        phoneSMS: {
            verified: {
                type: Boolean,
                default: false
            },
            verificationCode: String,
            verificationCodeExpiry: Date
        },
        magicLink: {
            verificationToken: String,
            verificationTokenExpiry: Date
        },
        socialGoogle: {
            id: String,
            verified: Boolean,
            data: mongoose.Schema.Types.Mixed,
            lastLogin: Date
        },
        socialFacebook: {
            id: String,
            verified: Boolean,
            data: mongoose.Schema.Types.Mixed,
            lastLogin: Date
        },
        socialGithub: {
            id: String,
            verified: Boolean,
            data: mongoose.Schema.Types.Mixed,
            lastLogin: Date
        }
    },
    roles: {
        type: [String],
        enum: ['user', 'admin'],
        default: ['user']
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
    },
    security: {
        failedLoginAttempts: {
            type: Number,
            default: 0
        },
        lastFailedLogin: Date,
        lastSuccessfulLogin: Date,
        lastIp: String
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index(
    { tenantId: 1, email: 1 }, 
    { unique: true, sparse: true, partialFilterExpression: { email: { $type: "string" } } }
);
userSchema.index(
    { tenantId: 1, phone: 1 }, 
    { unique: true, sparse: true, partialFilterExpression: { phone: { $type: "string" } } }
);

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Update avatar from social profile
userSchema.methods.updateAvatarFromSocial = async function(provider, imageUrl) {
    if (!this.avatar?.url && imageUrl) {
        this.avatar = {
            url: imageUrl,
            provider: 'social',
            updatedAt: new Date()
        };
        await this.save();
    }
};

// Compare password
userSchema.methods.comparePassword = async function(password) {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
};

// Track failed login
userSchema.methods.trackFailedLogin = async function(ip) {
    this.security.failedLoginAttempts += 1;
    this.security.lastFailedLogin = new Date();
    this.security.lastIp = ip;
    await this.save();
};

// Reset failed login attempts
userSchema.methods.resetFailedLogins = async function(ip) {
    this.security.failedLoginAttempts = 0;
    this.security.lastSuccessfulLogin = new Date();
    this.security.lastIp = ip;
    await this.save();
};

// Generate random display name
userSchema.statics.generateDisplayName = async function(tenantId, prefix = 'user') {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const random = Math.floor(Math.random() * 10000);
        const displayName = `${prefix}${random}`;
        
        const exists = await this.exists({
            tenantId,
            displayName
        });
        
        if (!exists) {
            return displayName;
        }
        
        attempts++;
    }
    
    throw new Error('Could not generate unique display name');
};
userSchema.pre('save', async function(next) {
    if (!this.displayName) {
        this.displayName = await this.constructor.generateDisplayName(this.tenantId);
    }
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User; 