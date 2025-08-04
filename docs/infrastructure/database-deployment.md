# Database Infrastructure Deployment Guide

## Overview

This document outlines the deployment and configuration of Aurora PostgreSQL Serverless v2 database infrastructure for the Clinical Trial Platform. The infrastructure is designed with HIPAA compliance, cost optimization, and high availability in mind.

## Architecture

### Aurora PostgreSQL Serverless v2 Configuration

- **Engine**: Aurora PostgreSQL 15.4
- **Deployment**: Serverless v2 with auto-scaling
- **Encryption**: Customer-managed KMS keys with automatic rotation
- **Networking**: Private subnets only, no public access
- **Backup**: Automated backups with 35-day retention (production)

### Environment-Specific Configurations

#### Development Environment
- **Scaling**: 0.5-4 ACUs with auto-pause enabled
- **Availability**: Single-AZ deployment for cost optimization
- **Backup Retention**: 3 days
- **Monitoring**: Basic CloudWatch metrics
- **Cost Target**: $5-8/month

#### Production Environment
- **Scaling**: 1-16 ACUs, no auto-pause
- **Availability**: Multi-AZ deployment across 3 availability zones
- **Backup Retention**: 35 days (HIPAA compliant)
- **Monitoring**: Enhanced monitoring + Performance Insights
- **RDS Proxy**: Enabled for connection pooling
- **Cost Target**: $12-15/month

## Security Features

### HIPAA Compliance

1. **Encryption at Rest**
   - Customer-managed KMS keys
   - Automatic key rotation enabled
   - Separate encryption keys for database and backups

2. **Encryption in Transit**
   - TLS 1.3 enforcement
   - SSL certificate validation
   - IAM database authentication

3. **Audit Logging**
   - PostgreSQL audit extension (pgaudit) enabled
   - All SQL statements logged
   - Connection and disconnection events tracked
   - CloudTrail for API-level audit

4. **Network Security**
   - Private subnet placement only
   - Security groups with least-privilege access
   - VPC endpoints for AWS service communication

### Access Control

- **IAM Database Authentication**: Enabled for all environments
- **Lambda Access Role**: Dedicated IAM role for Lambda function access
- **Secrets Manager**: Database credentials stored securely
- **RDS Proxy**: Connection pooling and enhanced security (production)

## Monitoring and Alerting

### CloudWatch Metrics

- CPU utilization
- Database connections
- Read/Write latency
- Serverless v2 capacity utilization
- Storage usage
- I/O operations

### Alarms Configuration

```hcl
# Example alarm thresholds
CPU Utilization: > 80% (dev), > 70% (prod)
Database Connections: > 50 (dev), > 80 (prod)
Read/Write Latency: > 200ms
Capacity Utilization: > 80% of max capacity
```

### Dashboards

- **Database Performance**: Real-time metrics and capacity scaling
- **Performance Insights**: Query-level performance analysis (production)
- **Cost Tracking**: Budget alerts and usage patterns

## Backup and Recovery

### Automated Backups

- **Backup Window**: 03:00-04:00 UTC
- **Retention**: 3 days (dev), 35 days (prod)
- **Point-in-Time Recovery**: Available for full retention period
- **Cross-Region Backup**: Configurable for disaster recovery

### Maintenance

- **Maintenance Window**: Sunday 04:00-05:00 UTC
- **Engine Updates**: Automatic minor version updates
- **Parameter Changes**: Applied during maintenance window

## Cost Optimization

### Development Environment

- Auto-pause after 5 minutes of inactivity
- Single-AZ deployment
- Minimal monitoring (Performance Insights disabled)
- 3-day backup retention

### Production Environment

- Serverless v2 scaling based on demand
- Reserved capacity planning for consistent workloads
- S3 lifecycle policies for long-term backup storage
- Cost budgets with alerts at 80% and 100% thresholds

### Expected Costs

| Environment | Monthly Cost | Features |
|------------|-------------|----------|
| Development | $5-8 | Auto-pause, Single-AZ, Basic monitoring |
| Production | $12-15 | Multi-AZ, Enhanced monitoring, RDS Proxy |

## Deployment Instructions

### Prerequisites

1. **Network Infrastructure**: VPC, subnets, and security groups must be deployed
2. **IAM Permissions**: Terraform execution role with RDS and KMS permissions
3. **Variable Configuration**: Environment-specific variables configured

### Deployment Steps

#### 1. Development Environment Deployment

```bash
cd infra/environments/dev
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply
```

#### 2. Production Environment Deployment

```bash
cd infra/environments/prod
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply
```

### Post-Deployment Verification

1. **Database Connectivity**
   ```bash
   # Test connection using psql with IAM authentication
   psql -h <cluster-endpoint> -p 5432 -U <username> -d clinical_trial
   ```

2. **Monitoring Setup**
   - Verify CloudWatch dashboard creation
   - Test alarm notifications
   - Check Performance Insights (production)

3. **Security Validation**
   - Confirm encryption status
   - Validate audit logging
   - Test IAM authentication

## Connection Configuration

### Lambda Function Configuration

```typescript
// Example Lambda database configuration
const dbConfig = {
  host: process.env.DB_CLUSTER_ENDPOINT,
  port: 5432,
  database: process.env.DB_NAME,
  ssl: {
    require: true,
    rejectUnauthorized: true
  },
  // Use IAM authentication
  authenticationMethod: 'iam'
};
```

### Environment Variables

```bash
# Required environment variables for Lambda functions
DB_CLUSTER_ENDPOINT=<cluster-endpoint>
DB_CLUSTER_PORT=5432
DB_NAME=clinical_trial
DB_SECRET_ARN=<secrets-manager-arn>
DB_PROXY_ENDPOINT=<proxy-endpoint>  # Production only
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Check security group rules
   - Verify subnet routing
   - Confirm Lambda VPC configuration

2. **High CPU Utilization**
   - Review query performance
   - Check for long-running transactions
   - Consider scaling up capacity

3. **Auto-Pause Not Working (Dev)**
   - Verify no active connections
   - Check auto-pause delay configuration
   - Review CloudWatch logs

### Performance Optimization

1. **Query Optimization**
   - Use Performance Insights to identify slow queries
   - Implement proper indexing strategies
   - Monitor query execution plans

2. **Connection Pooling**
   - Use RDS Proxy in production
   - Implement application-level connection pooling
   - Configure appropriate pool sizes

## Maintenance Procedures

### Regular Tasks

1. **Weekly**
   - Review CloudWatch metrics
   - Check alarm status
   - Monitor cost trends

2. **Monthly**
   - Review backup retention
   - Validate security compliance
   - Update documentation

3. **Quarterly**
   - Performance review and optimization
   - Cost analysis and optimization
   - Security audit and compliance review

### Emergency Procedures

1. **Database Failover**
   - Aurora automatically handles failover in Multi-AZ setup
   - Monitor application reconnection
   - Verify data consistency

2. **Point-in-Time Recovery**
   ```bash
   # Create cluster from backup
   aws rds restore-db-cluster-to-point-in-time \
     --source-db-cluster-identifier original-cluster \
     --db-cluster-identifier restored-cluster \
     --restore-to-time 2024-01-01T12:00:00Z
   ```

## Compliance Validation

### HIPAA Requirements

- [x] Data encryption at rest and in transit
- [x] Audit logging of all database access
- [x] Access controls and authentication
- [x] Backup retention and recovery procedures
- [x] Network isolation and security
- [x] Monitoring and alerting

### Regular Audits

1. **Security Assessment**
   - AWS Config rules for compliance
   - Regular penetration testing
   - Access review and rotation

2. **Backup Testing**
   - Monthly restoration tests
   - Cross-region backup validation
   - Recovery time objective (RTO) verification

## Support and Escalation

### Monitoring Contacts

- **Database Alerts**: Configured SNS topic
- **Cost Alerts**: Budget notification system
- **Security Alerts**: CloudTrail and GuardDuty integration

### Escalation Matrix

1. **Level 1**: Application team (development issues)
2. **Level 2**: Platform team (infrastructure issues)
3. **Level 3**: AWS Support (service-level issues)

## Related Documentation

- [Network Infrastructure Guide](./network-deployment.md)
- [Security Configuration Guide](../security/security-controls-implementation.md)
- [HIPAA Compliance Checklist](../security/hipaa-compliance-checklist.md)
- [Cost Optimization Strategy](./cost-optimization-guide.md)