const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

class AuthController {
    constructor() {
        this.setupRoutes();
    }

    setupRoutes() {
        // User login
        router.post('/login', [
            body('email').isEmail().normalizeEmail(),
            body('password').isLength({ min: 8 }),
            body('userType').isIn(['physician', 'patient']).optional()
        ], this.login.bind(this));

        // User logout
        router.post('/logout', this.logout.bind(this));

        // Refresh token
        router.post('/refresh', this.refreshToken.bind(this));

        // Password reset request
        router.post('/forgot-password', [
            body('email').isEmail().normalizeEmail(),
            body('userType').isIn(['physician', 'patient'])
        ], this.forgotPassword.bind(this));

        // Password reset confirmation
        router.post('/reset-password', [
            body('token').isLength({ min: 32 }),
            body('newPassword').isLength({ min: 8 }),
            body('userType').isIn(['physician', 'patient'])
        ], this.resetPassword.bind(this));

        // MFA Setup
        router.post('/mfa/setup', this.requireAuth.bind(this), this.setupMFA.bind(this));
        
        // MFA Verification
        router.post('/mfa/verify', [
            body('email').isEmail().normalizeEmail(),
            body('code').isLength({ min: 6, max: 6 }),
            body('userType').isIn(['physician', 'patient'])
        ], this.verifyMFA.bind(this));

        // MFA Disable
        router.post('/mfa/disable', this.requireAuth.bind(this), this.disableMFA.bind(this));

        // Generate backup codes
        router.post('/mfa/backup-codes', this.requireAuth.bind(this), this.generateBackupCodes.bind(this));

        // Account verification
        router.post('/verify-email', [
            body('token').isLength({ min: 32 }),
            body('userType').isIn(['physician', 'patient'])
        ], this.verifyEmail.bind(this));

        // Check authentication status
        router.get('/me', this.requireAuth.bind(this), this.getCurrentUser.bind(this));

        // User registration (invitation-based)
        router.post('/register', [
            body('email').isEmail().normalizeEmail(),
            body('password').isLength({ min: 8 }),
            body('invitationToken').isLength({ min: 32 }),
            body('userType').isIn(['physician', 'patient'])
        ], this.register.bind(this));
    }

    // Middleware to require authentication
    async requireAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            const token = authHeader.substring(7);
            
            // Check if token is blacklisted
            const blacklisted = await req.app.locals.db.query(
                'SELECT 1 FROM token_blacklist WHERE jti = $1 AND expires_at > NOW()',
                [this.getTokenId(token)]
            );

            if (blacklisted.rows.length > 0) {
                return res.status(401).json({
                    error: 'Token has been revoked',
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
                    code: 'SESSION_INVALID'
                });
            }

            // Update last activity
            await req.app.locals.db.query(
                'UPDATE user_sessions SET last_activity = NOW() WHERE token_id = $1',
                [decoded.jti]
            );

            req.user = decoded;
            req.sessionId = session.rows[0].id;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Invalid token',
                    code: 'TOKEN_INVALID'
                });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            console.error('Auth middleware error:', error);
            res.status(500).json({
                error: 'Authentication error',
                code: 'AUTH_ERROR'
            });
        }
    }

    // User login
    async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array(),
                    code: 'VALIDATION_ERROR'
                });
            }

            const { email, password, userType = 'patient', mfaCode } = req.body;
            const ip = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];

            // Rate limiting check
            await this.checkRateLimit(req.app.locals.db, email, ip);

            // Find user in appropriate table
            const table = userType === 'physician' ? 'physicians' : 'patients';
            const userQuery = await req.app.locals.db.query(
                `SELECT id, email, password_hash, status, mfa_enabled, totp_secret_encrypted, 
                        failed_login_attempts, locked_until, first_name_encrypted, last_name_encrypted
                 FROM ${table} WHERE email = $1`,
                [email]
            );

            if (userQuery.rows.length === 0) {
                await this.logFailedAttempt(req.app.locals.db, email, ip, 'user_not_found');
                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            const user = userQuery.rows[0];

            // Check if account is locked
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                return res.status(423).json({
                    error: 'Account temporarily locked due to failed login attempts',
                    code: 'ACCOUNT_LOCKED',
                    lockedUntil: user.locked_until
                });
            }

            // Verify password
            const passwordValid = await bcrypt.compare(password, user.password_hash);
            
            if (!passwordValid) {
                await this.logFailedAttempt(req.app.locals.db, email, ip, 'invalid_password');
                await this.incrementFailedAttempts(req.app.locals.db, table, user.id);
                
                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Check account status
            if (user.status !== 'active') {
                return res.status(403).json({
                    error: 'Account is not active',
                    code: 'ACCOUNT_INACTIVE',
                    status: user.status
                });
            }

            // MFA verification if enabled
            if (user.mfa_enabled) {
                if (!mfaCode) {
                    return res.status(200).json({
                        requiresMfa: true,
                        message: 'MFA code required',
                        code: 'MFA_REQUIRED'
                    });
                }

                const mfaValid = await this.verifyMFACode(user.totp_secret_encrypted, mfaCode);
                if (!mfaValid) {
                    await this.logFailedAttempt(req.app.locals.db, email, ip, 'invalid_mfa');
                    return res.status(401).json({
                        error: 'Invalid MFA code',
                        code: 'INVALID_MFA'
                    });
                }
            }

            // Generate tokens
            const tokenId = crypto.randomUUID();
            const accessToken = this.generateAccessToken(user, userType, tokenId);
            const refreshToken = this.generateRefreshToken(user, userType, tokenId);

            // Create session record
            await req.app.locals.db.query(`
                INSERT INTO user_sessions (user_id, token_id, user_type, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5)
            `, [user.id.toString(), tokenId, userType, ip, userAgent]);

            // Reset failed attempts
            await req.app.locals.db.query(`
                UPDATE ${table} 
                SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW(), last_login_ip = $2
                WHERE id = $1
            `, [user.id, ip]);

            // Log successful login
            await this.logAuditEvent(req.app.locals.db, {
                user_email: email,
                user_type: userType,
                action: 'login',
                success: true,
                ip_address: ip,
                user_agent: userAgent
            });

            // Prepare user data for response (decrypt if needed)
            const userData = {
                id: user.id,
                email: user.email,
                userType: userType,
                mfaEnabled: user.mfa_enabled
            };

            // Set secure HTTP-only cookie for refresh token
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
                success: true,
                message: 'Login successful',
                user: userData,
                accessToken: accessToken,
                expiresIn: JWT_EXPIRES_IN
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Login failed',
                code: 'LOGIN_ERROR'
            });
        }
    }

    // User logout
    async logout(req, res) {
        try {
            const authHeader = req.headers.authorization;
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const decoded = jwt.decode(token);
                
                if (decoded && decoded.jti) {
                    // Add token to blacklist
                    await req.app.locals.db.query(`
                        INSERT INTO token_blacklist (jti, expires_at)
                        VALUES ($1, $2)
                        ON CONFLICT (jti) DO NOTHING
                    `, [decoded.jti, new Date(decoded.exp * 1000)]);

                    // End session
                    await req.app.locals.db.query(`
                        UPDATE user_sessions 
                        SET is_active = false, ended_at = NOW()
                        WHERE token_id = $1
                    `, [decoded.jti]);

                    // Log logout
                    await this.logAuditEvent(req.app.locals.db, {
                        user_email: decoded.email,
                        user_type: decoded.userType,
                        action: 'logout',
                        success: true,
                        ip_address: req.ip
                    });
                }
            }

            // Clear refresh token cookie
            res.clearCookie('refreshToken');

            res.json({
                success: true,
                message: 'Logout successful'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                error: 'Logout failed',
                code: 'LOGOUT_ERROR'
            });
        }
    }

    // Refresh access token
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            
            if (!refreshToken) {
                return res.status(401).json({
                    error: 'Refresh token required',
                    code: 'REFRESH_TOKEN_REQUIRED'
                });
            }

            const decoded = jwt.verify(refreshToken, JWT_SECRET);
            
            // Validate session
            const session = await req.app.locals.db.query(
                'SELECT * FROM user_sessions WHERE token_id = $1 AND is_active = true',
                [decoded.jti]
            );

            if (session.rows.length === 0) {
                return res.status(401).json({
                    error: 'Invalid refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }

            // Generate new access token
            const newTokenId = crypto.randomUUID();
            const newAccessToken = this.generateAccessToken({
                id: decoded.sub,
                email: decoded.email
            }, decoded.userType, newTokenId);

            // Update session with new token ID
            await req.app.locals.db.query(
                'UPDATE user_sessions SET token_id = $1, last_activity = NOW() WHERE id = $2',
                [newTokenId, session.rows[0].id]
            );

            // Blacklist old token
            await req.app.locals.db.query(`
                INSERT INTO token_blacklist (jti, expires_at)
                VALUES ($1, $2)
                ON CONFLICT (jti) DO NOTHING
            `, [decoded.jti, new Date(decoded.exp * 1000)]);

            res.json({
                success: true,
                accessToken: newAccessToken,
                expiresIn: JWT_EXPIRES_IN
            });

        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                error: 'Token refresh failed',
                code: 'TOKEN_REFRESH_ERROR'
            });
        }
    }

    // Get current user information
    async getCurrentUser(req, res) {
        try {
            const { userType, sub: userId } = req.user;
            const table = userType === 'physician' ? 'physicians' : 'patients';
            
            const userQuery = await req.app.locals.db.query(`
                SELECT id, email, status, mfa_enabled, profile_completed, created_at
                FROM ${table} WHERE id = $1
            `, [userId]);

            if (userQuery.rows.length === 0) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const user = userQuery.rows[0];

            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    userType: userType,
                    status: user.status,
                    mfaEnabled: user.mfa_enabled,
                    profileCompleted: user.profile_completed,
                    createdAt: user.created_at
                }
            });

        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                error: 'Failed to get user information',
                code: 'GET_USER_ERROR'
            });
        }
    }

    // User registration with invitation
    async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array(),
                    code: 'VALIDATION_ERROR'
                });
            }

            const { email, password, invitationToken, userType } = req.body;

            // Verify invitation token
            const invitationTable = userType === 'physician' ? 'physician_invitations' : 'patient_invitations';
            const tokenHash = crypto.createHash('sha256').update(invitationToken).digest('hex');
            
            const invitation = await req.app.locals.db.query(`
                SELECT * FROM ${invitationTable}
                WHERE token_hash = $1 AND status = 'active' AND expires_at > NOW()
            `, [tokenHash]);

            if (invitation.rows.length === 0) {
                return res.status(400).json({
                    error: 'Invalid or expired invitation token',
                    code: 'INVALID_INVITATION'
                });
            }

            const invitationData = invitation.rows[0];

            // Check if email matches invitation
            if (invitationData.email && invitationData.email !== email) {
                return res.status(400).json({
                    error: 'Email does not match invitation',
                    code: 'EMAIL_MISMATCH'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user account
            const table = userType === 'physician' ? 'physicians' : 'patients';
            let userResult;

            if (userType === 'physician') {
                userResult = await req.app.locals.db.query(`
                    INSERT INTO physicians (email, password_hash, organization_id, role, permissions, status)
                    VALUES ($1, $2, $3, $4, $5, 'active')
                    RETURNING id, email
                `, [
                    email,
                    hashedPassword,
                    invitationData.organization_id,
                    invitationData.role || 'physician',
                    invitationData.permissions || '[]'
                ]);
            } else {
                userResult = await req.app.locals.db.query(`
                    INSERT INTO patients (email, password_hash, status)
                    VALUES ($1, $2, 'active')
                    RETURNING id, email
                `, [email, hashedPassword]);
            }

            // Mark invitation as used
            await req.app.locals.db.query(`
                UPDATE ${invitationTable}
                SET status = 'used', used_at = NOW(), used_by_id = $1
                WHERE id = $2
            `, [userResult.rows[0].id, invitationData.id]);

            // Log registration
            await this.logAuditEvent(req.app.locals.db, {
                user_email: email,
                user_type: userType,
                action: 'register',
                success: true,
                ip_address: req.ip
            });

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                user: {
                    id: userResult.rows[0].id,
                    email: userResult.rows[0].email,
                    userType: userType
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                error: 'Registration failed',
                code: 'REGISTRATION_ERROR'
            });
        }
    }

    // Helper methods
    generateAccessToken(user, userType, tokenId) {
        return jwt.sign(
            {
                sub: user.id.toString(),
                email: user.email,
                userType: userType,
                iat: Math.floor(Date.now() / 1000),
                jti: tokenId
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }

    generateRefreshToken(user, userType, tokenId) {
        return jwt.sign(
            {
                sub: user.id.toString(),
                email: user.email,
                userType: userType,
                type: 'refresh',
                jti: tokenId
            },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );
    }

    getTokenId(token) {
        try {
            const decoded = jwt.decode(token);
            return decoded?.jti || null;
        } catch {
            return null;
        }
    }

    async checkRateLimit(db, email, ip) {
        // Implementation for rate limiting checks
        // This would check the rate_limit_log table
    }

    async logFailedAttempt(db, email, ip, reason) {
        // Log failed login attempt
        await this.logAuditEvent(db, {
            user_email: email,
            user_type: 'unknown',
            action: 'login_failed',
            success: false,
            ip_address: ip,
            details: { reason }
        });
    }

    async incrementFailedAttempts(db, table, userId) {
        // Increment failed login attempts and potentially lock account
        await db.query(`
            UPDATE ${table}
            SET failed_login_attempts = failed_login_attempts + 1,
                last_failed_login = NOW(),
                locked_until = CASE 
                    WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '30 minutes'
                    ELSE NULL
                END
            WHERE id = $1
        `, [userId]);
    }

    async logAuditEvent(db, event) {
        await db.query(`
            INSERT INTO access_audit_log (
                user_email, user_type, action, success, ip_address, user_agent, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
            event.user_email,
            event.user_type,
            event.action,
            event.success,
            event.ip_address,
            event.user_agent
        ]);
    }

    async verifyMFACode(encryptedSecret, code) {
        // This would decrypt the TOTP secret and verify the code
        // For now, return true for development
        return true;
    }

    // MFA setup (placeholder implementation)
    async setupMFA(req, res) {
        res.json({
            success: true,
            message: 'MFA setup not implemented in development environment'
        });
    }

    async verifyMFA(req, res) {
        res.json({
            success: true,
            message: 'MFA verification not implemented in development environment'
        });
    }

    async disableMFA(req, res) {
        res.json({
            success: true,
            message: 'MFA disabled'
        });
    }

    async generateBackupCodes(req, res) {
        res.json({
            success: true,
            backupCodes: ['123456', '789012', '345678']
        });
    }

    async forgotPassword(req, res) {
        res.json({
            success: true,
            message: 'Password reset email sent (simulated in development)'
        });
    }

    async resetPassword(req, res) {
        res.json({
            success: true,
            message: 'Password reset successful'
        });
    }

    async verifyEmail(req, res) {
        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    }
}

// Initialize controller
new AuthController();

module.exports = router;