# Security Module Variables
# Configuration parameters for security groups and network ACLs

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

# Network Configuration
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
  validation {
    condition     = can(regex("^vpc-[0-9a-f]{8,17}$", var.vpc_id))
    error_message = "VPC ID must be a valid AWS VPC identifier."
  }
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC"
  type        = string
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
  validation {
    condition     = length(var.public_subnet_ids) >= 2
    error_message = "At least 2 public subnets are required for high availability."
  }
}

variable "private_app_subnet_ids" {
  description = "List of private application subnet IDs"
  type        = list(string)
  validation {
    condition     = length(var.private_app_subnet_ids) >= 2
    error_message = "At least 2 private application subnets are required for high availability."
  }
}

variable "private_db_subnet_ids" {
  description = "List of private database subnet IDs"
  type        = list(string)
  validation {
    condition     = length(var.private_db_subnet_ids) >= 2
    error_message = "At least 2 private database subnets are required for high availability."
  }
}

# Security Configuration
variable "enable_database_management_access" {
  description = "Enable database management security group (disable in production)"
  type        = bool
  default     = false
}

variable "management_cidr_blocks" {
  description = "CIDR blocks allowed for database management access"
  type        = list(string)
  default     = []
  validation {
    condition = alltrue([
      for cidr in var.management_cidr_blocks : can(cidrhost(cidr, 0))
    ])
    error_message = "All management CIDR blocks must be valid IPv4 CIDR blocks."
  }
}

variable "enable_redis_cache" {
  description = "Enable Redis cache security group"
  type        = bool
  default     = false
}

variable "enable_api_gateway_vpc_link" {
  description = "Enable API Gateway VPC Link security group"
  type        = bool
  default     = true
}

# Network ACL Configuration
variable "enable_nat_ssh_access" {
  description = "Enable SSH access to NAT instance in public subnet NACL"
  type        = bool
  default     = false
}

variable "enable_security_hardening" {
  description = "Enable additional security hardening rules"
  type        = bool
  default     = true
}

# HIPAA Compliance
variable "enable_hipaa_compliance" {
  description = "Enable HIPAA compliance features"
  type        = bool
  default     = true
}

variable "allowed_countries" {
  description = "List of country codes allowed for HIPAA compliance (e.g., ['US', 'CA'])"
  type        = list(string)
  default     = ["US"]
  validation {
    condition = alltrue([
      for country in var.allowed_countries : length(country) == 2
    ])
    error_message = "Country codes must be 2-character ISO country codes."
  }
}

# Security Monitoring
variable "enable_security_monitoring" {
  description = "Enable security monitoring and alerting"
  type        = bool
  default     = true
}

variable "security_alert_email" {
  description = "Email address for security alerts"
  type        = string
  default     = ""
  validation {
    condition = var.security_alert_email == "" || can(regex("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", var.security_alert_email))
    error_message = "Security alert email must be a valid email address."
  }
}

# Load Balancer Configuration
variable "enable_alb_deletion_protection" {
  description = "Enable deletion protection for Application Load Balancer"
  type        = bool
  default     = true
}

variable "alb_idle_timeout" {
  description = "Idle timeout for Application Load Balancer in seconds"
  type        = number
  default     = 60
  validation {
    condition     = var.alb_idle_timeout >= 1 && var.alb_idle_timeout <= 4000
    error_message = "ALB idle timeout must be between 1 and 4000 seconds."
  }
}

# Lambda Security Configuration
variable "lambda_reserved_concurrency" {
  description = "Reserved concurrency for Lambda functions (cost control)"
  type        = number
  default     = 100
  validation {
    condition     = var.lambda_reserved_concurrency >= 0 && var.lambda_reserved_concurrency <= 1000
    error_message = "Lambda reserved concurrency must be between 0 and 1000."
  }
}

variable "lambda_timeout" {
  description = "Maximum execution time for Lambda functions in seconds"
  type        = number
  default     = 30
  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds."
  }
}

# Database Security
variable "db_backup_retention_period" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
  validation {
    condition     = var.db_backup_retention_period >= 1 && var.db_backup_retention_period <= 35
    error_message = "Database backup retention period must be between 1 and 35 days."
  }
}

variable "enable_db_encryption" {
  description = "Enable database encryption at rest"
  type        = bool
  default     = true
}

variable "enable_db_performance_insights" {
  description = "Enable database performance insights"
  type        = bool
  default     = true
}

# Cost Optimization
variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "auto_scaling_target_cpu" {
  description = "Target CPU utilization for auto scaling (percentage)"
  type        = number
  default     = 70
  validation {
    condition     = var.auto_scaling_target_cpu >= 10 && var.auto_scaling_target_cpu <= 90
    error_message = "Auto scaling target CPU must be between 10 and 90 percent."
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

# Additional Security Headers
variable "security_headers" {
  description = "Additional security headers for ALB responses"
  type        = map(string)
  default = {
    "X-Content-Type-Options"    = "nosniff"
    "X-Frame-Options"          = "DENY"
    "X-XSS-Protection"         = "1; mode=block"
    "Strict-Transport-Security" = "max-age=31536000; includeSubDomains"
    "Content-Security-Policy"   = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  }
}