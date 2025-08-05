/**
 * JWT Token Validation Middleware
 * Validates JWT tokens and checks blacklist for revoked tokens
 * Implements comprehensive token security checks
 */

const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');

// Initialize AWS services
const rds = new AWS.RDSDataService();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_ARN = process.env.DATABASE_ARN;
const SECRET_ARN = process.env.SECRET_ARN;

/**
 * JWT validation middleware for Lambda functions
 */
exports.validateJWT = async (event) => {
    try {
        const token = extractToken(event);
        if (!token) {
            return createUnauthorizedResponse('Authorization token required');
        }

        // Verify JWT signature and decode
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check token expiration
        if (decoded.exp <= Math.floor(Date.now() / 1000)) {
            return createUnauthorizedResponse('Token expired');
        }

        // Check if token is blacklisted
        const isBlacklisted = await checkTokenBlacklist(decoded.jti);
        if (isBlacklisted) {
            return createUnauthorizedResponse('Token revoked');
        }

        // Validate token claims
        if (!decoded.sub || !decoded.email || !decoded.userType) {
            return createUnauthorizedResponse('Invalid token claims');
        }

        // Add user context to event
        event.user = {
            id: decoded.sub,
            email: decoded.email,
            userType: decoded.userType,
            permissions: decoded.permissions || [],
            tokenId: decoded.jti
        };

        return { isValid: true, user: event.user };

    } catch (error) {
        console.error('JWT validation error:', error);
        
        if (error.name === 'TokenExpiredError') {
            return createUnauthorizedResponse('Token expired');
        } else if (error.name === 'JsonWebTokenError') {
            return createUnauthorizedResponse('Invalid token');
        } else if (error.name === 'NotBeforeError') {
            return createUnauthorizedResponse('Token not active yet');
        }
        
        return createUnauthorizedResponse('Token validation failed');
    }
};

/**
 * Rate limiting validation
 * Checks API rate limits per user/IP
 */
exports.validateRateLimit = async (event) => {
    try {
        const userEmail = event.user?.email || 'anonymous';
        const sourceIp = event.requestContext?.http?.sourceIp || 'unknown';
        const endpoint = event.requestContext?.http?.path || 'unknown';

        // Check user-based rate limit (100 requests per hour)
        const userLimit = await checkRateLimit('user', userEmail, 100, 3600);
        if (userLimit.exceeded) {
            return createRateLimitResponse('User rate limit exceeded');
        }

        // Check IP-based rate limit (500 requests per hour)
        const ipLimit = await checkRateLimit('ip', sourceIp, 500, 3600);
        if (ipLimit.exceeded) {
            return createRateLimitResponse('IP rate limit exceeded');
        }

        // Check endpoint-specific limits for sensitive operations
        if (endpoint.includes('/auth/') || endpoint.includes('/mfa/')) {
            const authLimit = await checkRateLimit('auth', `${userEmail}:${sourceIp}`, 20, 900); // 20 per 15 minutes
            if (authLimit.exceeded) {
                return createRateLimitResponse('Authentication rate limit exceeded');
            }
        }

        return { 
            isValid: true, 
            remaining: {
                user: userLimit.remaining,
                ip: ipLimit.remaining
            }
        };

    } catch (error) {
        console.error('Rate limit validation error:', error);
        return { isValid: true }; // Allow on error to prevent blocking legitimate users
    }
};

/**
 * Session validation
 * Validates active sessions and concurrent login limits
 */
exports.validateSession = async (event) => {
    try {
        const user = event.user;
        if (!user) {
            return createUnauthorizedResponse('User context required');
        }

        // Check for active session
        const session = await getActiveSession(user.id, user.tokenId);
        if (!session) {
            return createUnauthorizedResponse('Invalid session');
        }

        // Check session timeout (auto-logout after inactivity)
        const sessionTimeout = user.userType === 'physician' ? 3600 : 1800; // 1h for physicians, 30min for patients
        const inactiveTime = Math.floor(Date.now() / 1000) - session.lastActivity;
        
        if (inactiveTime > sessionTimeout) {
            await invalidateSession(user.id, user.tokenId);
            return createUnauthorizedResponse('Session expired due to inactivity');
        }

        // Update last activity
        await updateSessionActivity(user.id, user.tokenId);

        return { isValid: true, session };

    } catch (error) {
        console.error('Session validation error:', error);
        return createUnauthorizedResponse('Session validation failed');
    }
};

/**
 * Helper Functions
 */

function extractToken(event) {
    // Check Authorization header
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check query parameter (for WebSocket connections)
    if (event.queryStringParameters?.token) {
        return event.queryStringParameters.token;
    }

    return null;
}

async function checkTokenBlacklist(jti) {
    if (!jti) return false;
    
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT COUNT(*) as count
                FROM token_blacklist 
                WHERE jti = :jti 
                AND expires_at > NOW()
            `,
            parameters: [
                { name: 'jti', value: { stringValue: jti } }
            ]
        };

        const result = await rds.executeStatement(params).promise();
        return result.records[0][0]?.longValue > 0;

    } catch (error) {
        console.error('Error checking token blacklist:', error);
        return false; // Allow on error to prevent blocking legitimate users
    }
}

async function checkRateLimit(type, identifier, limit, windowSeconds) {
    try {
        const windowStart = new Date(Date.now() - (windowSeconds * 1000));
        
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT COUNT(*) as request_count
                FROM rate_limit_log 
                WHERE rate_limit_type = :type
                AND identifier = :identifier
                AND created_at > :window_start
            `,
            parameters: [
                { name: 'type', value: { stringValue: type } },
                { name: 'identifier', value: { stringValue: identifier } },
                { name: 'window_start', value: { stringValue: windowStart.toISOString() } }
            ]
        };

        const result = await rds.executeStatement(params).promise();
        const requestCount = result.records[0][0]?.longValue || 0;

        // Log this request
        await logRateLimit(type, identifier);

        return {
            exceeded: requestCount >= limit,
            remaining: Math.max(0, limit - requestCount),
            count: requestCount
        };

    } catch (error) {
        console.error('Error checking rate limit:', error);
        return { exceeded: false, remaining: limit, count: 0 };
    }
}

async function logRateLimit(type, identifier) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                INSERT INTO rate_limit_log (rate_limit_type, identifier, created_at)
                VALUES (:type, :identifier, NOW())
            `,
            parameters: [
                { name: 'type', value: { stringValue: type } },
                { name: 'identifier', value: { stringValue: identifier } }
            ]
        };

        await rds.executeStatement(params).promise();
    } catch (error) {
        console.error('Error logging rate limit:', error);
    }
}

async function getActiveSession(userId, tokenId) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                SELECT id, user_id, token_id, last_activity, created_at
                FROM user_sessions 
                WHERE user_id = :user_id 
                AND token_id = :token_id
                AND is_active = true
            `,
            parameters: [
                { name: 'user_id', value: { stringValue: userId } },
                { name: 'token_id', value: { stringValue: tokenId } }
            ]
        };

        const result = await rds.executeStatement(params).promise();
        if (result.records && result.records.length > 0) {
            const record = result.records[0];
            return {
                id: record[0].longValue,
                userId: record[1].stringValue,
                tokenId: record[2].stringValue,
                lastActivity: Math.floor(new Date(record[3].stringValue).getTime() / 1000),
                createdAt: record[4].stringValue
            };
        }

        return null;

    } catch (error) {
        console.error('Error getting active session:', error);
        return null;
    }
}

async function updateSessionActivity(userId, tokenId) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                UPDATE user_sessions SET
                    last_activity = NOW()
                WHERE user_id = :user_id 
                AND token_id = :token_id
            `,
            parameters: [
                { name: 'user_id', value: { stringValue: userId } },
                { name: 'token_id', value: { stringValue: tokenId } }
            ]
        };

        await rds.executeStatement(params).promise();
    } catch (error) {
        console.error('Error updating session activity:', error);
    }
}

async function invalidateSession(userId, tokenId) {
    try {
        const params = {
            resourceArn: DATABASE_ARN,
            secretArn: SECRET_ARN,
            database: 'clinical_trial',
            sql: `
                UPDATE user_sessions SET
                    is_active = false,
                    ended_at = NOW()
                WHERE user_id = :user_id 
                AND token_id = :token_id
            `,
            parameters: [
                { name: 'user_id', value: { stringValue: userId } },
                { name: 'token_id', value: { stringValue: tokenId } }
            ]
        };

        await rds.executeStatement(params).promise();
    } catch (error) {
        console.error('Error invalidating session:', error);
    }
}

function createUnauthorizedResponse(message) {
    return {
        statusCode: 401,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: message })
    };
}

function createRateLimitResponse(message) {
    return {
        statusCode: 429,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Retry-After': '3600'
        },
        body: JSON.stringify({ error: message })
    };
}

/**
 * Comprehensive middleware wrapper
 * Combines all validation checks
 */
exports.authMiddleware = async (event) => {
    try {
        // 1. Validate JWT token
        const jwtResult = await exports.validateJWT(event);
        if (!jwtResult.isValid) {
            return jwtResult;
        }

        // 2. Validate rate limits
        const rateLimitResult = await exports.validateRateLimit(event);
        if (!rateLimitResult.isValid) {
            return rateLimitResult;
        }

        // 3. Validate session
        const sessionResult = await exports.validateSession(event);
        if (!sessionResult.isValid) {
            return sessionResult;
        }

        return {
            isValid: true,
            user: event.user,
            session: sessionResult.session,
            rateLimit: rateLimitResult.remaining
        };

    } catch (error) {
        console.error('Auth middleware error:', error);
        return createUnauthorizedResponse('Authentication failed');
    }
};