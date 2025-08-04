#!/bin/bash

# Clinical Trial Platform - Database Migration Script
# Automated database migration with rollback support and health checks

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
LOG_FILE="$PROJECT_ROOT/logs/db-migrate-$(date +%Y%m%d-%H%M%S).log"

# Ensure logs directory exists
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log() {
    local level="${2:-INFO}"
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $1"
    echo "$message" | tee -a "$LOG_FILE"
}

# Error handling
trap 'log "Database migration failed at line $LINENO" "ERROR"' ERR

# Configuration
ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_PROFILE="${AWS_PROFILE:-clinical-trial-$ENVIRONMENT}"
MIGRATION_TIMEOUT="${MIGRATION_TIMEOUT:-300}"  # 5 minutes
DRY_RUN="${DRY_RUN:-false}"
ROLLBACK_MODE="${ROLLBACK_MODE:-false}"
ROLLBACK_STEPS="${ROLLBACK_STEPS:-1}"
CREATE_BACKUP="${CREATE_BACKUP:-true}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

log "Starting database migration process..."
log "Environment: $ENVIRONMENT"
log "AWS Region: $AWS_REGION"
log "Dry Run: $DRY_RUN"
log "Rollback Mode: $ROLLBACK_MODE"

# Database configuration per environment
declare -A DB_CONFIG
case "$ENVIRONMENT" in
    "dev")
        DB_CONFIG[cluster_id]="clinical-trial-dev"
        DB_CONFIG[secret_name]="clinical-trial-db-dev"
        DB_CONFIG[backup_required]="false"
        ;;
    "staging")
        DB_CONFIG[cluster_id]="clinical-trial-staging"
        DB_CONFIG[secret_name]="clinical-trial-db-staging"
        DB_CONFIG[backup_required]="true"
        ;;
    "prod")
        DB_CONFIG[cluster_id]="clinical-trial-prod"
        DB_CONFIG[secret_name]="clinical-trial-db-prod"
        DB_CONFIG[backup_required]="true"
        ;;
    *)
        log "Unknown environment: $ENVIRONMENT" "ERROR"
        exit 1
        ;;
esac

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check required tools
    for tool in node npm aws jq psql; do
        if ! command -v "$tool" &> /dev/null; then
            log "$tool is not installed or not in PATH" "ERROR"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity --profile "$AWS_PROFILE" --region "$AWS_REGION" &>/dev/null; then
        log "AWS credentials not configured for profile: $AWS_PROFILE" "ERROR"
        exit 1
    fi
    
    # Check backend directory
    if [[ ! -d "$BACKEND_DIR" ]]; then
        log "Backend directory not found: $BACKEND_DIR" "ERROR"
        exit 1
    fi
    
    # Check for migration files
    if [[ ! -d "$BACKEND_DIR/migrations" ]]; then
        log "Migrations directory not found: $BACKEND_DIR/migrations" "ERROR"
        exit 1
    fi
    
    log "Prerequisites check completed"
}

# Get database connection details
get_database_connection() {
    log "Retrieving database connection details..."
    
    # Get RDS cluster endpoint
    local cluster_endpoint
    cluster_endpoint=$(aws rds describe-db-clusters \
        --db-cluster-identifier "${DB_CONFIG[cluster_id]}" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" \
        --query 'DBClusters[0].Endpoint' \
        --output text 2>/dev/null || echo "")
    
    if [[ -z "$cluster_endpoint" || "$cluster_endpoint" == "None" ]]; then
        log "Could not retrieve RDS cluster endpoint" "ERROR"
        exit 1
    fi
    
    # Get database credentials from Secrets Manager
    local db_secret
    db_secret=$(aws secretsmanager get-secret-value \
        --secret-id "${DB_CONFIG[secret_name]}" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" \
        --query 'SecretString' \
        --output text 2>/dev/null || echo "")
    
    if [[ -z "$db_secret" ]]; then
        log "Could not retrieve database credentials from Secrets Manager" "ERROR"
        exit 1
    fi
    
    # Parse credentials
    local db_username
    local db_password
    local db_name
    
    db_username=$(echo "$db_secret" | jq -r '.username')
    db_password=$(echo "$db_secret" | jq -r '.password')
    db_name=$(echo "$db_secret" | jq -r '.dbname // "clinical_trial"')
    
    # Construct connection string
    export DATABASE_URL="postgresql://$db_username:$db_password@$cluster_endpoint:5432/$db_name"
    export PGHOST="$cluster_endpoint"
    export PGPORT="5432"
    export PGDATABASE="$db_name"
    export PGUSER="$db_username"
    export PGPASSWORD="$db_password"
    
    log "Database connection configured for: $cluster_endpoint"
}

# Test database connection
test_database_connection() {
    log "Testing database connection..."
    
    local max_attempts=5
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if psql -c "SELECT 1;" &>/dev/null; then
            log "Database connection successful"
            return 0
        else
            log "Database connection attempt $attempt/$max_attempts failed" "WARNING"
            if [[ $attempt -eq $max_attempts ]]; then
                log "Database connection failed after $max_attempts attempts" "ERROR"
                exit 1
            fi
            sleep 10
            ((attempt++))
        fi
    done
}

# Create database backup
create_database_backup() {
    if [[ "${DB_CONFIG[backup_required]}" != "true" || "$CREATE_BACKUP" != "true" ]]; then
        log "Skipping backup creation"
        return
    fi
    
    log "Creating database backup..."
    
    local backup_id="pre-migration-$(date +%Y%m%d-%H%M%S)"
    
    # Create RDS cluster snapshot
    aws rds create-db-cluster-snapshot \
        --db-cluster-identifier "${DB_CONFIG[cluster_id]}" \
        --db-cluster-snapshot-identifier "$backup_id" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" \
        --tags Key=Purpose,Value=PreMigrationBackup Key=Environment,Value="$ENVIRONMENT" Key=RetentionDays,Value="$BACKUP_RETENTION_DAYS" > /dev/null
    
    log "Backup initiated: $backup_id"
    
    # Wait for backup to complete (with timeout)
    log "Waiting for backup to complete..."
    local timeout=$(($(date +%s) + 1800))  # 30 minutes timeout
    
    while [[ $(date +%s) -lt $timeout ]]; do
        local status
        status=$(aws rds describe-db-cluster-snapshots \
            --db-cluster-snapshot-identifier "$backup_id" \
            --profile "$AWS_PROFILE" \
            --region "$AWS_REGION" \
            --query 'DBClusterSnapshots[0].Status' \
            --output text 2>/dev/null || echo "unknown")
        
        case "$status" in
            "available")
                log "Backup completed successfully: $backup_id"
                export BACKUP_ID="$backup_id"
                return 0
                ;;
            "creating")
                log "Backup in progress..."
                sleep 30
                ;;
            *)
                log "Backup failed with status: $status" "ERROR"
                exit 1
                ;;
        esac
    done
    
    log "Backup timeout reached" "ERROR"
    exit 1
}

# Get current migration state
get_migration_state() {
    log "Checking current migration state..."
    
    cd "$BACKEND_DIR"
    
    # Ensure migration dependencies are installed
    if [[ ! -d "node_modules" ]]; then
        log "Installing dependencies..."
        npm ci --silent
    fi
    
    # Check if migration table exists
    if ! psql -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations';" &>/dev/null; then
        log "Migration table does not exist - first migration"
        export MIGRATION_STATE="empty"
        return
    fi
    
    # Get current migration version
    local current_version
    current_version=$(psql -t -c "SELECT version FROM migrations ORDER BY version DESC LIMIT 1;" 2>/dev/null | xargs || echo "")
    
    if [[ -z "$current_version" ]]; then
        export MIGRATION_STATE="empty"
        log "No migrations found in database"
    else
        export MIGRATION_STATE="$current_version"
        log "Current migration version: $current_version"
    fi
    
    # Get pending migrations
    local pending_count
    if command -v npm run migrate:status &>/dev/null; then
        pending_count=$(npm run migrate:status 2>/dev/null | grep -c "pending" || echo "0")
        log "Pending migrations: $pending_count"
    fi
}

# Validate migrations
validate_migrations() {
    log "Validating migration files..."
    
    cd "$BACKEND_DIR"
    
    # Check migration file format
    local migration_files
    migration_files=$(find migrations -name "*.js" -o -name "*.sql" 2>/dev/null | wc -l)
    
    if [[ $migration_files -eq 0 ]]; then
        log "No migration files found" "WARNING"
        return
    fi
    
    log "Found $migration_files migration files"
    
    # Validate migration syntax (if using JavaScript migrations)
    if ls migrations/*.js &>/dev/null; then
        log "Validating JavaScript migration syntax..."
        for migration in migrations/*.js; do
            if ! node -c "$migration" &>/dev/null; then
                log "Syntax error in migration: $migration" "ERROR"
                exit 1
            fi
        done
    fi
    
    # Check for migration conflicts
    if command -v npm run migrate:check &>/dev/null; then
        log "Checking for migration conflicts..."
        npm run migrate:check
    fi
    
    log "Migration validation completed"
}

# Execute migrations
execute_migrations() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would execute migrations"
        return
    fi
    
    log "Executing database migrations..."
    
    cd "$BACKEND_DIR"
    
    # Set timeout for migration execution
    timeout "$MIGRATION_TIMEOUT" npm run migrate:up 2>&1 | tee -a "$LOG_FILE"
    
    if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
        log "Migration execution failed" "ERROR"
        exit 1
    fi
    
    log "Migrations executed successfully"
}

# Execute rollback
execute_rollback() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would rollback $ROLLBACK_STEPS steps"
        return
    fi
    
    log "Executing database rollback ($ROLLBACK_STEPS steps)..."
    
    cd "$BACKEND_DIR"
    
    # Execute rollback
    for ((i=1; i<=ROLLBACK_STEPS; i++)); do
        log "Rolling back step $i/$ROLLBACK_STEPS..."
        
        timeout "$MIGRATION_TIMEOUT" npm run migrate:down 2>&1 | tee -a "$LOG_FILE"
        
        if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
            log "Rollback step $i failed" "ERROR"
            exit 1
        fi
    done
    
    log "Rollback completed successfully"
}

# Verify migration results
verify_migrations() {
    log "Verifying migration results..."
    
    cd "$BACKEND_DIR"
    
    # Check migration status
    if command -v npm run migrate:status &>/dev/null; then
        log "Current migration status:"
        npm run migrate:status 2>&1 | tee -a "$LOG_FILE"
    fi
    
    # Run basic database health checks
    log "Running database health checks..."
    
    # Check database connectivity
    if ! psql -c "SELECT 1;" &>/dev/null; then
        log "Database connectivity check failed" "ERROR"
        exit 1
    fi
    
    # Check table existence (basic schema validation)
    local essential_tables=("users" "studies" "questionnaires" "responses")
    for table in "${essential_tables[@]}"; do
        if psql -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" | grep -q "1 row"; then
            log "✓ Table exists: $table"
        else
            log "⚠ Table missing: $table" "WARNING"
        fi
    done
    
    # Check for data integrity
    if command -v npm run db:validate &>/dev/null; then
        log "Running data integrity checks..."
        npm run db:validate 2>&1 | tee -a "$LOG_FILE"
    fi
    
    log "Migration verification completed"
}

# Cleanup old backups
cleanup_old_backups() {
    if [[ "${DB_CONFIG[backup_required]}" != "true" ]]; then
        return
    fi
    
    log "Cleaning up old backups..."
    
    # Calculate cutoff date
    local cutoff_date
    cutoff_date=$(date -u -d "$BACKUP_RETENTION_DAYS days ago" '+%Y-%m-%d')
    
    # Get old snapshots
    local old_snapshots
    old_snapshots=$(aws rds describe-db-cluster-snapshots \
        --db-cluster-identifier "${DB_CONFIG[cluster_id]}" \
        --snapshot-type manual \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION" \
        --query "DBClusterSnapshots[?SnapshotCreateTime<'$cutoff_date'].DBClusterSnapshotIdentifier" \
        --output text)
    
    if [[ -n "$old_snapshots" && "$old_snapshots" != "None" ]]; then
        for snapshot in $old_snapshots; do
            log "Deleting old backup: $snapshot"
            aws rds delete-db-cluster-snapshot \
                --db-cluster-snapshot-identifier "$snapshot" \
                --profile "$AWS_PROFILE" \
                --region "$AWS_REGION" > /dev/null || true
        done
    else
        log "No old backups to clean up"
    fi
}

# Main migration process
main() {
    log "Starting database migration process..."
    
    check_prerequisites
    get_database_connection
    test_database_connection
    get_migration_state
    validate_migrations
    
    if [[ "${DB_CONFIG[backup_required]}" == "true" && "$ROLLBACK_MODE" != "true" ]]; then
        create_database_backup
    fi
    
    if [[ "$ROLLBACK_MODE" == "true" ]]; then
        execute_rollback
    else
        execute_migrations
    fi
    
    verify_migrations
    cleanup_old_backups
    
    # Create migration report
    local report_file="$PROJECT_ROOT/migration-report.json"
    cat > "$report_file" << EOF
{
  "migration": {
    "timestamp": "$(date -Iseconds)",
    "environment": "$ENVIRONMENT",
    "mode": "$([ "$ROLLBACK_MODE" == "true" ] && echo "rollback" || echo "migrate")",
    "previousState": "$MIGRATION_STATE",
    "backupId": "${BACKUP_ID:-}",
    "success": true,
    "logFile": "$LOG_FILE"
  }
}
EOF
    
    log "Migration report created: $report_file"
    log "Database migration process completed successfully!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --rollback)
            ROLLBACK_MODE="true"
            shift
            ;;
        --rollback-steps)
            ROLLBACK_STEPS="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --no-backup)
            CREATE_BACKUP="false"
            shift
            ;;
        --timeout)
            MIGRATION_TIMEOUT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --environment, -e ENV    Target environment (dev, staging, prod)"
            echo "  --rollback              Execute rollback instead of migration"
            echo "  --rollback-steps N      Number of steps to rollback (default: 1)"
            echo "  --dry-run               Show what would be done without executing"
            echo "  --no-backup             Skip backup creation"
            echo "  --timeout SECONDS       Migration timeout (default: 300)"
            echo "  --help, -h              Show this help message"
            exit 0
            ;;
        *)
            log "Unknown option: $1" "ERROR"
            exit 1
            ;;
    esac
done

# Run main process
main

log "Log file: $LOG_FILE"
exit 0