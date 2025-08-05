# Clinical Trial Platform - Local Development Setup Script
# This script sets up the complete local development environment

param(
    [switch]$SkipInstall = $false,
    [switch]$SkipDocker = $false,
    [switch]$SkipDatabase = $false,
    [switch]$Force = $false,
    [switch]$Help = $false
)

# Script configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow" 
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Show-Help {
    Write-ColorOutput "🚀 Clinical Trial Platform - Local Development Setup" "Header"
    Write-ColorOutput ""
    Write-ColorOutput "USAGE:" "Info"
    Write-ColorOutput "  .\scripts\setup-local.ps1 [OPTIONS]"
    Write-ColorOutput ""
    Write-ColorOutput "OPTIONS:" "Info"
    Write-ColorOutput "  -SkipInstall    Skip NPM package installation"
    Write-ColorOutput "  -SkipDocker     Skip Docker services setup"
    Write-ColorOutput "  -SkipDatabase   Skip database initialization"
    Write-ColorOutput "  -Force          Force overwrite existing configurations"
    Write-ColorOutput "  -Help           Show this help message"
    Write-ColorOutput ""
    Write-ColorOutput "EXAMPLES:" "Info"
    Write-ColorOutput "  .\scripts\setup-local.ps1                    # Full setup"
    Write-ColorOutput "  .\scripts\setup-local.ps1 -SkipInstall       # Skip package install"
    Write-ColorOutput "  .\scripts\setup-local.ps1 -Force             # Force overwrite"
    Write-ColorOutput ""
    exit 0
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." "Info"
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✅ Node.js: $nodeVersion" "Success"
    } catch {
        Write-ColorOutput "❌ Node.js is not installed or not in PATH" "Error"
        Write-ColorOutput "Please install Node.js 18+ from https://nodejs.org/" "Warning"
        exit 1
    }
    
    # Check NPM
    try {
        $npmVersion = npm --version
        Write-ColorOutput "✅ NPM: v$npmVersion" "Success"
    } catch {
        Write-ColorOutput "❌ NPM is not installed or not in PATH" "Error"
        exit 1
    }
    
    # Check Docker
    if (-not $SkipDocker) {
        try {
            $dockerVersion = docker --version
            Write-ColorOutput "✅ Docker: $dockerVersion" "Success"
            
            # Check if Docker is running
            docker info | Out-Null
            Write-ColorOutput "✅ Docker daemon is running" "Success"
        } catch {
            Write-ColorOutput "❌ Docker is not installed or not running" "Error"
            Write-ColorOutput "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" "Warning"
            exit 1
        }
        
        # Check Docker Compose
        try {
            $composeVersion = docker-compose --version
            Write-ColorOutput "✅ Docker Compose: $composeVersion" "Success"
        } catch {
            Write-ColorOutput "❌ Docker Compose is not installed" "Error"
            exit 1
        }
    }
    
    Write-ColorOutput ""
}

function Install-Dependencies {
    if ($SkipInstall) {
        Write-ColorOutput "⏭️  Skipping package installation" "Warning"
        return
    }
    
    Write-ColorOutput "📦 Installing NPM dependencies..." "Info"
    
    try {
        npm install
        Write-ColorOutput "✅ Dependencies installed successfully" "Success"
    } catch {
        Write-ColorOutput "❌ Failed to install dependencies" "Error"
        Write-ColorOutput "Error: $_" "Error"
        exit 1
    }
    
    Write-ColorOutput ""
}

function Setup-Environment {
    Write-ColorOutput "⚙️  Setting up environment configuration..." "Info"
    
    $envPath = ".env"
    $envExamplePath = ".env.example"
    
    if (Test-Path $envPath) {
        if (-not $Force) {
            Write-ColorOutput "⚠️  .env file already exists. Use -Force to overwrite" "Warning"
        } else {
            Copy-Item $envExamplePath $envPath -Force
            Write-ColorOutput "✅ Environment file overwritten" "Success"
        }
    } else {
        Copy-Item $envExamplePath $envPath
        Write-ColorOutput "✅ Environment file created from template" "Success"
    }
    
    Write-ColorOutput ""
}

function Setup-Docker {
    if ($SkipDocker) {
        Write-ColorOutput "⏭️  Skipping Docker setup" "Warning"
        return
    }
    
    Write-ColorOutput "🐳 Setting up Docker services..." "Info"
    
    # Stop any existing containers
    try {
        docker-compose down -v | Out-Null
        Write-ColorOutput "🧹 Cleaned up existing containers" "Info"
    } catch {
        # Ignore errors if no containers exist
    }
    
    # Start services
    try {
        Write-ColorOutput "🚀 Starting PostgreSQL, Redis, MinIO, and pgAdmin..." "Info"
        docker-compose up -d
        
        # Wait for services to be ready
        Write-ColorOutput "⏳ Waiting for services to start..." "Info"
        Start-Sleep -Seconds 10
        
        # Check service health
        $postgresReady = $false
        $redisReady = $false
        $attempts = 0
        $maxAttempts = 30
        
        while ((-not $postgresReady -or -not $redisReady) -and $attempts -lt $maxAttempts) {
            $attempts++
            
            if (-not $postgresReady) {
                try {
                    docker-compose exec -T postgres pg_isready -U dev_user -d clinical_trial_dev | Out-Null
                    $postgresReady = $true
                    Write-ColorOutput "✅ PostgreSQL is ready" "Success"
                } catch {
                    # Still starting up
                }
            }
            
            if (-not $redisReady) {
                try {
                    docker-compose exec -T redis redis-cli ping | Out-Null
                    $redisReady = $true
                    Write-ColorOutput "✅ Redis is ready" "Success"
                } catch {
                    # Still starting up
                }
            }
            
            if (-not $postgresReady -or -not $redisReady) {
                Write-Host "." -NoNewline
                Start-Sleep -Seconds 2
            }
        }
        
        if (-not $postgresReady -or -not $redisReady) {
            Write-ColorOutput "❌ Services failed to start within timeout" "Error"
            exit 1
        }
        
        Write-ColorOutput "✅ All Docker services are running" "Success"
        
    } catch {
        Write-ColorOutput "❌ Failed to start Docker services" "Error"
        Write-ColorOutput "Error: $_" "Error"
        exit 1
    }
    
    Write-ColorOutput ""
}

function Initialize-Database {
    if ($SkipDatabase) {
        Write-ColorOutput "⏭️  Skipping database initialization" "Warning"
        return
    }
    
    Write-ColorOutput "🗄️  Initializing database..." "Info"
    
    # Wait a bit more for PostgreSQL to be fully ready
    Start-Sleep -Seconds 5
    
    try {
        # Run database migrations
        Write-ColorOutput "📋 Running database migrations..." "Info"
        node backend/database/migrate.js up
        
        # Seed database with test data
        Write-ColorOutput "🌱 Seeding database with test data..." "Info"
        node backend/database/seed-data.js seed
        
        Write-ColorOutput "✅ Database initialized successfully" "Success"
        
    } catch {
        Write-ColorOutput "❌ Failed to initialize database" "Error"
        Write-ColorOutput "Error: $_" "Error"
        Write-ColorOutput "💡 Try running the database commands manually:" "Info"
        Write-ColorOutput "   node backend/database/migrate.js up" "Info"
        Write-ColorOutput "   node backend/database/seed-data.js seed" "Info"
        exit 1
    }
    
    Write-ColorOutput ""
}

function Create-Directories {
    Write-ColorOutput "📁 Creating necessary directories..." "Info"
    
    $directories = @(
        "uploads",
        "uploads/temp",
        "uploads/media",
        "logs",
        "backups"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-ColorOutput "✅ Created directory: $dir" "Success"
        }
    }
    
    Write-ColorOutput ""
}

function Show-Summary {
    Write-ColorOutput "🎉 Local development environment setup complete!" "Header"
    Write-ColorOutput ""
    Write-ColorOutput "📋 SETUP SUMMARY:" "Info"
    Write-ColorOutput "✅ Dependencies installed" "Success"
    Write-ColorOutput "✅ Environment configured" "Success"
    Write-ColorOutput "✅ Docker services running" "Success"
    Write-ColorOutput "✅ Database initialized" "Success"
    Write-ColorOutput "✅ Test data seeded" "Success"
    Write-ColorOutput ""
    Write-ColorOutput "🌐 SERVICES AVAILABLE:" "Info"
    Write-ColorOutput "• API Server: http://localhost:3001 (not started yet)" "Info"
    Write-ColorOutput "• PostgreSQL: localhost:5432" "Info"
    Write-ColorOutput "• Redis: localhost:6379" "Info"
    Write-ColorOutput "• MinIO Console: http://localhost:9001" "Info"
    Write-ColorOutput "• pgAdmin: http://localhost:5050" "Info"
    Write-ColorOutput ""
    Write-ColorOutput "🔐 TEST CREDENTIALS:" "Info"
    Write-ColorOutput "• Physician: dr.smith@centralmedical.com / DevPassword123!" "Info"
    Write-ColorOutput "• Patient: patient1@example.com / PatientPass123!" "Info"
    Write-ColorOutput "• pgAdmin: admin@clinical-trial.local / admin123" "Info"
    Write-ColorOutput "• MinIO: minioadmin / minioadmin123" "Info"
    Write-ColorOutput ""
    Write-ColorOutput "🚀 NEXT STEPS:" "Info"
    Write-ColorOutput "1. Start the API server:" "Info"
    Write-ColorOutput "   npm run dev:server" "Info"
    Write-ColorOutput ""
    Write-ColorOutput "2. Access the API documentation:" "Info"
    Write-ColorOutput "   http://localhost:3001/api" "Info"
    Write-ColorOutput ""
    Write-ColorOutput "3. Test the health endpoint:" "Info"
    Write-ColorOutput "   http://localhost:3001/health" "Info"
    Write-ColorOutput ""
    Write-ColorOutput "📚 USEFUL COMMANDS:" "Info"
    Write-ColorOutput "• npm run dev:server          - Start API server with auto-reload" "Info"
    Write-ColorOutput "• npm run dev:db              - Start only database services" "Info"
    Write-ColorOutput "• npm run dev:services        - Start all Docker services" "Info"
    Write-ColorOutput "• npm run dev:seed            - Re-seed test data" "Info"
    Write-ColorOutput "• npm run dev:reset           - Reset and re-seed database" "Info"
    Write-ColorOutput "• npm run dev:clean           - Clean up Docker resources" "Info"
    Write-ColorOutput ""
    Write-ColorOutput "Happy coding! 🎯" "Header"
}

function Main {
    if ($Help) {
        Show-Help
    }
    
    Write-ColorOutput "🚀 Clinical Trial Platform - Local Development Setup" "Header"
    Write-ColorOutput "=================================================" "Header"
    Write-ColorOutput ""
    
    # Run setup steps
    Test-Prerequisites
    Install-Dependencies
    Setup-Environment
    Create-Directories
    Setup-Docker
    Initialize-Database
    Show-Summary
}

# Run main function
try {
    Main
} catch {
    Write-ColorOutput "💥 Setup failed with error: $_" "Error"
    Write-ColorOutput ""
    Write-ColorOutput "🔧 TROUBLESHOOTING:" "Warning"
    Write-ColorOutput "1. Ensure Docker Desktop is running" "Info"
    Write-ColorOutput "2. Check that ports 3001, 5432, 6379, 9000, 9001, 5050 are available" "Info"
    Write-ColorOutput "3. Try running with -Force to overwrite existing configurations" "Info"
    Write-ColorOutput "4. Check the logs: docker-compose logs" "Info"
    Write-ColorOutput ""
    exit 1
}