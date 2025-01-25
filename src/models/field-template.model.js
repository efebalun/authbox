const mongoose = require('mongoose');

// Import the validation rule schema to reuse field configuration
const { validationRuleSchema } = require('./validation-schema.model');

const fieldTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    category: {
        type: String,
        enum: ['general', 'business', 'healthcare', 'education', 'ecommerce', 'compliance'],
        default: 'general'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant'
    },
    fields: [validationRuleSchema],
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
    }],
    metadata: {
        version: String,
        tags: [String],
        requiredFeatures: [String],
        compatibility: {
            minVersion: String,
            maxVersion: String
        }
    }
}, {
    timestamps: true
});

// Ensure field names are unique within a template
fieldTemplateSchema.pre('save', function(next) {
    const fieldNames = new Set();
    for (const field of this.fields) {
        if (fieldNames.has(field.field)) {
            return next(new Error(`Duplicate field name: ${field.field}`));
        }
        fieldNames.add(field.field);
    }
    next();
});

const FieldTemplate = mongoose.model('FieldTemplate', fieldTemplateSchema);

module.exports = FieldTemplate; 