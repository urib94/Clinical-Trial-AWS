/**
 * Authentication API Routes
 * Universal authentication endpoints for both physician and patient portals
 * Implements secure JWT token management and MFA flows
 */

const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS services
const cognito = new AWS.CognitoIdentityServiceProvider();
const rds = new AWS.RDSDataService();
const secretsManager = new AWS.SecretsManager();

// Environment variables
const PHYSICIAN_USER_POOL_ID = process.env.PHYSICIAN_USER_POOL_ID;
const PATIENT_USER_POOL_ID = process.env.PATIENT_USER_POOL_ID;
const PHYSICIAN_CLIENT_ID = process.env.PHYSICIAN_CLIENT_ID;
const PATIENT_CLIENT_ID = process.env.PATIENT_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_ARN = process.env.DATABASE_ARN;
const SECRET_ARN = process.env.SECRET_ARN;
const DOMAIN_NAME = process.env.DOMAIN_NAME;

/**
 * Universal login endpoint
 * Detects user type and routes to appropriate user pool
 */
exports.login = async (event) => {
    try {
        const { email, password, userType, mfaCode, session } = JSON.parse(event.body);
        const sourceIp = event.requestContext?.http?.sourceIp || 'unknown';
        const userAgent = event.headers?.['user-agent'] || 'unknown';

        console.log('Login attempt for:', email, 'Type:', userType);

        // Validate input
        if (!email || !password) {
            return createResponse(400, { error: 'Email and password are required' });
        }

        // Determine user pool configuration
        const poolConfig = getUserPoolConfig(userType, email);
        if (!poolConfig) {
            return createResponse(400, { error: 'Invalid user type or email domain' });
        }

        // Handle MFA challenge
        if (session && mfaCode) {
            return await handleMFAChallenge(session, mfaCode, poolConfig);
        }

        // Initial authentication
        const authResult = await initiateAuth(email, password, poolConfig);
        
        // Log successful authentication attempt
        await auditLog('login_attempt', email, {
            userType,
            sourceIp,
            userAgent,
            success: true
        });

        // Check if MFA is required
        if (authResult.ChallengeName === 'SMS_MFA' || authResult.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
            return createResponse(200, {
                challengeName: authResult.ChallengeName,
                session: authResult.Session,
                challengeParameters: authResult.ChallengeParameters
            });
        }

        // Complete authentication flow
        const tokens = authResult.AuthenticationResult;
        const userData = await getUserData(tokens.AccessToken, poolConfig);
        
        // Update last login
        await updateLastLogin(email, userType, sourceIp);
        
        // Generate custom JWT with user context
        const customToken = generateCustomJWT(userData, userType);

        return createResponse(200, {
            accessToken: tokens.AccessToken,
            idToken: tokens.IdToken,
            refreshToken: tokens.RefreshToken,
            customToken,
            user: userData,
            expiresIn: tokens.ExpiresIn
        });

    } catch (error) {
        console.error('Login error:', error);
        
        // Log failed attempt
        const body = JSON.parse(event.body || '{}');
        await auditLog('login_failed', body.email || 'unknown', {
            error: error.message,
            sourceIp: event.requestContext?.http?.sourceIp || 'unknown',
            userAgent: event.headers?.['user-agent'] || 'unknown'
        });

        return createResponse(401, { 
            error: error.code === 'NotAuthorizedException' ? 'Invalid credentials' : 'Authentication failed',
            details: error.message 
        });
    }
};

/**
 * Logout endpoint
 * Revokes tokens and clears session
 */
exports.logout = async (event) => {
    try {
        const { accessToken, refreshToken } = JSON.parse(event.body);
        const authHeader = event.headers?.authorization;
        
        if (!accessToken && !authHeader) {
            return createResponse(400, { error: 'Access token required' });
        }

        const token = accessToken || authHeader.replace('Bearer ', '');
        
        // Get user info from token
        const userData = jwt.decode(token);
        
        // Revoke refresh token if provided
        if (refreshToken) {
            await cognito.revokeToken({
                Token: refreshToken,
                ClientId: userData.aud
            }).promise();
        }

        // Add token to blacklist
        await blacklistToken(token);
        
        // Log logout
        await auditLog('logout', userData.email || userData.username, {
            sourceIp: event.requestContext?.http?.sourceIp || 'unknown'
        });

        return createResponse(200, { message: 'Logged out successfully' });

    } catch (error) {
        console.error('Logout error:', error);
        return createResponse(500, { error: 'Logout failed' });
    }
};

/**
 * Token refresh endpoint
 * Refreshes JWT tokens with rotation
 */
exports.refresh = async (event) => {
    try {
        const { refreshToken, userType } = JSON.parse(event.body);
        
        if (!refreshToken) {
            return createResponse(400, { error: 'Refresh token required' });
        }

        const poolConfig = getUserPoolConfig(userType);
        
        const params = {
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            ClientId: poolConfig.clientId,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken
            }
        };

        const result = await cognito.initiateAuth(params).promise();
        const tokens = result.AuthenticationResult;
        
        // Get updated user data
        const userData = await getUserData(tokens.AccessToken, poolConfig);
        
        // Generate new custom JWT
        const customToken = generateCustomJWT(userData, userType);

        return createResponse(200, {
            accessToken: tokens.AccessToken,
            idToken: tokens.IdToken,
            customToken,
            user: userData,
            expiresIn: tokens.ExpiresIn
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        return createResponse(401, { error: 'Token refresh failed' });
    }
};

/**
 * MFA setup endpoint
 * Generates QR code and secret for TOTP setup
 */
exports.setupMFA = async (event) => {
    try {
        const authToken = extractBearerToken(event);
        if (!authToken) {
            return createResponse(401, { error: 'Authentication required' });
        }

        const userData = await getUserData(authToken.token, authToken.poolConfig);
        
        // Generate TOTP secret
        const secret = speakeasy.generateSecret({
            name: `${DOMAIN_NAME}:${userData.email}`,
            issuer: 'Clinical Trial Platform',
            length: 32
        });

        // Store secret temporarily (user must verify before permanent storage)
        await storeTempMFASecret(userData.email, secret.base32);
        
        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        
        return createResponse(200, {
            secret: secret.base32,
            qrCode: qrCodeUrl,
            manualEntryKey: secret.base32
        });

    } catch (error) {
        console.error('MFA setup error:', error);
        return createResponse(500, { error: 'MFA setup failed' });
    }
};

/**
 * MFA verification endpoint
 * Verifies TOTP code and enables MFA
 */
exports.verifyMFA = async (event) => {
    try {
        const { token, secret } = JSON.parse(event.body);
        const authToken = extractBearerToken(event);
        
        if (!authToken) {
            return createResponse(401, { error: 'Authentication required' });
        }

        if (!token || !secret) {
            return createResponse(400, { error: 'Token and secret are required' });
        }

        const userData = await getUserData(authToken.token, authToken.poolConfig);
        
        // Verify TOTP token
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps tolerance
        });

        if (!verified) {
            return createResponse(400, { error: 'Invalid verification code' });
        }

        // Enable MFA in Cognito
        await cognito.associateSoftwareToken({
            AccessToken: authToken.token,
            SecretCode: secret
        }).promise();

        await cognito.verifySoftwareToken({
            AccessToken: authToken.token,
            UserCode: token
        }).promise();

        await cognito.setUserMFAPreference({
            AccessToken: authToken.token,
            SoftwareTokenMfaSettings: {
                Enabled: true,
                PreferredMfa: true
            }
        }).promise();

        // Store MFA settings in database
        await enableMFAInDatabase(userData.email, authToken.userType, secret);
        
        // Generate recovery codes
        const recoveryCodes = generateRecoveryCodes();
        await storeRecoveryCodes(userData.email, recoveryCodes);

        return createResponse(200, {
            message: 'MFA enabled successfully',
            recoveryCodes: recoveryCodes
        });

    } catch (error) {
        console.error('MFA verification error:', error);
        return createResponse(500, { error: 'MFA verification failed' });
    }
};

/**
 * Password reset request endpoint
 */
exports.resetPasswordRequest = async (event) => {
    try {
        const { email, userType } = JSON.parse(event.body);
        
        if (!email) {
            return createResponse(400, { error: 'Email is required' });
        }

        const poolConfig = getUserPoolConfig(userType, email);
        
        await cognito.forgotPassword({
            ClientId: poolConfig.clientId,
            Username: email
        }).promise();

        // Log password reset request
        await auditLog('password_reset_request', email, {
            userType,
            sourceIp: event.requestContext?.http?.sourceIp || 'unknown'
        });

        return createResponse(200, { 
            message: 'Password reset instructions sent to your email' 
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        return createResponse(500, { error: 'Password reset request failed' });
    }
};

/**
 * Password reset confirmation endpoint
 */
exports.resetPasswordConfirm = async (event) => {
    try {
        const { email, confirmationCode, newPassword, userType } = JSON.parse(event.body);
        
        if (!email || !confirmationCode || !newPassword) {
            return createResponse(400, { 
                error: 'Email, confirmation code, and new password are required' 
            });
        }

        const poolConfig = getUserPoolConfig(userType, email);
        
        await cognito.confirmForgotPassword({
            ClientId: poolConfig.clientId,
            Username: email,
            ConfirmationCode: confirmationCode,
            Password: newPassword
        }).promise();

        // Log successful password reset
        await auditLog('password_reset_success', email, {
            userType,
            sourceIp: event.requestContext?.http?.sourceIp || 'unknown'
        });

        return createResponse(200, { 
            message: 'Password reset successfully' 
        });

    } catch (error) {
        console.error('Password reset confirmation error:', error);
        return createResponse(400, { 
            error: error.code === 'CodeMismatchException' ? 
                'Invalid confirmation code' : 'Password reset failed' 
        });
    }
};

/**
 * Helper Functions
 */

function getUserPoolConfig(userType, email = '') {
    if (userType === 'physician') {
        return {
            userPoolId: PHYSICIAN_USER_POOL_ID,
            clientId: PHYSICIAN_CLIENT_ID,
            type: 'physician'
        };
    } else if (userType === 'patient') {
        return {
            userPoolId: PATIENT_USER_POOL_ID,
            clientId: PATIENT_CLIENT_ID,
            type: 'patient'
        };
    }
    
    // Auto-detect based on email domain if not specified
    const domain = email.split('@')[1];
    const physicianDomains = ['healthcenter.org', 'hospital.com', 'clinic.net'];
    
    if (physicianDomains.includes(domain)) {
        return {
            userPoolId: PHYSICIAN_USER_POOL_ID,
            clientId: PHYSICIAN_CLIENT_ID,
            type: 'physician'
        };
    }
    
    return {
        userPoolId: PATIENT_USER_POOL_ID,
        clientId: PATIENT_CLIENT_ID,
        type: 'patient'
    };
}

async function initiateAuth(email, password, poolConfig) {
    const params = {
        AuthFlow: 'USER_SRP_AUTH',
        ClientId: poolConfig.clientId,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password
        }
    };

    return await cognito.initiateAuth(params).promise();
}

async function handleMFAChallenge(session, mfaCode, poolConfig) {
    const params = {
        ClientId: poolConfig.clientId,
        ChallengeName: 'SOFTWARE_TOKEN_MFA',
        Session: session,
        ChallengeResponses: {
            SOFTWARE_TOKEN_MFA_CODE: mfaCode
        }
    };

    const result = await cognito.respondToAuthChallenge(params).promise();
    const tokens = result.AuthenticationResult;
    
    if (tokens) {
        const userData = await getUserData(tokens.AccessToken, poolConfig);
        const customToken = generateCustomJWT(userData, poolConfig.type);
        
        return createResponse(200, {
            accessToken: tokens.AccessToken,
            idToken: tokens.IdToken,
            refreshToken: tokens.RefreshToken,
            customToken,
            user: userData,
            expiresIn: tokens.ExpiresIn
        });
    }
    
    throw new Error('MFA challenge failed');
}

async function getUserData(accessToken, poolConfig) {
    const userInfo = await cognito.getUser({
        AccessToken: accessToken
    }).promise();
    
    const attributes = {};
    userInfo.UserAttributes.forEach(attr => {
        attributes[attr.Name] = attr.Value;
    });
    
    return {
        username: userInfo.Username,
        email: attributes.email,
        firstName: attributes.given_name,
        lastName: attributes.family_name,
        emailVerified: attributes.email_verified === 'true',
        userType: poolConfig.type,
        attributes
    };
}

function generateCustomJWT(userData, userType) {
    const payload = {
        sub: userData.username,
        email: userData.email,
        userType: userType,
        permissions: getUserPermissions(userType),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (userType === 'physician' ? 3600 : 1800), // 1h for physicians, 30m for patients
        jti: uuidv4()
    };
    
    return jwt.sign(payload, JWT_SECRET);
}

function getUserPermissions(userType) {
    if (userType === 'physician') {
        return ['read:patients', 'write:patients', 'read:questionnaires', 'write:questionnaires', 'read:analytics'];
    } else {
        return ['read:own_data', 'write:own_responses', 'read:questionnaires'];
    }
}

function extractBearerToken(event) {
    const authHeader = event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.decode(token);
    const userType = decoded?.userType;
    
    return {
        token,
        poolConfig: getUserPoolConfig(userType),
        userType
    };
}

async function updateLastLogin(email, userType, sourceIp) {
    try {
        const tableName = userType === 'physician' ? 'physicians' : 'patients';
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                UPDATE ${tableName} SET
                    last_login = NOW(),
                    last_login_ip = :ip_address,
                    failed_login_attempts = 0,
                    updated_at = NOW()
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } },
                { name: 'ip_address', value: { stringValue: sourceIp } }
            ]
        };
        
        await rds.executeStatement(params).promise();
    } catch (error) {
        console.error('Error updating last login:', error);
    }
}

async function blacklistToken(token) {
    try {
        const decoded = jwt.decode(token);
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                INSERT INTO token_blacklist (jti, expires_at, created_at)
                VALUES (:jti, :expires_at, NOW())
            `,
            parameters: [
                { name: 'jti', value: { stringValue: decoded.jti } },
                { name: 'expires_at', value: { stringValue: new Date(decoded.exp * 1000).toISOString() } }
            ]
        };
        
        await rds.executeStatement(params).promise();
    } catch (error) {
        console.error('Error blacklisting token:', error);
    }
}

async function enableMFAInDatabase(email, userType, secret) {
    try {
        const tableName = userType === 'physician' ? 'physicians' : 'patients';
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                UPDATE ${tableName} SET
                    mfa_enabled = true,
                    mfa_methods = 'TOTP',
                    mfa_secret_encrypted = pgp_sym_encrypt(:secret, :key),
                    updated_at = NOW()
                WHERE email = :email
            `,
            parameters: [
                { name: 'email', value: { stringValue: email } },
                { name: 'secret', value: { stringValue: secret } },
                { name: 'key', value: { stringValue: JWT_SECRET } }
            ]
        };
        
        await rds.executeStatement(params).promise();
    } catch (error) {
        console.error('Error enabling MFA in database:', error);
    }
}

function generateRecoveryCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
}

async function storeRecoveryCodes(email, codes) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                INSERT INTO mfa_recovery_codes (user_email, code_hash, created_at)
                VALUES ${codes.map((_, i) => `(:email${i}, :code${i}, NOW())`).join(', ')}
            `,
            parameters: [
                ...codes.flatMap((code, i) => [
                    { name: `email${i}`, value: { stringValue: email } },
                    { name: `code${i}`, value: { stringValue: require('crypto').createHash('sha256').update(code).digest('hex') } }
                ])
            ]
        };
        
        await rds.executeStatement(params).promise();
    } catch (error) {
        console.error('Error storing recovery codes:', error);
    }
}

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
    }
}

function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT'
        },
        body: JSON.stringify(body)
    };
}