const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');
const crypto = require('crypto');

const router = express.Router();

class ResponseController {
    constructor() {
        this.setupRoutes();
    }

    setupRoutes() {
        // Response CRUD operations
        router.get('/', ValidationMiddleware.paginationValidation(), this.getResponses.bind(this));
        router.get('/:responseId', this.getResponseDetail.bind(this));
        router.post('/', ValidationMiddleware.responseValidation(), ValidationMiddleware.validateQuestionnaireResponses(), this.createResponse.bind(this));
        router.put('/:responseId', ValidationMiddleware.responseValidation(), ValidationMiddleware.validateQuestionnaireResponses(), this.updateResponse.bind(this));
        router.delete('/:responseId', this.deleteResponse.bind(this));
        
        // Response submission and status management
        router.post('/:responseId/submit', this.submitResponse.bind(this));
        router.post('/:responseId/auto-save', this.autoSaveResponse.bind(this));
        
        // Response review (physicians only)
        router.put('/:responseId/review', AuthMiddleware.requirePhysician, this.reviewResponse.bind(this));
        router.post('/:responseId/comments', AuthMiddleware.requirePhysician, this.addComment.bind(this));
        
        // Bulk operations
        router.get('/export/:format', this.exportResponses.bind(this));
        router.post('/bulk-review', AuthMiddleware.requirePhysician, this.bulkReviewResponses.bind(this));
        
        // Analytics
        router.get('/analytics/summary', this.getResponseAnalytics.bind(this));
        router.get('/analytics/completion-rates', this.getCompletionRates.bind(this));
    }

    async getResponses(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const status = req.query.status || '';
            const questionnaireId = req.query.questionnaireId || '';
            const patientId = req.query.patientId || '';

            let whereClause = 'WHERE 1=1';
            let params = [];
            let paramCount = 0;

            // Apply user-specific filters
            if (req.user.userType === 'patient') {
                paramCount++;
                whereClause += ` AND pr.patient_id = $${paramCount}`;
                params.push(req.user.id);
            } else if (req.user.userType === 'physician') {
                paramCount++;
                whereClause += ` AND EXISTS (
                    SELECT 1 FROM physician_patient_relationships ppr 
                    WHERE ppr.patient_id = pr.patient_id 
                    AND ppr.physician_id = $${paramCount} 
                    AND ppr.is_active = true
                )`;
                params.push(req.user.id);
            }

            if (status) {
                paramCount++;
                whereClause += ` AND pr.status = $${paramCount}`;
                params.push(status);
            }

            if (questionnaireId) {
                paramCount++;
                whereClause += ` AND pr.questionnaire_id = $${paramCount}`;
                params.push(questionnaireId);
            }

            if (patientId && req.user.userType === 'physician') {
                paramCount++;
                whereClause += ` AND pr.patient_id = $${paramCount}`;
                params.push(patientId);
            }

            const responses = await req.app.locals.db.query(`
                SELECT pr.id, pr.status, pr.started_at, pr.completed_at, pr.submitted_at,
                       pr.reviewed_at, pr.auto_saved_at, pr.questionnaire_version,
                       q.title as questionnaire_title, q.questionnaire_type,
                       p.patient_id, p.email as patient_email,
                       rev.first_name as reviewer_first_name, rev.last_name as reviewer_last_name
                FROM patient_responses pr
                JOIN questionnaires q ON pr.questionnaire_id = q.id
                JOIN patients p ON pr.patient_id = p.id
                LEFT JOIN physicians rev ON pr.reviewed_by = rev.id
                ${whereClause}
                ORDER BY pr.created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `, [...params, limit, offset]);

            const totalCount = await req.app.locals.db.query(`
                SELECT COUNT(*) as count
                FROM patient_responses pr
                ${whereClause}
            `, params);

            // Mask sensitive patient data for physicians
            const responseData = responses.rows.map(r => ({
                id: r.id,
                status: r.status,
                startedAt: r.started_at,
                completedAt: r.completed_at,
                submittedAt: r.submitted_at,
                reviewedAt: r.reviewed_at,
                autoSavedAt: r.auto_saved_at,
                questionnaireVersion: r.questionnaire_version,
                questionnaire: {
                    title: r.questionnaire_title,
                    type: r.questionnaire_type
                },
                patient: req.user.userType === 'patient' ? {
                    id: r.patient_id,
                    email: r.patient_email
                } : {
                    id: r.patient_id,
                    patientId: r.patient_id // Only show patient ID to physicians
                },
                reviewer: r.reviewer_first_name ? {
                    name: `${r.reviewer_first_name} ${r.reviewer_last_name}`
                } : null
            }));

            res.json({
                success: true,
                responses: responseData,
                pagination: {
                    page,
                    limit,
                    total: parseInt(totalCount.rows[0].count),
                    pages: Math.ceil(totalCount.rows[0].count / limit)
                }
            });

        } catch (error) {
            console.error('Get responses error:', error);
            res.status(500).json({
                error: 'Failed to load responses',
                code: 'RESPONSES_ERROR'
            });
        }
    }

    async getResponseDetail(req, res) {
        try {
            const responseId = req.params.responseId;

            const response = await req.app.locals.db.query(`
                SELECT pr.*, q.title as questionnaire_title, q.questions, q.validation_rules,
                       p.patient_id, p.email as patient_email,
                       rev.first_name as reviewer_first_name, rev.last_name as reviewer_last_name
                FROM patient_responses pr
                JOIN questionnaires q ON pr.questionnaire_id = q.id
                JOIN patients p ON pr.patient_id = p.id
                LEFT JOIN physicians rev ON pr.reviewed_by = rev.id
                WHERE pr.id = $1
            `, [responseId]);

            if (response.rows.length === 0) {
                return res.status(404).json({
                    error: 'Response not found',
                    code: 'RESPONSE_NOT_FOUND'
                });
            }

            const r = response.rows[0];

            // Check access permissions
            if (req.user.userType === 'patient') {
                if (r.patient_id !== req.user.id) {
                    return res.status(403).json({
                        error: 'Access denied',
                        message: 'You can only access your own responses',
                        code: 'RESPONSE_ACCESS_DENIED'
                    });
                }
            } else if (req.user.userType === 'physician') {
                const access = await req.app.locals.db.query(`
                    SELECT 1 FROM physician_patient_relationships 
                    WHERE physician_id = $1 AND patient_id = $2 AND is_active = true
                `, [req.user.id, r.patient_id]);

                if (access.rows.length === 0) {
                    return res.status(403).json({
                        error: 'Access denied',
                        message: 'You do not have access to this patient\'s responses',
                        code: 'RESPONSE_ACCESS_DENIED'
                    });
                }
            }

            // Decrypt response data
            let responseData = null;
            if (r.response_data_encrypted) {
                try {
                    responseData = this.decryptResponseData(r.response_data_encrypted);
                } catch (decryptError) {
                    console.error('Response decryption error:', decryptError);
                    return res.status(500).json({
                        error: 'Failed to decrypt response data',
                        code: 'DECRYPTION_ERROR'
                    });
                }
            }

            res.json({
                success: true,
                response: {
                    id: r.id,
                    questionnaireId: r.questionnaire_id,
                    questionnaireVersion: r.questionnaire_version,
                    questionnaire: {
                        title: r.questionnaire_title,
                        questions: r.questions,
                        validationRules: r.validation_rules
                    },
                    patient: req.user.userType === 'patient' ? {
                        id: r.patient_id,
                        email: r.patient_email
                    } : {
                        patientId: r.patient_id
                    },
                    responseData: responseData,
                    status: r.status,
                    startedAt: r.started_at,
                    completedAt: r.completed_at,
                    submittedAt: r.submitted_at,
                    reviewedAt: r.reviewed_at,
                    reviewedBy: r.reviewer_first_name ? {
                        name: `${r.reviewer_first_name} ${r.reviewer_last_name}`
                    } : null,
                    autoSavedAt: r.auto_saved_at,
                    submissionIp: req.user.userType === 'physician' ? r.submission_ip : undefined,
                    deviceInfo: r.device_info
                }
            });

        } catch (error) {
            console.error('Get response detail error:', error);
            res.status(500).json({
                error: 'Failed to load response',
                code: 'RESPONSE_DETAIL_ERROR'
            });
        }
    }

    async createResponse(req, res) {
        try {
            const { questionnaireId, questionnaireVersion, responses, status = 'in_progress' } = req.body;
            
            // Verify questionnaire access
            const access = await this.verifyQuestionnaireAccess(req, questionnaireId);
            if (!access.allowed) {
                return res.status(403).json(access.error);
            }

            // Check if response already exists
            const existing = await req.app.locals.db.query(`
                SELECT id FROM patient_responses 
                WHERE patient_id = $1 AND questionnaire_id = $2 AND questionnaire_version = $3
            `, [req.user.id, questionnaireId, questionnaireVersion]);

            if (existing.rows.length > 0) {
                return res.status(409).json({
                    error: 'Response already exists',
                    message: 'You have already started this questionnaire',
                    code: 'RESPONSE_EXISTS',
                    existingResponseId: existing.rows[0].id
                });
            }

            // Encrypt response data and create hash
            const encryptedData = this.encryptResponseData(responses);
            const responseHash = crypto.createHash('sha256').update(JSON.stringify(responses)).digest('hex');

            const result = await req.app.locals.db.query(`
                INSERT INTO patient_responses (
                    patient_id, questionnaire_id, questionnaire_version,
                    response_data_encrypted, response_hash, status,
                    submission_ip, device_info
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, status, started_at, created_at
            `, [
                req.user.id, questionnaireId, questionnaireVersion,
                encryptedData, responseHash, status,
                req.ip, JSON.stringify({ userAgent: req.headers['user-agent'] })
            ]);

            res.status(201).json({
                success: true,
                message: 'Response created successfully',
                response: {
                    id: result.rows[0].id,
                    status: result.rows[0].status,
                    startedAt: result.rows[0].started_at,
                    createdAt: result.rows[0].created_at
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

    async updateResponse(req, res) {
        try {
            const responseId = req.params.responseId;
            const { responses, status } = req.body;

            // Verify response ownership
            const ownership = await this.verifyResponseOwnership(req, responseId);
            if (!ownership.allowed) {
                return res.status(403).json(ownership.error);
            }

            // Check if response can be modified
            const currentResponse = await req.app.locals.db.query(`
                SELECT status FROM patient_responses WHERE id = $1
            `, [responseId]);

            if (currentResponse.rows[0].status === 'submitted' || currentResponse.rows[0].status === 'reviewed') {
                return res.status(400).json({
                    error: 'Response cannot be modified',
                    message: 'Submitted or reviewed responses cannot be modified',
                    code: 'RESPONSE_LOCKED'
                });
            }

            // Update response data
            const encryptedData = this.encryptResponseData(responses);
            const responseHash = crypto.createHash('sha256').update(JSON.stringify(responses)).digest('hex');

            const result = await req.app.locals.db.query(`
                UPDATE patient_responses 
                SET response_data_encrypted = $2,
                    response_hash = $3,
                    status = COALESCE($4, status),
                    auto_saved_at = NOW(),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id, status, auto_saved_at, updated_at
            `, [responseId, encryptedData, responseHash, status]);

            res.json({
                success: true,
                message: 'Response updated successfully',
                response: {
                    id: result.rows[0].id,
                    status: result.rows[0].status,
                    autoSavedAt: result.rows[0].auto_saved_at,
                    updatedAt: result.rows[0].updated_at
                }
            });

        } catch (error) {
            console.error('Update response error:', error);
            res.status(500).json({
                error: 'Failed to update response',
                code: 'UPDATE_RESPONSE_ERROR'
            });
        }
    }

    async submitResponse(req, res) {
        try {
            const responseId = req.params.responseId;

            // Verify response ownership
            const ownership = await this.verifyResponseOwnership(req, responseId);
            if (!ownership.allowed) {
                return res.status(403).json(ownership.error);
            }

            // Check current status
            const currentResponse = await req.app.locals.db.query(`
                SELECT status FROM patient_responses WHERE id = $1
            `, [responseId]);

            if (currentResponse.rows[0].status === 'submitted' || currentResponse.rows[0].status === 'reviewed') {
                return res.status(400).json({
                    error: 'Response already submitted',
                    code: 'RESPONSE_ALREADY_SUBMITTED'
                });
            }

            // Submit response
            const result = await req.app.locals.db.query(`
                UPDATE patient_responses 
                SET status = 'submitted',
                    submitted_at = NOW(),
                    completed_at = COALESCE(completed_at, NOW()),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id, status, submitted_at, completed_at
            `, [responseId]);

            res.json({
                success: true,
                message: 'Response submitted successfully',
                response: {
                    id: result.rows[0].id,
                    status: result.rows[0].status,
                    submittedAt: result.rows[0].submitted_at,
                    completedAt: result.rows[0].completed_at
                }
            });

        } catch (error) {
            console.error('Submit response error:', error);
            res.status(500).json({
                error: 'Failed to submit response',
                code: 'SUBMIT_RESPONSE_ERROR'
            });
        }
    }

    // Helper methods
    async verifyQuestionnaireAccess(req, questionnaireId) {
        if (req.user.userType === 'patient') {
            const access = await req.app.locals.db.query(`
                SELECT 1 FROM patient_questionnaire_access 
                WHERE patient_id = $1 AND questionnaire_id = $2 AND is_active = true
                AND (access_expires_at IS NULL OR access_expires_at > NOW())
            `, [req.user.id, questionnaireId]);

            if (access.rows.length === 0) {
                return {
                    allowed: false,
                    error: {
                        error: 'Access denied',
                        message: 'You do not have access to this questionnaire',
                        code: 'QUESTIONNAIRE_ACCESS_DENIED'
                    }
                };
            }
        }

        return { allowed: true };
    }

    async verifyResponseOwnership(req, responseId) {
        const ownership = await req.app.locals.db.query(`
            SELECT patient_id FROM patient_responses WHERE id = $1
        `, [responseId]);

        if (ownership.rows.length === 0) {
            return {
                allowed: false,
                error: {
                    error: 'Response not found',
                    code: 'RESPONSE_NOT_FOUND'
                }
            };
        }

        if (req.user.userType === 'patient' && ownership.rows[0].patient_id !== req.user.id) {
            return {
                allowed: false,
                error: {
                    error: 'Access denied',
                    message: 'You can only modify your own responses',
                    code: 'RESPONSE_ACCESS_DENIED'
                }
            };
        }

        return { allowed: true };
    }

    encryptResponseData(data) {
        const cipher = crypto.createCipher('aes-256-cbc', 'dev_encryption_key');
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    decryptResponseData(encryptedData) {
        const decipher = crypto.createDecipher('aes-256-cbc', 'dev_encryption_key');
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }

    // Placeholder methods for remaining endpoints
    async deleteResponse(req, res) {
        res.json({ success: true, message: 'Delete response endpoint - implementation pending' });
    }

    async autoSaveResponse(req, res) {
        res.json({ success: true, message: 'Auto-save response endpoint - implementation pending' });
    }

    async reviewResponse(req, res) {
        res.json({ success: true, message: 'Review response endpoint - implementation pending' });
    }

    async addComment(req, res) {
        res.json({ success: true, message: 'Add comment endpoint - implementation pending' });
    }

    async exportResponses(req, res) {
        res.json({ success: true, message: 'Export responses endpoint - implementation pending' });
    }

    async bulkReviewResponses(req, res) {
        res.json({ success: true, message: 'Bulk review endpoint - implementation pending' });
    }

    async getResponseAnalytics(req, res) {
        res.json({ success: true, message: 'Response analytics endpoint - implementation pending' });
    }

    async getCompletionRates(req, res) {
        res.json({ success: true, message: 'Completion rates endpoint - implementation pending' });
    }
}

// Initialize controller
new ResponseController();

module.exports = router;