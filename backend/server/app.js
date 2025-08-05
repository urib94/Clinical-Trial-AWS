const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');
const { Pool } = require('pg');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const physicianRoutes = require('./routes/physicians');
const patientRoutes = require('./routes/patients');
const questionnaireRoutes = require('./routes/questionnaires');
const responseRoutes = require('./routes/responses');
const mediaRoutes = require('./routes/media');

// Import middleware
const authMiddleware = require('./middleware/auth');
const validationMiddleware = require('./middleware/validation');
const errorHandler = require('./middleware/error-handler');
const auditLogger = require('./middleware/audit-logger');

// Import Swagger documentation setup
const { setupSwagger, addDocumentationLinks, validateOpenApiSpec } = require('./swagger-setup');

class ClinicalTrialServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        this.environment = process.env.NODE_ENV || 'development';
        
        // Initialize database connection
        this.initializeDatabase();
        
        // Initialize Redis connection
        this.initializeRedis();
        
        // Setup middleware
        this.setupMiddleware();
        
        // Setup routes
        this.setupRoutes();
        
        // Setup error handling
        this.setupErrorHandling();
    }

    initializeDatabase() {
        this.db = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'clinical_trial_dev',
            user: process.env.DB_USER || 'api_user',
            password: process.env.DB_PASSWORD || 'api_password',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Test database connection
        this.db.connect()
            .then(client => {
                console.log('✅ Connected to PostgreSQL database');
                client.release();
            })
            .catch(err => {
                console.error('❌ Database connection failed:', err.message);
                process.exit(1);
            });

        // Make database available to all routes
        this.app.locals.db = this.db;
    }

    initializeRedis() {
        this.redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || 'dev_redis_password',
            db: 0
        });

        this.redisClient.on('connect', () => {
            console.log('✅ Connected to Redis server');
        });

        this.redisClient.on('error', (err) => {
            console.error('❌ Redis connection error:', err.message);
        });

        // Make Redis client available to all routes
        this.app.locals.redis = this.redisClient;
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Compression middleware
        this.app.use(compression());

        // Request logging
        if (this.environment === 'development') {
            this.app.use(morgan('dev'));
        } else {
            this.app.use(morgan('combined'));
        }

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: this.environment === 'development' ? 1000 : 100, // Limit each IP
            message: {
                error: 'Too many requests from this IP, please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
            },
            standardHeaders: true,
            legacyHeaders: false,
            store: new rateLimit.MemoryStore(), // In production, use Redis store
        });

        // Stricter rate limiting for auth endpoints
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: this.environment === 'development' ? 100 : 5, // Very restrictive for auth
            message: {
                error: 'Too many authentication attempts, please try again later.',
                code: 'AUTH_RATE_LIMIT_EXCEEDED'
            },
            skipSuccessfulRequests: true,
        });

        this.app.use('/api/auth', authLimiter);
        this.app.use(limiter);

        // Body parsing middleware
        this.app.use(express.json({ 
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Session configuration
        this.app.use(session({
            store: new RedisStore({ client: this.redisClient }),
            secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
            resave: false,
            saveUninitialized: false,
            name: 'clinical.session',
            cookie: {
                secure: this.environment === 'production',
                httpOnly: true,
                maxAge: 30 * 60 * 1000, // 30 minutes
                sameSite: 'lax'
            }
        }));

        // Custom middleware for request ID
        this.app.use((req, res, next) => {
            req.id = require('crypto').randomUUID();
            res.setHeader('X-Request-ID', req.id);
            next();
        });

        // Audit logging middleware
        this.app.use(auditLogger);

        // API documentation middleware
        this.app.use(addDocumentationLinks);

        // Trust proxy in production
        if (this.environment === 'production') {
            this.app.set('trust proxy', 1);
        }
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                environment: this.environment,
                version: process.env.npm_package_version || '1.0.0',
                services: {
                    database: 'connected',
                    redis: this.redisClient.connected ? 'connected' : 'disconnected'
                }
            });
        });

        // API documentation endpoint
        this.app.get('/api', (req, res) => {
            res.json({
                name: 'Clinical Trial Platform API',
                version: process.env.npm_package_version || '1.0.0',
                description: 'RESTful API for clinical trial patient data collection',
                environment: this.environment,
                endpoints: {
                    authentication: '/api/auth',
                    physicians: '/api/physicians',
                    patients: '/api/patients',
                    questionnaires: '/api/questionnaires',
                    responses: '/api/responses',
                    media: '/api/media'
                },
                documentation: '/api/docs'
            });
        });

        // Setup API documentation
        setupSwagger(this.app);

        // API Routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/physicians', authMiddleware.requireAuth, physicianRoutes);
        this.app.use('/api/patients', authMiddleware.requireAuth, patientRoutes);
        this.app.use('/api/questionnaires', authMiddleware.requireAuth, questionnaireRoutes);
        this.app.use('/api/responses', authMiddleware.requireAuth, responseRoutes);
        this.app.use('/api/media', authMiddleware.requireAuth, mediaRoutes);

        // Catch-all for undefined routes
        this.app.all('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.method} ${req.path} not found`,
                code: 'ROUTE_NOT_FOUND'
            });
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use(errorHandler);

        // Graceful shutdown handling
        process.on('SIGTERM', this.shutdown.bind(this));
        process.on('SIGINT', this.shutdown.bind(this));
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            this.shutdown();
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            this.shutdown();
        });
    }

    async shutdown() {
        console.log('\n🔄 Graceful shutdown initiated...');
        
        try {
            // Close database connections
            await this.db.end();
            console.log('✅ Database connections closed');
            
            // Close Redis connection
            this.redisClient.quit();
            console.log('✅ Redis connection closed');
            
            // Close HTTP server
            if (this.server) {
                this.server.close(() => {
                    console.log('✅ HTTP server closed');
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }

    start() {
        // Validate OpenAPI specification
        const specValid = validateOpenApiSpec();
        if (!specValid) {
            console.warn('⚠️  API documentation may be incomplete');
        }

        this.server = this.app.listen(this.port, () => {
            console.log('\n🚀 Clinical Trial Platform API Server Started');
            console.log(`   Environment: ${this.environment}`);
            console.log(`   Port: ${this.port}`);
            console.log(`   Health Check: http://localhost:${this.port}/health`);
            console.log(`   API Documentation: http://localhost:${this.port}/api-docs`);
            console.log('\n📡 Available Endpoints:');
            console.log('   POST /api/auth/login           - User authentication');
            console.log('   POST /api/auth/logout          - User logout');
            console.log('   GET  /api/physicians/dashboard - Physician dashboard');
            console.log('   GET  /api/patients/profile     - Patient profile');
            console.log('   GET  /api/questionnaires       - List questionnaires');
            console.log('   POST /api/responses            - Submit responses');
            console.log('   POST /api/media/upload         - Upload media files');
            console.log('\n📚 API Documentation:');
            console.log(`   Interactive UI: http://localhost:${this.port}/api-docs`);
            console.log(`   OpenAPI JSON:   http://localhost:${this.port}/api-docs/json`);
            console.log(`   OpenAPI YAML:   http://localhost:${this.port}/api-docs/yaml`);
            console.log('\n⚡ Ready for requests!');
        });

        return this.server;
    }
}

// Create and start server
const server = new ClinicalTrialServer();

// Export for testing
module.exports = server;

// Start server if this file is run directly
if (require.main === module) {
    server.start();
}