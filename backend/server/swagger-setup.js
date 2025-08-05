const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

/**
 * Swagger UI Setup for Clinical Trial Platform API
 * 
 * Provides interactive API documentation accessible at /api-docs
 * Loads OpenAPI specification from docs/api/openapi.yaml
 */

// Load OpenAPI specification
const openApiPath = path.join(__dirname, '../../docs/api/openapi.yaml');
let swaggerDocument;

try {
    swaggerDocument = YAML.load(openApiPath);
    console.log('✅ OpenAPI specification loaded successfully');
} catch (error) {
    console.error('❌ Failed to load OpenAPI specification:', error.message);
    // Fallback minimal specification
    swaggerDocument = {
        openapi: '3.0.3',
        info: {
            title: 'Clinical Trial Platform API',
            version: '1.0.0',
            description: 'API documentation is temporarily unavailable'
        },
        paths: {}
    };
}

// Swagger UI configuration options
const swaggerOptions = {
    customCss: `
        .swagger-ui .topbar { 
            display: none; 
        }
        .swagger-ui .info .title {
            color: #2563eb;
            font-weight: bold;
        }
        .swagger-ui .scheme-container {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px;
            border-radius: 6px;
        }
        .swagger-ui .info .description p {
            margin: 10px 0px;
        }
        .swagger-ui .info .description code {
            background: #f1f5f9;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 85%;
        }
    `,
    customSiteTitle: 'Clinical Trial Platform API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
        requestInterceptor: (req) => {
            // Add request ID header for all requests
            req.headers['X-Request-Source'] = 'swagger-ui';
            return req;
        },
        responseInterceptor: (res) => {
            // Log responses for debugging
            if (process.env.NODE_ENV === 'development') {
                console.log('Swagger UI Response:', {
                    status: res.status,
                    url: res.url,
                    headers: res.headers
                });
            }
            return res;
        }
    }
};

/**
 * Setup Swagger UI middleware
 * @param {Express} app - Express application instance
 */
function setupSwagger(app) {
    // Serve Swagger UI at /api-docs
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerDocument, swaggerOptions));
    
    // Serve raw OpenAPI JSON at /api-docs/json
    app.get('/api-docs/json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.json(swaggerDocument);
    });
    
    // Serve raw OpenAPI YAML at /api-docs/yaml
    app.get('/api-docs/yaml', (req, res) => {
        res.setHeader('Content-Type', 'text/yaml');
        res.send(YAML.stringify(swaggerDocument, 4));
    });
    
    // API documentation landing page
    app.get('/docs', (req, res) => {
        res.redirect('/api-docs');
    });
    
    console.log('📚 API Documentation available at:');
    console.log(`   Interactive UI: http://localhost:${process.env.PORT || 3001}/api-docs`);
    console.log(`   OpenAPI JSON:   http://localhost:${process.env.PORT || 3001}/api-docs/json`);
    console.log(`   OpenAPI YAML:   http://localhost:${process.env.PORT || 3001}/api-docs/yaml`);
}

/**
 * Middleware to add API documentation links to main API endpoint
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
function addDocumentationLinks(req, res, next) {
    // Add documentation links to main API response
    if (req.path === '/api' && req.method === 'GET') {
        const originalJson = res.json;
        res.json = function(data) {
            if (data && typeof data === 'object') {
                data.documentation = {
                    interactive: '/api-docs',
                    openapi_json: '/api-docs/json',
                    openapi_yaml: '/api-docs/yaml',
                    version: swaggerDocument.info?.version || '1.0.0'
                };
            }
            return originalJson.call(this, data);
        };
    }
    next();
}

/**
 * Validate OpenAPI specification at startup
 * @returns {boolean} - True if specification is valid
 */
function validateOpenApiSpec() {
    try {
        // Basic validation checks
        const requiredFields = ['openapi', 'info', 'paths'];
        const missingFields = requiredFields.filter(field => !swaggerDocument[field]);
        
        if (missingFields.length > 0) {
            console.warn('⚠️  OpenAPI specification missing required fields:', missingFields);
            return false;
        }
        
        // Check if we have any paths defined
        const pathCount = Object.keys(swaggerDocument.paths || {}).length;
        if (pathCount === 0) {
            console.warn('⚠️  OpenAPI specification has no paths defined');
            return false;
        }
        
        console.log(`✅ OpenAPI specification validation passed (${pathCount} endpoints)`);
        return true;
        
    } catch (error) {
        console.error('❌ OpenAPI specification validation failed:', error.message);
        return false;
    }
}

module.exports = {
    setupSwagger,
    addDocumentationLinks,
    validateOpenApiSpec,
    swaggerDocument
};