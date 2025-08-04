# Development Environment Configuration
# Clinical Trial Platform - Development Infrastructure

terraform {
  required_version = ">= 1.8"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # backend "s3" {
  #   bucket = "clinical-trial-terraform-state-dev"
  #   key    = "dev/terraform.tfstate"
  #   region = "us-east-1"
  #   encrypt = true
  #   dynamodb_table = "clinical-trial-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "dev"
      Project     = "clinical-trial-platform"
      ManagedBy   = "terraform"
      Owner       = "platform-team"
    }
  }
}

# Local variables for development environment
locals {
  project_name = "clinical-trial-dev"
  environment  = "dev"
  
  common_tags = {
    Environment = local.environment
    Project     = "clinical-trial-platform"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
    CostCenter  = "development"
  }
}

# Network Module
module "network" {
  source = "../../modules/network"

  project_name            = local.project_name
  environment            = local.environment
  aws_region             = var.aws_region
  vpc_cidr               = "10.0.0.0/16"
  availability_zone_count = 2

  # NAT Instance Configuration (cost-optimized)
  nat_instance_type           = "t3.nano"
  key_name                   = var.key_name
  enable_nat_ssh             = true  # Enabled for dev environment
  enable_nat_monitoring      = true
  enable_nat_auto_recovery   = true
  alarm_sns_topic_arn        = ""

  # VPC Endpoints for cost optimization
  enable_s3_endpoint              = true
  enable_dynamodb_endpoint        = true
  enable_secretsmanager_endpoint  = true
  enable_ssm_endpoint            = true

  # Development-specific settings
  enable_flow_logs           = false  # Disabled for cost savings in dev
  flow_logs_retention_days   = 7
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

  # Development-specific security settings
  enable_database_management_access = true   # Enabled for dev environment
  management_cidr_blocks            = ["10.0.0.0/16"]  # Allow from VPC
  enable_redis_cache               = false   # Disabled for cost in dev
  enable_api_gateway_vpc_link      = true

  # Network ACL settings
  enable_nat_ssh_access     = true   # Enabled for dev
  enable_security_hardening = true
  enable_hipaa_compliance   = true

  # Monitoring and alerting
  enable_security_monitoring = true
  security_alert_email      = var.security_alert_email

  # Cost optimization settings
  enable_cost_optimization    = true
  lambda_reserved_concurrency = 50    # Lower for dev
  lambda_timeout             = 30
  alb_idle_timeout          = 60
  auto_scaling_target_cpu   = 70

  # Database settings
  db_backup_retention_period    = 3     # Shorter retention for dev
  enable_db_encryption         = true
  enable_db_performance_insights = false # Disabled for cost in dev

  tags = local.common_tags
}

# Database Module
# Database infrastructure configuration is defined in database.tf
# This includes Aurora PostgreSQL Serverless v2 with HIPAA compliance