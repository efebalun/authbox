const FieldTemplate = require('../models/field-template.model');

const defaultTemplates = {
    // Address Information Template
    addressFields: {
        name: 'Address Information',
        description: 'Common address fields including street, city, state, zip, and country',
        category: 'general',
        isPublic: true,
        fields: [
            {
                field: 'streetAddress',
                type: 'string',
                label: 'Street Address',
                description: 'Street address, apartment, suite, etc.',
                required: true,
                order: 0,
                group: 'address',
                maxLength: 100
            },
            {
                field: 'city',
                type: 'string',
                label: 'City',
                required: true,
                order: 1,
                group: 'address',
                maxLength: 50
            },
            {
                field: 'state',
                type: 'string',
                label: 'State/Province',
                required: true,
                order: 2,
                group: 'address',
                maxLength: 50
            },
            {
                field: 'postalCode',
                type: 'string',
                label: 'ZIP/Postal Code',
                required: true,
                order: 3,
                group: 'address',
                pattern: '^[0-9]{5}(?:-[0-9]{4})?$',
                maxLength: 10
            },
            {
                field: 'country',
                type: 'string',
                label: 'Country',
                required: true,
                order: 4,
                group: 'address',
                maxLength: 50
            }
        ],
        groups: [{
            name: 'address',
            label: 'Address Information',
            order: 0,
            description: 'User address details'
        }]
    },

    // Social Media Profile Template
    socialProfiles: {
        name: 'Social Media Profiles',
        description: 'Social media profile links and handles',
        category: 'general',
        isPublic: true,
        fields: [
            {
                field: 'twitter',
                type: 'url',
                label: 'Twitter Profile',
                description: 'Your Twitter profile URL',
                order: 0,
                group: 'social',
                pattern: '^https?://(?:www\\.)?twitter\\.com/.+$'
            },
            {
                field: 'linkedin',
                type: 'url',
                label: 'LinkedIn Profile',
                description: 'Your LinkedIn profile URL',
                order: 1,
                group: 'social',
                pattern: '^https?://(?:www\\.)?linkedin\\.com/in/.+$'
            },
            {
                field: 'github',
                type: 'url',
                label: 'GitHub Profile',
                description: 'Your GitHub profile URL',
                order: 2,
                group: 'social',
                pattern: '^https?://(?:www\\.)?github\\.com/.+$'
            }
        ],
        groups: [{
            name: 'social',
            label: 'Social Media Profiles',
            order: 0,
            description: 'Social media links and handles'
        }]
    },

    // Business Information Template
    businessInfo: {
        name: 'Business Information',
        description: 'Common business-related fields',
        category: 'business',
        isPublic: true,
        fields: [
            {
                field: 'companyName',
                type: 'string',
                label: 'Company Name',
                required: true,
                order: 0,
                group: 'company',
                maxLength: 100
            },
            {
                field: 'taxId',
                type: 'string',
                label: 'Tax ID/VAT Number',
                description: 'Company tax identification number',
                required: true,
                order: 1,
                group: 'company',
                maxLength: 20
            },
            {
                field: 'industry',
                type: 'string',
                label: 'Industry',
                required: true,
                order: 2,
                group: 'company',
                maxLength: 50
            },
            {
                field: 'companySize',
                type: 'string',
                label: 'Company Size',
                description: 'Number of employees',
                order: 3,
                group: 'company'
            },
            {
                field: 'website',
                type: 'url',
                label: 'Company Website',
                order: 4,
                group: 'company'
            }
        ],
        groups: [{
            name: 'company',
            label: 'Company Information',
            order: 0,
            description: 'Business details and information'
        }]
    },

    // Personal Information Template
    personalInfo: {
        name: 'Personal Information',
        description: 'Basic personal information fields',
        category: 'general',
        isPublic: true,
        fields: [
            {
                field: 'dateOfBirth',
                type: 'date',
                label: 'Date of Birth',
                description: 'Your birth date',
                order: 0,
                group: 'personal'
            },
            {
                field: 'gender',
                type: 'string',
                label: 'Gender',
                order: 1,
                group: 'personal'
            },
            {
                field: 'nationality',
                type: 'string',
                label: 'Nationality',
                order: 2,
                group: 'personal'
            },
            {
                field: 'bio',
                type: 'string',
                label: 'Biography',
                description: 'Tell us about yourself',
                order: 3,
                group: 'personal',
                maxLength: 500
            }
        ],
        groups: [{
            name: 'personal',
            label: 'Personal Information',
            order: 0,
            description: 'Basic personal details'
        }]
    },

    // Healthcare Template
    healthcareInfo: {
        name: 'Healthcare Information',
        description: 'Medical and healthcare-related fields for patient profiles',
        category: 'healthcare',
        isPublic: true,
        fields: [
            {
                field: 'medicalId',
                type: 'string',
                label: 'Medical ID Number',
                description: 'Your medical identification number',
                required: true,
                order: 0,
                group: 'medical',
                maxLength: 20
            },
            {
                field: 'insuranceProvider',
                type: 'string',
                label: 'Insurance Provider',
                required: true,
                order: 1,
                group: 'medical'
            },
            {
                field: 'insuranceNumber',
                type: 'string',
                label: 'Insurance Number',
                required: true,
                order: 2,
                group: 'medical'
            },
            {
                field: 'bloodType',
                type: 'string',
                label: 'Blood Type',
                order: 3,
                group: 'medical'
            },
            {
                field: 'allergies',
                type: 'string',
                label: 'Allergies',
                description: 'List any known allergies',
                order: 4,
                group: 'medical',
                maxLength: 500
            },
            {
                field: 'emergencyContact',
                type: 'string',
                label: 'Emergency Contact Name',
                required: true,
                order: 5,
                group: 'emergency'
            },
            {
                field: 'emergencyPhone',
                type: 'phone',
                label: 'Emergency Contact Phone',
                required: true,
                order: 6,
                group: 'emergency'
            }
        ],
        groups: [
            {
                name: 'medical',
                label: 'Medical Information',
                order: 0,
                description: 'Medical and insurance details'
            },
            {
                name: 'emergency',
                label: 'Emergency Contacts',
                order: 1,
                description: 'Emergency contact information'
            }
        ]
    },

    // Education Template
    educationInfo: {
        name: 'Education Information',
        description: 'Educational institution and student-related fields',
        category: 'education',
        isPublic: true,
        fields: [
            {
                field: 'studentId',
                type: 'string',
                label: 'Student ID',
                required: true,
                order: 0,
                group: 'academic'
            },
            {
                field: 'major',
                type: 'string',
                label: 'Major/Field of Study',
                order: 1,
                group: 'academic'
            },
            {
                field: 'graduationYear',
                type: 'string',
                label: 'Expected Graduation Year',
                order: 2,
                group: 'academic'
            },
            {
                field: 'academicLevel',
                type: 'string',
                label: 'Academic Level',
                description: 'Undergraduate, Graduate, etc.',
                order: 3,
                group: 'academic'
            },
            {
                field: 'advisor',
                type: 'string',
                label: 'Academic Advisor',
                order: 4,
                group: 'academic'
            }
        ],
        groups: [{
            name: 'academic',
            label: 'Academic Information',
            order: 0,
            description: 'Student and academic details'
        }]
    },

    // GDPR Compliance Template
    gdprCompliance: {
        name: 'GDPR Compliance Fields',
        description: 'Required fields for GDPR compliance',
        category: 'compliance',
        isPublic: true,
        fields: [
            {
                field: 'dataConsent',
                type: 'boolean',
                label: 'Data Processing Consent',
                description: 'I consent to the processing of my personal data',
                required: true,
                order: 0,
                group: 'consent'
            },
            {
                field: 'marketingConsent',
                type: 'boolean',
                label: 'Marketing Communications Consent',
                description: 'I agree to receive marketing communications',
                order: 1,
                group: 'consent'
            },
            {
                field: 'thirdPartyConsent',
                type: 'boolean',
                label: 'Third Party Data Sharing Consent',
                description: 'I agree to the sharing of my data with third parties',
                order: 2,
                group: 'consent'
            },
            {
                field: 'dataRetentionConsent',
                type: 'boolean',
                label: 'Data Retention Consent',
                description: 'I understand and agree to the data retention policy',
                required: true,
                order: 3,
                group: 'consent'
            }
        ],
        groups: [{
            name: 'consent',
            label: 'GDPR Consents',
            order: 0,
            description: 'Data processing and privacy consents'
        }]
    },

    // KYC Verification Template
    kycVerification: {
        name: 'KYC Verification Fields',
        description: 'Know Your Customer (KYC) verification fields',
        category: 'compliance',
        isPublic: true,
        fields: [
            {
                field: 'idType',
                type: 'string',
                label: 'ID Document Type',
                description: 'Passport, National ID, Driver\'s License',
                required: true,
                order: 0,
                group: 'identity'
            },
            {
                field: 'idNumber',
                type: 'string',
                label: 'ID Document Number',
                required: true,
                order: 1,
                group: 'identity'
            },
            {
                field: 'idExpiryDate',
                type: 'date',
                label: 'ID Document Expiry Date',
                required: true,
                order: 2,
                group: 'identity'
            },
            {
                field: 'idFrontImage',
                type: 'image',
                label: 'ID Document Front',
                description: 'Upload front side of your ID document',
                required: true,
                order: 3,
                group: 'identity',
                maxFileSize: 5 * 1024 * 1024, // 5MB
                allowedTypes: ['image/jpeg', 'image/png']
            },
            {
                field: 'idBackImage',
                type: 'image',
                label: 'ID Document Back',
                description: 'Upload back side of your ID document',
                required: true,
                order: 4,
                group: 'identity',
                maxFileSize: 5 * 1024 * 1024, // 5MB
                allowedTypes: ['image/jpeg', 'image/png']
            },
            {
                field: 'selfieImage',
                type: 'image',
                label: 'Selfie with ID',
                description: 'Upload a selfie holding your ID document',
                required: true,
                order: 5,
                group: 'identity',
                maxFileSize: 5 * 1024 * 1024, // 5MB
                allowedTypes: ['image/jpeg', 'image/png']
            },
            {
                field: 'occupation',
                type: 'string',
                label: 'Occupation',
                required: true,
                order: 6,
                group: 'verification'
            },
            {
                field: 'sourceOfFunds',
                type: 'string',
                label: 'Source of Funds',
                description: 'Primary source of your funds',
                required: true,
                order: 7,
                group: 'verification'
            }
        ],
        groups: [
            {
                name: 'identity',
                label: 'Identity Documents',
                order: 0,
                description: 'Government-issued ID verification'
            },
            {
                name: 'verification',
                label: 'Additional Verification',
                order: 1,
                description: 'Additional KYC information'
            }
        ]
    }
};

class DefaultTemplatesService {
    /**
     * Initialize default templates in the database
     */
    static async initializeDefaultTemplates() {
        try {
            console.log('Initializing default templates...');
            
            for (const [key, template] of Object.entries(defaultTemplates)) {
                // Check if template already exists
                const exists = await FieldTemplate.findOne({ name: template.name });
                if (!exists) {
                    // Add metadata
                    template.metadata = {
                        version: '1.0.0',
                        tags: [key, 'default', template.category],
                        requiredFeatures: [],
                        compatibility: {
                            minVersion: '1.0.0',
                            maxVersion: '*'
                        }
                    };
                    
                    // Create template
                    await FieldTemplate.create(template);
                    console.log(`Created template: ${template.name}`);
                }
            }
            
            console.log('Default templates initialization complete');
        } catch (error) {
            console.error('Error initializing default templates:', error);
            throw error;
        }
    }

    /**
     * Get a specific default template by key
     */
    static getDefaultTemplate(key) {
        return defaultTemplates[key];
    }

    /**
     * Get all default templates
     */
    static getAllDefaultTemplates() {
        return defaultTemplates;
    }

    /**
     * Get all default templates (alias for getAllDefaultTemplates)
     */
    static getDefaultTemplates() {
        return DefaultTemplatesService.getAllDefaultTemplates();
    }
}

module.exports = DefaultTemplatesService; 