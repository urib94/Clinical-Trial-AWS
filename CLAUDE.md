# Clinical Trial Platform - Claude Code Configuration

## Project Overview
Healthcare clinical trial platform with mobile-first PWA, AWS serverless backend, and secure data management.

**CURRENT DEVELOPMENT PHASE**: Local development and testing only - NO AWS deployment yet.

## Development Workflow Commands
```bash
# Frontend Development (Local)
npm run dev          # Start Next.js development server
npm run build        # Build production bundle
npm run test         # Run Jest unit tests
npm run e2e          # Run Playwright E2E tests
npm run lint         # ESLint check
npm run type-check   # TypeScript check

# Backend Development (Local)
npm run lambda:dev   # Local Lambda development with LocalStack
npm run lambda:test  # Test Lambda functions locally
npm run api:docs     # Generate API documentation
npm run db:local     # Run local PostgreSQL with Docker
npm run cognito:local # Local Cognito simulation

# Infrastructure (Design & Validation Only)
terraform fmt        # Format Terraform files
terraform validate   # Validate Terraform configuration
terraform plan       # Preview infrastructure changes (DRY RUN ONLY)
# terraform apply    # DISABLED - No AWS deployment yet
tflint              # Terraform linting
checkov -d infra    # Security scanning

# Local Testing & Simulation
docker-compose up    # Start local development stack
./scripts/setup-local.ps1   # Setup local development environment
./scripts/seed-local-db.ts  # Seed local database with test data
```

## Project Structure
```
Clinical-Trail-AWS/
├── frontend/           # Next.js PWA application
├── backend/           # AWS Lambda functions
├── infra/            # Terraform infrastructure
├── scripts/          # Deployment and utility scripts
├── tests/            # E2E and integration tests
├── docs/             # Architecture and API documentation
└── .claude/          # Claude Code agent configurations
```

## Key Technologies (Local Development Stack)
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, PWA
- **Backend**: Node.js 20 with Express (simulating AWS Lambda locally)
- **Database**: PostgreSQL with Docker (simulating Aurora Serverless v2)
- **Auth**: Local Cognito simulation or Auth0 dev environment
- **Storage**: Local filesystem or MinIO (simulating S3)
- **Local Stack**: LocalStack for AWS service simulation
- **IaC**: Terraform modules (design only, no deployment)
- **Testing**: Jest, Playwright, terraform-compliance

## Target Production Technologies (Future Deployment)
- **Backend**: AWS Lambda (Node.js 20), TypeScript
- **Database**: Aurora PostgreSQL Serverless v2
- **Auth**: AWS Cognito with Google OAuth
- **Storage**: S3 with lifecycle policies
- **CDN**: CloudFront with custom domain

## Security Requirements
- OWASP Top 10 compliance
- Column-level encryption (pgcrypto)
- WAF protection on all endpoints
- Virus scanning for uploads
- Least-privilege IAM roles
- Secrets management with AWS Secrets Manager

## Performance Targets
- Lambda cold start < 400ms
- Lighthouse mobile score ≥ 90
- PWA support for offline functionality
- Responsive design (≥ 360px viewport)

## Cost Optimization
- Target: ≤ $40/month at 100 MAU
- Aurora Serverless v2 auto-scaling
- S3 lifecycle policies (Standard-IA → Glacier)
- NAT instance instead of NAT Gateway
- Spot instances where applicable

## Testing Strategy
- Unit tests: ≥ 85% coverage
- E2E tests: Critical user journeys
- Security tests: Vulnerability scanning
- Performance tests: Load testing
- Infrastructure tests: terraform-compliance

## Local Development Environment
- **Database**: PostgreSQL 15 with Docker Compose
- **Authentication**: Local JWT simulation or Auth0 dev tenant
- **File Storage**: Local filesystem with organized directory structure
- **API Testing**: Postman collections for all endpoints
- **Monitoring**: Local logging and health check endpoints

## Future Production Compliance & Monitoring
- HIPAA-aligned security controls
- CloudWatch monitoring and alerting
- AWS Config for compliance tracking
- GuardDuty for threat detection
- Daily automated backups

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

**DEVELOPMENT FOCUS**: All current development work should target local development environment setup and testing. AWS infrastructure code should be designed and validated but NOT deployed until explicitly requested.