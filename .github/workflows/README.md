# Clinical Trial Platform - GitHub Actions Workflows

This directory contains all GitHub Actions workflows for the Clinical Trial Data Collection Platform. These workflows implement a comprehensive CI/CD pipeline with security, compliance, and quality gates suitable for healthcare applications.

## Workflow Overview

### 🔄 Continuous Integration (`ci.yml`)

**Purpose:** Validates code quality, security, and compliance on every pull request and develop branch push.

**Triggers:**
- Pull requests to `main` or `develop` branches
- Pushes to `develop` branch

**Key Features:**
- Static Application Security Testing (SAST) with CodeQL
- Dependency vulnerability scanning (npm audit, Snyk)
- Infrastructure security scanning (Checkov, tflint)
- Comprehensive HIPAA compliance validation
- Unit tests with ≥85% coverage requirement
- Accessibility testing (WCAG 2.1 AA)
- Performance testing with Lighthouse CI
- Code quality checks (ESLint, Prettier, TypeScript)

**HIPAA Compliance Checks:**
- Encryption configuration validation
- PII/PHI exposure scanning
- Audit logging verification
- Access control validation
- Data retention policy checks
- Network security validation

### 🚀 Continuous Deployment

#### Development Deployment (`cd-dev.yml`)

**Purpose:** Automated deployment to development environment.

**Triggers:**
- Pushes to `develop` branch
- Manual workflow dispatch

**Features:**
- Infrastructure deployment with Terraform
- Database migration with seeding
- Lambda function deployment with versioning
- Frontend deployment to S3/CloudFront
- Post-deployment health checks
- Automated rollback on failure

#### Staging Deployment (`cd-staging.yml`)

**Purpose:** Production-like deployment with comprehensive testing.

**Triggers:**
- Pushes to `main` branch
- Manual workflow dispatch

**Features:**
- Blue-green deployment strategy
- Canary backend deployment (10% traffic)
- Comprehensive E2E testing with Playwright
- Load testing and performance validation
- Security validation with OWASP ZAP
- Traffic switching with monitoring
- Extended validation period

#### Production Deployment (`cd-prod.yml`)

**Purpose:** Secure, approved deployment to production environment.

**Triggers:**
- Manual workflow dispatch only

**Features:**
- Multi-level approval process (Technical Lead + Product Owner)
- Pre-deployment backup creation
- Maintenance mode support
- Canary deployment (5% traffic)
- Extended monitoring (30 minutes)
- Automatic rollback triggers
- Business continuity validation

### 🔒 Security Scanning (`security-scan.yml`)

**Purpose:** Daily comprehensive security scanning and monitoring.

**Triggers:**
- Daily at 2 AM UTC (scheduled)
- Manual workflow dispatch

**Features:**
- Multi-environment security validation
- Static and dynamic application security testing
- Infrastructure security scanning
- Secrets detection and validation
- Docker image vulnerability scanning
- HIPAA compliance verification
- Automated security issue creation

### 🏗️ Infrastructure Management (`infrastructure.yml`)

**Purpose:** Infrastructure validation, planning, and deployment.

**Triggers:**
- Changes to `infra/` directory
- Manual workflow dispatch

**Features:**
- Terraform validation and linting
- Infrastructure security scanning
- Cost estimation with Infracost
- Drift detection and reporting
- Environment-specific deployment
- Resource import capabilities
- Automated issue creation for failures

## Environment Strategy

### 🧪 Development Environment
- **Auto-deployment:** Enabled on `develop` branch
- **Approval:** Not required
- **Monitoring:** Basic (7-day retention)
- **Resources:** Minimal scaling (cost-optimized)
- **Data:** Anonymized test data with seeding

### 🧪 Staging Environment
- **Auto-deployment:** Enabled on `main` branch
- **Approval:** Limited (1 reviewer from dev team)
- **Monitoring:** Enhanced (30-day retention)
- **Resources:** Production-like scaling
- **Data:** Anonymized production-like data
- **Testing:** Comprehensive E2E and performance tests

### 🏥 Production Environment
- **Auto-deployment:** Disabled (manual only)
- **Approval:** Required (2 reviewers: Technical Lead + Product Owner)
- **Monitoring:** Comprehensive (365-day retention)
- **Resources:** Enterprise scaling with HA
- **Data:** Real encrypted data with strict access controls
- **Compliance:** Full HIPAA compliance with audit trails

## Security Integration

### SAST (Static Application Security Testing)
- **CodeQL:** GitHub's advanced semantic analysis
- **Semgrep:** Custom rule-based security scanning
- **ESLint Security:** JavaScript-specific security rules
- **Custom Rules:** Healthcare-specific compliance checks

### DAST (Dynamic Application Security Testing)
- **OWASP ZAP:** Web application security testing
- **SSL Labs:** TLS/SSL configuration validation
- **Custom Security Tests:** Healthcare-specific vulnerability checks

### Infrastructure Security
- **Checkov:** Comprehensive Terraform security scanning
- **tfsec:** Additional infrastructure security rules
- **Terrascan:** Multi-cloud security policy validation
- **AWS Config:** Compliance rule monitoring

### Dependency Security
- **npm audit:** Node.js dependency vulnerability scanning
- **Snyk:** Advanced vulnerability database and monitoring
- **GitHub Dependabot:** Automated dependency updates
- **License compliance:** Open source license validation

## Quality Gates

### Code Quality
- ✅ Test coverage ≥85%
- ✅ Zero TypeScript errors
- ✅ ESLint compliance
- ✅ Prettier formatting
- ✅ Clean build with no warnings

### Security Gates
- ✅ No high/critical SAST findings
- ✅ No high/critical dependency vulnerabilities
- ✅ Infrastructure security compliance
- ✅ No exposed secrets or credentials
- ✅ HIPAA validation passing

### Performance Gates
- ✅ Lighthouse mobile score ≥90
- ✅ Bundle size <500KB JavaScript
- ✅ API response time <500ms P95
- ✅ Accessibility WCAG 2.1 AA compliance

### HIPAA Compliance Gates
- ✅ Encryption at rest and in transit
- ✅ Access control implementation
- ✅ Audit logging configuration
- ✅ Data retention policies
- ✅ Network security controls
- ✅ PII/PHI protection validation

## Deployment Strategies

### Blue-Green Deployment
- **Used for:** Infrastructure in staging environment
- **Benefits:** Zero-downtime deployments, quick rollback
- **Process:** Deploy to inactive environment → test → switch traffic

### Canary Deployment
- **Used for:** Backend services in staging (10%) and production (5%)
- **Benefits:** Gradual risk exposure, real-world validation
- **Process:** Route small traffic percentage → monitor → gradual increase

### Rolling Deployment
- **Used for:** Frontend applications via CDN
- **Benefits:** Efficient content distribution, quick updates
- **Process:** Update CDN → invalidate cache → verify propagation

## Rollback Procedures

### Automatic Rollback Triggers
- Error rate >1% for 5 minutes
- Response time >2s P95 for 10 minutes
- Health check failures
- Critical monitoring alerts

### Rollback Types
- **Lambda Functions:** Alias update (<2 minutes)
- **Frontend:** S3 version restore + CloudFront invalidation (<5 minutes)
- **Database:** Backup restore (15-30 minutes)
- **Infrastructure:** Terraform state revert (10-20 minutes)

### Emergency Procedures
- Immediate traffic isolation
- Security incident response
- Data corruption recovery
- Business continuity activation

## Monitoring and Alerting

### Application Monitoring
- Request rates and response times
- Error rates and success metrics
- Resource utilization tracking
- Custom business metrics
- Real user monitoring (RUM)

### Security Monitoring
- Authentication and authorization events
- Data access pattern analysis
- Configuration change tracking
- Vulnerability scan results
- Compliance status monitoring

### Infrastructure Monitoring
- Server health and performance
- Network connectivity and latency
- Storage utilization and performance
- Cost tracking and optimization
- Resource utilization patterns

### Alert Escalation
1. **5 minutes:** On-call engineer (PagerDuty)
2. **15 minutes:** Team lead (Slack + Email)
3. **30 minutes:** Management (Phone + Email)
4. **60 minutes:** Disaster recovery activation

## HIPAA Compliance

### Administrative Safeguards
- ✅ Access control policies and procedures
- ✅ Assigned security responsibility
- ✅ Workforce training and access management
- ✅ Information access management
- ✅ Security awareness and training
- ✅ Security incident procedures
- ✅ Contingency plan
- ✅ Regular security evaluations

### Physical Safeguards
- ✅ Facility access controls (AWS responsibility)
- ✅ Workstation security
- ✅ Device and media controls
- ✅ Data center environmental controls (AWS)

### Technical Safeguards
- ✅ Access control (unique user IDs, encryption)
- ✅ Audit controls (comprehensive logging)
- ✅ Integrity (data validation, checksums)
- ✅ Person or entity authentication (MFA)
- ✅ Transmission security (TLS 1.3)

### Business Associate Agreements
- ✅ AWS BAA in place
- ✅ Third-party service BAAs
- ✅ Vendor compliance monitoring
- ✅ Incident notification procedures

## Usage Instructions

### Running Individual Workflows

```bash
# Trigger security scan manually
gh workflow run security-scan.yml

# Deploy to development
gh workflow run cd-dev.yml

# Deploy to staging (requires main branch)
gh workflow run cd-staging.yml

# Deploy to production (requires approval)
gh workflow run cd-prod.yml --ref main

# Infrastructure planning
gh workflow run infrastructure.yml -f action=plan -f environment=staging
```

### Environment Setup

1. **Configure AWS Credentials:**
   ```bash
   # Development
   AWS_ACCESS_KEY_ID_DEV
   AWS_SECRET_ACCESS_KEY_DEV
   
   # Staging
   AWS_ACCESS_KEY_ID_STAGING
   AWS_SECRET_ACCESS_KEY_STAGING
   
   # Production
   AWS_ACCESS_KEY_ID_PROD
   AWS_SECRET_ACCESS_KEY_PROD
   ```

2. **Configure Integration Secrets:**
   ```bash
   SNYK_TOKEN                    # Security scanning
   LHCI_GITHUB_APP_TOKEN        # Lighthouse CI
   SLACK_WEBHOOK_URL            # Notifications
   DATADOG_API_KEY              # Monitoring
   SENTRY_DSN                   # Error tracking
   ```

3. **Configure Environment Protection Rules:**
   - Development: No protection
   - Staging: 1 reviewer required
   - Production: 2 reviewers required (Technical Lead + Product Owner)

### Workflow Monitoring

- **GitHub Actions tab:** View workflow runs and logs
- **Security tab:** Review security findings and SARIF reports
- **Issues:** Automated issue creation for failures
- **Artifacts:** Download build outputs and reports
- **Deployments:** Track environment deployment history

## Troubleshooting

### Common Issues

1. **Failed Security Scans:**
   - Review SARIF reports in Security tab
   - Update dependencies with security patches
   - Fix code security issues before merge

2. **Deployment Failures:**
   - Check AWS permissions and quotas
   - Verify Terraform state consistency
   - Review infrastructure drift reports

3. **Test Failures:**
   - Ensure test coverage meets 85% threshold
   - Fix accessibility and performance issues
   - Update test data and mocks

4. **HIPAA Compliance Failures:**
   - Review compliance report artifacts
   - Update encryption and security configurations
   - Ensure audit logging is properly configured

### Getting Help

- **Documentation:** Check `/docs/deployment/` directory
- **Team Slack:** `#clinical-trial-devops` channel
- **On-call:** Use PagerDuty for urgent issues
- **Issues:** Create GitHub issues for workflow problems

## Continuous Improvement

### Regular Reviews
- **Weekly:** Team retrospectives and metric reviews
- **Monthly:** Security and compliance assessment
- **Quarterly:** Performance optimization and process updates
- **Annually:** Strategy review and technology updates

### Metrics and KPIs
- Deployment frequency and success rate
- Mean time to recovery (MTTR)
- Security vulnerability response time
- Compliance score and audit findings
- Performance benchmarks and trends

---

## Contributing

When modifying workflows:

1. Test changes in a feature branch
2. Update documentation accordingly
3. Ensure HIPAA compliance is maintained
4. Review security implications
5. Update team on changes

For questions or suggestions, contact the DevOps team or create an issue.