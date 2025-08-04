#!/bin/bash

# Clinical Trial Platform - Lambda Deployment Script
# Automated deployment of AWS Lambda functions with versioning and alias management

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
LOG_FILE="$PROJECT_ROOT/logs/lambda-deploy-$(date +%Y%m%d-%H%M%S).log"

# Ensure logs directory exists
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log() {
    local level="${2:-INFO}"
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $1"
    echo "$message" | tee -a "$LOG_FILE"
}

# Error handling
trap 'log "Lambda deployment failed at line $LINENO" "ERROR"' ERR

# Configuration
ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_PROFILE="${AWS_PROFILE:-clinical-trial-$ENVIRONMENT}"
VERSION_TAG="${VERSION_TAG:-$(date +%Y%m%d-%H%M%S)}"
DEPLOYMENT_STRATEGY="${DEPLOYMENT_STRATEGY:-direct}"  # direct, canary, blue-green
CANARY_PERCENTAGE="${CANARY_PERCENTAGE:-10}"
DRY_RUN="${DRY_RUN:-false}"
SKIP_BUILD="${SKIP_BUILD:-false}"
ROLLBACK_VERSION="${ROLLBACK_VERSION:-}"

log "Starting Lambda deployment process..."
log "Environment: $ENVIRONMENT"
log "AWS Region: $AWS_REGION"
log "AWS Profile: $AWS_PROFILE"
log "Version Tag: $VERSION_TAG"
log "Deployment Strategy: $DEPLOYMENT_STRATEGY"
log "Dry Run: $DRY_RUN"

# Validate prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check required tools
    for tool in node npm aws jq; do
        if ! command -v "$tool" &> /dev/null; then
            log "$tool is not installed or not in PATH" "ERROR"
            exit 1
        fi
    done
    
    # Check Node.js version
    NODE_VERSION=$(node --version)
    log "Node.js version: $NODE_VERSION"
    
    if [[ ! "$NODE_VERSION" =~ ^v20\. ]]; then
        log "Warning: Node.js version $NODE_VERSION detected. Recommended: v20.x" "WARNING"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity --profile "$AWS_PROFILE" --region "$AWS_REGION" &>/dev/null; then
        log "AWS credentials not configured for profile: $AWS_PROFILE" "ERROR"
        exit 1
    fi
    
    local account_id
    account_id=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --region "$AWS_REGION" --query 'Account' --output text)
    log "AWS Account ID: $account_id"
    
    # Check backend directory
    if [[ ! -d "$BACKEND_DIR" ]]; then
        log "Backend directory not found: $BACKEND_DIR" "ERROR"
        exit 1
    fi
    
    log "Prerequisites check completed"
}

# Build Lambda functions
build_lambdas() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log "Skipping build due to SKIP_BUILD flag"
        return
    fi
    
    log "Building Lambda functions..."
    cd "$BACKEND_DIR"
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --silent
    
    # Run tests
    if [[ "$SKIP_TESTS" != "true" ]]; then
        log "Running unit tests..."
        npm run test 2>&1 | tee -a "$LOG_FILE"
        
        # Check test coverage
        if [[ -f "coverage/coverage-summary.json" ]]; then
            local coverage
            coverage=$(node -e "console.log(JSON.parse(require('fs').readFileSync('./coverage/coverage-summary.json')).total.lines.pct)")
            log "Test coverage: $coverage%"
            
            if (( $(echo "$coverage < 85" | bc -l) )); then
                log "Test coverage ($coverage%) is below 85% threshold" "WARNING"
            fi
        fi
    fi
    
    # Lint and format check
    log "Running ESLint..."
    npm run lint 2>&1 | tee -a "$LOG_FILE"
    
    # Type checking
    log "Running TypeScript type check..."
    npm run type-check 2>&1 | tee -a "$LOG_FILE"
    
    # Build
    log "Building Lambda functions..."
    npm run build 2>&1 | tee -a "$LOG_FILE"
    
    # Package
    log "Packaging Lambda functions..."
    npm run package 2>&1 | tee -a "$LOG_FILE"
    
    # Verify packages
    if [[ ! -d "dist" ]]; then
        log "Build output directory (dist) not found" "ERROR"
        exit 1
    fi
    
    local package_count
    package_count=$(find dist -name "*.zip" | wc -l)
    log "Created $package_count Lambda packages"
    
    if [[ $package_count -eq 0 ]]; then
        log "No Lambda packages found in dist directory" "ERROR"
        exit 1
    fi
    
    log "Lambda build completed successfully"
}

# Get function name from Terraform outputs
get_function_name() {
    local package_name="$1"
    local terraform_key="${package_name}_function_name"
    
    # Try to get from Terraform outputs if available
    if [[ -f "$PROJECT_ROOT/terraform-outputs.json" ]]; then
        local function_name
        function_name=$(jq -r ".$terraform_key.value // empty" "$PROJECT_ROOT/terraform-outputs.json")
        if [[ -n "$function_name" && "$function_name" != "null" ]]; then
            echo "$function_name"
            return
        fi
    fi
    
    # Fallback to naming convention
    echo "clinical-trial-${package_name}-${ENVIRONMENT}"
}

# Deploy single Lambda function
deploy_lambda() {
    local package_path="$1"
    local package_name
    package_name=$(basename "$package_path" .zip)
    
    local function_name
    function_name=$(get_function_name "$package_name")
    
    log "Deploying $package_name to $function_name..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would deploy $package_path to $function_name"
        return
    fi
    
    # Check if function exists
    if ! aws lambda get-function \
        --function-name "$function_name" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" &>/dev/null; then
        log "Lambda function $function_name does not exist" "ERROR"
        return 1
    fi
    
    # Get current version for rollback
    local current_version
    current_version=$(aws lambda get-alias \
        --function-name "$function_name" \
        --name "$ENVIRONMENT" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" \
        --query 'FunctionVersion' \
        --output text 2>/dev/null || echo "1")
    
    log "Current version: $current_version"
    
    # Update function code
    log "Updating function code..."
    aws lambda update-function-code \
        --function-name "$function_name" \
        --zip-file "fileb://$package_path" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" > /dev/null
    
    # Wait for update to complete
    log "Waiting for function update to complete..."
    aws lambda wait function-updated \
        --function-name "$function_name" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION"
    
    # Publish new version
    log "Publishing new version..."
    local new_version
    new_version=$(aws lambda publish-version \
        --function-name "$function_name" \
        --description "Deployment $VERSION_TAG" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" \
        --query 'Version' \
        --output text)
    
    log "Published version: $new_version"
    
    # Update function configuration
    log "Updating function configuration..."
    aws lambda update-function-configuration \
        --function-name "$function_name" \
        --environment "Variables={NODE_ENV=$ENVIRONMENT,ENVIRONMENT=$ENVIRONMENT,VERSION=$VERSION_TAG}" \
        --timeout 30 \
        --memory-size 512 \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" > /dev/null
    
    # Deploy based on strategy
    case "$DEPLOYMENT_STRATEGY" in
        "direct")
            deploy_direct "$function_name" "$new_version"
            ;;
        "canary")
            deploy_canary "$function_name" "$new_version" "$current_version"
            ;;
        "blue-green")
            deploy_blue_green "$function_name" "$new_version" "$current_version"
            ;;
        *)
            log "Unknown deployment strategy: $DEPLOYMENT_STRATEGY" "ERROR"
            return 1
            ;;
    esac
    
    log "✓ Successfully deployed $package_name"
}

# Direct deployment (immediate switch)
deploy_direct() {
    local function_name="$1"
    local new_version="$2"
    
    log "Executing direct deployment..."
    
    # Update alias to point to new version
    aws lambda update-alias \
        --function-name "$function_name" \
        --name "$ENVIRONMENT" \
        --function-version "$new_version" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" > /dev/null || \
    aws lambda create-alias \
        --function-name "$function_name" \
        --name "$ENVIRONMENT" \
        --function-version "$new_version" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" > /dev/null
    
    log "Direct deployment completed"
}

# Canary deployment (gradual traffic shift)
deploy_canary() {
    local function_name="$1"
    local new_version="$2"
    local current_version="$3"
    
    log "Executing canary deployment ($CANARY_PERCENTAGE% traffic)..."
    
    # Create/update canary alias with traffic split
    local routing_config="{\"AdditionalVersionWeights\":{\"$new_version\":$(echo "scale=2; $CANARY_PERCENTAGE/100" | bc)}}"
    
    aws lambda update-alias \
        --function-name "$function_name" \
        --name "${ENVIRONMENT}-CANARY" \
        --function-version "$current_version" \
        --routing-config "$routing_config" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" > /dev/null || \
    aws lambda create-alias \
        --function-name "$function_name" \
        --name "${ENVIRONMENT}-CANARY" \
        --function-version "$current_version" \
        --routing-config "$routing_config" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" > /dev/null
    
    log "Canary deployment completed - monitoring for 5 minutes..."
    
    # Monitor canary for 5 minutes
    monitor_canary "$function_name" "$new_version"
    
    # If monitoring passes, promote to full deployment
    log "Promoting canary to full deployment..."
    aws lambda update-alias \
        --function-name "$function_name" \
        --name "$ENVIRONMENT" \
        --function-version "$new_version" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" > /dev/null
    
    log "Canary promotion completed"
}

# Blue-green deployment
deploy_blue_green() {
    local function_name="$1"
    local new_version="$2"
    local current_version="$3"
    
    log "Executing blue-green deployment..."
    
    # Create green alias
    aws lambda update-alias \
        --function-name "$function_name" \
        --name "${ENVIRONMENT}-GREEN" \
        --function-version "$new_version" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" > /dev/null || \
    aws lambda create-alias \
        --function-name "$function_name" \
        --name "${ENVIRONMENT}-GREEN" \
        --function-version "$new_version" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" > /dev/null
    
    log "Green environment ready - running validation..."
    
    # Run validation tests against green environment
    validate_green_environment "$function_name"
    
    # Switch traffic to green
    log "Switching traffic to green environment..."
    aws lambda update-alias \
        --function-name "$function_name" \
        --name "$ENVIRONMENT" \
        --function-version "$new_version" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" > /dev/null
    
    log "Blue-green deployment completed"
}

# Monitor canary deployment
monitor_canary() {
    local function_name="$1"
    local new_version="$2"
    local monitoring_duration=300  # 5 minutes
    local check_interval=30       # 30 seconds
    local checks=$((monitoring_duration / check_interval))
    
    for ((i=1; i<=checks; i++)); do
        log "Canary monitoring check $i/$checks..."
        
        # Check error rate
        local error_count
        error_count=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/Lambda \
            --metric-name Errors \
            --dimensions Name=FunctionName,Value="$function_name" \
            --start-time "$(date -u -d '1 minute ago' '+%Y-%m-%dT%H:%M:%S')" \
            --end-time "$(date -u '+%Y-%m-%dT%H:%M:%S')" \
            --period 60 \
            --statistics Sum \
            --profile "$AWS_PROFILE" \
            --region "$AWS_REGION" \
            --query 'Datapoints[0].Sum' \
            --output text 2>/dev/null || echo "0")
        
        if [[ "$error_count" != "None" && "$error_count" -gt 0 ]]; then
            log "High error rate detected: $error_count errors" "ERROR"
            
            # Auto-rollback on high error rate
            log "Performing automatic rollback..."
            rollback_deployment "$function_name"
            exit 1
        fi
        
        # Check duration metrics
        local avg_duration
        avg_duration=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/Lambda \
            --metric-name Duration \
            --dimensions Name=FunctionName,Value="$function_name" \
            --start-time "$(date -u -d '1 minute ago' '+%Y-%m-%dT%H:%M:%S')" \
            --end-time "$(date -u '+%Y-%m-%dT%H:%M:%S')" \
            --period 60 \
            --statistics Average \
            --profile "$AWS_PROFILE" \
            --region "$AWS_REGION" \
            --query 'Datapoints[0].Average' \
            --output text 2>/dev/null || echo "0")
        
        if [[ "$avg_duration" != "None" && $(echo "$avg_duration > 10000" | bc -l) -eq 1 ]]; then
            log "High average duration detected: ${avg_duration}ms" "WARNING"
        fi
        
        sleep $check_interval
    done
    
    log "Canary monitoring completed successfully"
}

# Validate green environment
validate_green_environment() {
    local function_name="$1"
    
    log "Validating green environment..."
    
    # Test function invocation
    local test_payload='{"test": true}'
    local response
    response=$(aws lambda invoke \
        --function-name "$function_name:${ENVIRONMENT}-GREEN" \
        --payload "$test_payload" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" \
        --output json \
        /tmp/lambda-response.json 2>&1 || echo "FAILED")
    
    if [[ "$response" == "FAILED" ]]; then
        log "Green environment validation failed" "ERROR"
        exit 1
    fi
    
    # Check response
    if [[ -f "/tmp/lambda-response.json" ]]; then
        local status_code
        status_code=$(echo "$response" | jq -r '.StatusCode // 500')
        if [[ "$status_code" -ne 200 ]]; then
            log "Green environment returned non-200 status: $status_code" "ERROR"
            exit 1
        fi
    fi
    
    log "Green environment validation passed"
}

# Rollback deployment
rollback_deployment() {
    local function_name="$1"
    
    if [[ -n "$ROLLBACK_VERSION" ]]; then
        log "Rolling back to version: $ROLLBACK_VERSION"
        
        aws lambda update-alias \
            --function-name "$function_name" \
            --name "$ENVIRONMENT" \
            --function-version "$ROLLBACK_VERSION" \
            --profile "$AWS_PROFILE" \
            --region "$AWS_REGION" > /dev/null
        
        log "Rollback completed"
    else
        log "No rollback version specified" "ERROR"
    fi
}

# Main deployment process
main() {
    log "Starting Lambda deployment process..."
    
    check_prerequisites
    
    cd "$BACKEND_DIR"
    build_lambdas
    
    # Deploy all Lambda packages
    local deployed_count=0
    local failed_count=0
    
    for package in dist/*.zip; do
        if [[ -f "$package" ]]; then
            if deploy_lambda "$package"; then
                ((deployed_count++))
            else
                ((failed_count++))
                log "Failed to deploy $(basename "$package")" "ERROR"
            fi
        fi
    done
    
    log "Deployment summary:"
    log "  - Successfully deployed: $deployed_count functions"
    log "  - Failed deployments: $failed_count functions"
    
    if [[ $failed_count -gt 0 ]]; then
        log "Some deployments failed" "ERROR"
        exit 1
    fi
    
    # Create deployment manifest
    local manifest_file="$PROJECT_ROOT/lambda-deployment-manifest.json"
    cat > "$manifest_file" << EOF
{
  "deployment": {
    "timestamp": "$(date -Iseconds)",
    "environment": "$ENVIRONMENT",
    "versionTag": "$VERSION_TAG",
    "strategy": "$DEPLOYMENT_STRATEGY",
    "deployedFunctions": $deployed_count,
    "failedFunctions": $failed_count,
    "success": $([ $failed_count -eq 0 ] && echo "true" || echo "false")
  }
}
EOF
    
    log "Deployment manifest created: $manifest_file"
    log "Lambda deployment process completed successfully!"
}

# Handle rollback mode
if [[ -n "$ROLLBACK_VERSION" ]]; then
    log "ROLLBACK MODE: Rolling back to version $ROLLBACK_VERSION"
    
    # Get all Lambda functions for the environment
    local functions
    functions=$(aws lambda list-functions \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" \
        --query "Functions[?starts_with(FunctionName, 'clinical-trial-') && contains(FunctionName, '-$ENVIRONMENT')].FunctionName" \
        --output text)
    
    for function_name in $functions; do
        log "Rolling back $function_name to version $ROLLBACK_VERSION..."
        rollback_deployment "$function_name"
    done
    
    log "Rollback completed"
    exit 0
fi

# Run main deployment process
main

log "Log file: $LOG_FILE"
exit 0