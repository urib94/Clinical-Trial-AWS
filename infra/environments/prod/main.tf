# Production Environment Configuration
# Clinical Trial Platform - Production Infrastructure

terraform {
  required_version = ">= 1.8"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # backend "s3" {
  #   bucket = "clinical-trial-terraform-state-prod"
  #   key    = "prod/terraform.tfstate"
  #   region = "us-east-1"
  #   encrypt = true
  #   dynamodb_table = "clinical-trial-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "prod"
      Project     = "clinical-trial-platform"
      ManagedBy   = "terraform"
      Owner       = "platform-team"
      Compliance  = "HIPAA"
    }
  }
}

# Local variables for production environment
locals {
  project_name = "clinical-trial-prod"
  environment  = "prod"
  
  common_tags = {
    Environment = local.environment
    Project     = "clinical-trial-platform"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    CostCenter  = "production"
    Compliance  = "HIPAA"
    Backup      = "required"
  }
}

# Network Module
module "network" {
  source = "../../modules/network"

  project_name            = local.project_name
  environment            = local.environment
  aws_region             = var.aws_region
  vpc_cidr               = "10.1.0.0/16"  # Different CIDR for prod
  availability_zone_count = 3             # 3 AZs for production

  # NAT Instance Configuration (production-optimized)
  nat_instance_type           = "t3.micro"  # Slightly larger for prod
  key_name                   = var.key_name
  enable_nat_ssh             = false       # Disabled for security in prod
  enable_nat_monitoring      = true
  enable_nat_auto_recovery   = true
  alarm_sns_topic_arn        = var.alarm_sns_topic_arn

  # VPC Endpoints for cost optimization and security
  enable_s3_endpoint              = true
  enable_dynamodb_endpoint        = true
  enable_secretsmanager_endpoint  = true
  enable_ssm_endpoint            = true

  # Production-specific settings
  enable_flow_logs           = true   # Enabled for security monitoring
  flow_logs_retention_days   = 30    # Longer retention for prod
  enable_encryption          = true
  compliance_mode            = true

  tags = local.common_tags
}

# Security Module
module "security" {
  source = "../../modules/security"

  project_name = local.project_name
  environment  = local.environment

  # Network configuration from network module
  vpc_id                  = module.network.vpc_id
  vpc_cidr               = module.network.vpc_cidr_block
  public_subnet_ids      = module.network.public_subnet_ids
  private_app_subnet_ids = module.network.private_app_subnet_ids
  private_db_subnet_ids  = module.network.private_db_subnet_ids

  # Production security settings
  enable_database_management_access = false  # Disabled for security in prod
  management_cidr_blocks            = []     # No management access in prod
  enable_redis_cache               = true    # Enabled for performance
  enable_api_gateway_vpc_link      = true

  # Network ACL settings
  enable_nat_ssh_access     = false  # Disabled for prod
  enable_security_hardening = true
  enable_hipaa_compliance   = true
  allowed_countries         = ["US"]

  # Monitoring and alerting
  enable_security_monitoring = true
  security_alert_email      = var.security_alert_email

  # Production optimization settings
  enable_cost_optimization    = true
  lambda_reserved_concurrency = 200   # Higher for prod load
  lambda_timeout             = 30
  alb_idle_timeout          = 60
  auto_scaling_target_cpu   = 70
  enable_alb_deletion_protection = true

  # Database settings
  db_backup_retention_period    = 30    # Longer retention for prod
  enable_db_encryption         = true
  enable_db_performance_insights = true

  tags = local.common_tags
}

# Database Module
# Database infrastructure configuration is defined in database.tf
# This includes Aurora PostgreSQL Serverless v2 with full HIPAA compliance