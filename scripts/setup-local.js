#!/usr/bin/env node

/**
 * Clinical Trial Platform - Local Development Setup Script
 * Node.js version for cross-platform compatibility
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
    colorLog(`\n${message}`, 'magenta');
    colorLog('='.repeat(message.length), 'magenta');
}

function success(message) {
    colorLog(`✅ ${message}`, 'green');
}

function error(message) {
    colorLog(`❌ ${message}`, 'red');
}

function warning(message) {
    colorLog(`⚠️  ${message}`, 'yellow');
}

function info(message) {
    colorLog(`ℹ️  ${message}`, 'cyan');
}

function checkPrerequisites() {
    info('Checking prerequisites...');
    
    try {
        // Check Node.js
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        success(`Node.js: ${nodeVersion}`);
        
        // Check NPM
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        success(`NPM: v${npmVersion}`);
        
        // Check Docker
        const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
        success(`Docker: ${dockerVersion}`);
        
        // Check if Docker is running
        execSync('docker info', { stdio: 'ignore' });
        success('Docker daemon is running');
        
        // Check Docker Compose
        const composeVersion = execSync('docker-compose --version', { encoding: 'utf8' }).trim();
        success(`Docker Compose: ${composeVersion}`);
        
    } catch (err) {
        error('Prerequisites check failed');
        console.error(err.message);
        process.exit(1);
    }
}

function installDependencies() {
    info('Installing NPM dependencies...');
    
    try {
        execSync('npm install', { stdio: 'inherit' });
        success('Dependencies installed successfully');
    } catch (err) {
        error('Failed to install dependencies');
        process.exit(1);
    }
}

function setupEnvironment() {
    info('Setting up environment configuration...');
    
    const envPath = '.env';
    const envExamplePath = '.env.example';
    
    if (fs.existsSync(envPath)) {
        warning('.env file already exists, skipping...');
    } else {
        fs.copyFileSync(envExamplePath, envPath);
        success('Environment file created from template');
    }
}

function createDirectories() {
    info('Creating necessary directories...');
    
    const directories = [
        'uploads',
        'uploads/temp',
        'uploads/media',
        'logs',
        'backups'
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            success(`Created directory: ${dir}`);
        }
    });
}

async function setupDocker() {
    info('Setting up Docker services...');
    
    try {
        // Stop any existing containers
        try {
            execSync('docker-compose down -v', { stdio: 'ignore' });
            info('Cleaned up existing containers');
        } catch {
            // Ignore errors if no containers exist
        }
        
        // Start services
        info('Starting PostgreSQL, Redis, MinIO, and pgAdmin...');
        execSync('docker-compose up -d', { stdio: 'inherit' });
        
        // Wait for services to be ready
        info('Waiting for services to start...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check service health
        let postgresReady = false;
        let redisReady = false;
        let attempts = 0;
        const maxAttempts = 30;
        
        while ((!postgresReady || !redisReady) && attempts < maxAttempts) {
            attempts++;
            
            if (!postgresReady) {
                try {
                    execSync('docker-compose exec -T postgres pg_isready -U dev_user -d clinical_trial_dev', { stdio: 'ignore' });
                    postgresReady = true;
                    success('PostgreSQL is ready');
                } catch {
                    // Still starting up
                }
            }
            
            if (!redisReady) {
                try {
                    execSync('docker-compose exec -T redis redis-cli ping', { stdio: 'ignore' });
                    redisReady = true;
                    success('Redis is ready');
                } catch {
                    // Still starting up
                }
            }
            
            if (!postgresReady || !redisReady) {
                process.stdout.write('.');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        if (!postgresReady || !redisReady) {
            error('Services failed to start within timeout');
            process.exit(1);
        }
        
        success('All Docker services are running');
        
    } catch (err) {
        error('Failed to start Docker services');
        console.error(err.message);
        process.exit(1);
    }
}

async function initializeDatabase() {
    info('Initializing database...');
    
    // Wait a bit more for PostgreSQL to be fully ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
        // Run database migrations
        info('Running database migrations...');
        execSync('node backend/database/migrate.js up', { stdio: 'inherit' });
        
        // Seed database with test data
        info('Seeding database with test data...');
        execSync('node backend/database/seed-data.js seed', { stdio: 'inherit' });
        
        success('Database initialized successfully');
        
    } catch (err) {
        error('Failed to initialize database');
        console.error(err.message);
        info('Try running the database commands manually:');
        info('  node backend/database/migrate.js up');
        info('  node backend/database/seed-data.js seed');
        process.exit(1);
    }
}

function showSummary() {
    header('🎉 Local development environment setup complete!');
    
    colorLog('\n📋 SETUP SUMMARY:', 'cyan');
    success('Dependencies installed');
    success('Environment configured');
    success('Docker services running');
    success('Database initialized');
    success('Test data seeded');
    
    colorLog('\n🌐 SERVICES AVAILABLE:', 'cyan');
    info('• API Server: http://localhost:3001 (not started yet)');
    info('• PostgreSQL: localhost:5432');
    info('• Redis: localhost:6379');
    info('• MinIO Console: http://localhost:9001');
    info('• pgAdmin: http://localhost:5050');
    
    colorLog('\n🔐 TEST CREDENTIALS:', 'cyan');
    info('• Physician: dr.smith@centralmedical.com / DevPassword123!');
    info('• Patient: patient1@example.com / PatientPass123!');
    info('• pgAdmin: admin@clinical-trial.local / admin123');
    info('• MinIO: minioadmin / minioadmin123');
    
    colorLog('\n🚀 NEXT STEPS:', 'cyan');
    info('1. Start the API server:');
    info('   npm run dev:server');
    info('');
    info('2. Access the API documentation:');
    info('   http://localhost:3001/api');
    info('');
    info('3. Test the health endpoint:');
    info('   http://localhost:3001/health');
    
    colorLog('\n📚 USEFUL COMMANDS:', 'cyan');
    info('• npm run dev:server          - Start API server with auto-reload');
    info('• npm run dev:db              - Start only database services');
    info('• npm run dev:services        - Start all Docker services');
    info('• npm run dev:seed            - Re-seed test data');
    info('• npm run dev:reset           - Reset and re-seed database');
    info('• npm run dev:clean           - Clean up Docker resources');
    
    colorLog('\nHappy coding! 🎯', 'magenta');
}

async function main() {
    header('🚀 Clinical Trial Platform - Local Development Setup');
    
    try {
        checkPrerequisites();
        installDependencies();
        setupEnvironment();
        createDirectories();
        await setupDocker();
        await initializeDatabase();
        showSummary();
    } catch (err) {
        error(`Setup failed: ${err.message}`);
        
        colorLog('\n🔧 TROUBLESHOOTING:', 'yellow');
        info('1. Ensure Docker Desktop is running');
        info('2. Check that ports 3001, 5432, 6379, 9000, 9001, 5050 are available');
        info('3. Check the logs: docker-compose logs');
        
        process.exit(1);
    }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    header('🚀 Clinical Trial Platform - Local Development Setup');
    colorLog('\nUSAGE:', 'cyan');
    info('  node scripts/setup-local.js');
    colorLog('\nOPTIONS:', 'cyan');
    info('  --help, -h    Show this help message');
    colorLog('\nThis script will:');
    info('• Check prerequisites (Node.js, NPM, Docker)');
    info('• Install NPM dependencies');
    info('• Set up environment configuration');
    info('• Start Docker services (PostgreSQL, Redis, MinIO)');
    info('• Initialize and seed the database');
    process.exit(0);
}

// Run main function
main();