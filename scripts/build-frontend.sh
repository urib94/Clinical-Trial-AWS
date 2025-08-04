#!/bin/bash

# Clinical Trial Platform - Frontend Build Script
# Optimized build process for Next.js application with PWA support

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOG_FILE="$PROJECT_ROOT/logs/frontend-build-$(date +%Y%m%d-%H%M%S).log"

# Ensure logs directory exists
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log() {
    local level="${2:-INFO}"
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $1"
    echo "$message" | tee -a "$LOG_FILE"
}

# Error handling
trap 'log "Frontend build failed at line $LINENO" "ERROR"' ERR

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
NODE_ENV="${NODE_ENV:-production}"
ANALYZE_BUNDLE="${ANALYZE_BUNDLE:-false}"
SKIP_LINT="${SKIP_LINT:-false}"
SKIP_TYPE_CHECK="${SKIP_TYPE_CHECK:-false}"

log "Starting frontend build process..."
log "Environment: $ENVIRONMENT"
log "Node Environment: $NODE_ENV"

# Change to frontend directory
cd "$FRONTEND_DIR"

# Check Node.js version
NODE_VERSION=$(node --version)
log "Node.js version: $NODE_VERSION"

if [[ ! "$NODE_VERSION" =~ ^v20\. ]]; then
    log "Warning: Node.js version $NODE_VERSION detected. Recommended: v20.x" "WARNING"
fi

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    log "package.json not found in frontend directory" "ERROR"
    exit 1
fi

# Install dependencies
log "Installing dependencies..."
if [[ -f "package-lock.json" ]]; then
    npm ci --silent
else
    npm install --silent
fi

# Clean previous build
log "Cleaning previous build artifacts..."
rm -rf .next out dist build

# Environment-specific configurations
case "$ENVIRONMENT" in
    "development"|"dev")
        log "Configuring for development environment"
        ;;
    "staging")
        log "Configuring for staging environment"
        ;;
    "production"|"prod")
        log "Configuring for production environment"
        ;;
    *)
        log "Unknown environment: $ENVIRONMENT" "ERROR"
        exit 1
        ;;
esac

# Create environment file if it doesn't exist
if [[ ! -f ".env.local" && ! -f ".env.production" ]]; then
    log "Creating default environment file..."
    cat > ".env.local" << EOF
# Clinical Trial Platform - Environment Configuration
NEXT_PUBLIC_ENVIRONMENT=$ENVIRONMENT
NEXT_PUBLIC_VERSION=\${VERSION:-local}
NEXT_PUBLIC_BUILD_TIME=$(date -Iseconds)

# API Configuration (to be updated by deployment script)
NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL:-http://localhost:3001}

# AWS Configuration (to be updated by deployment script)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=\${NEXT_PUBLIC_COGNITO_USER_POOL_ID:-}
NEXT_PUBLIC_COGNITO_CLIENT_ID=\${NEXT_PUBLIC_COGNITO_CLIENT_ID:-}
NEXT_PUBLIC_S3_BUCKET=\${NEXT_PUBLIC_S3_BUCKET:-}
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=\${NEXT_PUBLIC_CLOUDFRONT_DOMAIN:-}

# Application Configuration
NEXT_PUBLIC_APP_NAME="Clinical Trial Platform"
NEXT_PUBLIC_APP_DESCRIPTION="Healthcare Clinical Trial Data Collection Platform"
EOF
fi

# Lint check
if [[ "$SKIP_LINT" != "true" ]]; then
    log "Running ESLint..."
    npm run lint 2>&1 | tee -a "$LOG_FILE"
    
    log "Checking code formatting..."
    npx prettier --check "**/*.{js,jsx,ts,tsx,json,css,md}" 2>&1 | tee -a "$LOG_FILE" || {
        log "Code formatting issues found. Run 'npm run format' to fix." "WARNING"
    }
fi

# Type checking
if [[ "$SKIP_TYPE_CHECK" != "true" ]]; then
    log "Running TypeScript type check..."
    npm run type-check 2>&1 | tee -a "$LOG_FILE"
fi

# Unit tests (if not skipped by environment)
if [[ "$SKIP_TESTS" != "true" ]]; then
    log "Running unit tests..."
    npm run test -- --coverage --watchAll=false --passWithNoTests 2>&1 | tee -a "$LOG_FILE"
    
    # Check coverage threshold
    if [[ -f "coverage/coverage-summary.json" ]]; then
        COVERAGE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('./coverage/coverage-summary.json')).total.lines.pct)")
        log "Test coverage: $COVERAGE%"
        
        if (( $(echo "$COVERAGE < 85" | bc -l) )); then
            log "Test coverage ($COVERAGE%) is below 85% threshold" "WARNING"
        fi
    fi
fi

# Build application
log "Building Next.js application..."
export NODE_ENV="$NODE_ENV"

# Build with optimizations
if [[ "$ENVIRONMENT" == "production" || "$ENVIRONMENT" == "prod" ]]; then
    # Production build with all optimizations
    npm run build 2>&1 | tee -a "$LOG_FILE"
else
    # Development/staging build
    npm run build 2>&1 | tee -a "$LOG_FILE"
fi

# Verify build output
if [[ ! -d ".next" ]]; then
    log "Build output directory (.next) not found" "ERROR"
    exit 1
fi

# Generate static export for S3 deployment
log "Generating static export..."
npm run export 2>&1 | tee -a "$LOG_FILE" || {
    log "Static export failed, continuing with server build" "WARNING"
}

# Bundle analysis (if requested)
if [[ "$ANALYZE_BUNDLE" == "true" ]]; then
    log "Analyzing bundle size..."
    ANALYZE=true npm run build 2>&1 | tee -a "$LOG_FILE"
fi

# Security scan of dependencies
log "Scanning for security vulnerabilities..."
npm audit --audit-level=moderate 2>&1 | tee -a "$LOG_FILE" || {
    log "Security vulnerabilities found in dependencies" "WARNING"
}

# Generate build report
BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "Unknown")
EXPORT_SIZE=$(du -sh out 2>/dev/null | cut -f1 || echo "Unknown")

log "Build completed successfully!"
log "Build artifacts:"
log "  - .next directory size: $BUILD_SIZE"
log "  - Export directory size: $EXPORT_SIZE"

# Create build manifest
BUILD_MANIFEST="$PROJECT_ROOT/build-manifest.json"
cat > "$BUILD_MANIFEST" << EOF
{
  "frontend": {
    "buildTime": "$(date -Iseconds)",
    "environment": "$ENVIRONMENT",
    "nodeVersion": "$NODE_VERSION",
    "buildSize": "$BUILD_SIZE",
    "exportSize": "$EXPORT_SIZE",
    "buildDirectory": ".next",
    "exportDirectory": "out",
    "success": true
  }
}
EOF

log "Build manifest created: $BUILD_MANIFEST"

# Lighthouse CI (if in production build)
if [[ "$ENVIRONMENT" == "production" && "$SKIP_LIGHTHOUSE" != "true" ]]; then
    log "Running Lighthouse CI for performance analysis..."
    
    # Start the application for testing
    npm start &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 10
    
    # Run Lighthouse CI
    npx lhci autorun --config=.lighthouserc.js 2>&1 | tee -a "$LOG_FILE" || {
        log "Lighthouse CI analysis failed" "WARNING"
    }
    
    # Stop the server
    kill $SERVER_PID 2>/dev/null || true
fi

# Clean up temporary files
log "Cleaning up temporary files..."
rm -rf node_modules/.cache

# Final verification
if [[ -d "out" ]]; then
    log "Static export verification..."
    
    # Check for essential files
    ESSENTIAL_FILES=("index.html" "_next" "favicon.ico")
    for file in "${ESSENTIAL_FILES[@]}"; do
        if [[ -e "out/$file" ]]; then
            log "✓ Found: $file"
        else
            log "✗ Missing: $file" "WARNING"
        fi
    done
    
    # Check for service worker (PWA)
    if [[ -f "out/sw.js" || -f "out/service-worker.js" ]]; then
        log "✓ Service worker found - PWA enabled"
    else
        log "! Service worker not found - PWA may not be enabled" "WARNING"
    fi
    
    # Verify no sensitive information in build
    if grep -r "API_KEY\|SECRET\|PASSWORD" out/ --include="*.js" --include="*.json" 2>/dev/null; then
        log "Potential sensitive information found in build output" "ERROR"
        exit 1
    fi
fi

# Create deployment-ready archive (optional)
if [[ "$CREATE_ARCHIVE" == "true" ]]; then
    log "Creating deployment archive..."
    ARCHIVE_NAME="frontend-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$PROJECT_ROOT/$ARCHIVE_NAME" -C . out .next package.json package-lock.json
    log "Archive created: $ARCHIVE_NAME"
fi

log "Frontend build process completed successfully!"
log "Log file: $LOG_FILE"

# Exit with success
exit 0