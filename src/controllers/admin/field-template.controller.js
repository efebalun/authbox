const FieldTemplate = require('../../models/field-template.model');
const { ValidationSchema } = require('../../models/validation-schema.model');

class AdminFieldTemplateController {
    constructor() {
        // Bind instance methods to ensure proper 'this' context
        this.listTemplates = this.listTemplates.bind(this);
        this.createTemplate = this.createTemplate.bind(this);
        this.getTemplate = this.getTemplate.bind(this);
        this.updateTemplate = this.updateTemplate.bind(this);
        this.applyTemplate = this.applyTemplate.bind(this);
        this.deleteTemplate = this.deleteTemplate.bind(this);
    }

    /**
     * List all field templates
     */
    async listTemplates(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const query = req.tenant ? { tenantId: req.tenant._id } : {};

            const templates = await FieldTemplate.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort('-createdAt');

            const total = await FieldTemplate.countDocuments(query);

            res.json({
                status: 'success',
                data: templates,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create new field template
     */
    async createTemplate(req, res, next) {
        try {
            const templateData = req.body;
            if (req.tenant) {
                templateData.tenantId = req.tenant._id;
            }

            const template = await FieldTemplate.create(templateData);

            res.status(201).json({
                status: 'success',
                data: template
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get field template details
     */
    async getTemplate(req, res, next) {
        try {
            const { templateId } = req.params;
            const query = { _id: templateId };
            if (req.tenant) {
                query.tenantId = req.tenant._id;
            }

            const template = await FieldTemplate.findOne(query);

            if (!template) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Template not found'
                });
            }

            res.json({
                status: 'success',
                data: template
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update field template
     */
    async updateTemplate(req, res, next) {
        try {
            const { templateId } = req.params;
            const updates = req.body;
            const query = { _id: templateId };
            if (req.tenant) {
                query.tenantId = req.tenant._id;
            }

            const template = await FieldTemplate.findOneAndUpdate(
                query,
                updates,
                { new: true }
            );

            if (!template) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Template not found'
                });
            }

            res.json({
                status: 'success',
                data: template
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Apply field template to validation schema
     */
    async applyTemplate(req, res, next) {
        try {
            const { templateId } = req.params;
            const tenantId = req.tenant?._id || req.body.tenantId;
            if (!tenantId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Tenant ID is required'
                });
            }

            // Get template
            const query = { _id: templateId };
            if (req.tenant) {
                query.tenantId = req.tenant._id;
            }

            const template = await FieldTemplate.findOne(query);

            if (!template) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Template not found'
                });
            }

            // Get validation schema
            let schema = await ValidationSchema.findOne({ tenantId });
            if (!schema) {
                schema = new ValidationSchema({ tenantId });
            }

            // Apply template fields
            template.fields.forEach(field => {
                const existingField = schema.customFields.find(f => f.field === field.field);
                if (existingField) {
                    Object.assign(existingField, field);
                } else {
                    schema.customFields.push(field);
                }
            });

            // Apply template groups
            if (template.groups && template.groups.length > 0) {
                template.groups.forEach(group => {
                    const existingGroup = schema.groups.find(g => g.name === group.name);
                    if (existingGroup) {
                        Object.assign(existingGroup, group);
                    } else {
                        schema.groups.push(group);
                    }
                });
            }

            // Apply template sections
            if (template.sections && template.sections.length > 0) {
                template.sections.forEach(section => {
                    const existingSection = schema.sections.find(s => s.name === section.name);
                    if (existingSection) {
                        Object.assign(existingSection, section);
                    } else {
                        schema.sections.push(section);
                    }
                });
            }

            await schema.save();

            res.json({
                status: 'success',
                data: schema
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete field template
     */
    async deleteTemplate(req, res, next) {
        try {
            const { templateId } = req.params;
            const query = { _id: templateId };
            if (req.tenant) {
                query.tenantId = req.tenant._id;
            }

            const template = await FieldTemplate.findOneAndDelete(query);

            if (!template) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Template not found'
                });
            }

            res.json({
                status: 'success',
                message: 'Template deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminFieldTemplateController(); 