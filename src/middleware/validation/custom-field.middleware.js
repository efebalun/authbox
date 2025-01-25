const validateFieldData = (fieldData) => {
    const errors = [];

    // Required fields
    if (!fieldData.field) {
        errors.push('Field name is required');
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldData.field)) {
        errors.push('Field name must start with a letter and contain only letters, numbers, and underscores');
    }

    if (!fieldData.type) {
        errors.push('Field type is required');
    }

    // Type-specific validations
    switch (fieldData.type) {
        case 'string':
            if (fieldData.minLength && fieldData.maxLength && fieldData.minLength > fieldData.maxLength) {
                errors.push('minLength cannot be greater than maxLength');
            }
            break;

        case 'number':
            if (fieldData.min && fieldData.max && fieldData.min > fieldData.max) {
                errors.push('min cannot be greater than max');
            }
            break;

        case 'image':
            if (fieldData.maxFileSize && fieldData.maxFileSize < 1024) { // 1KB minimum
                errors.push('maxFileSize must be at least 1KB');
            }
            if (fieldData.imageOptions) {
                const { maxWidth, maxHeight, quality } = fieldData.imageOptions;
                if (maxWidth && maxWidth < 1) errors.push('maxWidth must be positive');
                if (maxHeight && maxHeight < 1) errors.push('maxHeight must be positive');
                if (quality && (quality < 1 || quality > 100)) errors.push('quality must be between 1 and 100');
            }
            if (fieldData.allowedTypes && !Array.isArray(fieldData.allowedTypes)) {
                errors.push('allowedTypes must be an array');
            }
            break;

        case 'email':
            // No additional validations needed as email format is handled by the validator
            break;

        case 'phone':
            // No additional validations needed as phone format is handled by the validator
            break;

        case 'date':
            // No additional validations needed
            break;

        case 'boolean':
            // No additional validations needed
            break;

        case 'url':
            // No additional validations needed as URL format is handled by the validator
            break;

        default:
            errors.push('Invalid field type');
    }

    // Validate visibility conditions
    if (fieldData.visibility?.conditions) {
        if (!Array.isArray(fieldData.visibility.conditions)) {
            errors.push('Visibility conditions must be an array');
        } else {
            fieldData.visibility.conditions.forEach((condition, index) => {
                if (!condition.field) {
                    errors.push(`Visibility condition ${index + 1}: field is required`);
                }
                if (!condition.operator) {
                    errors.push(`Visibility condition ${index + 1}: operator is required`);
                }
                if (!['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty'].includes(condition.operator)) {
                    errors.push(`Visibility condition ${index + 1}: invalid operator`);
                }
                if (['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan'].includes(condition.operator) && condition.value === undefined) {
                    errors.push(`Visibility condition ${index + 1}: value is required for operator ${condition.operator}`);
                }
            });
        }
    }

    // Validate dependencies
    if (fieldData.dependencies) {
        if (!Array.isArray(fieldData.dependencies)) {
            errors.push('Dependencies must be an array');
        } else {
            fieldData.dependencies.forEach((dependency, index) => {
                if (!dependency.field) {
                    errors.push(`Dependency ${index + 1}: field is required`);
                }
                if (!dependency.type) {
                    errors.push(`Dependency ${index + 1}: type is required`);
                }
                if (!['enable', 'disable', 'require', 'optional'].includes(dependency.type)) {
                    errors.push(`Dependency ${index + 1}: invalid type`);
                }
                if (dependency.conditions) {
                    if (!Array.isArray(dependency.conditions)) {
                        errors.push(`Dependency ${index + 1}: conditions must be an array`);
                    } else {
                        dependency.conditions.forEach((condition, condIndex) => {
                            if (!condition.field) {
                                errors.push(`Dependency ${index + 1}, condition ${condIndex + 1}: field is required`);
                            }
                            if (!condition.operator) {
                                errors.push(`Dependency ${index + 1}, condition ${condIndex + 1}: operator is required`);
                            }
                            if (!['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty'].includes(condition.operator)) {
                                errors.push(`Dependency ${index + 1}, condition ${condIndex + 1}: invalid operator`);
                            }
                            if (['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan'].includes(condition.operator) && condition.value === undefined) {
                                errors.push(`Dependency ${index + 1}, condition ${condIndex + 1}: value is required for operator ${condition.operator}`);
                            }
                        });
                    }
                }
            });
        }
    }

    // Validate group and section
    if (fieldData.group && typeof fieldData.group !== 'string') {
        errors.push('Group must be a string');
    }
    if (fieldData.section && typeof fieldData.section !== 'string') {
        errors.push('Section must be a string');
    }

    return errors;
};

const validateCustomField = (req, res, next) => {
    try {
        const fieldData = req.body;
        const errors = validateFieldData(fieldData);

        if (errors.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid field configuration',
                errors
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

const validateFieldOrder = (req, res, next) => {
    try {
        const { order } = req.body;

        if (!Array.isArray(order)) {
            return res.status(400).json({
                status: 'error',
                message: 'Order must be an array of field IDs'
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

const validateGrouping = (req, res, next) => {
    try {
        const { groups, sections } = req.body;

        const errors = [];

        if (groups) {
            if (!Array.isArray(groups)) {
                errors.push('Groups must be an array');
            } else {
                groups.forEach((group, index) => {
                    if (!group.name) {
                        errors.push(`Group ${index + 1}: name is required`);
                    }
                    if (!group.label) {
                        errors.push(`Group ${index + 1}: label is required`);
                    }
                    if (group.order && typeof group.order !== 'number') {
                        errors.push(`Group ${index + 1}: order must be a number`);
                    }
                });
            }
        }

        if (sections) {
            if (!Array.isArray(sections)) {
                errors.push('Sections must be an array');
            } else {
                sections.forEach((section, index) => {
                    if (!section.name) {
                        errors.push(`Section ${index + 1}: name is required`);
                    }
                    if (!section.label) {
                        errors.push(`Section ${index + 1}: label is required`);
                    }
                    if (!section.group) {
                        errors.push(`Section ${index + 1}: group is required`);
                    }
                    if (section.order && typeof section.order !== 'number') {
                        errors.push(`Section ${index + 1}: order must be a number`);
                    }
                });
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid grouping configuration',
                errors
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    validateCustomField,
    validateFieldOrder,
    validateGrouping
}; 