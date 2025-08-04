/**
 * Cognito Pre-Signup Lambda Trigger
 * Validates physician invitations and patient registration tokens
 * Enforces business rules for user registration
 */

const AWS = require('aws-sdk');
const { createHash, randomUUID } = require('crypto');

// Initialize AWS services
const rds = new AWS.RDSDataService();
const secretsManager = new AWS.SecretsManager();

// Environment variables
const DATABASE_ARN = process.env.DATABASE_ARN;
const SECRET_ARN = process.env.SECRET_ARN;
const PHYSICIAN_DOMAIN_WHITELIST = process.env.PHYSICIAN_DOMAIN_WHITELIST?.split(',') || [];

/**
 * Main Lambda handler for pre-signup validation
 */
exports.handler = async (event) => {
    console.log('Pre-signup trigger event:', JSON.stringify(event, null, 2));
    
    try {
        const { userPoolId, triggerSource, request, response } = event;
        const { userAttributes } = request;
        
        // Determine user type based on user pool
        const userType = getUserType(userPoolId);
        
        // Validate based on user type
        if (userType === 'physician') {
            await validatePhysicianSignup(userAttributes, request);
        } else if (userType === 'patient') {
            await validatePatientSignup(userAttributes, request);
        } else {
            throw new Error('Invalid user pool configuration');
        }
        
        // Auto-confirm users for OAuth providers
        if (triggerSource === 'PreSignUp_ExternalProvider') {
            response.autoConfirmUser = true;
            response.autoVerifyEmail = true;
        }
        
        // Generate unique patient ID for patients
        if (userType === 'patient') {
            response.userAttributes = {
                ...userAttributes,
                'custom:patient_id': generatePatientId(),
            };
        }
        
        console.log('Pre-signup validation successful');
        return event;
        
    } catch (error) {
        console.error('Pre-signup validation failed:', error);
        throw new Error(error.message || 'Registration validation failed');
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
 * Validate physician signup
 */
async function validatePhysicianSignup(userAttributes, request) {
    const email = userAttributes.email;
    const medicalLicense = userAttributes['custom:medical_license'];
    
    console.log('Validating physician signup for:', email);
    
    // Check if email domain is whitelisted for physicians
    const emailDomain = email.split('@')[1];
    if (PHYSICIAN_DOMAIN_WHITELIST.length > 0 && !PHYSICIAN_DOMAIN_WHITELIST.includes(emailDomain)) {
        throw new Error('Email domain not authorized for physician registration');
    }
    
    // Check if physician invitation exists and is valid
    const invitation = await checkPhysicianInvitation(email);
    if (!invitation) {
        throw new Error('Valid physician invitation required for registration');
    }
    
    // Validate medical license if provided
    if (medicalLicense) {
        await validateMedicalLicense(medicalLicense, userAttributes.given_name, userAttributes.family_name);
    }
    
    // Check for existing physician account
    const existingPhysician = await checkExistingPhysician(email);
    if (existingPhysician) {
        throw new Error('Physician account already exists with this email');
    }
    
    console.log('Physician validation successful');
}

/**
 * Validate patient signup
 */
async function validatePatientSignup(userAttributes, request) {
    const email = userAttributes.email;
    const invitationToken = userAttributes['custom:invitation_token'];
    
    console.log('Validating patient signup for:', email);
    
    // Validate invitation token
    if (!invitationToken) {
        throw new Error('Patient invitation token is required');
    }
    
    const invitation = await validatePatientInvitation(invitationToken, email);
    if (!invitation) {
        throw new Error('Invalid or expired patient invitation');
    }
    
    // Check for existing patient account
    const existingPatient = await checkExistingPatient(email);
    if (existingPatient) {
        throw new Error('Patient account already exists with this email');
    }
    
    console.log('Patient validation successful');
}

/**
 * Check physician invitation in database
 */
async function checkPhysicianInvitation(email) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT id, email, organization_id, expires_at, used_at
                FROM physician_invitations 
                WHERE email = :email 
                AND expires_at > NOW() 
                AND used_at IS NULL
                AND status = 'active'
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } }
            ]
        };
        
        const result = await rds.executeStatement(params).promise();
        return result.records && result.records.length > 0 ? result.records[0] : null;
        
    } catch (error) {
        console.error('Error checking physician invitation:', error);
        throw new Error('Unable to validate physician invitation');
    }
}

/**
 * Validate patient invitation token
 */
async function validatePatientInvitation(token, email) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT pi.id, pi.token_hash, pi.email, pi.expires_at, pi.used_at,
                       p.first_name, p.last_name, p.date_of_birth
                FROM patient_invitations pi
                LEFT JOIN patients p ON pi.patient_id = p.id
                WHERE pi.token_hash = :token_hash 
                AND pi.expires_at > NOW() 
                AND pi.used_at IS NULL
                AND pi.status = 'active'
            `,
            parameters: [
                { name: 'token_hash', value: { stringValue: hashToken(token) } }
            ]
        };
        
        const result = await rds.executeStatement(params).promise();
        
        if (!result.records || result.records.length === 0) {
            return null;
        }
        
        const invitation = result.records[0];
        
        // Verify email matches if specified in invitation
        if (invitation[2]?.stringValue && invitation[2].stringValue !== email) {
            throw new Error('Email does not match invitation');
        }
        
        return invitation;
        
    } catch (error) {
        console.error('Error validating patient invitation:', error);
        throw new Error('Unable to validate patient invitation');
    }
}

/**
 * Validate medical license (placeholder for external API integration)
 */
async function validateMedicalLicense(license, firstName, lastName) {
    // TODO: Integrate with medical license verification API
    // For now, perform basic format validation
    
    if (!license || license.length < 5) {
        throw new Error('Invalid medical license format');
    }
    
    // Check for common invalid patterns
    const invalidPatterns = [
        /^[0]+$/,  // All zeros
        /^[1]+$/,  // All ones
        /test/i,   // Test values
        /demo/i    // Demo values
    ];
    
    for (const pattern of invalidPatterns) {
        if (pattern.test(license)) {
            throw new Error('Invalid medical license number');
        }
    }
    
    console.log('Medical license validation passed (basic format check)');
    return true;
}

/**
 * Check for existing physician account
 */
async function checkExistingPhysician(email) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT id, email, cognito_user_id 
                FROM physicians 
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } }
            ]
        };
        
        const result = await rds.executeStatement(params).promise();
        return result.records && result.records.length > 0;
        
    } catch (error) {
        console.error('Error checking existing physician:', error);
        return false; // Allow registration if check fails
    }
}

/**
 * Check for existing patient account
 */
async function checkExistingPatient(email) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT id, email, cognito_user_id 
                FROM patients 
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } }
            ]
        };
        
        const result = await rds.executeStatement(params).promise();
        return result.records && result.records.length > 0;
        
    } catch (error) {
        console.error('Error checking existing patient:', error);
        return false; // Allow registration if check fails
    }
}

/**
 * Generate unique patient ID
 */
function generatePatientId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `PAT-${timestamp}-${random}`.toUpperCase();
}

/**
 * Hash invitation token for database storage
 */
function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
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