const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';

class AuthMiddleware {
    // Require authentication for protected routes
    static async requireAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'Please provide a valid authorization token',
                    code: 'AUTH_REQUIRED'
                });
            }

            const token = authHeader.substring(7);
            
            // Check if token is blacklisted
            const blacklisted = await req.app.locals.db.query(
                'SELECT 1 FROM token_blacklist WHERE jti = $1 AND expires_at > NOW()',
                [AuthMiddleware.getTokenId(token)]
            );

            if (blacklisted.rows.length > 0) {
                return res.status(401).json({
                    error: 'Token has been revoked',
                    message: 'This authentication token is no longer valid',
                    code: 'TOKEN_REVOKED'
                });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Validate session
            const session = await req.app.locals.db.query(
                'SELECT * FROM user_sessions WHERE token_id = $1 AND is_active = true',
                [decoded.jti]
            );

            if (session.rows.length === 0) {
                return res.status(401).json({
                    error: 'Session not found or expired',
                    message: 'Please log in again to continue',
                    code: 'SESSION_INVALID'
                });
            }

            // Check session timeout (30 minutes of inactivity)
            const lastActivity = new Date(session.rows[0].last_activity);
            const now = new Date();
            const thirtyMinutes = 30 * 60 * 1000;
            
            if (now - lastActivity > thirtyMinutes) {
                // End expired session
                await req.app.locals.db.query(
                    'UPDATE user_sessions SET is_active = false, ended_at = NOW() WHERE id = $1',
                    [session.rows[0].id]
                );
                
                return res.status(401).json({
                    error: 'Session expired due to inactivity',
                    message: 'Please log in again to continue',
                    code: 'SESSION_TIMEOUT'
                });
            }

            // Update last activity
            await req.app.locals.db.query(
                'UPDATE user_sessions SET last_activity = NOW() WHERE token_id = $1',
                [decoded.jti]
            );

            // Attach user info to request
            req.user = {
                id: decoded.sub,
                email: decoded.email,
                userType: decoded.userType,
                jti: decoded.jti
            };
            req.sessionId = session.rows[0].id;
            
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Invalid token',
                    message: 'The provided authentication token is malformed',
                    code: 'TOKEN_INVALID'
                });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    message: 'Authentication token has expired, please log in again',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            console.error('Auth middleware error:', error);
            res.status(500).json({
                error: 'Authentication error',
                message: 'An error occurred while verifying authentication',
                code: 'AUTH_ERROR'
            });
        }
    }

    // Require specific user type (physician or patient)
    static requireUserType(userType) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            if (req.user.userType !== userType) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    message: `This endpoint requires ${userType} access`,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    required: userType,
                    current: req.user.userType
                });
            }

            next();
        };
    }

    // Require physician access
    static requirePhysician(req, res, next) {
        return AuthMiddleware.requireUserType('physician')(req, res, next);
    }

    // Require patient access
    static requirePatient(req, res, next) {
        return AuthMiddleware.requireUserType('patient')(req, res, next);
    }

    // Optional authentication - continues even if not authenticated
    static optionalAuth(req, res, next) {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // Continue without authentication
        }

        // Try to authenticate, but don't fail if it doesn't work
        AuthMiddleware.requireAuth(req, res, (error) => {
            if (error) {
                // Clear any partial auth info and continue
                req.user = null;
            }
            next();
        });
    }

    // Check if user has specific permissions
    static requirePermission(permission) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                const table = req.user.userType === 'physician' ? 'physicians' : 'patients';
                const userQuery = await req.app.locals.db.query(
                    `SELECT permissions FROM ${table} WHERE id = $1`,
                    [req.user.id]
                );

                if (userQuery.rows.length === 0) {
                    return res.status(404).json({
                        error: 'User not found',
                        code: 'USER_NOT_FOUND'
                    });
                }

                const permissions = userQuery.rows[0].permissions || [];
                
                if (!permissions.includes(permission)) {
                    return res.status(403).json({
                        error: 'Insufficient permissions',
                        message: `This action requires '${permission}' permission`,
                        code: 'INSUFFICIENT_PERMISSIONS',
                        required: permission
                    });
                }

                next();
            } catch (error) {
                console.error('Permission check error:', error);
                res.status(500).json({
                    error: 'Permission check failed',
                    code: 'PERMISSION_ERROR'
                });
            }
        };
    }

    // Check if user can access specific patient data
    static requirePatientAccess(patientIdParam = 'patientId') {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                const patientId = req.params[patientIdParam] || req.body[patientIdParam];
                
                if (!patientId) {
                    return res.status(400).json({
                        error: 'Patient ID required',
                        code: 'PATIENT_ID_REQUIRED'
                    });
                }

                // Patients can only access their own data
                if (req.user.userType === 'patient') {
                    if (req.user.id.toString() !== patientId.toString()) {
                        return res.status(403).json({
                            error: 'Access denied',
                            message: 'Patients can only access their own data',
                            code: 'ACCESS_DENIED'
                        });
                    }
                    return next();
                }

                // Physicians can access patients they have relationships with
                if (req.user.userType === 'physician') {
                    const relationship = await req.app.locals.db.query(`
                        SELECT 1 FROM physician_patient_relationships 
                        WHERE physician_id = $1 AND patient_id = $2 AND is_active = true
                    `, [req.user.id, patientId]);

                    if (relationship.rows.length === 0) {
                        return res.status(403).json({
                            error: 'Access denied',
                            message: 'You do not have access to this patient\'s data',
                            code: 'PATIENT_ACCESS_DENIED'
                        });
                    }
                }

                next();
            } catch (error) {
                console.error('Patient access check error:', error);
                res.status(500).json({
                    error: 'Access check failed',
                    code: 'ACCESS_CHECK_ERROR'
                });
            }
        };
    }

    // Check if user can access specific study data
    static requireStudyAccess(studyIdParam = 'studyId') {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                const studyId = req.params[studyIdParam] || req.body[studyIdParam];
                
                if (!studyId) {
                    return res.status(400).json({
                        error: 'Study ID required',
                        code: 'STUDY_ID_REQUIRED'
                    });
                }

                // Check access based on user type
                if (req.user.userType === 'physician') {
                    const studyAccess = await req.app.locals.db.query(`
                        SELECT role, permissions FROM study_physicians 
                        WHERE physician_id = $1 AND study_id = $2 AND is_active = true
                    `, [req.user.id, studyId]);

                    if (studyAccess.rows.length === 0) {
                        return res.status(403).json({
                            error: 'Access denied',
                            message: 'You do not have access to this study',
                            code: 'STUDY_ACCESS_DENIED'
                        });
                    }

                    req.studyRole = studyAccess.rows[0].role;
                    req.studyPermissions = studyAccess.rows[0].permissions || [];
                } else if (req.user.userType === 'patient') {
                    const enrollment = await req.app.locals.db.query(`
                        SELECT enrollment_status FROM patient_studies 
                        WHERE patient_id = $1 AND study_id = $2
                    `, [req.user.id, studyId]);

                    if (enrollment.rows.length === 0 || enrollment.rows[0].enrollment_status !== 'enrolled') {
                        return res.status(403).json({
                            error: 'Access denied',
                            message: 'You are not enrolled in this study',
                            code: 'STUDY_NOT_ENROLLED'
                        });
                    }
                }

                next();
            } catch (error) {
                console.error('Study access check error:', error);
                res.status(500).json({
                    error: 'Study access check failed',
                    code: 'STUDY_ACCESS_ERROR'
                });
            }
        };
    }

    // Rate limiting middleware for sensitive operations
    static rateLimitSensitive(windowMs = 15 * 60 * 1000, maxAttempts = 5) {
        return async (req, res, next) => {
            try {
                const identifier = req.user ? req.user.email : req.ip;
                const windowStart = new Date(Date.now() - windowMs);

                const attempts = await req.app.locals.db.query(`
                    SELECT COUNT(*) as count FROM rate_limit_log 
                    WHERE identifier = $1 AND rate_limit_type = 'sensitive' AND created_at > $2
                `, [identifier, windowStart]);

                if (attempts.rows[0].count >= maxAttempts) {
                    return res.status(429).json({
                        error: 'Rate limit exceeded',
                        message: 'Too many attempts for this operation',
                        code: 'RATE_LIMIT_EXCEEDED'
                    });
                }

                // Log this attempt
                await req.app.locals.db.query(`
                    INSERT INTO rate_limit_log (rate_limit_type, identifier) 
                    VALUES ('sensitive', $1)
                `, [identifier]);

                next();
            } catch (error) {
                console.error('Rate limit error:', error);
                next(); // Continue on error to avoid blocking legitimate requests
            }
        };
    }

    // Helper method to extract token ID
    static getTokenId(token) {
        try {
            const decoded = jwt.decode(token);
            return decoded?.jti || null;
        } catch {
            return null;
        }
    }

    // Middleware to log all authenticated requests
    static logAuthenticatedRequest(req, res, next) {
        if (req.user) {
            console.log(`🔐 Authenticated request: ${req.user.userType} ${req.user.email} -> ${req.method} ${req.path}`);
        }
        next();
    }
}

module.exports = AuthMiddleware;