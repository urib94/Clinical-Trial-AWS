# Clinical Trial Platform - Claude Code Configuration

## Project Overview
Healthcare clinical trial platform with mobile-first PWA, AWS serverless backend, and secure data management.

## Development Workflow Commands
```bash
# Frontend Development
npm run dev          # Start Next.js development server
npm run build        # Build production bundle
npm run test         # Run Jest unit tests
npm run e2e          # Run Playwright E2E tests
npm run lint         # ESLint check
npm run type-check   # TypeScript check

# Backend Development
npm run lambda:dev   # Local Lambda development
npm run lambda:test  # Test Lambda functions
npm run api:docs     # Generate API documentation

# Infrastructure
terraform fmt        # Format Terraform files
terraform validate   # Validate Terraform configuration
terraform plan       # Preview infrastructure changes
terraform apply      # Apply infrastructure changes
tflint              # Terraform linting
checkov -d infra    # Security scanning

# Deployment
./scripts/deploy.ps1 dev    # Deploy to development
./scripts/deploy.ps1 prod   # Deploy to production
./scripts/seed_db.ts        # Seed database with test data
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

## Key Technologies
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, PWA
- **Backend**: AWS Lambda (Node.js 20), TypeScript
- **Database**: Aurora PostgreSQL Serverless v2
- **Auth**: AWS Cognito with Google OAuth
- **Storage**: S3 with lifecycle policies
- **CDN**: CloudFront with custom domain
- **IaC**: Terraform with modular design
- **Testing**: Jest, Playwright, terraform-compliance

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

## Compliance & Monitoring
- HIPAA-aligned security controls
- CloudWatch monitoring and alerting
- AWS Config for compliance tracking
- GuardDuty for threat detection
- Daily automated backups