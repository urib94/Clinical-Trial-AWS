/**
 * Cognito Pre-Authentication Lambda Trigger
 * Enforces MFA and account status validation before authentication
 * Implements rate limiting and security controls
 */

const AWS = require('aws-sdk');

// Initialize AWS services
const rds = new AWS.RDSDataService();
const secretsManager = new AWS.SecretsManager();

// Environment variables
const DATABASE_ARN = process.env.DATABASE_ARN;
const SECRET_ARN = process.env.SECRET_ARN;
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const LOCKOUT_DURATION = parseInt(process.env.LOCKOUT_DURATION || '1800'); // 30 minutes

/**
 * Main Lambda handler for pre-authentication validation
 */
exports.handler = async (event) => {
    console.log('Pre-authentication trigger event:', JSON.stringify(event, null, 2));
    
    try {
        const { userPoolId, request } = event;
        const { userAttributes } = request;
        const email = userAttributes.email;
        const sourceIp = request.clientMetadata?.sourceIp || 'unknown';
        
        // Determine user type based on user pool
        const userType = getUserType(userPoolId);
        
        // Check account status and security
        await validateAccountStatus(email, userType);
        await checkRateLimit(email, sourceIp);
        await validateMFARequirement(email, userType);
        
        // Log authentication attempt
        await auditLog('pre_authentication', email, {
            userType,
            sourceIp,
            userAgent: request.clientMetadata?.userAgent || 'unknown',
            success: true
        });
        
        console.log('Pre-authentication validation successful for:', email);
        return event;
        
    } catch (error) {
        console.error('Pre-authentication validation failed:', error);
        
        // Log failed attempt
        await auditLog('pre_authentication_failed', request.userAttributes?.email || 'unknown', {
            error: error.message,
            sourceIp: request.clientMetadata?.sourceIp || 'unknown',
            userAgent: request.clientMetadata?.userAgent || 'unknown'
        });
        
        // Record failed login attempt
        await recordFailedAttempt(request.userAttributes?.email, request.clientMetadata?.sourceIp);
        
        throw new Error(error.message || 'Authentication validation failed');
    }
};

/**
 * Determine user type based on user pool ID
 */
function getUserType(userPoolId) {
    if (userPoolId.includes('physician')) {
        return 'physician';
    } else if (userPoolId.includes('patient')) {
        return 'patient';
    }
    return null;
}

/**
 * Validate account status and eligibility
 */
async function validateAccountStatus(email, userType) {
    console.log('Validating account status for:', email, 'Type:', userType);
    
    try {
        const tableName = userType === 'physician' ? 'physicians' : 'patients';
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT id, status, locked_until, failed_login_attempts, 
                       email_verified, mfa_enabled, last_login,
                       created_at, updated_at
                FROM ${tableName} 
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } }
            ]
        };
        
        const result = await rds.executeStatement(params).promise();
        
        if (!result.records || result.records.length === 0) {
            throw new Error('Account not found');
        }
        
        const account = result.records[0];
        const status = account[1]?.stringValue;
        const lockedUntil = account[2]?.stringValue;
        const failedAttempts = account[3]?.longValue || 0;
        const emailVerified = account[4]?.booleanValue;
        const mfaEnabled = account[5]?.booleanValue;
        
        // Check account status
        if (status !== 'active') {
            throw new Error(`Account is ${status}. Please contact support.`);
        }
        
        // Check if account is locked
        if (lockedUntil) {
            const lockExpiry = new Date(lockedUntil);
            if (lockExpiry > new Date()) {
                throw new Error('Account is temporarily locked due to multiple failed login attempts');
            } else {
                // Unlock account if lock period has expired
                await unlockAccount(email, userType);
            }
        }
        
        // Check failed login attempts
        if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
            await lockAccount(email, userType);
            throw new Error('Account locked due to too many failed login attempts');
        }
        
        // Verify email is confirmed
        if (!emailVerified) {
            throw new Error('Email address must be verified before login');
        }
        
        console.log('Account status validation successful');
        
    } catch (error) {
        console.error('Account status validation failed:', error);
        throw error;
    }
}

/**
 * Check rate limiting for login attempts
 */
async function checkRateLimit(email, sourceIp) {
    console.log('Checking rate limit for:', email, 'IP:', sourceIp);
    
    try {
        // Check recent login attempts from this IP
        const ipParams = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT COUNT(*) as attempt_count
                FROM audit_logs 
                WHERE ip_address = :ip_address
                AND event_type IN ('pre_authentication', 'pre_authentication_failed')
                AND created_at > NOW() - INTERVAL '1 hour'
            `,
            parameters: [
                { name: 'ip_address', value: { stringValue: sourceIp } }
            ]
        };
        
        const ipResult = await rds.executeStatement(ipParams).promise();
        const ipAttempts = ipResult.records[0][0]?.longValue || 0;
        
        if (ipAttempts > 20) { // 20 attempts per hour per IP
            throw new Error('Too many login attempts from this IP address');
        }
        
        // Check recent failed attempts for this email
        const emailParams = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT COUNT(*) as failed_count
                FROM audit_logs 
                WHERE user_email = :email
                AND event_type = 'pre_authentication_failed'
                AND created_at > NOW() - INTERVAL '15 minutes'
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } }
            ]
        };
        
        const emailResult = await rds.executeStatement(emailParams).promise();
        const emailFailures = emailResult.records[0][0]?.longValue || 0;
        
        if (emailFailures >= 3) { // 3 failures in 15 minutes
            throw new Error('Too many failed login attempts. Please wait before trying again.');
        }
        
        console.log('Rate limit check passed');
        
    } catch (error) {
        console.error('Rate limit check failed:', error);
        throw error;
    }
}

/**
 * Validate MFA requirement
 */
async function validateMFARequirement(email, userType) {
    console.log('Validating MFA requirement for:', email);
    
    try {
        const tableName = userType === 'physician' ? 'physicians' : 'patients';
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT mfa_enabled, mfa_methods, emergency_access_until
                FROM ${tableName} 
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } }
            ]
        };
        
        const result = await rds.executeStatement(params).promise();
        
        if (!result.records || result.records.length === 0) {
            throw new Error('User account not found for MFA validation');
        }
        
        const mfaEnabled = result.records[0][0]?.booleanValue;
        const mfaMethods = result.records[0][1]?.stringValue;
        const emergencyAccessUntil = result.records[0][2]?.stringValue;
        
        // Check for emergency access (physicians only)
        if (userType === 'physician' && emergencyAccessUntil) {
            const emergencyExpiry = new Date(emergencyAccessUntil);
            if (emergencyExpiry > new Date()) {
                console.log('Emergency access granted, MFA temporarily bypassed');
                return;
            }
        }
        
        // MFA is required for all users
        if (!mfaEnabled || !mfaMethods) {
            throw new Error('Multi-factor authentication must be configured before login');
        }
        
        console.log('MFA validation successful');
        
    } catch (error) {
        console.error('MFA validation failed:', error);
        throw error;
    }
}

/**
 * Record failed login attempt
 */
async function recordFailedAttempt(email, sourceIp) {
    if (!email) return;
    
    try {
        // Determine user type and update failed attempts
        const userType = await getUserTypeByEmail(email);
        if (!userType) return;
        
        const tableName = userType === 'physician' ? 'physicians' : 'patients';
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                UPDATE ${tableName} SET
                    failed_login_attempts = failed_login_attempts + 1,
                    last_failed_login = NOW(),
                    last_failed_ip = :ip_address,
                    updated_at = NOW()
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } },
                { name: 'ip_address', value: { stringValue: sourceIp || 'unknown' } }
            ]
        };
        
        await rds.executeStatement(params).promise();
        console.log('Failed attempt recorded for:', email);
        
    } catch (error) {
        console.error('Error recording failed attempt:', error);
    }
}

/**
 * Lock account due to too many failed attempts
 */
async function lockAccount(email, userType) {
    try {
        const tableName = userType === 'physician' ? 'physicians' : 'patients';
        const lockUntil = new Date(Date.now() + (LOCKOUT_DURATION * 1000));
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                UPDATE ${tableName} SET
                    locked_until = :locked_until,
                    status = 'locked',
                    updated_at = NOW()
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } },
                { name: 'locked_until', value: { stringValue: lockUntil.toISOString() } }
            ]
        };
        
        await rds.executeStatement(params).promise();
        
        // Log security event
        await auditLog('account_locked', email, {
            reason: 'too_many_failed_attempts',
            lockUntil: lockUntil.toISOString(),
            userType
        });
        
        console.log('Account locked for:', email);
        
    } catch (error) {
        console.error('Error locking account:', error);
    }
}

/**
 * Unlock account after lock period expires
 */
async function unlockAccount(email, userType) {
    try {
        const tableName = userType === 'physician' ? 'physicians' : 'patients';
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                UPDATE ${tableName} SET
                    locked_until = NULL,
                    failed_login_attempts = 0,
                    status = 'active',
                    updated_at = NOW()
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } }
            ]
        };
        
        await rds.executeStatement(params).promise();
        
        // Log security event
        await auditLog('account_unlocked', email, {
            reason: 'lock_period_expired',
            userType
        });
        
        console.log('Account unlocked for:', email);
        
    } catch (error) {
        console.error('Error unlocking account:', error);
    }
}

/**
 * Get user type by email
 */
async function getUserTypeByEmail(email) {
    try {
        // Check physicians table first
        let params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `SELECT id FROM physicians WHERE email = :email`,
            parameters: [
                { name: 'email', value: { stringValue: email } }
            ]
        };
        
        let result = await rds.executeStatement(params).promise();
        if (result.records && result.records.length > 0) {
            return 'physician';
        }
        
        // Check patients table
        params.sql = `SELECT id FROM patients WHERE email = :email`;
        result = await rds.executeStatement(params).promise();
        if (result.records && result.records.length > 0) {
            return 'patient';
        }
        
        return null;
        
    } catch (error) {
        console.error('Error determining user type:', error);
        return null;
    }
}

/**
 * Audit log for security events
 */
async function auditLog(event, userEmail, details) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                INSERT INTO audit_logs (
                    event_type, user_email, details, 
                    ip_address, user_agent, created_at
                ) VALUES (
                    :event_type, :user_email, :details,
                    :ip_address, :user_agent, NOW()
                )
            `,
            parameters: [
                { name: 'event_type', value: { stringValue: event } },
                { name: 'user_email', value: { stringValue: userEmail } },
                { name: 'details', value: { stringValue: JSON.stringify(details) } },
                { name: 'ip_address', value: { stringValue: details.sourceIp || 'unknown' } },
                { name: 'user_agent', value: { stringValue: details.userAgent || 'unknown' } }
            ]
        };
        
        await rds.executeStatement(params).promise();
        
    } catch (error) {
        console.error('Audit logging failed:', error);
        // Don't throw error for audit logging failures
    }
}