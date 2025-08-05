const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

class QuestionnaireController {
    constructor() {
        this.setupRoutes();
    }

    setupRoutes() {
        // Public questionnaire information (with auth)
        router.get('/', ValidationMiddleware.paginationValidation(), this.getQuestionnaires.bind(this));
        router.get('/:questionnaireId', this.getQuestionnaireDetail.bind(this));
        
        // Questionnaire management (physicians only)
        router.post('/', AuthMiddleware.requirePhysician, ValidationMiddleware.questionnaireValidation(), this.createQuestionnaire.bind(this));
        router.put('/:questionnaireId', AuthMiddleware.requirePhysician, ValidationMiddleware.questionnaireValidation(), this.updateQuestionnaire.bind(this));
        router.delete('/:questionnaireId', AuthMiddleware.requirePhysician, this.deleteQuestionnaire.bind(this));
        
        // Questionnaire versioning
        router.post('/:questionnaireId/versions', AuthMiddleware.requirePhysician, this.createVersion.bind(this));
        router.get('/:questionnaireId/versions', this.getVersions.bind(this));
        
        // Questionnaire assignment
        router.post('/:questionnaireId/assign', AuthMiddleware.requirePhysician, this.assignToPatients.bind(this));
        router.delete('/:questionnaireId/assign/:patientId', AuthMiddleware.requirePhysician, this.removeAssignment.bind(this));
        
        // Questionnaire analytics
        router.get('/:questionnaireId/analytics', AuthMiddleware.requirePhysician, this.getAnalytics.bind(this));
        router.get('/:questionnaireId/responses-summary', AuthMiddleware.requirePhysician, this.getResponsesSummary.bind(this));
    }

    async getQuestionnaires(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const status = req.query.status || 'active';
            const type = req.query.type || '';
            const search = req.query.search || '';

            let whereClause = 'WHERE q.status = $1';
            let params = [status];
            let paramCount = 1;

            // Filter by user access
            if (req.user.userType === 'patient') {
                paramCount++;
                whereClause += ` AND EXISTS (
                    SELECT 1 FROM patient_questionnaire_access pqa 
                    WHERE pqa.questionnaire_id = q.id 
                    AND pqa.patient_id = $${paramCount} 
                    AND pqa.is_active = true
                )`;
                params.push(req.user.id);
            } else if (req.user.userType === 'physician') {
                paramCount++;
                whereClause += ` AND (q.created_by = $${paramCount} OR EXISTS (
                    SELECT 1 FROM study_physicians sp 
                    WHERE sp.study_id = q.study_id 
                    AND sp.physician_id = $${paramCount} 
                    AND sp.is_active = true
                ))`;
                params.push(req.user.id);
            }

            if (type) {
                paramCount++;
                whereClause += ` AND q.questionnaire_type = $${paramCount}`;
                params.push(type);
            }

            if (search) {
                paramCount++;
                whereClause += ` AND (q.title ILIKE $${paramCount} OR q.description ILIKE $${paramCount})`;
                params.push(`%${search}%`);
            }

            const questionnaires = await req.app.locals.db.query(`
                SELECT q.id, q.title, q.description, q.version, q.questionnaire_type,
                       q.frequency, q.is_required, q.estimated_time_minutes,
                       q.status, q.published_at, q.created_at,
                       p.first_name as creator_first_name, p.last_name as creator_last_name,
                       s.title as study_title,
                       COUNT(pr.id) as response_count,
                       COUNT(CASE WHEN pr.status = 'completed' THEN 1 END) as completed_count
                FROM questionnaires q
                LEFT JOIN physicians p ON q.created_by = p.id
                LEFT JOIN studies s ON q.study_id = s.id
                LEFT JOIN patient_responses pr ON q.id = pr.questionnaire_id
                ${whereClause}
                GROUP BY q.id, p.first_name, p.last_name, s.title
                ORDER BY q.created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `, [...params, limit, offset]);

            const totalCount = await req.app.locals.db.query(`
                SELECT COUNT(DISTINCT q.id) as count
                FROM questionnaires q
                ${whereClause}
            `, params);

            res.json({
                success: true,
                questionnaires: questionnaires.rows.map(q => ({
                    id: q.id,
                    title: q.title,
                    description: q.description,
                    version: q.version,
                    type: q.questionnaire_type,
                    frequency: q.frequency,
                    isRequired: q.is_required,
                    estimatedTimeMinutes: q.estimated_time_minutes,
                    status: q.status,
                    publishedAt: q.published_at,
                    createdAt: q.created_at,
                    creator: q.creator_first_name ? `${q.creator_first_name} ${q.creator_last_name}` : null,
                    studyTitle: q.study_title,
                    stats: {
                        totalResponses: parseInt(q.response_count) || 0,
                        completedResponses: parseInt(q.completed_count) || 0
                    }
                })),
                pagination: {
                    page,
                    limit,
                    total: parseInt(totalCount.rows[0].count),
                    pages: Math.ceil(totalCount.rows[0].count / limit)
                }
            });

        } catch (error) {
            console.error('Get questionnaires error:', error);
            res.status(500).json({
                error: 'Failed to load questionnaires',
                code: 'QUESTIONNAIRES_ERROR'
            });
        }
    }

    async getQuestionnaireDetail(req, res) {
        try {
            const questionnaireId = req.params.questionnaireId;
            
            const questionnaire = await req.app.locals.db.query(`
                SELECT q.*, p.first_name as creator_first_name, p.last_name as creator_last_name,
                       s.title as study_title, s.id as study_id
                FROM questionnaires q
                LEFT JOIN physicians p ON q.created_by = p.id
                LEFT JOIN studies s ON q.study_id = s.id
                WHERE q.id = $1
            `, [questionnaireId]);

            if (questionnaire.rows.length === 0) {
                return res.status(404).json({
                    error: 'Questionnaire not found',
                    code: 'QUESTIONNAIRE_NOT_FOUND'
                });
            }

            const q = questionnaire.rows[0];

            // Check access permissions
            if (req.user.userType === 'patient') {
                const access = await req.app.locals.db.query(`
                    SELECT 1 FROM patient_questionnaire_access 
                    WHERE patient_id = $1 AND questionnaire_id = $2 AND is_active = true
                `, [req.user.id, questionnaireId]);

                if (access.rows.length === 0) {
                    return res.status(403).json({
                        error: 'Access denied',
                        message: 'You do not have access to this questionnaire',
                        code: 'QUESTIONNAIRE_ACCESS_DENIED'
                    });
                }
            } else if (req.user.userType === 'physician') {
                const access = await req.app.locals.db.query(`
                    SELECT 1 FROM questionnaires q
                    WHERE q.id = $1 AND (
                        q.created_by = $2 OR EXISTS (
                            SELECT 1 FROM study_physicians sp 
                            WHERE sp.study_id = q.study_id 
                            AND sp.physician_id = $2 
                            AND sp.is_active = true
                        )
                    )
                `, [questionnaireId, req.user.id]);

                if (access.rows.length === 0) {
                    return res.status(403).json({
                        error: 'Access denied',
                        message: 'You do not have access to this questionnaire',
                        code: 'QUESTIONNAIRE_ACCESS_DENIED'
                    });
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
                    scheduleData: q.schedule_data,
                    questions: q.questions,
                    validationRules: q.validation_rules,
                    status: q.status,
                    isRequired: q.is_required,
                    estimatedTimeMinutes: q.estimated_time_minutes,
                    instructions: q.instructions,
                    createdBy: q.creator_first_name ? `${q.creator_first_name} ${q.creator_last_name}` : null,
                    study: {
                        id: q.study_id,
                        title: q.study_title
                    },
                    publishedAt: q.published_at,
                    archivedAt: q.archived_at,
                    createdAt: q.created_at,
                    updatedAt: q.updated_at
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

    async createQuestionnaire(req, res) {
        try {
            const physicianId = req.user.id;
            const {
                title, description, version = '1.0', studyId, questionnaireType,
                frequency, scheduleData, questions, validationRules,
                isRequired = false, estimatedTimeMinutes, instructions
            } = req.body;

            // Verify physician has access to the study
            if (studyId) {
                const studyAccess = await req.app.locals.db.query(`
                    SELECT 1 FROM study_physicians 
                    WHERE physician_id = $1 AND study_id = $2 AND is_active = true
                `, [physicianId, studyId]);

                if (studyAccess.rows.length === 0) {
                    return res.status(403).json({
                        error: 'Access denied',
                        message: 'You do not have access to this study',
                        code: 'STUDY_ACCESS_DENIED'
                    });
                }
            }

            const result = await req.app.locals.db.query(`
                INSERT INTO questionnaires (
                    title, description, version, study_id, questionnaire_type,
                    frequency, schedule_data, questions, validation_rules,
                    is_required, estimated_time_minutes, instructions, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id, title, version, status, created_at
            `, [
                title, description, version, studyId, questionnaireType,
                frequency, JSON.stringify(scheduleData), JSON.stringify(questions),
                JSON.stringify(validationRules), isRequired, estimatedTimeMinutes,
                instructions, physicianId
            ]);

            res.status(201).json({
                success: true,
                message: 'Questionnaire created successfully',
                questionnaire: {
                    id: result.rows[0].id,
                    title: result.rows[0].title,
                    version: result.rows[0].version,
                    status: result.rows[0].status,
                    createdAt: result.rows[0].created_at
                }
            });

        } catch (error) {
            console.error('Create questionnaire error:', error);
            res.status(500).json({
                error: 'Failed to create questionnaire',
                code: 'CREATE_QUESTIONNAIRE_ERROR'
            });
        }
    }

    // Placeholder methods for remaining endpoints
    async updateQuestionnaire(req, res) {
        res.json({ success: true, message: 'Update questionnaire endpoint - implementation pending' });
    }

    async deleteQuestionnaire(req, res) {
        res.json({ success: true, message: 'Delete questionnaire endpoint - implementation pending' });
    }

    async createVersion(req, res) {
        res.json({ success: true, message: 'Create version endpoint - implementation pending' });
    }

    async getVersions(req, res) {
        res.json({ success: true, message: 'Get versions endpoint - implementation pending' });
    }

    async assignToPatients(req, res) {
        res.json({ success: true, message: 'Assign to patients endpoint - implementation pending' });
    }

    async removeAssignment(req, res) {
        res.json({ success: true, message: 'Remove assignment endpoint - implementation pending' });
    }

    async getAnalytics(req, res) {
        res.json({ success: true, message: 'Get analytics endpoint - implementation pending' });
    }

    async getResponsesSummary(req, res) {
        res.json({ success: true, message: 'Get responses summary endpoint - implementation pending' });
    }
}

// Initialize controller
new QuestionnaireController();

module.exports = router;