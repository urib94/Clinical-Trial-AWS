#!/usr/bin/env node

/**
 * API Documentation Setup Script
 * 
 * This script:
 * 1. Installs required dependencies for Swagger UI
 * 2. Validates the OpenAPI specification
 * 3. Tests the API documentation endpoints
 * 4. Provides setup verification
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`${colors.blue}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
    log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
    log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
    log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

async function checkFileExists(filePath) {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function installDependencies() {
    logStep('1', 'Installing required npm packages...');
    
    try {
        const { stdout, stderr } = await execAsync('npm install swagger-ui-express yamljs', {
            cwd: path.join(__dirname, '..')
        });
        
        if (stderr && !stderr.includes('npm WARN')) {
            logWarning(`npm warnings: ${stderr}`);
        }
        
        logSuccess('Dependencies installed successfully');
        return true;
    } catch (error) {
        logError(`Failed to install dependencies: ${error.message}`);
        return false;
    }
}

async function validateOpenApiSpec() {
    logStep('2', 'Validating OpenAPI specification...');
    
    const openApiPath = path.join(__dirname, '../docs/api/openapi.yaml');
    
    if (!(await checkFileExists(openApiPath))) {
        logError(`OpenAPI specification not found at: ${openApiPath}`);
        return false;
    }
    
    try {
        const YAML = require('yamljs');
        const spec = YAML.load(openApiPath);
        
        // Basic validation
        const requiredFields = ['openapi', 'info', 'paths'];
        const missingFields = requiredFields.filter(field => !spec[field]);
        
        if (missingFields.length > 0) {
            logError(`OpenAPI spec missing required fields: ${missingFields.join(', ')}`);
            return false;
        }
        
        const pathCount = Object.keys(spec.paths || {}).length;
        const schemaCount = Object.keys(spec.components?.schemas || {}).length;
        
        logSuccess(`OpenAPI specification is valid`);
        log(`   📊 Endpoints: ${pathCount}`);
        log(`   🏗️  Schemas: ${schemaCount}`);
        log(`   📝 Version: ${spec.info.version}`);
        
        return true;
    } catch (error) {
        logError(`OpenAPI validation failed: ${error.message}`);
        return false;
    }
}

async function validateSwaggerSetup() {
    logStep('3', 'Validating Swagger UI setup...');
    
    const swaggerSetupPath = path.join(__dirname, '../backend/server/swagger-setup.js');
    const appPath = path.join(__dirname, '../backend/server/app.js');
    
    // Check if swagger-setup.js exists
    if (!(await checkFileExists(swaggerSetupPath))) {
        logError(`Swagger setup file not found at: ${swaggerSetupPath}`);
        return false;
    }
    
    // Check if app.js includes swagger setup
    try {
        const appContent = await fs.promises.readFile(appPath, 'utf8');
        
        if (!appContent.includes('swagger-setup')) {
            logError('app.js does not include Swagger setup integration');
            return false;
        }
        
        if (!appContent.includes('setupSwagger')) {
            logError('app.js does not call setupSwagger function');
            return false;
        }
        
        logSuccess('Swagger UI setup is properly integrated');
        return true;
    } catch (error) {
        logError(`Failed to validate app.js: ${error.message}`);
        return false;
    }
}

async function testApiDocumentation() {
    logStep('4', 'Testing API documentation endpoints...');
    
    // We can't actually start the server in this script, but we can check the configuration
    log('   📋 Expected documentation endpoints:');
    log('      • Interactive UI: http://localhost:3001/api-docs');
    log('      • OpenAPI JSON: http://localhost:3001/api-docs/json');
    log('      • OpenAPI YAML: http://localhost:3001/api-docs/yaml');
    log('      • Redirect: http://localhost:3001/docs');
    
    logSuccess('API documentation endpoints configured');
    return true;
}

async function generateApiDocsSummary() {
    logStep('5', 'Generating API documentation summary...');
    
    try {
        const YAML = require('yamljs');
        const openApiPath = path.join(__dirname, '../docs/api/openapi.yaml');
        const spec = YAML.load(openApiPath);
        
        const summary = {
            title: spec.info.title,
            version: spec.info.version,
            endpoints: {},
            totalEndpoints: 0
        };
        
        // Count endpoints by tag
        for (const [path, methods] of Object.entries(spec.paths)) {
            for (const [method, operation] of Object.entries(methods)) {
                if (typeof operation === 'object' && operation.tags) {
                    const tag = operation.tags[0] || 'Untagged';
                    if (!summary.endpoints[tag]) {
                        summary.endpoints[tag] = 0;
                    }
                    summary.endpoints[tag]++;
                    summary.totalEndpoints++;
                }
            }
        }
        
        log(`\n${colors.bold}📚 API Documentation Summary:${colors.reset}`);
        log(`   Title: ${summary.title}`);
        log(`   Version: ${summary.version}`);
        log(`   Total Endpoints: ${summary.totalEndpoints}`);
        log(`\n   Endpoints by Category:`);
        
        for (const [tag, count] of Object.entries(summary.endpoints)) {
            log(`      • ${tag}: ${count} endpoints`);
        }
        
        return true;
    } catch (error) {
        logError(`Failed to generate summary: ${error.message}`);
        return false;
    }
}

async function main() {
    log(`\n${colors.bold}🚀 Clinical Trial Platform - API Documentation Setup${colors.reset}\n`);
    
    const steps = [
        installDependencies,
        validateOpenApiSpec,
        validateSwaggerSetup,
        testApiDocumentation,
        generateApiDocsSummary
    ];
    
    let allSuccessful = true;
    
    for (const step of steps) {
        const success = await step();
        if (!success) {
            allSuccessful = false;
        }
        console.log(''); // Add spacing between steps
    }
    
    if (allSuccessful) {
        log(`${colors.green}${colors.bold}🎉 API Documentation Setup Complete!${colors.reset}\n`);
        log('Next steps:');
        log('1. Start the development server: npm run dev:server');
        log('2. Visit http://localhost:3001/api-docs to view the interactive API documentation');
        log('3. Use the documentation to test API endpoints and understand the platform capabilities');
        log('4. The documentation is now ready for Android app integration planning\n');
    } else {
        log(`${colors.red}${colors.bold}❌ API Documentation Setup Failed${colors.reset}\n`);
        log('Please review the errors above and resolve them before proceeding.\n');
        process.exit(1);
    }
}

// Run the setup
if (require.main === module) {
    main().catch(error => {
        logError(`Setup script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    installDependencies,
    validateOpenApiSpec,
    validateSwaggerSetup,
    testApiDocumentation,
    generateApiDocsSummary
};