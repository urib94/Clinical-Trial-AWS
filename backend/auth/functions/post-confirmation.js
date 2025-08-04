/**
 * Cognito Post-Confirmation Lambda Trigger
 * Creates user records in PostgreSQL database after successful confirmation
 * Updates invitation status and initializes user data
 */

const AWS = require('aws-sdk');
const { createHash } = require('crypto');

// Initialize AWS services
const rds = new AWS.RDSDataService();
const secretsManager = new AWS.SecretsManager();

// Environment variables
const DATABASE_ARN = process.env.DATABASE_ARN;
const SECRET_ARN = process.env.SECRET_ARN;

/**
 * Main Lambda handler for post-confirmation processing
 */
exports.handler = async (event) => {
    console.log('Post-confirmation trigger event:', JSON.stringify(event, null, 2));
    
    try {
        const { userPoolId, request } = event;
        const { userAttributes } = request;
        
        // Determine user type based on user pool
        const userType = getUserType(userPoolId);
        
        // Create user record based on type
        if (userType === 'physician') {
            await createPhysicianRecord(userAttributes, event);
        } else if (userType === 'patient') {
            await createPatientRecord(userAttributes, event);
        } else {
            throw new Error('Invalid user pool configuration');
        }
        
        // Log successful confirmation
        await auditLog('user_confirmation', userAttributes.email, {
            userType,
            cognitoUserId: userAttributes.sub,
            sourceIp: request.clientMetadata?.sourceIp || 'unknown'
        });
        
        console.log('Post-confirmation processing successful');
        return event;
        
    } catch (error) {
        console.error('Post-confirmation processing failed:', error);
        
        // Log the error but don't throw to avoid blocking user confirmation
        await auditLog('user_confirmation_error', event.request.userAttributes.email, {
            error: error.message,
            cognitoUserId: event.request.userAttributes.sub
        });
        
        return event;
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
 * Create physician record in database
 */
async function createPhysicianRecord(userAttributes, event) {
    const email = userAttributes.email;
    const cognitoUserId = userAttributes.sub;
    
    console.log('Creating physician record for:', email);
    
    try {
        // Start transaction
        await rds.beginTransaction({
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial'
        }).promise();
        
        // Get invitation details
        const invitation = await getPhysicianInvitation(email);
        
        // Create physician record
        const physicianParams = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                INSERT INTO physicians (
                    cognito_user_id, email, first_name, last_name,
                    medical_license, organization_id, phone_number,
                    email_verified, status, created_at, updated_at
                ) VALUES (
                    :cognito_user_id, :email, :first_name, :last_name,
                    :medical_license, :organization_id, :phone_number,
                    :email_verified, 'active', NOW(), NOW()
                )
                RETURNING id
            `,
            parameters: [
                { name: 'cognito_user_id', value: { stringValue: cognitoUserId } },
                { name: 'email', value: { stringValue: email } },
                { name: 'first_name', value: { stringValue: userAttributes.given_name || '' } },
                { name: 'last_name', value: { stringValue: userAttributes.family_name || '' } },
                { name: 'medical_license', value: { stringValue: userAttributes['custom:medical_license'] || '' } },
                { name: 'organization_id', value: { stringValue: userAttributes['custom:organization_id'] || invitation?.organization_id || '' } },
                { name: 'phone_number', value: { stringValue: userAttributes.phone_number || '' } },
                { name: 'email_verified', value: { booleanValue: userAttributes.email_verified === 'true' } }
            ]
        };
        
        const physicianResult = await rds.executeStatement(physicianParams).promise();
        const physicianId = physicianResult.records[0][0].longValue;
        
        // Mark invitation as used
        if (invitation) {
            await markInvitationUsed('physician_invitations', invitation.id, physicianId);
        }
        
        // Create initial physician settings
        await createPhysicianSettings(physicianId);
        
        // Commit transaction
        await rds.commitTransaction({
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial'
        }).promise();
        
        console.log('Physician record created successfully, ID:', physicianId);
        
    } catch (error) {
        // Rollback transaction
        await rds.rollbackTransaction({
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial'
        }).promise();
        
        console.error('Error creating physician record:', error);
        throw error;
    }
}

/**
 * Create patient record in database
 */
async function createPatientRecord(userAttributes, event) {
    const email = userAttributes.email;
    const cognitoUserId = userAttributes.sub;
    const invitationToken = userAttributes['custom:invitation_token'];
    
    console.log('Creating patient record for:', email);
    
    try {
        // Start transaction
        await rds.beginTransaction({
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial'
        }).promise();
        
        // Get invitation details
        const invitation = await getPatientInvitation(invitationToken);
        
        // Create or update patient record
        let patientId;
        if (invitation?.patient_id) {
            // Update existing patient record
            patientId = invitation.patient_id;
            await updateExistingPatient(patientId, userAttributes, cognitoUserId);
        } else {
            // Create new patient record
            patientId = await createNewPatient(userAttributes, cognitoUserId);
        }
        
        // Mark invitation as used
        if (invitation) {
            await markInvitationUsed('patient_invitations', invitation.id, patientId);
        }
        
        // Create initial patient settings
        await createPatientSettings(patientId);
        
        // Initialize patient questionnaire progress
        await initializePatientQuestionnaires(patientId);
        
        // Commit transaction
        await rds.commitTransaction({
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial'
        }).promise();
        
        console.log('Patient record created successfully, ID:', patientId);
        
    } catch (error) {
        // Rollback transaction
        await rds.rollbackTransaction({
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial'
        }).promise();
        
        console.error('Error creating patient record:', error);
        throw error;
    }
}

/**
 * Get physician invitation details
 */
async function getPhysicianInvitation(email) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT id, organization_id, role, permissions
                FROM physician_invitations 
                WHERE email = :email 
                AND expires_at > NOW() 
                AND used_at IS NULL
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } }
            ]
        };
        
        const result = await rds.executeStatement(params).promise();
        return result.records && result.records.length > 0 ? {
            id: result.records[0][0].longValue,
            organization_id: result.records[0][1].stringValue,
            role: result.records[0][2].stringValue,
            permissions: result.records[0][3].stringValue
        } : null;
        
    } catch (error) {
        console.error('Error getting physician invitation:', error);
        return null;
    }
}

/**
 * Get patient invitation details
 */
async function getPatientInvitation(token) {
    if (!token) return null;
    
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT id, patient_id, study_id, physician_id
                FROM patient_invitations 
                WHERE token_hash = :token_hash 
                AND expires_at > NOW() 
                AND used_at IS NULL
            `,
            parameters: [
                { name: 'token_hash', value: { stringValue: hashToken(token) } }
            ]
        };
        
        const result = await rds.executeStatement(params).promise();
        return result.records && result.records.length > 0 ? {
            id: result.records[0][0].longValue,
            patient_id: result.records[0][1]?.longValue,
            study_id: result.records[0][2]?.longValue,
            physician_id: result.records[0][3]?.longValue
        } : null;
        
    } catch (error) {
        console.error('Error getting patient invitation:', error);
        return null;
    }
}

/**
 * Update existing patient record with Cognito details
 */
async function updateExistingPatient(patientId, userAttributes, cognitoUserId) {
    const params = {
        resourceArn: DATABASE_ARN,
        secretArn: SECRET_ARN,
        database: 'clinical_trial',
        sql: `
            UPDATE patients SET
                cognito_user_id = :cognito_user_id,
                email = :email,
                first_name = COALESCE(:first_name, first_name),
                last_name = COALESCE(:last_name, last_name),
                phone_number = COALESCE(:phone_number, phone_number),
                email_verified = :email_verified,
                status = 'active',
                updated_at = NOW()
            WHERE id = :patient_id
        `,
        parameters: [
            { name: 'patient_id', value: { longValue: patientId } },
            { name: 'cognito_user_id', value: { stringValue: cognitoUserId } },
            { name: 'email', value: { stringValue: userAttributes.email } },
            { name: 'first_name', value: { stringValue: userAttributes.given_name || '' } },
            { name: 'last_name', value: { stringValue: userAttributes.family_name || '' } },
            { name: 'phone_number', value: { stringValue: userAttributes.phone_number || '' } },
            { name: 'email_verified', value: { booleanValue: userAttributes.email_verified === 'true' } }
        ]
    };
    
    await rds.executeStatement(params).promise();
}

/**
 * Create new patient record
 */
async function createNewPatient(userAttributes, cognitoUserId) {
    const params = {
        resourceArn: DATABASE_ARN,
        secretArn: SECRET_ARN,
        database: 'clinical_trial',
        sql: `
            INSERT INTO patients (
                cognito_user_id, patient_id, email, first_name, last_name,
                date_of_birth, phone_number, email_verified, status,
                created_at, updated_at
            ) VALUES (
                :cognito_user_id, :patient_id, :email, :first_name, :last_name,
                :date_of_birth, :phone_number, :email_verified, 'active',
                NOW(), NOW()
            )
            RETURNING id
        `,
        parameters: [
            { name: 'cognito_user_id', value: { stringValue: cognitoUserId } },
            { name: 'patient_id', value: { stringValue: userAttributes['custom:patient_id'] } },
            { name: 'email', value: { stringValue: userAttributes.email } },
            { name: 'first_name', value: { stringValue: userAttributes.given_name || '' } },
            { name: 'last_name', value: { stringValue: userAttributes.family_name || '' } },
            { name: 'date_of_birth', value: { stringValue: userAttributes.birthdate || null } },
            { name: 'phone_number', value: { stringValue: userAttributes.phone_number || '' } },
            { name: 'email_verified', value: { booleanValue: userAttributes.email_verified === 'true' } }
        ]
    };
    
    const result = await rds.executeStatement(params).promise();
    return result.records[0][0].longValue;
}

/**
 * Mark invitation as used
 */
async function markInvitationUsed(tableName, invitationId, userId) {
    const params = {
        resourceArn: DATABASE_ARN,
        secretArn: SECRET_ARN,
        database: 'clinical_trial',
        sql: `
            UPDATE ${tableName} SET
                used_at = NOW(),
                used_by_id = :user_id,
                status = 'used'
            WHERE id = :invitation_id
        `,
        parameters: [
            { name: 'invitation_id', value: { longValue: invitationId } },
            { name: 'user_id', value: { longValue: userId } }
        ]
    };
    
    await rds.executeStatement(params).promise();
}

/**
 * Create initial physician settings
 */
async function createPhysicianSettings(physicianId) {
    const params = {
        resourceArn: DATABASE_ARN,
        secretArn: SECRET_ARN,
        database: 'clinical_trial',
        sql: `
            INSERT INTO physician_settings (
                physician_id, email_notifications, sms_notifications,
                dashboard_theme, timezone, language,
                created_at, updated_at
            ) VALUES (
                :physician_id, true, false, 'light', 'UTC', 'en',
                NOW(), NOW()
            )
        `,
        parameters: [
            { name: 'physician_id', value: { longValue: physicianId } }
        ]
    };
    
    await rds.executeStatement(params).promise();
}

/**
 * Create initial patient settings
 */
async function createPatientSettings(patientId) {
    const params = {
        resourceArn: DATABASE_ARN,
        secretArn: SECRET_ARN,
        database: 'clinical_trial',
        sql: `
            INSERT INTO patient_settings (
                patient_id, email_notifications, sms_notifications,
                app_theme, timezone, language, privacy_level,
                created_at, updated_at
            ) VALUES (
                :patient_id, true, false, 'light', 'UTC', 'en', 'standard',
                NOW(), NOW()
            )
        `,
        parameters: [
            { name: 'patient_id', value: { longValue: patientId } }
        ]
    };
    
    await rds.executeStatement(params).promise();
}

/**
 * Initialize patient questionnaires
 */
async function initializePatientQuestionnaires(patientId) {
    // Get active questionnaires for the patient's studies
    const params = {
        resourceArn: DATABASE_ARN,
        secretArn: SECRET_ARN,
        database: 'clinical_trial',
        sql: `
            INSERT INTO patient_questionnaire_progress (
                patient_id, questionnaire_id, status, created_at, updated_at
            )
            SELECT 
                :patient_id, q.id, 'not_started', NOW(), NOW()
            FROM questionnaires q
            JOIN study_questionnaires sq ON q.id = sq.questionnaire_id
            JOIN patient_studies ps ON sq.study_id = ps.study_id
            WHERE ps.patient_id = :patient_id
            AND q.status = 'active'
            AND sq.is_active = true
        `,
        parameters: [
            { name: 'patient_id', value: { longValue: patientId } }
        ]
    };
    
    await rds.executeStatement(params).promise();
}

/**
 * Hash invitation token for database lookup
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