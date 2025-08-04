# Clinical Trial Platform - PowerShell Deployment Script
# Supports deployment to dev, staging, and production environments

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInfrastructure = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$RollbackMode = $false,
    
    [Parameter(Mandatory=$false)]
    [string]$RollbackVersion = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

# Script Configuration
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogFile = "$ProjectRoot\logs\deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Ensure logs directory exists
if (!(Test-Path "$ProjectRoot\logs")) {
    New-Item -ItemType Directory -Path "$ProjectRoot\logs" -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

# Environment-specific configurations
$Config = @{
    "dev" = @{
        "AWSProfile" = "clinical-trial-dev"
        "Region" = "us-east-1"
        "TerraformBackend" = "s3://clinical-trial-terraform-state-dev/terraform.tfstate"
        "SkipApproval" = $true
        "MonitoringDuration" = 5  # minutes
    }
    "staging" = @{
        "AWSProfile" = "clinical-trial-staging"
        "Region" = "us-east-1"
        "TerraformBackend" = "s3://clinical-trial-terraform-state-staging/terraform.tfstate"
        "SkipApproval" = $false
        "MonitoringDuration" = 10  # minutes
    }
    "prod" = @{
        "AWSProfile" = "clinical-trial-prod"
        "Region" = "us-east-1"
        "TerraformBackend" = "s3://clinical-trial-terraform-state-prod/terraform.tfstate"
        "SkipApproval" = $false
        "MonitoringDuration" = 30  # minutes
    }
}

$EnvConfig = $Config[$Environment]

function Test-Prerequisites {
    Write-Log "Checking deployment prerequisites..."
    
    # Check required tools
    $RequiredTools = @("node", "npm", "terraform", "aws")
    foreach ($Tool in $RequiredTools) {
        try {
            $null = Get-Command $Tool -ErrorAction Stop
            Write-Log "✓ $Tool is available"
        }
        catch {
            Write-Log "✗ $Tool is not available. Please install it." "ERROR"
            exit 1
        }
    }
    
    # Check AWS credentials
    try {
        $Identity = aws sts get-caller-identity --profile $EnvConfig.AWSProfile 2>$null | ConvertFrom-Json
        Write-Log "✓ AWS credentials valid for account: $($Identity.Account)"
    }
    catch {
        Write-Log "✗ AWS credentials not configured for profile: $($EnvConfig.AWSProfile)" "ERROR"
        exit 1
    }
    
    # Check Node.js version
    $NodeVersion = node --version
    if ($NodeVersion -notmatch "v20") {
        Write-Log "⚠ Warning: Node.js version $NodeVersion detected. Recommended: v20.x"
    }
    
    # Check if running in correct directory
    if (!(Test-Path "$ProjectRoot\package.json") -or !(Test-Path "$ProjectRoot\infra")) {
        Write-Log "✗ Please run this script from the project root directory" "ERROR"
        exit 1
    }
    
    Write-Log "Prerequisites check completed"
}

function Get-DeploymentVersion {
    if ($Version) {
        return $Version
    }
    
    # Generate version from timestamp and git commit
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $GitCommit = git rev-parse --short HEAD 2>$null
    
    if ($GitCommit) {
        return "$Timestamp-$GitCommit"
    } else {
        return $Timestamp
    }
}

function Invoke-SecurityScan {
    if ($SkipTests) {
        Write-Log "Skipping security scan due to -SkipTests flag"
        return
    }
    
    Write-Log "Running security scans..."
    
    # Dependency vulnerability scan
    Write-Log "Running npm audit..."
    Push-Location "$ProjectRoot\frontend"
    try {
        npm audit --audit-level=high
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Frontend npm audit found high severity vulnerabilities" "ERROR"
            exit 1
        }
    }
    finally {
        Pop-Location
    }
    
    Push-Location "$ProjectRoot\backend"
    try {
        npm audit --audit-level=high
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Backend npm audit found high severity vulnerabilities" "ERROR"
            exit 1
        }
    }
    finally {
        Pop-Location
    }
    
    # Terraform security scan
    if (!(Test-Path "$ProjectRoot\infra\environments\$Environment")) {
        Write-Log "Infrastructure directory not found for environment: $Environment" "ERROR"
        exit 1
    }
    
    Write-Log "Running Terraform security scan..."
    Push-Location "$ProjectRoot\infra\environments\$Environment"
    try {
        # Run checkov if available
        if (Get-Command checkov -ErrorAction SilentlyContinue) {
            checkov -d . --framework terraform
            if ($LASTEXITCODE -ne 0) {
                Write-Log "Terraform security scan found issues" "WARNING"
            }
        } else {
            Write-Log "Checkov not available, skipping Terraform security scan" "WARNING"
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Log "Security scans completed"
}

function Invoke-Tests {
    if ($SkipTests) {
        Write-Log "Skipping tests due to -SkipTests flag"
        return
    }
    
    Write-Log "Running test suites..."
    
    # Frontend tests
    Write-Log "Running frontend tests..."
    Push-Location "$ProjectRoot\frontend"
    try {
        npm ci
        npm run test:coverage
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Frontend tests failed" "ERROR"
            exit 1
        }
        
        # Check coverage threshold
        $CoverageReport = Get-Content "coverage\coverage-summary.json" | ConvertFrom-Json
        $LineCoverage = $CoverageReport.total.lines.pct
        if ($LineCoverage -lt 85) {
            Write-Log "Frontend test coverage ($LineCoverage%) is below 85% threshold" "ERROR"
            exit 1
        }
        Write-Log "Frontend test coverage: $LineCoverage%"
    }
    finally {
        Pop-Location
    }
    
    # Backend tests
    Write-Log "Running backend tests..."
    Push-Location "$ProjectRoot\backend"
    try {
        npm ci
        npm run test:coverage
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Backend tests failed" "ERROR"
            exit 1
        }
        
        # Check coverage threshold
        $CoverageReport = Get-Content "coverage\coverage-summary.json" | ConvertFrom-Json
        $LineCoverage = $CoverageReport.total.lines.pct
        if ($LineCoverage -lt 85) {
            Write-Log "Backend test coverage ($LineCoverage%) is below 85% threshold" "ERROR"
            exit 1
        }
        Write-Log "Backend test coverage: $LineCoverage%"
    }
    finally {
        Pop-Location
    }
    
    Write-Log "All tests passed"
}

function Deploy-Infrastructure {
    if ($SkipInfrastructure) {
        Write-Log "Skipping infrastructure deployment due to -SkipInfrastructure flag"
        return @{ "outputs" = @{} }
    }
    
    Write-Log "Deploying infrastructure for environment: $Environment"
    
    $TerraformDir = "$ProjectRoot\infra\environments\$Environment"
    Push-Location $TerraformDir
    
    try {
        # Initialize Terraform
        Write-Log "Initializing Terraform..."
        terraform init -backend-config="profile=$($EnvConfig.AWSProfile)"
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Terraform init failed" "ERROR"
            exit 1
        }
        
        # Plan deployment
        Write-Log "Planning infrastructure changes..."
        $PlanArgs = @(
            "plan"
            "-var=environment=$Environment"
            "-var=region=$($EnvConfig.Region)"
            "-var=version_tag=$DeploymentVersion"
            "-out=tfplan"
        )
        
        terraform @PlanArgs
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Terraform plan failed" "ERROR"
            exit 1
        }
        
        if ($DryRun) {
            Write-Log "Dry run mode - skipping Terraform apply"
            return @{ "outputs" = @{} }
        }
        
        # Apply changes
        if ($Environment -eq "prod" -and !$EnvConfig.SkipApproval) {
            Write-Log "Production deployment requires manual approval. Continue? (y/N): " "WARNING"
            $Confirmation = Read-Host
            if ($Confirmation -ne "y" -and $Confirmation -ne "Y") {
                Write-Log "Deployment cancelled by user"
                exit 0
            }
        }
        
        Write-Log "Applying infrastructure changes..."
        terraform apply -auto-approve tfplan
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Terraform apply failed" "ERROR"
            exit 1
        }
        
        # Get outputs
        Write-Log "Retrieving Terraform outputs..."
        $OutputsJson = terraform output -json
        $Outputs = $OutputsJson | ConvertFrom-Json
        
        Write-Log "Infrastructure deployment completed"
        return @{ "outputs" = $Outputs }
        
    }
    finally {
        Pop-Location
    }
}

function Deploy-Backend {
    param($TerraformOutputs)
    
    Write-Log "Deploying backend Lambda functions..."
    
    Push-Location "$ProjectRoot\backend"
    try {
        # Install dependencies and build
        Write-Log "Building backend..."
        npm ci
        npm run build
        npm run package
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Backend build failed" "ERROR"
            exit 1
        }
        
        # Deploy Lambda functions
        $LambdaPackages = Get-ChildItem "dist\*.zip"
        foreach ($Package in $LambdaPackages) {
            $FunctionName = [System.IO.Path]::GetFileNameWithoutExtension($Package.Name)
            $TerraformKey = "${FunctionName}_function_name"
            
            if ($TerraformOutputs -and $TerraformOutputs.$TerraformKey) {
                $AwsFunctionName = $TerraformOutputs.$TerraformKey.value
                Write-Log "Deploying $FunctionName to $AwsFunctionName..."
                
                aws lambda update-function-code `
                    --function-name $AwsFunctionName `
                    --zip-file "fileb://$($Package.FullName)" `
                    --profile $EnvConfig.AWSProfile `
                    --region $EnvConfig.Region
                
                if ($LASTEXITCODE -ne 0) {
                    Write-Log "Failed to deploy Lambda function: $FunctionName" "ERROR"
                    exit 1
                }
                
                # Wait for update to complete
                aws lambda wait function-updated `
                    --function-name $AwsFunctionName `
                    --profile $EnvConfig.AWSProfile `
                    --region $EnvConfig.Region
                
                # Update function configuration
                aws lambda update-function-configuration `
                    --function-name $AwsFunctionName `
                    --environment "Variables={NODE_ENV=$Environment,ENVIRONMENT=$Environment,VERSION=$DeploymentVersion}" `
                    --timeout 30 `
                    --memory-size 512 `
                    --profile $EnvConfig.AWSProfile `
                    --region $EnvConfig.Region
                
                Write-Log "✓ Deployed $FunctionName successfully"
            } else {
                Write-Log "⚠ No Terraform output found for $FunctionName" "WARNING"
            }
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Log "Backend deployment completed"
}

function Deploy-Frontend {
    param($TerraformOutputs)
    
    Write-Log "Deploying frontend application..."
    
    Push-Location "$ProjectRoot\frontend"
    try {
        # Install dependencies
        Write-Log "Installing frontend dependencies..."
        npm ci
        
        # Configure environment variables
        if ($TerraformOutputs) {
            Write-Log "Configuring environment variables..."
            $EnvContent = @"
NEXT_PUBLIC_API_URL=$($TerraformOutputs.api_gateway_url.value)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$($TerraformOutputs.cognito_user_pool_id.value)
NEXT_PUBLIC_COGNITO_CLIENT_ID=$($TerraformOutputs.cognito_client_id.value)
NEXT_PUBLIC_S3_BUCKET=$($TerraformOutputs.s3_bucket_name.value)
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=$($TerraformOutputs.cloudfront_domain.value)
NEXT_PUBLIC_ENVIRONMENT=$Environment
NEXT_PUBLIC_VERSION=$DeploymentVersion
"@
            $EnvContent | Out-File -FilePath ".env.production" -Encoding UTF8
        }
        
        # Build application
        Write-Log "Building frontend application..."
        $env:NODE_ENV = "production"
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Frontend build failed" "ERROR"
            exit 1
        }
        
        # Deploy to S3
        if ($TerraformOutputs -and $TerraformOutputs.s3_bucket_name) {
            $S3Bucket = $TerraformOutputs.s3_bucket_name.value
            Write-Log "Deploying to S3 bucket: $S3Bucket..."
            
            # Sync static assets with long cache
            aws s3 sync out/ "s3://$S3Bucket/" `
                --delete `
                --cache-control "public, max-age=31536000, immutable" `
                --exclude "*.html" `
                --profile $EnvConfig.AWSProfile `
                --region $EnvConfig.Region
            
            # Sync HTML files with short cache
            aws s3 sync out/ "s3://$S3Bucket/" `
                --delete `
                --cache-control "public, max-age=0, must-revalidate" `
                --exclude "*" `
                --include "*.html" `
                --profile $EnvConfig.AWSProfile `
                --region $EnvConfig.Region
            
            if ($LASTEXITCODE -ne 0) {
                Write-Log "S3 deployment failed" "ERROR"
                exit 1
            }
            
            # Invalidate CloudFront cache
            if ($TerraformOutputs.cloudfront_distribution_id) {
                $DistributionId = $TerraformOutputs.cloudfront_distribution_id.value
                Write-Log "Invalidating CloudFront cache..."
                
                $InvalidationId = aws cloudfront create-invalidation `
                    --distribution-id $DistributionId `
                    --paths "/*" `
                    --profile $EnvConfig.AWSProfile `
                    --query "Invalidation.Id" `
                    --output text
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "CloudFront invalidation created: $InvalidationId"
                } else {
                    Write-Log "CloudFront invalidation failed" "WARNING"
                }
            }
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Log "Frontend deployment completed"
}

function Invoke-PostDeploymentTests {
    param($TerraformOutputs)
    
    if ($SkipTests) {
        Write-Log "Skipping post-deployment tests due to -SkipTests flag"
        return
    }
    
    Write-Log "Running post-deployment tests..."
    
    # Wait for deployment to propagate
    Write-Log "Waiting 60 seconds for deployment to propagate..."
    Start-Sleep -Seconds 60
    
    # Health check
    if ($TerraformOutputs -and $TerraformOutputs.cloudfront_domain) {
        $AppUrl = "https://$($TerraformOutputs.cloudfront_domain.value)"
        $HealthUrl = "$AppUrl/api/health"
        
        Write-Log "Running health check: $HealthUrl"
        
        try {
            $Response = Invoke-WebRequest -Uri $HealthUrl -TimeoutSec 30
            if ($Response.StatusCode -eq 200) {
                Write-Log "✓ Health check passed"
            } else {
                Write-Log "✗ Health check failed: HTTP $($Response.StatusCode)" "ERROR"
                exit 1
            }
        }
        catch {
            Write-Log "✗ Health check failed: $($_.Exception.Message)" "ERROR"
            exit 1
        }
    }
    
    # Run smoke tests if available
    if (Test-Path "$ProjectRoot\tests") {
        Write-Log "Running smoke tests..."
        Push-Location "$ProjectRoot\tests"
        try {
            if (Test-Path "package.json") {
                npm ci
                if (Test-Path "package.json" -PathType Leaf) {
                    $PackageJson = Get-Content "package.json" | ConvertFrom-Json
                    if ($PackageJson.scripts."test:smoke") {
                        $env:TEST_ENVIRONMENT = $Environment
                        if ($TerraformOutputs) {
                            $env:APP_URL = "https://$($TerraformOutputs.cloudfront_domain.value)"
                            $env:API_BASE_URL = $TerraformOutputs.api_gateway_url.value
                        }
                        
                        npm run test:smoke
                        if ($LASTEXITCODE -ne 0) {
                            Write-Log "Smoke tests failed" "ERROR"
                            exit 1
                        }
                        Write-Log "✓ Smoke tests passed"
                    }
                }
            }
        }
        finally {
            Pop-Location
        }
    }
    
    Write-Log "Post-deployment tests completed"
}

function Invoke-MonitoringCheck {
    $MonitoringDuration = $EnvConfig.MonitoringDuration
    Write-Log "Monitoring deployment for $MonitoringDuration minutes..."
    
    $EndTime = (Get-Date).AddMinutes($MonitoringDuration)
    $CheckInterval = 30  # seconds
    $CheckCount = 0
    
    while ((Get-Date) -lt $EndTime) {
        $CheckCount++
        Write-Log "Monitoring check $CheckCount..."
        
        # Add monitoring logic here (CloudWatch metrics, health checks, etc.)
        # For now, just a basic health check
        try {
            if ($TerraformOutputs -and $TerraformOutputs.cloudfront_domain) {
                $HealthUrl = "https://$($TerraformOutputs.cloudfront_domain.value)/api/health"
                $Response = Invoke-WebRequest -Uri $HealthUrl -TimeoutSec 10
                if ($Response.StatusCode -ne 200) {
                    Write-Log "Health check failed during monitoring: HTTP $($Response.StatusCode)" "WARNING"
                }
            }
        }
        catch {
            Write-Log "Health check failed during monitoring: $($_.Exception.Message)" "WARNING"
        }
        
        Start-Sleep -Seconds $CheckInterval
    }
    
    Write-Log "Monitoring period completed"
}

# Main deployment logic
function Start-Deployment {
    Write-Log "Starting deployment to $Environment environment..."
    Write-Log "Deployment version: $DeploymentVersion"
    Write-Log "Dry run: $DryRun"
    
    if ($RollbackMode) {
        Write-Log "ROLLBACK MODE: Rolling back to version $RollbackVersion"
        # Implement rollback logic here
        Write-Log "Rollback functionality not yet implemented" "ERROR"
        exit 1
    }
    
    # Run deployment steps
    Test-Prerequisites
    Invoke-SecurityScan
    Invoke-Tests
    
    $InfraResult = Deploy-Infrastructure
    $TerraformOutputs = $InfraResult.outputs
    
    if (!$DryRun) {
        Deploy-Backend -TerraformOutputs $TerraformOutputs
        Deploy-Frontend -TerraformOutputs $TerraformOutputs
        Invoke-PostDeploymentTests -TerraformOutputs $TerraformOutputs
        
        if ($Environment -ne "dev") {
            Invoke-MonitoringCheck
        }
    }
    
    Write-Log "Deployment completed successfully!"
    
    # Output deployment summary
    Write-Log "=== Deployment Summary ==="
    Write-Log "Environment: $Environment"
    Write-Log "Version: $DeploymentVersion"
    Write-Log "Timestamp: $(Get-Date)"
    if ($TerraformOutputs -and $TerraformOutputs.cloudfront_domain) {
        Write-Log "Application URL: https://$($TerraformOutputs.cloudfront_domain.value)"
    }
    if ($TerraformOutputs -and $TerraformOutputs.api_gateway_url) {
        Write-Log "API URL: $($TerraformOutputs.api_gateway_url.value)"
    }
    Write-Log "Log file: $LogFile"
    Write-Log "=========================="
}

# Initialize deployment version
$DeploymentVersion = Get-DeploymentVersion

# Handle Ctrl+C gracefully
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Log "Deployment interrupted by user" "WARNING"
}

try {
    Start-Deployment
}
catch {
    Write-Log "Deployment failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    exit 1
}