const { body, param, query, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

class ValidationMiddleware {
    // Handle validation errors
    static handleValidationErrors(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Please check your input data',
                details: errors.array().map(error => ({
                    field: error.param,
                    value: error.value,
                    message: error.msg,
                    location: error.location
                })),
                code: 'VALIDATION_ERROR'
            });
        }
        next();
    }

    // Sanitize HTML content to prevent XSS
    static sanitizeInput(req, res, next) {
        const sanitizeValue = (value) => {
            if (typeof value === 'string') {
                return sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                    disallowedTagsMode: 'discard'
                });
            }
            if (typeof value === 'object' && value !== null) {
                const sanitized = {};
                for (const [key, val] of Object.entries(value)) {
                    sanitized[key] = sanitizeValue(val);
                }
                return sanitized;
            }
            return value;
        };

        if (req.body) {
            req.body = sanitizeValue(req.body);
        }
        
        if (req.query) {
            req.query = sanitizeValue(req.query);
        }

        next();
    }

    // Common validation rules
    static email() {
        return body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Must be a valid email address');
    }

    static password() {
        return body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }

    static userType() {
        return body('userType')
            .isIn(['physician', 'patient'])
            .withMessage('User type must be either physician or patient');
    }

    static uuid(field = 'id') {
        return param(field)
            .isUUID()
            .withMessage(`${field} must be a valid UUID`);
    }

    static positiveInteger(field) {
        return body(field)
            .isInt({ min: 1 })
            .withMessage(`${field} must be a positive integer`);
    }

    static optionalPositiveInteger(field) {
        return body(field)
            .optional()
            .isInt({ min: 1 })
            .withMessage(`${field} must be a positive integer`);
    }

    static dateField(field) {
        return body(field)
            .isISO8601()
            .toDate()
            .withMessage(`${field} must be a valid date`);
    }

    static optionalDateField(field) {
        return body(field)
            .optional()
            .isISO8601()
            .toDate()
            .withMessage(`${field} must be a valid date`);
    }

    static stringField(field, minLength = 1, maxLength = 255) {
        return body(field)
            .isLength({ min: minLength, max: maxLength })
            .trim()
            .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`);
    }

    static optionalStringField(field, maxLength = 255) {
        return body(field)
            .optional()
            .isLength({ max: maxLength })
            .trim()
            .withMessage(`${field} must be no more than ${maxLength} characters`);
    }

    static phoneNumber(field = 'phone') {
        return body(field)
            .isMobilePhone()
            .withMessage(`${field} must be a valid phone number`);
    }

    static optionalPhoneNumber(field = 'phone') {
        return body(field)
            .optional()
            .isMobilePhone()
            .withMessage(`${field} must be a valid phone number`);
    }

    // Validation rules for authentication
    static loginValidation() {
        return [
            ValidationMiddleware.email(),
            body('password').notEmpty().withMessage('Password is required'),
            ValidationMiddleware.userType().optional(),
            body('mfaCode')
                .optional()
                .isLength({ min: 6, max: 6 })
                .withMessage('MFA code must be 6 digits'),
            ValidationMiddleware.handleValidationErrors
        ];
    }

    static registrationValidation() {
        return [
            ValidationMiddleware.email(),
            ValidationMiddleware.password(),
            ValidationMiddleware.userType(),
            body('invitationToken')
                .isLength({ min: 32 })
                .withMessage('Valid invitation token is required'),
            body('firstName')
                .optional()
                .isLength({ min: 1, max: 100 })
                .withMessage('First name must be between 1 and 100 characters'),
            body('lastName')
                .optional()
                .isLength({ min: 1, max: 100 })
                .withMessage('Last name must be between 1 and 100 characters'),
            ValidationMiddleware.handleValidationErrors
        ];
    }

    // Validation rules for questionnaires
    static questionnaireValidation() {
        return [
            ValidationMiddleware.stringField('title', 1, 255),
            ValidationMiddleware.optionalStringField('description', 1000),
            ValidationMiddleware.stringField('version', 1, 20),
            ValidationMiddleware.positiveInteger('studyId'),
            body('questionnaireType')
                .isIn(['screening', 'baseline', 'followup', 'assessment', 'adverse_event'])
                .withMessage('Invalid questionnaire type'),
            body('frequency')
                .optional()
                .isIn(['once', 'daily', 'weekly', 'monthly', 'as_needed'])
                .withMessage('Invalid frequency'),
            body('questions')
                .isArray({ min: 1 })
                .withMessage('At least one question is required'),
            body('questions.*.id')
                .isLength({ min: 1, max: 50 })
                .withMessage('Question ID is required and must be under 50 characters'),
            body('questions.*.type')
                .isIn(['text', 'multiple_choice', 'scale', 'yes_no', 'date', 'file_upload'])
                .withMessage('Invalid question type'),
            body('questions.*.question')
                .isLength({ min: 1, max: 500 })
                .withMessage('Question text is required and must be under 500 characters'),
            body('questions.*.required')
                .isBoolean()
                .withMessage('Required field must be boolean'),
            ValidationMiddleware.optionalPositiveInteger('estimatedTimeMinutes'),
            ValidationMiddleware.handleValidationErrors
        ];
    }

    // Validation rules for patient responses
    static responseValidation() {
        return [
            ValidationMiddleware.positiveInteger('questionnaireId'),
            ValidationMiddleware.stringField('questionnaireVersion', 1, 20),
            body('responses')
                .isObject()
                .withMessage('Responses must be an object'),
            body('status')
                .optional()
                .isIn(['in_progress', 'completed', 'submitted'])
                .withMessage('Invalid response status'),
            ValidationMiddleware.handleValidationErrors
        ];
    }

    // Validation rules for patient profile
    static patientProfileValidation() {
        return [
            ValidationMiddleware.optionalStringField('firstName', 100),
            ValidationMiddleware.optionalStringField('lastName', 100),
            ValidationMiddleware.optionalDateField('dateOfBirth'),
            body('gender')
                .optional()
                .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
                .withMessage('Invalid gender value'),
            ValidationMiddleware.optionalPhoneNumber('phone'),
            ValidationMiddleware.optionalStringField('address', 500),
            ValidationMiddleware.optionalStringField('emergencyContact', 300),
            ValidationMiddleware.optionalStringField('medicalHistory', 1000),
            ValidationMiddleware.optionalStringField('medications', 1000),
            ValidationMiddleware.optionalStringField('allergies', 500),
            ValidationMiddleware.handleValidationErrors
        ];
    }

    // Validation rules for physician profile
    static physicianProfileValidation() {
        return [
            ValidationMiddleware.optionalStringField('firstName', 100),
            ValidationMiddleware.optionalStringField('lastName', 100),
            ValidationMiddleware.optionalStringField('title', 50),
            ValidationMiddleware.optionalStringField('specialization', 100),
            ValidationMiddleware.optionalStringField('licenseNumber', 100),
            ValidationMiddleware.optionalPhoneNumber('phone'),
            ValidationMiddleware.optionalStringField('department', 100),
            body('role')
                .optional()
                .isIn(['physician', 'principal_investigator', 'research_coordinator'])
                .withMessage('Invalid role'),
            ValidationMiddleware.handleValidationErrors
        ];
    }

    // Validation rules for file uploads
    static fileUploadValidation() {
        return [
            body('filename')
                .isLength({ min: 1, max: 255 })
                .withMessage('Filename is required and must be under 255 characters'),
            body('fileType')
                .isIn(['image', 'video', 'audio', 'document'])
                .withMessage('Invalid file type'),
            body('mimeType')
                .matches(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/)
                .withMessage('Invalid MIME type'),
            body('fileSize')
                .isInt({ min: 1, max: 100 * 1024 * 1024 }) // 100MB max
                .withMessage('File size must be between 1 byte and 100MB'),
            ValidationMiddleware.optionalPositiveInteger('responseId'),
            ValidationMiddleware.handleValidationErrors
        ];
    }

    // Validation rules for pagination
    static paginationValidation() {
        return [
            query('page')
                .optional()
                .isInt({ min: 1 })
                .toInt()
                .withMessage('Page must be a positive integer'),
            query('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .toInt()
                .withMessage('Limit must be between 1 and 100'),
            query('sortBy')
                .optional()
                .isAlpha('en-US', { ignore: '_' })
                .withMessage('Sort field can only contain letters and underscores'),
            query('sortOrder')
                .optional()
                .isIn(['asc', 'desc'])
                .withMessage('Sort order must be asc or desc'),
            ValidationMiddleware.handleValidationErrors
        ];
    }

    // Validation rules for search
    static searchValidation() {
        return [
            query('q')
                .optional()
                .isLength({ min: 1, max: 100 })
                .trim()
                .withMessage('Search query must be between 1 and 100 characters'),
            query('status')
                .optional()
                .isAlpha()
                .withMessage('Status filter must contain only letters'),
            query('dateFrom')
                .optional()
                .isISO8601()
                .toDate()
                .withMessage('Date from must be a valid date'),
            query('dateTo')
                .optional()
                .isISO8601()
                .toDate()
                .withMessage('Date to must be a valid date'),
            ValidationMiddleware.handleValidationErrors
        ];
    }

    // Custom validation for questionnaire responses
    static validateQuestionnaireResponses() {
        return async (req, res, next) => {
            try {
                const { questionnaireId, responses } = req.body;
                
                // Get questionnaire validation rules
                const questionnaire = await req.app.locals.db.query(
                    'SELECT questions, validation_rules FROM questionnaires WHERE id = $1',
                    [questionnaireId]
                );

                if (questionnaire.rows.length === 0) {
                    return res.status(404).json({
                        error: 'Questionnaire not found',
                        code: 'QUESTIONNAIRE_NOT_FOUND'
                    });
                }

                const { questions, validation_rules } = questionnaire.rows[0];
                const errors = [];

                // Validate each response against question requirements
                for (const question of questions) {
                    const response = responses[question.id];
                    
                    // Check required questions
                    if (question.required && (response === undefined || response === null || response === '')) {
                        errors.push({
                            field: question.id,
                            message: `Response to "${question.question}" is required`
                        });
                        continue;
                    }

                    // Skip validation if response is empty and not required
                    if (response === undefined || response === null || response === '') {
                        continue;
                    }

                    // Validate based on question type
                    switch (question.type) {
                        case 'multiple_choice':
                            if (question.multiple) {
                                if (!Array.isArray(response)) {
                                    errors.push({
                                        field: question.id,
                                        message: 'Multiple choice response must be an array'
                                    });
                                } else if (!response.every(r => question.options.includes(r))) {
                                    errors.push({
                                        field: question.id,
                                        message: 'Invalid option selected'
                                    });
                                }
                            } else {
                                if (!question.options.includes(response)) {
                                    errors.push({
                                        field: question.id,
                                        message: 'Invalid option selected'
                                    });
                                }
                            }
                            break;
                            
                        case 'scale':
                            const numResponse = Number(response);
                            if (isNaN(numResponse) || numResponse < question.min || numResponse > question.max) {
                                errors.push({
                                    field: question.id,
                                    message: `Response must be a number between ${question.min} and ${question.max}`
                                });
                            }
                            break;
                            
                        case 'yes_no':
                            if (!['yes', 'no', true, false].includes(response)) {
                                errors.push({
                                    field: question.id,
                                    message: 'Response must be yes/no or true/false'
                                });
                            }
                            break;
                            
                        case 'text':
                            if (typeof response !== 'string') {
                                errors.push({
                                    field: question.id,
                                    message: 'Text response must be a string'
                                });
                            } else if (question.max_length && response.length > question.max_length) {
                                errors.push({
                                    field: question.id,
                                    message: `Response must be no more than ${question.max_length} characters`
                                });
                            }
                            break;
                            
                        case 'date':
                            const dateResponse = new Date(response);
                            if (isNaN(dateResponse.getTime())) {
                                errors.push({
                                    field: question.id,
                                    message: 'Invalid date format'
                                });
                            }
                            break;
                    }
                }

                if (errors.length > 0) {
                    return res.status(400).json({
                        error: 'Response validation failed',
                        details: errors,
                        code: 'RESPONSE_VALIDATION_ERROR'
                    });
                }

                next();
            } catch (error) {
                console.error('Response validation error:', error);
                res.status(500).json({
                    error: 'Response validation failed',
                    code: 'VALIDATION_ERROR'
                });
            }
        };
    }

    // Middleware to validate file uploads
    static validateFileUpload() {
        return (req, res, next) => {
            if (!req.file && !req.files) {
                return res.status(400).json({
                    error: 'No file uploaded',
                    code: 'FILE_REQUIRED'
                });
            }

            const file = req.file || (req.files && req.files[0]);
            
            // Check file size (100MB max)
            if (file.size > 100 * 1024 * 1024) {
                return res.status(400).json({
                    error: 'File too large',
                    message: 'Maximum file size is 100MB',
                    code: 'FILE_TOO_LARGE'
                });
            }

            // Check file type
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'video/mp4', 'video/mpeg', 'video/quicktime',
                'audio/mpeg', 'audio/wav', 'audio/ogg',
                'application/pdf', 'text/plain',
                'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    error: 'File type not allowed',
                    message: 'Only images, videos, audio files, and documents are allowed',
                    code: 'FILE_TYPE_NOT_ALLOWED'
                });
            }

            next();
        };
    }
}

module.exports = ValidationMiddleware;