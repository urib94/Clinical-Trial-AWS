class ErrorHandler {
    static handle(error, req, res, next) {
        console.error('Error occurred:', {
            message: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            userId: req.user?.id,
            userType: req.user?.userType,
            timestamp: new Date().toISOString()
        });

        // Log to database if available
        if (req.app.locals.db) {
            ErrorHandler.logErrorToDatabase(req.app.locals.db, error, req).catch(err => {
                console.error('Failed to log error to database:', err);
            });
        }

        // Handle specific error types
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.message,
                code: 'VALIDATION_ERROR'
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'Invalid ID format',
                message: 'The provided ID is not in the correct format',
                code: 'INVALID_ID'
            });
        }

        if (error.code === '23505') { // PostgreSQL unique violation
            return res.status(409).json({
                error: 'Duplicate entry',
                message: 'A record with this information already exists',
                code: 'DUPLICATE_ENTRY'
            });
        }

        if (error.code === '23503') { // PostgreSQL foreign key violation
            return res.status(400).json({
                error: 'Invalid reference',
                message: 'Referenced record does not exist',
                code: 'FOREIGN_KEY_ERROR'
            });
        }

        if (error.code === '23502') { // PostgreSQL not null violation
            return res.status(400).json({
                error: 'Missing required field',
                message: 'A required field is missing',
                code: 'REQUIRED_FIELD_MISSING'
            });
        }

        // Handle file upload errors
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'The uploaded file exceeds the maximum size limit',
                code: 'FILE_TOO_LARGE'
            });
        }

        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected file',
                message: 'An unexpected file was uploaded',
                code: 'UNEXPECTED_FILE'
            });
        }

        // Handle JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'The provided authentication token is invalid',
                code: 'INVALID_TOKEN'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'The authentication token has expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        // Handle database connection errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(503).json({
                error: 'Service unavailable',
                message: 'Database connection failed',
                code: 'DATABASE_UNAVAILABLE'
            });
        }

        // Handle Redis connection errors
        if (error.code === 'ECONNRESET' && error.message.includes('Redis')) {
            return res.status(503).json({
                error: 'Service unavailable',
                message: 'Session store unavailable',
                code: 'SESSION_STORE_UNAVAILABLE'
            });
        }

        // Handle rate limiting errors
        if (error.status === 429) {
            return res.status(429).json({
                error: 'Too many requests',
                message: 'Rate limit exceeded, please try again later',
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        // Handle permission errors
        if (error.name === 'PermissionError') {
            return res.status(403).json({
                error: 'Permission denied',
                message: error.message || 'You do not have permission to perform this action',
                code: 'PERMISSION_DENIED'
            });
        }

        // Handle not found errors
        if (error.name === 'NotFoundError') {
            return res.status(404).json({
                error: 'Resource not found',
                message: error.message || 'The requested resource was not found',
                code: 'RESOURCE_NOT_FOUND'
            });
        }

        // Handle custom application errors
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: error.name || 'Application Error',
                message: error.message,
                code: error.code || 'APPLICATION_ERROR'
            });
        }

        // Default server error
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: isDevelopment ? error.message : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
            ...(isDevelopment && { stack: error.stack })
        });
    }

    static async logErrorToDatabase(db, error, req) {
        try {
            await db.query(`
                INSERT INTO access_audit_log (
                    user_email, user_type, action, success, ip_address, user_agent, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
                req.user?.email || 'anonymous',
                req.user?.userType || 'unknown',
                `error_${req.method}_${req.path}`,
                false,
                req.ip,
                req.headers['user-agent']
            ]);
        } catch (logError) {
            console.error('Failed to log error to database:', logError);
        }
    }

    // 404 handler for unknown routes
    static notFound(req, res) {
        res.status(404).json({
            error: 'Not Found',
            message: `Route ${req.method} ${req.originalUrl} not found`,
            code: 'ROUTE_NOT_FOUND'
        });
    }

    // Custom error classes
    static createError(message, statusCode = 500, code = 'APPLICATION_ERROR') {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.code = code;
        return error;
    }

    static validationError(message, details = []) {
        const error = new Error(message);
        error.name = 'ValidationError';
        error.details = details;
        return error;
    }

    static permissionError(message = 'Permission denied') {
        const error = new Error(message);
        error.name = 'PermissionError';
        return error;
    }

    static notFoundError(message = 'Resource not found') {
        const error = new Error(message);
        error.name = 'NotFoundError';
        return error;
    }

    // Async error wrapper
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}

module.exports = ErrorHandler;