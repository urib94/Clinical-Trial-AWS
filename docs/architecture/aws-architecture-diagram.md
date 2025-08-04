# Clinical Trial Platform - AWS Architecture Diagram

## Overview
This document provides the comprehensive AWS architecture for the Clinical Trial Data Collection Platform, designed to support both physician and patient portals with HIPAA compliance, cost optimization, and high performance.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    Internet                                         │
└─────────────────────┬───────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────────────────────┐
│                              AWS WAF + Shield                                      │
│                        (OWASP Top 10 Rules)                                        │
└─────────────────────┬───────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────────────────────┐
│                            CloudFront CDN                                          │
│               (Global Edge Caching + DDoS Protection)                              │
└─────────────────────┬───────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────────────────────┐
│                          Route 53 DNS                                              │
│                    (Health Checks + Failover)                                      │
└─────────────────────┬───────────────────────────────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐     ┌───────────────┐
              │   Physician   │     │    Patient    │
              │    Portal     │     │    Portal     │
              │  (Next.js 14) │     │  (Next.js 14) │
              │     PWA       │     │     PWA       │
              └───────┬───────┘     └───────┬───────┘
                      │                     │
                      └──────────┬──────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────────────────┐
│                                VPC                                                 │
│                         (10.0.0.0/16)                                             │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                        Public Subnets                                       │  │
│  │                   (10.0.1.0/24, 10.0.2.0/24)                               │  │
│  │                                                                             │  │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │  │
│  │  │  API Gateway    │    │ Application     │    │   NAT Instance  │        │  │
│  │  │   (Regional)    │    │ Load Balancer   │    │ (Cost Optimized)│        │  │
│  │  │  TLS 1.3 Only   │    │  (Multi-AZ)     │    │     t3.nano     │        │  │
│  │  └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘        │  │
│  └────────────┼──────────────────────┼──────────────────────┼────────────────┘  │
│               │                      │                      │                   │
│  ┌────────────▼──────────────────────▼──────────────────────▼────────────────┐  │
│  │                        Private Subnets                                    │  │
│  │                 (10.0.10.0/24, 10.0.11.0/24)                             │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    Lambda Functions                                 │ │  │
│  │  │                  (Node.js 20, Graviton)                            │ │  │
│  │  │                                                                     │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│ │  │
│  │  │  │   Auth      │  │ Physician   │  │   Patient   │  │    Admin    ││ │  │
│  │  │  │  Service    │  │   Portal    │  │   Portal    │  │   Portal    ││ │  │
│  │  │  │             │  │    API      │  │     API     │  │     API     ││ │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│ │  │
│  │  │                                                                     │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│ │  │
│  │  │  │    File     │  │    Email    │  │   Audit     │  │  Backup     ││ │  │
│  │  │  │  Processing │  │ Notification│  │   Logging   │  │  Service    ││ │  │
│  │  │  │   Service   │  │   Service   │  │   Service   │  │             ││ │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│ │  │
│  │  └─────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    Database Subnet                                  │ │  │
│  │  │                 (10.0.20.0/24, 10.0.21.0/24)                       │ │  │
│  │  │                                                                     │ │  │
│  │  │  ┌─────────────────────────────────────────────────────────────────┐│ │  │
│  │  │  │            Aurora PostgreSQL Serverless v2                     ││ │  │
│  │  │  │                    (Multi-AZ Deployment)                        ││ │  │
│  │  │  │                                                                 ││ │  │
│  │  │  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        ││ │  │
│  │  │  │  │   Writer    │    │   Reader    │    │   Reader    │        ││ │  │
│  │  │  │  │  Instance   │    │  Instance   │    │  Instance   │        ││ │  │
│  │  │  │  │    (AZ-a)   │    │    (AZ-b)   │    │    (AZ-c)   │        ││ │  │
│  │  │  │  └─────────────┘    └─────────────┘    └─────────────┘        ││ │  │
│  │  │  └─────────────────────────────────────────────────────────────────┘│ │  │
│  │  └─────────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              External Services                                      │
│                                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                │
│  │  AWS Cognito    │    │      S3         │    │      KMS        │                │
│  │ User Pools +    │    │   Buckets       │    │  Encryption     │                │
│  │ Identity Pools  │    │ (Multi-Region)  │    │ Key Management  │                │
│  │   OAuth 2.0     │    │                 │    │                 │                │
│  │  Google SSO     │    │ ┌─────────────┐ │    │ ┌─────────────┐ │                │
│  │                 │    │ │   PHI Data  │ │    │ │ Data Keys   │ │                │
│  │ ┌─────────────┐ │    │ │  (Encrypted)│ │    │ │(Auto Rotate)│ │                │
│  │ │    MFA      │ │    │ └─────────────┘ │    │ └─────────────┘ │                │
│  │ │  (TOTP/SMS) │ │    │                 │    │                 │                │
│  │ └─────────────┘ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │                │
│  └─────────────────┘    │ │ Documents   │ │    │ │Master Keys  │ │                │
│                         │ │  & Files    │ │    │ │(CMK/BYOK)   │ │                │
│                         │ └─────────────┘ │    │ └─────────────┘ │                │
│                         └─────────────────┘    └─────────────────┘                │
│                                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                │
│  │   CloudWatch    │    │  Secrets        │    │  ElastiCache    │                │
│  │   Monitoring    │    │   Manager       │    │    Redis        │                │
│  │                 │    │                 │    │  (Session       │                │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │   Storage)      │                │
│  │ │   Metrics   │ │    │ │  DB Creds   │ │    │                 │                │
│  │ │    Alarms   │ │    │ │  API Keys   │ │    │ ┌─────────────┐ │                │
│  │ │    Logs     │ │    │ │   JWT       │ │    │ │   Cache     │ │                │
│  │ └─────────────┘ │    │ │  Secrets    │ │    │ │ API Results │ │                │
│  │                 │    │ └─────────────┘ │    │ └─────────────┘ │                │
│  │ ┌─────────────┐ │    └─────────────────┘    └─────────────────┘                │
│  │ │   X-Ray     │ │                                                               │
│  │ │  Tracing    │ │    ┌─────────────────┐    ┌─────────────────┐                │
│  │ └─────────────┘ │    │      SES        │    │   GuardDuty     │                │
│  └─────────────────┘    │  Email Service  │    │ Threat Detection│                │
│                         │                 │    │                 │                │
│                         │ ┌─────────────┐ │    │ ┌─────────────┐ │                │
│                         │ │Patient      │ │    │ │   Anomaly   │ │                │
│                         │ │Invitations  │ │    │ │  Detection  │ │                │
│                         │ │Notifications│ │    │ │   Alerts    │ │                │
│                         │ └─────────────┘ │    │ └─────────────┘ │                │
│                         └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Physician Portal Data Flow
```
Physician Browser
       │
       ▼ (HTTPS/TLS 1.3)
   CloudFront CDN
       │
       ▼ (Cached Static Assets)
   Next.js PWA
       │
       ▼ (API Calls)
   API Gateway
       │
       ▼ (JWT Token Validation)
   AWS Cognito
       │
       ▼ (Authorized Requests)
   Lambda Functions
       │
       ▼ (Encrypted Queries)
   Aurora PostgreSQL
       │
       ▼ (Audit Trail)
   CloudWatch Logs
```

### Patient Portal Data Flow
```
Patient Mobile/Browser
       │
       ▼ (HTTPS/TLS 1.3 + PWA)
   CloudFront CDN
       │
       ▼ (Offline Capability)
   Next.js PWA
       │
       ▼ (API Calls + Background Sync)
   API Gateway
       │
       ▼ (MFA + Identity Verification)
   AWS Cognito
       │
       ▼ (RBAC Authorization)
   Lambda Functions
       │
       ├─▼ (PHI Data - Encrypted)
       │  Aurora PostgreSQL
       │
       └─▼ (File Uploads)
          S3 Bucket (Encrypted)
```

## Security Boundaries

### Network Security Layers
1. **Internet Gateway**: Entry point with AWS Shield Standard
2. **WAF Layer**: OWASP Top 10 protection + rate limiting
3. **CloudFront**: DDoS protection + geographic restrictions
4. **VPC**: Private network isolation (10.0.0.0/16)
5. **Security Groups**: Application-level firewall rules
6. **NACLs**: Subnet-level access control
7. **Private Subnets**: Lambda functions and databases isolated

### Data Encryption Points
- **In Transit**: TLS 1.3 (CloudFront → API Gateway → Lambda)
- **At Rest**: 
  - Aurora: AWS KMS encryption with customer-managed keys
  - S3: SSE-S3 + SSE-KMS for PHI data
  - Lambda: Environment variables encrypted with KMS
  - ElastiCache: Encryption at rest and in transit

### Access Control Matrix
```
┌─────────────────┬──────────────┬──────────────┬──────────────┐
│     Service     │   Physician  │   Patient    │    Admin     │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ Create Studies  │      ✓       │      ✗       │      ✓       │
│ Manage Patients │      ✓       │      ✗       │      ✓       │
│ View PHI Data   │      ✓       │   Own Only   │      ✓       │
│ Submit Forms    │      ✗       │      ✓       │      ✗       │
│ System Config   │      ✗       │      ✗       │      ✓       │
│ Audit Logs      │      ✗       │      ✗       │      ✓       │
└─────────────────┴──────────────┴──────────────┴──────────────┘
```

## Performance Architecture

### Lambda Cold Start Optimization
- **Runtime**: Node.js 20 with Graviton2 processors
- **Memory**: 1024MB for API functions, 512MB for background tasks
- **Provisioned Concurrency**: Enabled for critical API endpoints
- **Connection Pooling**: RDS Proxy for database connections
- **Target**: < 400ms cold start time

### Database Performance
- **Aurora Serverless v2**: Auto-scaling from 0.5 to 16 ACUs
- **Read Replicas**: 2 replicas across different AZs
- **Connection Pooling**: pgBouncer integration
- **Query Optimization**: Indexes on frequently queried columns
- **Caching**: ElastiCache for session data and API responses

### CDN and Caching Strategy
- **CloudFront**: Global edge locations with 24-hour TTL
- **Static Assets**: Versioned with long-term caching
- **API Responses**: Cached for 5 minutes for non-PHI data
- **Progressive Web App**: Service worker for offline functionality

## Cost Optimization Strategies

### Compute Costs
- **Lambda Graviton**: 34% better price-performance vs x86
- **Reserved Capacity**: For predictable workloads
- **Spot Instances**: Development and testing environments
- **Right-sizing**: Regular review of Lambda memory allocation

### Storage Costs
- **S3 Lifecycle Policies**:
  - Standard → Standard-IA (30 days)
  - Standard-IA → Glacier (90 days)
  - Glacier → Deep Archive (365 days)
- **Aurora Serverless**: Auto-pause after 5 minutes of inactivity
- **Database Backups**: Automated with 7-day retention

### Network Costs
- **NAT Instance**: t3.nano instead of NAT Gateway ($32/month savings)
- **CloudFront**: Origin shield for frequently accessed content
- **Direct Connect**: For high-volume data transfer (future consideration)

## Monitoring and Alerting

### CloudWatch Metrics
- **Lambda**: Duration, errors, throttles, cold starts
- **Aurora**: CPU, connections, buffer cache hit ratio
- **API Gateway**: 4xx/5xx errors, latency, cache hit ratio
- **Application**: Custom business metrics

### Alarms and Notifications
- **Critical**: Lambda errors > 1%, Database connections > 80%
- **Warning**: API latency > 2s, Storage usage > 80%
- **Cost**: Monthly spend > $35 (87.5% of budget)

### Security Monitoring
- **GuardDuty**: Threat detection and anomaly analysis
- **AWS Config**: Compliance monitoring and drift detection
- **VPC Flow Logs**: Network traffic analysis
- **CloudTrail**: API call auditing and forensics

## Scalability Considerations

### Auto-scaling Configuration
- **Lambda**: Concurrent executions up to 1000
- **Aurora**: ACU auto-scaling 0.5-16 based on CPU/connections
- **API Gateway**: 10,000 requests per second per region
- **ElastiCache**: Cluster mode with automatic failover

### Performance Targets
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 100ms (average)
- **PWA Load Time**: < 2 seconds on 3G networks
- **Lighthouse Mobile Score**: ≥ 90

### Capacity Planning
- **Current**: 100 MAU baseline
- **6-month**: 300 MAU projected
- **12-month**: 600 MAU maximum capacity
- **Peak Load**: 30% of users active simultaneously

## Disaster Recovery

### Backup Strategy
- **Aurora**: Automated backups with 7-day retention
- **Point-in-time Recovery**: Up to 35 days
- **Cross-region Replication**: For critical production data
- **S3 Cross-region Replication**: For PHI documents

### Recovery Targets
- **RTO (Recovery Time Objective)**: < 4 hours
- **RPO (Recovery Point Objective)**: < 15 minutes
- **Availability Target**: 99.9% uptime (8.76 hours/year)

## Compliance Architecture

### HIPAA Technical Safeguards
- **Access Control**: Unique user identification, emergency access, automatic logoff
- **Audit Controls**: Hardware, software, procedural mechanisms
- **Integrity**: PHI alteration/destruction protection
- **Person or Entity Authentication**: Verify user identity
- **Transmission Security**: End-to-end encryption protection

### Data Classification
- **PHI (Protected Health Information)**: Column-level encryption
- **PII (Personally Identifiable Information)**: Application-level encryption
- **Clinical Data**: Database-level encryption
- **System Logs**: CloudWatch encryption with KMS

This architecture supports the clinical trial platform's requirements for security, performance, cost optimization, and regulatory compliance while maintaining scalability for future growth.