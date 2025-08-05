class AuditLogger {
    // Main audit logging middleware
    static log(req, res, next) {
        // Skip logging for health checks and static assets
        if (req.path === '/health' || req.path.startsWith('/static')) {
            return next();
        }

        // Store original methods to intercept responses
        const originalSend = res.send;
        const originalJson = res.json;
        
        let responseBody = null;
        let statusCode = null;

        // Intercept res.send
        res.send = function(body) {
            responseBody = body;
            statusCode = res.statusCode;
            return originalSend.call(this, body);
        };

        // Intercept res.json
        res.json = function(body) {
            responseBody = body;
            statusCode = res.statusCode;
            return originalJson.call(this, body);
        };

        // Log the request when response finishes
        res.on('finish', () => {
            AuditLogger.logRequest(req, res, responseBody, statusCode);
        });

        next();
    }

    // Log individual requests
    static async logRequest(req, res, responseBody, statusCode) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            path: req.path,
            statusCode: statusCode || res.statusCode,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress,
            user: req.user ? {
                id: req.user.id,
                email: req.user.email,
                userType: req.user.userType
            } : null,
            requestSize: req.headers['content-length'] || 0,
            responseSize: res.get('content-length') || 0,
            duration: Date.now() - req.startTime,
            success: statusCode < 400
        };

        // Add request body for sensitive operations (excluding passwords)
        if (AuditLogger.shouldLogRequestBody(req)) {
            logEntry.requestBody = AuditLogger.sanitizeRequestBody(req.body);
        }

        // Add response body for errors
        if (statusCode >= 400 && responseBody) {
            logEntry.responseBody = typeof responseBody === 'string' 
                ? JSON.parse(responseBody) 
                : responseBody;
        }

        // Console logging (structured for development)
        if (process.env.NODE_ENV === 'development') {
            AuditLogger.logToConsole(logEntry);
        }

        // Database logging for audit trail
        if (req.app.locals.db) {
            await AuditLogger.logToDatabase(req.app.locals.db, logEntry);
        }
    }

    // Determine if request body should be logged
    static shouldLogRequestBody(req) {
        const sensitiveOperations = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/responses',
            '/api/patients/profile',
            '/api/physicians/profile'
        ];

        const isPost = req.method === 'POST';
        const isPut = req.method === 'PUT';
        const isPatch = req.method === 'PATCH';
        const isSensitive = sensitiveOperations.some(path => req.path.startsWith(path));

        return (isPost || isPut || isPatch) && isSensitive;
    }

    // Remove sensitive data from request body
    static sanitizeRequestBody(body) {
        if (!body || typeof body !== 'object') {
            return body;
        }

        const sanitized = { ...body };
        const sensitiveFields = [
            'password', 'currentPassword', 'newPassword', 'confirmPassword',
            'ssn', 'socialSecurityNumber', 'creditCard', 'bankAccount',
            'token', 'secret', 'key', 'signature'
        ];

        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });

        // Sanitize nested objects
        Object.keys(sanitized).forEach(key => {
            if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = AuditLogger.sanitizeRequestBody(sanitized[key]);
            }
        });

        return sanitized;
    }

    // Console logging for development
    static logToConsole(logEntry) {
        const { method, path, statusCode, user, duration } = logEntry;
        const userInfo = user ? `${user.userType}:${user.email}` : 'anonymous';
        const status = statusCode < 400 ? '✅' : statusCode < 500 ? '⚠️' : '❌';
        
        console.log(
            `${status} ${method} ${path} - ${statusCode} - ${userInfo} - ${duration}ms`
        );

        // Log errors with more detail
        if (statusCode >= 400) {
            console.log('   Error Details:', {
                requestId: logEntry.requestId,
                ip: logEntry.ip,
                userAgent: logEntry.userAgent,
                responseBody: logEntry.responseBody
            });
        }
    }

    // Database logging for audit trail
    static async logToDatabase(db, logEntry) {
        try {
            // Log to access_audit_log table
            await db.query(`
                INSERT INTO access_audit_log (
                    user_email, user_type, action, resource_type, resource_id,
                    success, ip_address, user_agent, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `, [
                logEntry.user?.email || 'anonymous',
                logEntry.user?.userType || 'unknown',
                `${logEntry.method} ${logEntry.path}`,
                AuditLogger.extractResourceType(logEntry.path),
                AuditLogger.extractResourceId(logEntry.path),
                logEntry.success,
                logEntry.ip,
                logEntry.userAgent
            ]);

            // Log detailed request information for sensitive operations
            if (AuditLogger.isSensitiveOperation(logEntry.path)) {
                await AuditLogger.logSensitiveOperation(db, logEntry);
            }

            // Log security incidents for failed authentication attempts
            if (logEntry.path.includes('/auth/') && !logEntry.success) {
                await AuditLogger.logSecurityIncident(db, logEntry);
            }

        } catch (error) {
            console.error('Failed to log audit entry to database:', error);
        }
    }

    // Extract resource type from URL path
    static extractResourceType(path) {
        const pathParts = path.split('/').filter(part => part);
        if (pathParts.length >= 2 && pathParts[0] === 'api') {
            return pathParts[1]; // Return 'patients', 'physicians', 'questionnaires', etc.
        }
        return 'unknown';
    }

    // Extract resource ID from URL path
    static extractResourceId(path) {
        const pathParts = path.split('/').filter(part => part);
        // Look for numeric IDs or UUIDs in the path
        const idPattern = /^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
        
        for (const part of pathParts) {
            if (idPattern.test(part)) {
                return part;
            }
        }
        return null;
    }

    // Check if operation is sensitive and requires detailed logging
    static isSensitiveOperation(path) {
        const sensitivePatterns = [
            '/api/auth/',
            '/api/patients/profile',
            '/api/physicians/profile',
            '/api/responses',
            '/api/media/upload'
        ];

        return sensitivePatterns.some(pattern => path.includes(pattern));
    }

    // Log sensitive operations with additional detail
    static async logSensitiveOperation(db, logEntry) {
        try {
            const operationDetails = {
                timestamp: logEntry.timestamp,
                requestId: logEntry.requestId,
                operation: `${logEntry.method} ${logEntry.path}`,
                user: logEntry.user,
                ip: logEntry.ip,
                userAgent: logEntry.userAgent,
                success: logEntry.success,
                statusCode: logEntry.statusCode,
                duration: logEntry.duration,
                requestBody: logEntry.requestBody,
                responseBody: logEntry.responseBody
            };

            // Store in a separate table for sensitive operations (if exists)
            await db.query(`
                INSERT INTO sensitive_operations_log (
                    user_email, operation, details, ip_address, success, created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT DO NOTHING
            `, [
                logEntry.user?.email || 'anonymous',
                operationDetails.operation,
                JSON.stringify(operationDetails),
                logEntry.ip,
                logEntry.success
            ]).catch(() => {
                // Table might not exist, ignore error
            });

        } catch (error) {
            console.error('Failed to log sensitive operation:', error);
        }
    }

    // Log security incidents
    static async logSecurityIncident(db, logEntry) {
        try {
            let incidentType = 'unknown';
            let severity = 'medium';

            if (logEntry.path.includes('/login')) {
                incidentType = 'failed_login';
                severity = 'high';
            } else if (logEntry.path.includes('/register')) {
                incidentType = 'failed_registration';
                severity = 'medium';
            } else if (logEntry.statusCode === 401) {
                incidentType = 'unauthorized_access';
                severity = 'high';
            } else if (logEntry.statusCode === 403) {
                incidentType = 'access_denied';
                severity = 'medium';
            }

            await db.query(`
                INSERT INTO security_incidents (
                    user_email, incident_type, severity, details, ip_address, user_agent, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
                logEntry.user?.email || 'anonymous',
                incidentType,
                severity,
                JSON.stringify({
                    path: logEntry.path,
                    method: logEntry.method,
                    statusCode: logEntry.statusCode,
                    responseBody: logEntry.responseBody
                }),
                logEntry.ip,
                logEntry.userAgent
            ]);

        } catch (error) {
            console.error('Failed to log security incident:', error);
        }
    }

    // Middleware to add start time for duration calculation
    static addStartTime(req, res, next) {
        req.startTime = Date.now();
        next();
    }

    // Express middleware factory
    static middleware() {
        return [
            AuditLogger.addStartTime,
            AuditLogger.log
        ];
    }

    // Manual logging for specific events
    static async logCustomEvent(db, eventType, details, req = null) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                eventType: eventType,
                details: details,
                user: req?.user || null,
                ip: req?.ip || null,
                userAgent: req?.headers?.['user-agent'] || null
            };

            await db.query(`
                INSERT INTO access_audit_log (
                    user_email, user_type, action, success, ip_address, user_agent, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
                logEntry.user?.email || 'system',
                logEntry.user?.userType || 'system',
                eventType,
                true,
                logEntry.ip,
                logEntry.userAgent
            ]);

        } catch (error) {
            console.error('Failed to log custom event:', error);
        }
    }
}

module.exports = AuditLogger;