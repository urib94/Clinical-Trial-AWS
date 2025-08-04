# Clinical Trial Platform - Infrastructure

This directory contains Terraform infrastructure code for the Clinical Trial Data Collection Platform. The infrastructure is designed with HIPAA compliance, cost optimization, and healthcare security requirements in mind.

## Architecture Overview

### Network Architecture
- **Multi-AZ VPC** with public and private subnets
- **Cost-Optimized NAT Instance** instead of NAT Gateway (saves ~$45/month)
- **VPC Endpoints** for AWS services to reduce data transfer costs
- **Defense-in-depth** security with Security Groups and Network ACLs

### Security Features
- **HIPAA-Compliant** security controls
- **Least-privilege** access patterns
- **Column-level encryption** support
- **WAF protection** (configured separately)
- **Network isolation** between tiers

### Cost Optimization
- Target: **≤ $40/month** at 100 MAU
- NAT instance with auto-recovery
- Graviton-compatible instance types
- VPC endpoints to avoid data transfer charges
- Aurora Serverless v2 auto-scaling support

## Directory Structure

```
infra/
├── modules/
│   ├── network/          # VPC, subnets, NAT instance, VPC endpoints
│   └── security/         # Security groups and Network ACLs
├── environments/
│   ├── dev/             # Development environment
│   └── prod/            # Production environment
└── README.md            # This file
```

## Module Usage

### Network Module

Creates the foundational network infrastructure:

```hcl
module "network" {
  source = "../../modules/network"

  project_name            = "clinical-trial-dev"
  environment            = "dev"
  aws_region             = "us-east-1"
  vpc_cidr               = "10.0.0.0/16"
  availability_zone_count = 2

  # Cost-optimized NAT instance
  nat_instance_type = "t3.nano"
  enable_nat_ssh    = true

  tags = local.common_tags
}
```

**Key Features:**
- Multi-AZ VPC with public/private subnets
- Single NAT instance for cost optimization
- VPC endpoints for S3, DynamoDB, Secrets Manager, SSM
- Database subnet group for Aurora
- CloudWatch monitoring and auto-recovery

### Security Module

Creates security groups and network ACLs:

```hcl
module "security" {
  source = "../../modules/security"

  project_name = "clinical-trial-dev"
  environment  = "dev"

  vpc_id                  = module.network.vpc_id
  vpc_cidr               = module.network.vpc_cidr_block
  public_subnet_ids      = module.network.public_subnet_ids
  private_app_subnet_ids = module.network.private_app_subnet_ids
  private_db_subnet_ids  = module.network.private_db_subnet_ids

  enable_hipaa_compliance = true
  
  tags = local.common_tags
}
```

**Key Features:**
- Application Load Balancer security group
- Lambda functions security group
- Aurora database security group
- Network ACLs for subnet-level protection
- HIPAA compliance features

## Deployment

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** 1.8+ installed
3. **EC2 Key Pair** (optional, for NAT instance access)

### Environment Setup

1. **Copy terraform.tfvars.example**:
   ```bash
   cd infra/environments/dev
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Update variables** in terraform.tfvars:
   ```hcl
   aws_region           = "us-east-1"
   security_alert_email = "your-email@domain.com"
   ```

3. **Initialize Terraform**:
   ```bash
   terraform init
   ```

4. **Plan deployment**:
   ```bash
   terraform plan
   ```

5. **Apply infrastructure**:
   ```bash
   terraform apply
   ```

### Development Environment

```bash
cd infra/environments/dev
terraform init
terraform plan
terraform apply
```

**Development Features:**
- SSH access to NAT instance enabled
- Database management access enabled
- Shorter backup retention (3 days)
- Flow logs disabled for cost savings

### Production Environment

```bash
cd infra/environments/prod
terraform init
terraform plan
terraform apply
```

**Production Features:**
- SSH access disabled for security
- 3 availability zones for high availability
- Longer backup retention (30 days)
- Flow logs enabled for security monitoring
- Deletion protection enabled

## Security Considerations

### HIPAA Compliance
- All EBS volumes encrypted
- Database encryption at rest
- Network isolation between tiers
- VPC endpoints for secure AWS service access
- Security monitoring and alerting

### Network Security
- **Security Groups**: Instance-level firewall rules
- **Network ACLs**: Subnet-level firewall rules
- **VPC Flow Logs**: Network traffic monitoring (prod only)
- **No internet access** for database subnets

### Access Control
- **Least-privilege** security group rules
- **No management access** in production
- **Restricted CIDR blocks** for any management access
- **CloudWatch monitoring** for NAT instance health

## Cost Optimization Features

### Network Costs
- **NAT Instance** instead of NAT Gateway: ~$45/month savings
- **VPC Endpoints** for S3/DynamoDB: Eliminates data transfer charges
- **Single NAT instance** across all AZs: Additional cost savings

### Compute Costs
- **t3.nano** NAT instance: $3.80/month
- **Graviton-compatible** instance types where supported
- **Auto-recovery** instead of Auto Scaling Groups

### Monitoring Costs
- **CloudWatch agent** with optimized metrics
- **Log retention** optimized by environment
- **Performance Insights** disabled in dev

## Monitoring and Alerting

### CloudWatch Integration
- NAT instance health monitoring
- Auto-recovery on system failures
- Custom metrics for network performance
- Security group and NACL rule monitoring

### Alerting
- Email notifications for security events
- NAT instance failure alerts
- Cost anomaly detection (configure separately)

## Troubleshooting

### NAT Instance Issues
1. **Check instance status**:
   ```bash
   aws ec2 describe-instances --instance-ids <nat-instance-id>
   ```

2. **View CloudWatch logs**:
   ```bash
   aws logs describe-log-streams --log-group-name clinical-trial-nat-instance
   ```

3. **SSH access** (dev environment only):
   ```bash
   ssh -i your-key.pem ec2-user@<nat-instance-public-ip>
   ```

### Connectivity Issues
1. **Check security group rules**
2. **Verify NACL rules**
3. **Confirm route table entries**
4. **Test VPC endpoint connectivity**

### Cost Monitoring
1. **Review AWS Cost Explorer**
2. **Check NAT instance utilization**
3. **Monitor VPC endpoint usage**
4. **Validate data transfer patterns**

## Next Steps

After deploying the network infrastructure:

1. **Deploy compute modules** (Lambda, ALB)
2. **Deploy database modules** (Aurora PostgreSQL)
3. **Configure monitoring** (CloudWatch dashboards)
4. **Set up CI/CD pipelines**
5. **Implement backup strategies**

## Support

For infrastructure issues:
- Check CloudWatch logs and metrics
- Review Terraform state for configuration drift
- Contact platform team for production issues

## Compliance Notes

This infrastructure is designed to support HIPAA compliance but requires additional configuration:
- **Encryption keys** management (KMS)
- **Access logging** (CloudTrail)
- **Data backup** procedures
- **Incident response** plans
- **Regular security assessments**