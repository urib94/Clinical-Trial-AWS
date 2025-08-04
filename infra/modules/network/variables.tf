# Network Module Variables
# Configurable parameters for VPC and networking infrastructure

variable "project_name" {
  description = "Name of the project for resource naming"
  type        = string
  validation {
    condition     = length(var.project_name) > 0 && length(var.project_name) <= 50
    error_message = "Project name must be between 1 and 50 characters."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zone_count" {
  description = "Number of availability zones to use (minimum 2 for high availability)"
  type        = number
  default     = 2
  validation {
    condition     = var.availability_zone_count >= 2 && var.availability_zone_count <= 4
    error_message = "Availability zone count must be between 2 and 4."
  }
}

# NAT Instance Configuration
variable "nat_instance_type" {
  description = "EC2 instance type for NAT instance"
  type        = string
  default     = "t3.nano"
  validation {
    condition     = contains(["t3.nano", "t3.micro", "t3.small", "t4g.nano", "t4g.micro"], var.nat_instance_type)
    error_message = "NAT instance type must be a cost-effective instance type."
  }
}

variable "key_name" {
  description = "EC2 Key Pair name for NAT instance access (optional)"
  type        = string
  default     = ""
}

variable "enable_nat_ssh" {
  description = "Enable SSH access to NAT instance (disable in production)"
  type        = bool
  default     = false
}

variable "enable_nat_monitoring" {
  description = "Enable CloudWatch monitoring for NAT instance"
  type        = bool
  default     = true
}

variable "enable_nat_auto_recovery" {
  description = "Enable auto-recovery for NAT instance"
  type        = bool
  default     = true
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms (optional)"
  type        = string
  default     = ""
}

# VPC Endpoints Configuration
variable "enable_s3_endpoint" {
  description = "Enable S3 VPC endpoint for cost optimization"
  type        = bool
  default     = true
}

variable "enable_dynamodb_endpoint" {
  description = "Enable DynamoDB VPC endpoint for cost optimization"
  type        = bool
  default     = true
}

variable "enable_secretsmanager_endpoint" {
  description = "Enable Secrets Manager VPC endpoint for HIPAA compliance"
  type        = bool
  default     = true
}

variable "enable_ssm_endpoint" {
  description = "Enable SSM VPC endpoint for parameter access"
  type        = bool
  default     = true
}

# Cost Optimization
variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs (additional cost but useful for security)"
  type        = bool
  default     = false
}

variable "flow_logs_retention_days" {
  description = "Retention period for VPC Flow Logs in days"
  type        = number
  default     = 7
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.flow_logs_retention_days)
    error_message = "Flow logs retention days must be a valid CloudWatch Logs retention period."
  }
}

# Tagging
variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    ManagedBy = "terraform"
    Purpose   = "clinical-trial-platform"
  }
}

# Healthcare Compliance
variable "enable_encryption" {
  description = "Enable encryption for EBS volumes and other resources"
  type        = bool
  default     = true
}

variable "compliance_mode" {
  description = "Enable HIPAA compliance features"
  type        = bool
  default     = true
}