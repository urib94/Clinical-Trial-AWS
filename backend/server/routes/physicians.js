const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');
const ErrorHandler = require('../middleware/error-handler');

const router = express.Router();

// All physician routes require physician authentication
router.use(AuthMiddleware.requirePhysician);

class PhysicianController {
    constructor() {
        this.setupRoutes();
    }

    setupRoutes() {
        // Dashboard endpoints
        router.get('/dashboard', this.getDashboard.bind(this));
        router.get('/dashboard/stats', this.getDashboardStats.bind(this));
        
        // Profile management
        router.get('/profile', this.getProfile.bind(this));
        router.put('/profile', ValidationMiddleware.physicianProfileValidation(), this.updateProfile.bind(this));
        
        // Patient management
        router.get('/patients', ValidationMiddleware.paginationValidation(), this.getPatients.bind(this));
        router.get('/patients/:patientId', this.getPatientDetail.bind(this));
        router.post('/patients/invite', this.invitePatient.bind(this));
        router.put('/patients/:patientId/relationship', this.updatePatientRelationship.bind(this));
        
        // Study management
        router.get('/studies', ValidationMiddleware.paginationValidation(), this.getStudies.bind(this));
        router.get('/studies/:studyId', AuthMiddleware.requireStudyAccess(), this.getStudyDetail.bind(this));
        router.get('/studies/:studyId/patients', AuthMiddleware.requireStudyAccess(), this.getStudyPatients.bind(this));
        router.get('/studies/:studyId/analytics', AuthMiddleware.requireStudyAccess(), this.getStudyAnalytics.bind(this));
        
        // Questionnaire management
        router.get('/questionnaires', ValidationMiddleware.paginationValidation(), this.getQuestionnaires.bind(this));
        router.post('/questionnaires', ValidationMiddleware.questionnaireValidation(), this.createQuestionnaire.bind(this));
        router.put('/questionnaires/:questionnaireId', ValidationMiddleware.questionnaireValidation(), this.updateQuestionnaire.bind(this));
        router.delete('/questionnaires/:questionnaireId', this.deleteQuestionnaire.bind(this));
        router.post('/questionnaires/:questionnaireId/assign', this.assignQuestionnaire.bind(this));
        
        // Response management
        router.get('/responses', ValidationMiddleware.paginationValidation(), this.getResponses.bind(this));
        router.get('/responses/:responseId', this.getResponseDetail.bind(this));
        router.put('/responses/:responseId/review', this.reviewResponse.bind(this));
        router.get('/responses/export/:format', this.exportResponses.bind(this));
        
        // Media management
        router.get('/media', ValidationMiddleware.paginationValidation(), this.getMediaFiles.bind(this));
        router.get('/media/:mediaId', this.getMediaDetail.bind(this));
        
        // Notifications
        router.get('/notifications', this.getNotifications.bind(this));
        router.put('/notifications/:notificationId/read', this.markNotificationRead.bind(this));
    }

    // Dashboard endpoints
    async getDashboard(req, res) {
        try {
            const physicianId = req.user.id;
            
            // Get dashboard overview data
            const [
                patientCountResult,
                activeStudiesResult,
                pendingResponsesResult,
                recentActivityResult
            ] = await Promise.all([
                // Total patients under care
                req.app.locals.db.query(`
                    SELECT COUNT(*) as count FROM physician_patient_relationships 
                    WHERE physician_id = $1 AND is_active = true
                `, [physicianId]),
                
                // Active studies
                req.app.locals.db.query(`
                    SELECT COUNT(*) as count FROM study_physicians sp
                    JOIN studies s ON sp.study_id = s.id
                    WHERE sp.physician_id = $1 AND sp.is_active = true AND s.status = 'active'
                `, [physicianId]),
                
                // Pending responses
                req.app.locals.db.query(`
                    SELECT COUNT(*) as count FROM patient_responses pr
                    JOIN physician_patient_relationships ppr ON pr.patient_id = ppr.patient_id
                    WHERE ppr.physician_id = $1 AND ppr.is_active = true 
                    AND pr.status IN ('in_progress', 'completed')
                `, [physicianId]),
                
                // Recent activity
                req.app.locals.db.query(`
                    SELECT pr.id, pr.status, pr.completed_at, pr.submitted_at,
                           q.title as questionnaire_title,
                           p.id as patient_id
                    FROM patient_responses pr
                    JOIN questionnaires q ON pr.questionnaire_id = q.id
                    JOIN patients p ON pr.patient_id = p.id
                    JOIN physician_patient_relationships ppr ON p.id = ppr.patient_id
                    WHERE ppr.physician_id = $1 AND ppr.is_active = true
                    ORDER BY COALESCE(pr.submitted_at, pr.completed_at, pr.updated_at) DESC
                    LIMIT 10
                `, [physicianId])
            ]);

            res.json({
                success: true,
                dashboard: {
                    overview: {
                        totalPatients: parseInt(patientCountResult.rows[0].count),
                        activeStudies: parseInt(activeStudiesResult.rows[0].count),
                        pendingResponses: parseInt(pendingResponsesResult.rows[0].count)
                    },
                    recentActivity: recentActivityResult.rows.map(activity => ({
                        id: activity.id,
                        type: 'response',
                        title: activity.questionnaire_title,
                        patientId: activity.patient_id,
                        status: activity.status,
                        timestamp: activity.submitted_at || activity.completed_at
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

    async getDashboardStats(req, res) {
        try {
            const physicianId = req.user.id;
            const timeframe = req.query.timeframe || '30'; // days
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(timeframe));

            const stats = await req.app.locals.db.query(`
                SELECT 
                    COUNT(DISTINCT pr.patient_id) as active_patients,
                    COUNT(pr.id) as total_responses,
                    COUNT(CASE WHEN pr.status = 'completed' THEN 1 END) as completed_responses,
                    COUNT(CASE WHEN pr.status = 'in_progress' THEN 1 END) as in_progress_responses,
                    AVG(CASE WHEN pr.completed_at IS NOT NULL 
                        THEN EXTRACT(EPOCH FROM (pr.completed_at - pr.started_at))/60 
                        END) as avg_completion_time_minutes
                FROM patient_responses pr
                JOIN physician_patient_relationships ppr ON pr.patient_id = ppr.patient_id
                WHERE ppr.physician_id = $1 AND ppr.is_active = true
                AND pr.created_at >= $2
            `, [physicianId, startDate]);

            res.json({
                success: true,
                stats: {
                    timeframe: `${timeframe} days`,
                    activePatients: parseInt(stats.rows[0].active_patients) || 0,
                    totalResponses: parseInt(stats.rows[0].total_responses) || 0,
                    completedResponses: parseInt(stats.rows[0].completed_responses) || 0,
                    inProgressResponses: parseInt(stats.rows[0].in_progress_responses) || 0,
                    avgCompletionTime: Math.round(parseFloat(stats.rows[0].avg_completion_time_minutes) || 0)
                }
            });

        } catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({
                error: 'Failed to load dashboard statistics',
                code: 'DASHBOARD_STATS_ERROR'
            });
        }
    }

    // Profile management
    async getProfile(req, res) {
        try {
            const physicianId = req.user.id;
            
            const profile = await req.app.locals.db.query(`
                SELECT p.id, p.email, p.first_name, p.last_name, p.title, p.specialization,
                       p.license_number, p.phone, p.department, p.role, p.permissions,
                       p.status, p.profile_completed, p.mfa_enabled, p.created_at,
                       o.name as organization_name, o.type as organization_type
                FROM physicians p
                LEFT JOIN organizations o ON p.organization_id = o.id
                WHERE p.id = $1
            `, [physicianId]);

            if (profile.rows.length === 0) {
                return res.status(404).json({
                    error: 'Profile not found',
                    code: 'PROFILE_NOT_FOUND'
                });
            }

            const physicianData = profile.rows[0];

            res.json({
                success: true,
                profile: {
                    id: physicianData.id,
                    email: physicianData.email,
                    firstName: physicianData.first_name,
                    lastName: physicianData.last_name,
                    title: physicianData.title,
                    specialization: physicianData.specialization,
                    licenseNumber: physicianData.license_number,
                    phone: physicianData.phone,
                    department: physicianData.department,
                    role: physicianData.role,
                    permissions: physicianData.permissions || [],
                    status: physicianData.status,
                    profileCompleted: physicianData.profile_completed,
                    mfaEnabled: physicianData.mfa_enabled,
                    organization: {
                        name: physicianData.organization_name,
                        type: physicianData.organization_type
                    },
                    createdAt: physicianData.created_at
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
            const physicianId = req.user.id;
            const {
                firstName, lastName, title, specialization, licenseNumber,
                phone, department, role
            } = req.body;

            const result = await req.app.locals.db.query(`
                UPDATE physicians 
                SET first_name = COALESCE($2, first_name),
                    last_name = COALESCE($3, last_name),
                    title = COALESCE($4, title),
                    specialization = COALESCE($5, specialization),
                    license_number = COALESCE($6, license_number),
                    phone = COALESCE($7, phone),
                    department = COALESCE($8, department),
                    role = COALESCE($9, role),
                    profile_completed = true,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id, first_name, last_name, title, specialization, license_number,
                          phone, department, role, profile_completed
            `, [physicianId, firstName, lastName, title, specialization, 
                licenseNumber, phone, department, role]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Profile not found',
                    code: 'PROFILE_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                profile: result.rows[0]
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                error: 'Failed to update profile',
                code: 'PROFILE_UPDATE_ERROR'
            });
        }
    }

    // Patient management methods
    async getPatients(req, res) {
        try {
            const physicianId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const search = req.query.search || '';
            const status = req.query.status || '';

            let whereClause = 'WHERE ppr.physician_id = $1 AND ppr.is_active = true';
            let params = [physicianId];
            let paramCount = 1;

            if (search) {
                paramCount++;
                whereClause += ` AND (p.patient_id ILIKE $${paramCount} OR p.email ILIKE $${paramCount})`;
                params.push(`%${search}%`);
            }

            if (status) {
                paramCount++;
                whereClause += ` AND p.status = $${paramCount}`;
                params.push(status);
            }

            const patients = await req.app.locals.db.query(`
                SELECT p.id, p.email, p.patient_id, p.status, p.enrollment_date,
                       ppr.relationship_type, ppr.started_at as relationship_started,
                       COUNT(pr.id) as total_responses,
                       COUNT(CASE WHEN pr.status = 'completed' THEN 1 END) as completed_responses
                FROM patients p
                JOIN physician_patient_relationships ppr ON p.id = ppr.patient_id
                LEFT JOIN patient_responses pr ON p.id = pr.patient_id
                ${whereClause}
                GROUP BY p.id, p.email, p.patient_id, p.status, p.enrollment_date,
                         ppr.relationship_type, ppr.started_at
                ORDER BY ppr.started_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `, [...params, limit, offset]);

            const totalCount = await req.app.locals.db.query(`
                SELECT COUNT(DISTINCT p.id) as count
                FROM patients p
                JOIN physician_patient_relationships ppr ON p.id = ppr.patient_id
                ${whereClause}
            `, params);

            res.json({
                success: true,
                patients: patients.rows,
                pagination: {
                    page,
                    limit,
                    total: parseInt(totalCount.rows[0].count),
                    pages: Math.ceil(totalCount.rows[0].count / limit)
                }
            });

        } catch (error) {
            console.error('Get patients error:', error);
            res.status(500).json({
                error: 'Failed to load patients',
                code: 'PATIENTS_ERROR'
            });
        }
    }

    // Placeholder methods for remaining endpoints
    async getPatientDetail(req, res) {
        res.json({ success: true, message: 'Patient detail endpoint - implementation pending' });
    }

    async invitePatient(req, res) {
        res.json({ success: true, message: 'Invite patient endpoint - implementation pending' });
    }

    async updatePatientRelationship(req, res) {
        res.json({ success: true, message: 'Update patient relationship endpoint - implementation pending' });
    }

    async getStudies(req, res) {
        res.json({ success: true, message: 'Get studies endpoint - implementation pending' });
    }

    async getStudyDetail(req, res) {
        res.json({ success: true, message: 'Study detail endpoint - implementation pending' });
    }

    async getStudyPatients(req, res) {
        res.json({ success: true, message: 'Study patients endpoint - implementation pending' });
    }

    async getStudyAnalytics(req, res) {
        res.json({ success: true, message: 'Study analytics endpoint - implementation pending' });
    }

    async getQuestionnaires(req, res) {
        res.json({ success: true, message: 'Get questionnaires endpoint - implementation pending' });
    }

    async createQuestionnaire(req, res) {
        res.json({ success: true, message: 'Create questionnaire endpoint - implementation pending' });
    }

    async updateQuestionnaire(req, res) {
        res.json({ success: true, message: 'Update questionnaire endpoint - implementation pending' });
    }

    async deleteQuestionnaire(req, res) {
        res.json({ success: true, message: 'Delete questionnaire endpoint - implementation pending' });
    }

    async assignQuestionnaire(req, res) {
        res.json({ success: true, message: 'Assign questionnaire endpoint - implementation pending' });
    }

    async getResponses(req, res) {
        res.json({ success: true, message: 'Get responses endpoint - implementation pending' });
    }

    async getResponseDetail(req, res) {
        res.json({ success: true, message: 'Response detail endpoint - implementation pending' });
    }

    async reviewResponse(req, res) {
        res.json({ success: true, message: 'Review response endpoint - implementation pending' });
    }

    async exportResponses(req, res) {
        res.json({ success: true, message: 'Export responses endpoint - implementation pending' });
    }

    async getMediaFiles(req, res) {
        res.json({ success: true, message: 'Get media files endpoint - implementation pending' });
    }

    async getMediaDetail(req, res) {
        res.json({ success: true, message: 'Media detail endpoint - implementation pending' });
    }

    async getNotifications(req, res) {
        res.json({ success: true, message: 'Get notifications endpoint - implementation pending' });
    }

    async markNotificationRead(req, res) {
        res.json({ success: true, message: 'Mark notification read endpoint - implementation pending' });
    }
}

// Initialize controller
new PhysicianController();

module.exports = router;