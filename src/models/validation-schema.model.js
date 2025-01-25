const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
    field: {
        type: String,
        required: true
    },
    operator: {
        type: String,
        enum: ['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty'],
        required: true
    },
    value: mongoose.Schema.Types.Mixed,
    logic: {
        type: String,
        enum: ['and', 'or'],
        default: 'and'
    }
}, { _id: false });

const validationRuleSchema = new mongoose.Schema({
    field: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'date', 'email', 'phone', 'url', 'image'],
        required: true
    },
    required: {
        type: Boolean,
        default: false
    },
    label: String,
    description: String,
    // String validations
    minLength: Number,
    maxLength: Number,
    pattern: String,
    // Number validations
    min: Number,
    max: Number,
    // Image validations
    maxFileSize: {
        type: Number,
        default: 5 * 1024 * 1024 // 5MB
    },
    allowedTypes: {
        type: [String],
        default: ['image/jpeg', 'image/png', 'image/gif']
    },
    imageOptions: {
        maxWidth: Number,
        maxHeight: Number,
        aspectRatio: String, // e.g., "1:1", "16:9"
        quality: {
            type: Number,
            min: 1,
            max: 100,
            default: 80
        }
    },
    // Field order
    order: {
        type: Number,
        default: 0
    },
    // Visibility and dependency settings
    visibility: {
        conditions: [conditionSchema],
        mode: {
            type: String,
            enum: ['show', 'hide'],
            default: 'show'
        }
    },
    dependencies: [{
        field: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['enable', 'disable', 'require', 'optional'],
            required: true
        },
        conditions: [conditionSchema]
    }],
    // Group and section settings
    group: String,
    section: String
}, { _id: false });

const validationSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    customFields: [validationRuleSchema],
    authMethods: {
        emailPassword: {
            enabled: {
                type: Boolean,
                default: true
            },
            passwordPolicy: {
                minLength: {
                    type: Number,
                    default: 6
                },
                requireUppercase: {
                    type: Boolean,
                    default: true
                },
                requireLowercase: {
                    type: Boolean,
                    default: true
                },
                requireNumbers: {
                    type: Boolean,
                    default: true
                },
                requireSpecialChars: {
                    type: Boolean,
                    default: true
                }
            },
            emailVerification: {
                required: {
                    type: Boolean,
                    default: true
                },
                tokenExpiry: {
                    type: Number,
                    default: 24 * 60 * 60 * 1000 // 24 hours
                }
            }
        },
        phoneSMS: {
            enabled: {
                type: Boolean,
                default: false
            },
            verificationRequired: {
                type: Boolean,
                default: true
            },
            codeLength: {
                type: Number,
                default: 6
            },
            codeExpiry: {
                type: Number,
                default: 10 * 60 * 1000 // 10 minutes
            }
        },
        magicLink: {
            enabled: {
                type: Boolean,
                default: false
            },
            tokenExpiry: {
                type: Number,
                default: 15 * 60 * 1000 // 15 minutes
            },
            allowedDomains: [String]
        },
        socialGoogle: {
            enabled: {
                type: Boolean,
                default: false
            },
            clientId: String,
            clientSecret: String,
            scope: [String]
        },
        socialFacebook: {
            enabled: {
                type: Boolean,
                default: false
            },
            clientId: String,
            clientSecret: String,
            scope: [String]
        },
        socialGithub: {
            enabled: {
                type: Boolean,
                default: false
            },
            clientId: String,
            clientSecret: String,
            scope: [String]
        },
        twoFactorApp: {
            enabled: {
                type: Boolean,
                default: false
            }
        },
        twoFactorPhone: {
            enabled: {
                type: Boolean,
                default: false
            }
        },
        twoFactorEmail: {
            enabled: {
                type: Boolean,
                default: false
            }
        }
    },
    // Field grouping settings
    groups: [{
        name: String,
        label: String,
        order: Number,
        description: String
    }],
    sections: [{
        name: String,
        label: String,
        group: String,
        order: Number,
        description: String
    }]
}, {
    timestamps: true
});

// Indexes
validationSchema.index({ tenantId: 1 }, { unique: true });

// Ensure field names are unique
validationSchema.pre('save', function(next) {
    const fieldNames = new Set();
    for (const field of this.customFields) {
        if (fieldNames.has(field.field)) {
            return next(new Error(`Duplicate field name: ${field.field}`));
        }
        fieldNames.add(field.field);
    }
    next();
});

// Validate dependencies don't create circular references
validationSchema.pre('save', function(next) {
    try {
        const graph = new Map();
        
        // Build dependency graph
        for (const field of this.customFields) {
            if (!graph.has(field.field)) {
                graph.set(field.field, new Set());
            }
            
            // Add dependencies
            field.dependencies?.forEach(dep => {
                graph.get(field.field).add(dep.field);
            });
            
            // Add visibility conditions
            field.visibility?.conditions?.forEach(cond => {
                graph.get(field.field).add(cond.field);
            });
        }
        
        // Check for cycles using DFS
        const visited = new Set();
        const recursionStack = new Set();
        
        const hasCycle = (node) => {
            if (recursionStack.has(node)) return true;
            if (visited.has(node)) return false;
            
            visited.add(node);
            recursionStack.add(node);
            
            const dependencies = graph.get(node) || new Set();
            for (const dep of dependencies) {
                if (hasCycle(dep)) return true;
            }
            
            recursionStack.delete(node);
            return false;
        };
        
        for (const field of this.customFields) {
            if (hasCycle(field.field)) {
                return next(new Error(`Circular dependency detected involving field: ${field.field}`));
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Check if the auth method is enabled
validationSchema.methods.isAuthMethodEnabled = function(methodName) {
    return this.authMethods[methodName]?.enabled;
};

const ValidationSchema = mongoose.model('ValidationSchema', validationSchema);

module.exports = {
    ValidationSchema,
    validationRuleSchema
}; 