/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces permissions and role-based access for physician and patient portals
 * Implements fine-grained access control for healthcare data
 */

const AWS = require('aws-sdk');

// Initialize AWS services
const rds = new AWS.RDSDataService();

// Environment variables
const DATABASE_ARN = process.env.DATABASE_ARN;
const SECRET_ARN = process.env.SECRET_ARN;

/**
 * Permission definitions for different user types
 */
const PERMISSIONS = {
    // Physician permissions
    physician: {
        // Patient management
        'patients:read': 'Read patient information',
        'patients:write': 'Create and update patient records',
        'patients:invite': 'Send patient invitations',
        'patients:archive': 'Archive patient records',
        
        // Questionnaire management
        'questionnaires:read': 'Read questionnaires',
        'questionnaires:write': 'Create and update questionnaires',
        'questionnaires:publish': 'Publish questionnaires',
        'questionnaires:archive': 'Archive questionnaires',
        
        // Response management
        'responses:read': 'Read patient responses',
        'responses:export': 'Export response data',
        'responses:analyze': 'Analyze response data',
        
        // Study management
        'studies:read': 'Read study information',
        'studies:write': 'Create and update studies',
        'studies:manage': 'Manage study participants',
        
        // Analytics and reporting
        'analytics:read': 'Access analytics dashboards',
        'reports:generate': 'Generate reports',
        'reports:export': 'Export reports',
        
        // System administration
        'users:manage': 'Manage user accounts',
        'settings:write': 'Modify system settings',
        'audit:read': 'Access audit logs'
    },
    
    // Patient permissions
    patient: {
        // Own data access
        'profile:read': 'Read own profile',
        'profile:write': 'Update own profile',
        
        // Questionnaire access
        'questionnaires:read': 'Read assigned questionnaires',
        'responses:write': 'Submit questionnaire responses',
        'responses:read': 'Read own responses',
        
        // File management
        'files:upload': 'Upload media files',
        'files:read': 'Access own uploaded files',
        
        // Study participation
        'studies:read': 'Read assigned study information',
        'consent:manage': 'Manage consent forms'
    },
    
    // Administrative roles
    admin: {
        // Full system access
        'system:admin': 'Full system administration',
        'users:admin': 'Full user management',
        'data:admin': 'Full data access and management',
        'security:admin': 'Security administration'
    }
};

/**
 * Resource-based access control
 * Defines which resources users can access
 */
const RESOURCE_ACCESS = {
    // Patient resources
    patient: {
        ownData: (user, resourceOwnerId) => user.id === resourceOwnerId,
        assignedPhysician: async (user, resourceId) => {
            return await checkPhysicianPatientRelationship(user.id, resourceId);
        }
    },
    
    // Physician resources
    physician: {
        ownPatients: async (user, patientId) => {
            return await checkPhysicianPatientRelationship(user.id, patientId);
        },
        ownStudies: async (user, studyId) => {
            return await checkPhysicianStudyRelationship(user.id, studyId);
        },
        organizationData: async (user, resourceId) => {
            return await checkOrganizationAccess(user.id, resourceId);
        }
    }
};

/**
 * Main RBAC middleware function
 */
exports.enforcePermissions = (requiredPermissions) => {
    return async (event) => {
        try {
            const user = event.user;
            if (!user) {
                return createAccessDeniedResponse('User authentication required');
            }

            // Check if user has required permissions
            const hasPermissions = await checkUserPermissions(user, requiredPermissions);
            if (!hasPermissions) {
                await auditAccessDenied(user, requiredPermissions, event);
                return createAccessDeniedResponse('Insufficient permissions');
            }

            // Log successful permission check
            await auditPermissionCheck(user, requiredPermissions, true);

            return { isAuthorized: true, user };

        } catch (error) {
            console.error('RBAC enforcement error:', error);
            return createAccessDeniedResponse('Authorization check failed');
        }
    };
};

/**
 * Resource-specific access control
 */
exports.enforceResourceAccess = (resourceType, resourceAccessCheck) => {
    return async (event, resourceId, resourceOwnerId) => {
        try {
            const user = event.user;
            if (!user) {
                return createAccessDeniedResponse('User authentication required');
            }

            // Check resource-specific access
            let hasAccess = false;
            
            if (typeof resourceAccessCheck === 'function') {
                hasAccess = await resourceAccessCheck(user, resourceId, resourceOwnerId);
            } else if (RESOURCE_ACCESS[user.userType] && RESOURCE_ACCESS[user.userType][resourceAccessCheck]) {
                hasAccess = await RESOURCE_ACCESS[user.userType][resourceAccessCheck](user, resourceId);
            }

            if (!hasAccess) {
                await auditResourceAccessDenied(user, resourceType, resourceId, event);
                return createAccessDeniedResponse('Access to resource denied');
            }

            await auditResourceAccess(user, resourceType, resourceId, true);
            return { isAuthorized: true, user };

        } catch (error) {
            console.error('Resource access enforcement error:', error);
            return createAccessDeniedResponse('Resource access check failed');
        }
    };
};

/**
 * Dynamic permission checking based on context
 */
exports.checkContextualPermissions = async (user, action, resource, context = {}) => {
    try {
        // Get user's current permissions
        const userPermissions = await getUserPermissions(user);
        
        // Check base permission
        if (!userPermissions.includes(action)) {
            return false;
        }

        // Apply contextual rules
        switch (resource) {
            case 'patient_data':
                return await checkPatientDataAccess(user, context);
            case 'questionnaire':
                return await checkQuestionnaireAccess(user, context);
            case 'study':
                return await checkStudyAccess(user, context);
            case 'analytics':
                return await checkAnalyticsAccess(user, context);
            default:
                return true;
        }

    } catch (error) {
        console.error('Contextual permission check error:', error);
        return false;
    }
};

/**
 * Helper Functions
 */

async function checkUserPermissions(user, requiredPermissions) {
    try {
        const userPermissions = await getUserPermissions(user);
        
        // Check if user has all required permissions
        return requiredPermissions.every(permission => 
            userPermissions.includes(permission)
        );

    } catch (error) {
        console.error('Error checking user permissions:', error);
        return false;
    }
}

async function getUserPermissions(user) {
    try {
        // Get base permissions from user type
        const basePermissions = Object.keys(PERMISSIONS[user.userType] || {});
        
        // Get additional permissions from database
        const tableName = user.userType === 'physician' ? 'physicians' : 'patients';
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT role, additional_permissions, organization_permissions
                FROM ${tableName} 
                WHERE cognito_user_id = :user_id
            `,
            parameters: [
                { name: 'user_id', value: { stringValue: user.id } }
            ]
        };

        const result = await rds.executeStatement(params).promise();
        
        if (result.records && result.records.length > 0) {
            const record = result.records[0];
            const role = record[0]?.stringValue;
            const additionalPermissions = record[1]?.stringValue ? JSON.parse(record[1].stringValue) : [];
            const orgPermissions = record[2]?.stringValue ? JSON.parse(record[2].stringValue) : [];
            
            // Combine all permissions
            return [...basePermissions, ...additionalPermissions, ...orgPermissions];
        }

        return basePermissions;

    } catch (error) {
        console.error('Error getting user permissions:', error);
        return [];
    }
}

async function checkPhysicianPatientRelationship(physicianId, patientId) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT COUNT(*) as count
                FROM physician_patient_relationships ppr
                JOIN physicians p ON ppr.physician_id = p.id
                JOIN patients pt ON ppr.patient_id = pt.id
                WHERE p.cognito_user_id = :physician_id 
                AND pt.cognito_user_id = :patient_id
                AND ppr.is_active = true
            `,
            parameters: [
                { name: 'physician_id', value: { stringValue: physicianId } },
                { name: 'patient_id', value: { stringValue: patientId } }
            ]
        };

        const result = await rds.executeStatement(params).promise();
        return result.records[0][0]?.longValue > 0;

    } catch (error) {
        console.error('Error checking physician-patient relationship:', error);
        return false;
    }
}

async function checkPhysicianStudyRelationship(physicianId, studyId) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT COUNT(*) as count
                FROM study_physicians sp
                JOIN physicians p ON sp.physician_id = p.id
                WHERE p.cognito_user_id = :physician_id 
                AND sp.study_id = :study_id
                AND sp.is_active = true
            `,
            parameters: [
                { name: 'physician_id', value: { stringValue: physicianId } },
                { name: 'study_id', value: { stringValue: studyId } }
            ]
        };

        const result = await rds.executeStatement(params).promise();
        return result.records[0][0]?.longValue > 0;

    } catch (error) {
        console.error('Error checking physician-study relationship:', error);
        return false;
    }
}

async function checkOrganizationAccess(userId, resourceId) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT COUNT(*) as count
                FROM physicians p1
                JOIN physicians p2 ON p1.organization_id = p2.organization_id
                WHERE p1.cognito_user_id = :user_id 
                AND p2.cognito_user_id = :resource_id
                AND p1.organization_id IS NOT NULL
            `,
            parameters: [
                { name: 'user_id', value: { stringValue: userId } },
                { name: 'resource_id', value: { stringValue: resourceId } }
            ]
        };

        const result = await rds.executeStatement(params).promise();
        return result.records[0][0]?.longValue > 0;

    } catch (error) {
        console.error('Error checking organization access:', error);
        return false;
    }
}

async function checkPatientDataAccess(user, context) {
    if (user.userType === 'patient') {
        // Patients can only access their own data
        return context.patientId === user.id;
    } else if (user.userType === 'physician') {
        // Physicians can access their patients' data
        return await checkPhysicianPatientRelationship(user.id, context.patientId);
    }
    return false;
}

async function checkQuestionnaireAccess(user, context) {
    if (user.userType === 'patient') {
        // Check if questionnaire is assigned to patient
        return await checkPatientQuestionnaireAccess(user.id, context.questionnaireId);
    } else if (user.userType === 'physician') {
        // Check if physician has access to questionnaire's study
        return await checkPhysicianQuestionnaireAccess(user.id, context.questionnaireId);
    }
    return false;
}

async function checkStudyAccess(user, context) {
    if (user.userType === 'patient') {
        // Check if patient is enrolled in study
        return await checkPatientStudyEnrollment(user.id, context.studyId);
    } else if (user.userType === 'physician') {
        // Check if physician is associated with study
        return await checkPhysicianStudyRelationship(user.id, context.studyId);
    }
    return false;
}

async function checkAnalyticsAccess(user, context) {
    if (user.userType === 'physician') {
        // Physicians can access analytics for their studies/patients
        if (context.studyId) {
            return await checkPhysicianStudyRelationship(user.id, context.studyId);
        }
        if (context.patientId) {
            return await checkPhysicianPatientRelationship(user.id, context.patientId);
        }
        return true; // General analytics access for physicians
    }
    return false; // Patients don't have analytics access
}

async function auditPermissionCheck(user, permissions, success) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                INSERT INTO access_audit_log (
                    user_email, user_type, action, resource_type, 
                    permissions_checked, success, created_at
                ) VALUES (
                    :user_email, :user_type, 'permission_check', 'system',
                    :permissions, :success, NOW()
                )
            `,
            parameters: [
                { name: 'user_email', value: { stringValue: user.email } },
                { name: 'user_type', value: { stringValue: user.userType } },
                { name: 'permissions', value: { stringValue: JSON.stringify(permissions) } },
                { name: 'success', value: { booleanValue: success } }
            ]
        };

        await rds.executeStatement(params).promise();
    } catch (error) {
        console.error('Error auditing permission check:', error);
    }
}

async function auditAccessDenied(user, permissions, event) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                INSERT INTO security_incidents (
                    user_email, incident_type, details, 
                    ip_address, user_agent, created_at
                ) VALUES (
                    :user_email, 'access_denied', :details,
                    :ip_address, :user_agent, NOW()
                )
            `,
            parameters: [
                { name: 'user_email', value: { stringValue: user.email } },
                { name: 'details', value: { stringValue: JSON.stringify({ 
                    requiredPermissions: permissions,
                    endpoint: event.requestContext?.http?.path
                }) } },
                { name: 'ip_address', value: { stringValue: event.requestContext?.http?.sourceIp || 'unknown' } },
                { name: 'user_agent', value: { stringValue: event.headers?.['user-agent'] || 'unknown' } }
            ]
        };

        await rds.executeStatement(params).promise();
    } catch (error) {
        console.error('Error auditing access denied:', error);
    }
}

function createAccessDeniedResponse(message) {
    return {
        statusCode: 403,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
            error: 'Access Denied',
            message: message,
            code: 'INSUFFICIENT_PERMISSIONS'
        })
    };
}

/**
 * Convenience functions for common permission checks
 */
exports.requirePhysicianAccess = exports.enforcePermissions(['patients:read']);
exports.requirePatientAccess = exports.enforcePermissions(['profile:read']);
exports.requireAdminAccess = exports.enforcePermissions(['system:admin']);

/**
 * Resource-specific middleware functions
 */
exports.requirePatientDataAccess = (patientId) => {
    return exports.enforceResourceAccess('patient_data', 
        (user, resourceId) => checkPatientDataAccess(user, { patientId: resourceId })
    );
};

exports.requireStudyAccess = (studyId) => {
    return exports.enforceResourceAccess('study', 
        (user, resourceId) => checkStudyAccess(user, { studyId: resourceId })
    );
};