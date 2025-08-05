/**
 * Multi-Factor Authentication (MFA) Helper Functions
 * Provides TOTP generation, SMS handling, and recovery code management
 * Implements secure MFA flows for both physicians and patients
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const AWS = require('aws-sdk');
const crypto = require('crypto');

// Initialize AWS services
const sns = new AWS.SNS();
const rds = new AWS.RDSDataService();
const secretsManager = new AWS.SecretsManager();

// Environment variables
const DATABASE_ARN = process.env.DATABASE_ARN;
const SECRET_ARN = process.env.SECRET_ARN;
const SMS_FROM_NUMBER = process.env.SMS_FROM_NUMBER;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Clinical Trial Platform';
const DOMAIN_NAME = process.env.DOMAIN_NAME || 'clinicaltrial.com';

/**
 * Generate TOTP secret and QR code for MFA setup
 */
exports.generateTOTPSecret = async (userEmail, userName) => {
    try {
        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `${DOMAIN_NAME}:${userEmail}`,
            issuer: COMPANY_NAME,
            length: 32
        });

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        return {
            secret: secret.base32,
            qrCode: qrCodeDataUrl,
            manualEntryKey: secret.base32,
            backupCodes: await generateBackupCodes()
        };

    } catch (error) {
        console.error('Error generating TOTP secret:', error);
        throw new Error('Failed to generate TOTP secret');
    }
};

/**
 * Verify TOTP token
 */
exports.verifyTOTP = (secret, token, window = 2) => {
    try {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: window, // Allow tolerance for time drift
            step: 30 // 30-second time step
        });
    } catch (error) {
        console.error('Error verifying TOTP:', error);
        return false;
    }
};

/**
 * Send SMS MFA code
 */
exports.sendSMSCode = async (phoneNumber, userType = 'patient') => {
    try {
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000);
        
        // Store code temporarily (5 minutes expiry)
        await storeSMSCode(phoneNumber, code);

        // Format phone number
        const formattedPhone = formatPhoneNumber(phoneNumber);
        
        // Send SMS
        const message = `${COMPANY_NAME}: Your verification code is ${code}. Valid for 5 minutes. Do not share this code with anyone.`;
        
        const params = {
            Message: message,
            PhoneNumber: formattedPhone,
            MessageAttributes: {
                'AWS.SNS.SMS.SenderID': {
                    DataType: 'String',
                    StringValue: COMPANY_NAME.substring(0, 11) // SMS sender ID limit
                },
                'AWS.SNS.SMS.SMSType': {
                    DataType: 'String',
                    StringValue: 'Transactional'
                }
            }
        };

        const result = await sns.publish(params).promise();
        
        // Log SMS sending
        await auditMFAEvent('sms_sent', phoneNumber, { messageId: result.MessageId });
        
        return {
            success: true,
            messageId: result.MessageId,
            expiresIn: 300 // 5 minutes
        };

    } catch (error) {
        console.error('Error sending SMS code:', error);
        await auditMFAEvent('sms_failed', phoneNumber, { error: error.message });
        throw new Error('Failed to send SMS verification code');
    }
};

/**
 * Verify SMS code
 */
exports.verifySMSCode = async (phoneNumber, code) => {
    try {
        const storedCode = await getSMSCode(phoneNumber);
        
        if (!storedCode) {
            return { valid: false, reason: 'Code not found or expired' };
        }

        if (storedCode.code !== code) {
            // Increment failed attempts
            await incrementSMSFailedAttempts(phoneNumber);
            return { valid: false, reason: 'Invalid code' };
        }

        // Check if code is expired (5 minutes)
        const codeAge = Date.now() - storedCode.createdAt;
        if (codeAge > 300000) { // 5 minutes in milliseconds
            await clearSMSCode(phoneNumber);
            return { valid: false, reason: 'Code expired' };
        }

        // Clear the code after successful verification
        await clearSMSCode(phoneNumber);
        
        await auditMFAEvent('sms_verified', phoneNumber, { success: true });
        
        return { valid: true };

    } catch (error) {
        console.error('Error verifying SMS code:', error);
        return { valid: false, reason: 'Verification failed' };
    }
};

/**
 * Generate backup/recovery codes
 */
exports.generateBackupCodes = async () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        // Generate 8-character alphanumeric code
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(code);
    }
    return codes;
};

/**
 * Verify backup code
 */
exports.verifyBackupCode = async (userEmail, code) => {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT id, code_hash, used_at
                FROM mfa_backup_codes 
                WHERE user_email = :email 
                AND code_hash = :code_hash
                AND used_at IS NULL
            `,
            parameters: [
                { name: 'email', value: { stringValue: userEmail } },
                { name: 'code_hash', value: { stringValue: hashBackupCode(code) } }
            ]
        };

        const result = await rds.executeStatement(params).promise();
        
        if (!result.records || result.records.length === 0) {
            return { valid: false, reason: 'Invalid or already used backup code' };
        }

        // Mark code as used
        const codeId = result.records[0][0].longValue;
        await markBackupCodeUsed(codeId);
        
        await auditMFAEvent('backup_code_used', userEmail, { codeId });
        
        return { valid: true };

    } catch (error) {
        console.error('Error verifying backup code:', error);
        return { valid: false, reason: 'Verification failed' };
    }
};

/**
 * Store MFA configuration in database
 */
exports.storeMFAConfig = async (userEmail, userType, config) => {
    try {
        const tableName = userType === 'physician' ? 'physicians' : 'patients';
        const encryptedSecret = config.totpSecret ? encryptSecret(config.totpSecret) : null;
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                UPDATE ${tableName} SET
                    mfa_enabled = :mfa_enabled,
                    mfa_methods = :mfa_methods,
                    totp_secret_encrypted = :totp_secret,
                    sms_phone_number = :phone_number,
                    mfa_backup_codes_count = :backup_codes_count,
                    mfa_setup_at = NOW(),
                    updated_at = NOW()
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: userEmail } },
                { name: 'mfa_enabled', value: { booleanValue: config.enabled } },
                { name: 'mfa_methods', value: { stringValue: JSON.stringify(config.methods || []) } },
                { name: 'totp_secret', value: { stringValue: encryptedSecret } },
                { name: 'phone_number', value: { stringValue: config.phoneNumber || '' } },
                { name: 'backup_codes_count', value: { longValue: config.backupCodesCount || 0 } }
            ]
        };

        await rds.executeStatement(params).promise();
        
        // Store backup codes if provided
        if (config.backupCodes && config.backupCodes.length > 0) {
            await storeBackupCodes(userEmail, config.backupCodes);
        }

        await auditMFAEvent('mfa_configured', userEmail, { 
            methods: config.methods,
            backupCodesCount: config.backupCodesCount 
        });

    } catch (error) {
        console.error('Error storing MFA config:', error);
        throw new Error('Failed to store MFA configuration');
    }
};

/**
 * Get user's MFA configuration
 */
exports.getMFAConfig = async (userEmail, userType) => {
    try {
        const tableName = userType === 'physician' ? 'physicians' : 'patients';
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT mfa_enabled, mfa_methods, totp_secret_encrypted, 
                       sms_phone_number, mfa_backup_codes_count, mfa_setup_at
                FROM ${tableName} 
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: userEmail } }
            ]
        };

        const result = await rds.executeStatement(params).promise();
        
        if (!result.records || result.records.length === 0) {
            return null;
        }

        const record = result.records[0];
        return {
            enabled: record[0]?.booleanValue || false,
            methods: record[1]?.stringValue ? JSON.parse(record[1].stringValue) : [],
            totpSecret: record[2]?.stringValue ? decryptSecret(record[2].stringValue) : null,
            phoneNumber: record[3]?.stringValue || '',
            backupCodesCount: record[4]?.longValue || 0,
            setupAt: record[5]?.stringValue
        };

    } catch (error) {
        console.error('Error getting MFA config:', error);
        return null;
    }
};

/**
 * Disable MFA for a user
 */
exports.disableMFA = async (userEmail, userType, reason = 'user_request') => {
    try {
        const tableName = userType === 'physician' ? 'physicians' : 'patients';
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                UPDATE ${tableName} SET
                    mfa_enabled = false,
                    mfa_methods = '[]',
                    totp_secret_encrypted = NULL,
                    sms_phone_number = NULL,
                    mfa_disabled_at = NOW(),
                    updated_at = NOW()
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: userEmail } }
            ]
        };

        await rds.executeStatement(params).promise();
        
        // Clear backup codes
        await clearBackupCodes(userEmail);
        
        await auditMFAEvent('mfa_disabled', userEmail, { reason });

    } catch (error) {
        console.error('Error disabling MFA:', error);
        throw new Error('Failed to disable MFA');
    }
};

/**
 * Helper Functions
 */

async function generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(code);
    }
    return codes;
}

async function storeBackupCodes(userEmail, codes) {
    try {
        const values = codes.map((code, index) => 
            `(:email${index}, :code_hash${index}, NOW())`
        ).join(', ');
        
        const parameters = codes.flatMap((code, index) => [
            { name: `email${index}`, value: { stringValue: userEmail } },
            { name: `code_hash${index}`, value: { stringValue: hashBackupCode(code) } }
        ]);

        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                INSERT INTO mfa_backup_codes (user_email, code_hash, created_at)
                VALUES ${values}
            `,
            parameters
        };

        await rds.executeStatement(params).promise();

    } catch (error) {
        console.error('Error storing backup codes:', error);
        throw error;
    }
}

async function storeSMSCode(phoneNumber, code) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                INSERT INTO sms_verification_codes (phone_number, code, created_at, expires_at)
                VALUES (:phone, :code, NOW(), NOW() + INTERVAL '5 minutes')
                ON CONFLICT (phone_number) 
                DO UPDATE SET 
                    code = :code, 
                    created_at = NOW(), 
                    expires_at = NOW() + INTERVAL '5 minutes',
                    failed_attempts = 0
            `,
            parameters: [
                { name: 'phone', value: { stringValue: phoneNumber } },
                { name: 'code', value: { stringValue: code.toString() } }
            ]
        };

        await rds.executeStatement(params).promise();

    } catch (error) {
        console.error('Error storing SMS code:', error);
        throw error;
    }
}

async function getSMSCode(phoneNumber) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT code, created_at, failed_attempts
                FROM sms_verification_codes 
                WHERE phone_number = :phone 
                AND expires_at > NOW()
            `,
            parameters: [
                { name: 'phone', value: { stringValue: phoneNumber } }
            ]
        };

        const result = await rds.executeStatement(params).promise();
        
        if (!result.records || result.records.length === 0) {
            return null;
        }

        const record = result.records[0];
        return {
            code: record[0].stringValue,
            createdAt: new Date(record[1].stringValue).getTime(),
            failedAttempts: record[2]?.longValue || 0
        };

    } catch (error) {
        console.error('Error getting SMS code:', error);
        return null;
    }
}

async function clearSMSCode(phoneNumber) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `DELETE FROM sms_verification_codes WHERE phone_number = :phone`,
            parameters: [
                { name: 'phone', value: { stringValue: phoneNumber } }
            ]
        };

        await rds.executeStatement(params).promise();

    } catch (error) {
        console.error('Error clearing SMS code:', error);
    }
}

async function incrementSMSFailedAttempts(phoneNumber) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                UPDATE sms_verification_codes 
                SET failed_attempts = failed_attempts + 1
                WHERE phone_number = :phone
            `,
            parameters: [
                { name: 'phone', value: { stringValue: phoneNumber } }
            ]
        };

        await rds.executeStatement(params).promise();

    } catch (error) {
        console.error('Error incrementing SMS failed attempts:', error);
    }
}

async function markBackupCodeUsed(codeId) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                UPDATE mfa_backup_codes 
                SET used_at = NOW()
                WHERE id = :code_id
            `,
            parameters: [
                { name: 'code_id', value: { longValue: codeId } }
            ]
        };

        await rds.executeStatement(params).promise();

    } catch (error) {
        console.error('Error marking backup code as used:', error);
    }
}

async function clearBackupCodes(userEmail) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `DELETE FROM mfa_backup_codes WHERE user_email = :email`,
            parameters: [
                { name: 'email', value: { stringValue: userEmail } }
            ]
        };

        await rds.executeStatement(params).promise();

    } catch (error) {
        console.error('Error clearing backup codes:', error);
    }
}

function hashBackupCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
}

function encryptSecret(secret) {
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decryptSecret(encryptedSecret) {
    try {
        const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
        let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Error decrypting secret:', error);
        return null;
    }
}

function formatPhoneNumber(phoneNumber) {
    // Remove non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add +1 for US numbers if not present
    if (digits.length === 10) {
        return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
        return `+${digits}`;
    }
    
    return `+${digits}`;
}

async function auditMFAEvent(eventType, identifier, details) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                INSERT INTO mfa_audit_log (
                    event_type, identifier, details, created_at
                ) VALUES (
                    :event_type, :identifier, :details, NOW()
                )
            `,
            parameters: [
                { name: 'event_type', value: { stringValue: eventType } },
                { name: 'identifier', value: { stringValue: identifier } },
                { name: 'details', value: { stringValue: JSON.stringify(details) } }
            ]
        };

        await rds.executeStatement(params).promise();

    } catch (error) {
        console.error('Error auditing MFA event:', error);
    }
}