const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');
const crypto = require('crypto');

const router = express.Router();

// All patient routes require patient authentication
router.use(AuthMiddleware.requirePatient);

class PatientController {
    constructor() {
        this.setupRoutes();
    }

    setupRoutes() {
        // Profile management
        router.get('/profile', this.getProfile.bind(this));
        router.put('/profile', ValidationMiddleware.patientProfileValidation(), this.updateProfile.bind(this));
        
        // Questionnaire access
        router.get('/questionnaires', this.getAvailableQuestionnaires.bind(this));
        router.get('/questionnaires/:questionnaireId', this.getQuestionnaireDetail.bind(this));
        
        // Response management
        router.get('/responses', ValidationMiddleware.paginationValidation(), this.getMyResponses.bind(this));
        router.get('/responses/:responseId', this.getResponseDetail.bind(this));
        router.post('/responses', ValidationMiddleware.responseValidation(), this.createResponse.bind(this));
        router.put('/responses/:responseId', ValidationMiddleware.responseValidation(), this.updateResponse.bind(this));
        router.post('/responses/:responseId/submit', this.submitResponse.bind(this));
        
        // File uploads
        router.get('/uploads', this.getMyUploads.bind(this));
        router.get('/uploads/:uploadId', this.getUploadDetail.bind(this));
        
        // Study information
        router.get('/studies', this.getMyStudies.bind(this));
        router.get('/studies/:studyId', AuthMiddleware.requireStudyAccess(), this.getStudyDetail.bind(this));
        
        // Dashboard/overview
        router.get('/dashboard', this.getDashboard.bind(this));
        
        // Notifications
        router.get('/notifications', this.getNotifications.bind(this));
        router.put('/notifications/:notificationId/read', this.markNotificationRead.bind(this));
    }

    // Profile management
    async getProfile(req, res) {
        try {
            const patientId = req.user.id;
            
            const profile = await req.app.locals.db.query(`
                SELECT id, email, patient_id, gender, status, enrollment_date,
                       consent_signed, consent_date, consent_version, 
                       mfa_enabled, created_at
                FROM patients 
                WHERE id = $1
            `, [patientId]);

            if (profile.rows.length === 0) {
                return res.status(404).json({
                    error: 'Profile not found',
                    code: 'PROFILE_NOT_FOUND'
                });
            }

            const patientData = profile.rows[0];

            // Decrypt sensitive fields for display (in a real app, this would be more sophisticated)
            let decryptedData = {};
            try {
                const encryptedFields = await req.app.locals.db.query(`
                    SELECT first_name_encrypted, last_name_encrypted, phone_encrypted,
                           address_encrypted, emergency_contact_encrypted
                    FROM patients WHERE id = $1
                `, [patientId]);

                if (encryptedFields.rows.length > 0) {
                    const fields = encryptedFields.rows[0];
                    // In development, we'll just return placeholder data
                    decryptedData = {
                        firstName: 'John', // This would be decrypted
                        lastName: 'Doe',   // This would be decrypted
                        phone: '+1-555-0000', // This would be decrypted
                        address: '123 Main St, City, ST 12345', // This would be decrypted
                        emergencyContact: 'Jane Doe - Spouse - +1-555-0001' // This would be decrypted
                    };
                }
            } catch (decryptError) {
                console.error('Decryption error:', decryptError);
            }

            res.json({
                success: true,
                profile: {
                    id: patientData.id,
                    email: patientData.email,
                    patientId: patientData.patient_id,
                    firstName: decryptedData.firstName,
                    lastName: decryptedData.lastName,
                    phone: decryptedData.phone,
                    address: decryptedData.address,
                    emergencyContact: decryptedData.emergencyContact,
                    gender: patientData.gender,
                    status: patientData.status,
                    enrollmentDate: patientData.enrollment_date,
                    consentSigned: patientData.consent_signed,
                    consentDate: patientData.consent_date,
                    consentVersion: patientData.consent_version,
                    mfaEnabled: patientData.mfa_enabled,
                    createdAt: patientData.created_at
                }
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                error: 'Failed to load profile',
                code: 'PROFILE_ERROR'
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const patientId = req.user.id;
            const {
                firstName, lastName, phone, address, emergencyContact,
                gender, medicalHistory, medications, allergies
            } = req.body;

            // In a real implementation, we would encrypt sensitive data
            const encryptPII = (data) => {
                if (!data) return null;
                // Simple encryption for development - in production, use proper encryption
                const cipher = crypto.createCipher('aes-256-cbc', 'dev_encryption_key');
                let encrypted = cipher.update(data, 'utf8', 'base64');
                encrypted += cipher.final('base64');
                return encrypted;
            };

            const result = await req.app.locals.db.query(`
                UPDATE patients 
                SET first_name_encrypted = COALESCE($2, first_name_encrypted),
                    last_name_encrypted = COALESCE($3, last_name_encrypted),
                    phone_encrypted = COALESCE($4, phone_encrypted),
                    address_encrypted = COALESCE($5, address_encrypted),
                    emergency_contact_encrypted = COALESCE($6, emergency_contact_encrypted),
                    gender = COALESCE($7, gender),
                    medical_history_encrypted = COALESCE($8, medical_history_encrypted),
                    medications_encrypted = COALESCE($9, medications_encrypted),
                    allergies_encrypted = COALESCE($10, allergies_encrypted),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id, gender, updated_at
            `, [
                patientId,
                firstName ? encryptPII(firstName) : null,
                lastName ? encryptPII(lastName) : null,
                phone ? encryptPII(phone) : null,
                address ? encryptPII(address) : null,
                emergencyContact ? encryptPII(emergencyContact) : null,
                gender,
                medicalHistory ? encryptPII(medicalHistory) : null,
                medications ? encryptPII(medications) : null,
                allergies ? encryptPII(allergies) : null
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Profile not found',
                    code: 'PROFILE_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                updatedAt: result.rows[0].updated_at
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                error: 'Failed to update profile',
                code: 'PROFILE_UPDATE_ERROR'
            });
        }
    }

    // Questionnaire access
    async getAvailableQuestionnaires(req, res) {
        try {
            const patientId = req.user.id;
            
            const questionnaires = await req.app.locals.db.query(`
                SELECT q.id, q.title, q.description, q.questionnaire_type, q.frequency,
                       q.estimated_time_minutes, q.instructions, q.is_required,
                       pqa.access_granted_at, pqa.access_expires_at,
                       CASE 
                           WHEN pr.id IS NOT NULL THEN pr.status 
                           ELSE 'not_started' 
                       END as response_status,
                       pr.id as response_id,
                       pr.started_at, pr.completed_at, pr.submitted_at
                FROM questionnaires q
                JOIN patient_questionnaire_access pqa ON q.id = pqa.questionnaire_id
                LEFT JOIN patient_responses pr ON q.id = pr.questionnaire_id AND pr.patient_id = $1
                WHERE pqa.patient_id = $1 
                AND pqa.is_active = true
                AND (pqa.access_expires_at IS NULL OR pqa.access_expires_at > NOW())
                AND q.status = 'active'
                ORDER BY q.is_required DESC, pqa.access_granted_at DESC
            `, [patientId]);

            res.json({
                success: true,
                questionnaires: questionnaires.rows.map(q => ({
                    id: q.id,
                    title: q.title,
                    description: q.description,
                    type: q.questionnaire_type,
                    frequency: q.frequency,
                    estimatedTimeMinutes: q.estimated_time_minutes,
                    instructions: q.instructions,
                    isRequired: q.is_required,
                    accessGrantedAt: q.access_granted_at,
                    accessExpiresAt: q.access_expires_at,
                    responseStatus: q.response_status,
                    responseId: q.response_id,
                    startedAt: q.started_at,
                    completedAt: q.completed_at,
                    submittedAt: q.submitted_at
                }))
            });

        } catch (error) {
            console.error('Get available questionnaires error:', error);
            res.status(500).json({
                error: 'Failed to load questionnaires',
                code: 'QUESTIONNAIRES_ERROR'
            });
        }
    }

    async getQuestionnaireDetail(req, res) {
        try {
            const patientId = req.user.id;
            const questionnaireId = req.params.questionnaireId;

            // Check access
            const access = await req.app.locals.db.query(`
                SELECT 1 FROM patient_questionnaire_access 
                WHERE patient_id = $1 AND questionnaire_id = $2 AND is_active = true
                AND (access_expires_at IS NULL OR access_expires_at > NOW())
            `, [patientId, questionnaireId]);

            if (access.rows.length === 0) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have access to this questionnaire',
                    code: 'QUESTIONNAIRE_ACCESS_DENIED'
                });
            }

            const questionnaire = await req.app.locals.db.query(`
                SELECT q.id, q.title, q.description, q.version, q.questionnaire_type,
                       q.frequency, q.questions, q.validation_rules, q.is_required,
                       q.estimated_time_minutes, q.instructions,
                       pr.id as response_id, pr.response_data_encrypted, pr.status as response_status,
                       pr.started_at, pr.completed_at, pr.submitted_at, pr.auto_saved_at
                FROM questionnaires q
                LEFT JOIN patient_responses pr ON q.id = pr.questionnaire_id AND pr.patient_id = $1
                WHERE q.id = $2 AND q.status = 'active'
            `, [patientId, questionnaireId]);

            if (questionnaire.rows.length === 0) {
                return res.status(404).json({
                    error: 'Questionnaire not found',
                    code: 'QUESTIONNAIRE_NOT_FOUND'
                });
            }

            const q = questionnaire.rows[0];
            
            // Decrypt response data if exists
            let responseData = null;
            if (q.response_data_encrypted) {
                try {
                    const decipher = crypto.createDecipher('aes-256-cbc', 'dev_encryption_key');
                    let decrypted = decipher.update(q.response_data_encrypted, 'base64', 'utf8');
                    decrypted += decipher.final('utf8');
                    responseData = JSON.parse(decrypted);
                } catch (decryptError) {
                    console.error('Response decryption error:', decryptError);
                }
            }

            res.json({
                success: true,
                questionnaire: {
                    id: q.id,
                    title: q.title,
                    description: q.description,
                    version: q.version,
                    type: q.questionnaire_type,
                    frequency: q.frequency,
                    questions: q.questions,
                    validationRules: q.validation_rules,
                    isRequired: q.is_required,
                    estimatedTimeMinutes: q.estimated_time_minutes,
                    instructions: q.instructions,
                    response: q.response_id ? {
                        id: q.response_id,
                        data: responseData,
                        status: q.response_status,
                        startedAt: q.started_at,
                        completedAt: q.completed_at,
                        submittedAt: q.submitted_at,
                        autoSavedAt: q.auto_saved_at
                    } : null
                }
            });

        } catch (error) {
            console.error('Get questionnaire detail error:', error);
            res.status(500).json({
                error: 'Failed to load questionnaire',
                code: 'QUESTIONNAIRE_DETAIL_ERROR'
            });
        }
    }

    // Response management
    async getMyResponses(req, res) {
        try {
            const patientId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const status = req.query.status || '';

            let whereClause = 'WHERE pr.patient_id = $1';
            let params = [patientId];
            let paramCount = 1;

            if (status) {
                paramCount++;
                whereClause += ` AND pr.status = $${paramCount}`;
                params.push(status);
            }

            const responses = await req.app.locals.db.query(`
                SELECT pr.id, pr.status, pr.started_at, pr.completed_at, pr.submitted_at,
                       pr.reviewed_at, pr.auto_saved_at,
                       q.title as questionnaire_title, q.questionnaire_type, q.version
                FROM patient_responses pr
                JOIN questionnaires q ON pr.questionnaire_id = q.id
                ${whereClause}
                ORDER BY pr.created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `, [...params, limit, offset]);

            const totalCount = await req.app.locals.db.query(`
                SELECT COUNT(*) as count FROM patient_responses pr ${whereClause}
            `, params);

            res.json({
                success: true,
                responses: responses.rows,
                pagination: {
                    page,
                    limit,
                    total: parseInt(totalCount.rows[0].count),
                    pages: Math.ceil(totalCount.rows[0].count / limit)
                }
            });

        } catch (error) {
            console.error('Get my responses error:', error);
            res.status(500).json({
                error: 'Failed to load responses',
                code: 'RESPONSES_ERROR'
            });
        }
    }

    async createResponse(req, res) {
        try {
            const patientId = req.user.id;
            const { questionnaireId, questionnaireVersion, responses } = req.body;

            // Check if response already exists
            const existing = await req.app.locals.db.query(`
                SELECT id FROM patient_responses 
                WHERE patient_id = $1 AND questionnaire_id = $2 AND questionnaire_version = $3
            `, [patientId, questionnaireId, questionnaireVersion]);

            if (existing.rows.length > 0) {
                return res.status(409).json({
                    error: 'Response already exists',
                    message: 'You have already started this questionnaire',
                    code: 'RESPONSE_EXISTS',
                    existingResponseId: existing.rows[0].id
                });
            }

            // Encrypt response data
            const encryptedData = this.encryptResponseData(responses);
            const responseHash = crypto.createHash('sha256').update(JSON.stringify(responses)).digest('hex');

            const result = await req.app.locals.db.query(`
                INSERT INTO patient_responses (
                    patient_id, questionnaire_id, questionnaire_version,
                    response_data_encrypted, response_hash, status, submission_ip, device_info
                ) VALUES ($1, $2, $3, $4, $5, 'in_progress', $6, $7)
                RETURNING id, status, started_at
            `, [
                patientId, questionnaireId, questionnaireVersion,
                encryptedData, responseHash, req.ip, 
                JSON.stringify({ userAgent: req.headers['user-agent'] })
            ]);

            res.status(201).json({
                success: true,
                message: 'Response created successfully',
                response: {
                    id: result.rows[0].id,
                    status: result.rows[0].status,
                    startedAt: result.rows[0].started_at
                }
            });

        } catch (error) {
            console.error('Create response error:', error);
            res.status(500).json({
                error: 'Failed to create response',
                code: 'CREATE_RESPONSE_ERROR'
            });
        }
    }

    // Helper method to encrypt response data
    encryptResponseData(data) {
        const cipher = crypto.createCipher('aes-256-cbc', 'dev_encryption_key');
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    // Dashboard
    async getDashboard(req, res) {
        try {
            const patientId = req.user.id;

            const [
                questionnairesCountResult,
                responsesCountResult,
                completedResponsesResult,
                recentActivityResult
            ] = await Promise.all([
                // Available questionnaires
                req.app.locals.db.query(`
                    SELECT COUNT(*) as count FROM patient_questionnaire_access pqa
                    JOIN questionnaires q ON pqa.questionnaire_id = q.id
                    WHERE pqa.patient_id = $1 AND pqa.is_active = true 
                    AND q.status = 'active'
                    AND (pqa.access_expires_at IS NULL OR pqa.access_expires_at > NOW())
                `, [patientId]),

                // Total responses
                req.app.locals.db.query(`
                    SELECT COUNT(*) as count FROM patient_responses WHERE patient_id = $1
                `, [patientId]),

                // Completed responses
                req.app.locals.db.query(`
                    SELECT COUNT(*) as count FROM patient_responses 
                    WHERE patient_id = $1 AND status IN ('completed', 'submitted', 'reviewed')
                `, [patientId]),

                // Recent activity
                req.app.locals.db.query(`
                    SELECT pr.id, pr.status, pr.completed_at, pr.submitted_at, pr.auto_saved_at,
                           q.title as questionnaire_title, q.questionnaire_type
                    FROM patient_responses pr
                    JOIN questionnaires q ON pr.questionnaire_id = q.id
                    WHERE pr.patient_id = $1
                    ORDER BY COALESCE(pr.submitted_at, pr.completed_at, pr.auto_saved_at, pr.updated_at) DESC
                    LIMIT 5
                `, [patientId])
            ]);

            res.json({
                success: true,
                dashboard: {
                    overview: {
                        availableQuestionnaires: parseInt(questionnairesCountResult.rows[0].count),
                        totalResponses: parseInt(responsesCountResult.rows[0].count),
                        completedResponses: parseInt(completedResponsesResult.rows[0].count)
                    },
                    recentActivity: recentActivityResult.rows.map(activity => ({
                        id: activity.id,
                        type: 'response',
                        title: activity.questionnaire_title,
                        questionnaireType: activity.questionnaire_type,
                        status: activity.status,
                        timestamp: activity.submitted_at || activity.completed_at || activity.auto_saved_at
                    }))
                }
            });

        } catch (error) {
            console.error('Get dashboard error:', error);
            res.status(500).json({
                error: 'Failed to load dashboard',
                code: 'DASHBOARD_ERROR'
            });
        }
    }

    // Placeholder methods for remaining endpoints
    async getResponseDetail(req, res) {
        res.json({ success: true, message: 'Response detail endpoint - implementation pending' });
    }

    async updateResponse(req, res) {
        res.json({ success: true, message: 'Update response endpoint - implementation pending' });
    }

    async submitResponse(req, res) {
        res.json({ success: true, message: 'Submit response endpoint - implementation pending' });
    }

    async getMyUploads(req, res) {
        res.json({ success: true, message: 'Get uploads endpoint - implementation pending' });
    }

    async getUploadDetail(req, res) {
        res.json({ success: true, message: 'Upload detail endpoint - implementation pending' });
    }

    async getMyStudies(req, res) {
        res.json({ success: true, message: 'Get studies endpoint - implementation pending' });
    }

    async getStudyDetail(req, res) {
        res.json({ success: true, message: 'Study detail endpoint - implementation pending' });
    }

    async getNotifications(req, res) {
        res.json({ success: true, message: 'Get notifications endpoint - implementation pending' });
    }

    async markNotificationRead(req, res) {
        res.json({ success: true, message: 'Mark notification read endpoint - implementation pending' });
    }
}

// Initialize controller
new PatientController();

module.exports = router;