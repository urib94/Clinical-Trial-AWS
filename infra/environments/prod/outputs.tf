# Production Environment Outputs

# Network Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.network.public_subnet_ids
}

output "private_app_subnet_ids" {
  description = "List of private application subnet IDs"
  value       = module.network.private_app_subnet_ids
}

output "private_db_subnet_ids" {
  description = "List of private database subnet IDs"
  value       = module.network.private_db_subnet_ids
}

output "db_subnet_group_name" {
  description = "Name of the database subnet group"
  value       = module.network.db_subnet_group_name
}

output "nat_instance_public_ip" {
  description = "Public IP of NAT instance"
  value       = module.network.nat_instance_public_ip
  sensitive   = false
}

# Security Outputs
output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = module.security.alb_security_group_id
}

output "lambda_security_group_id" {
  description = "Lambda security group ID"
  value       = module.security.lambda_security_group_id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = module.security.database_security_group_id
}

output "redis_security_group_id" {
  description = "Redis security group ID"
  value       = module.security.redis_security_group_id
}

# VPC Endpoints
output "vpc_endpoints" {
  description = "VPC endpoint information"
  value = {
    s3              = module.network.s3_vpc_endpoint_id
    dynamodb        = module.network.dynamodb_vpc_endpoint_id
    secretsmanager  = module.network.secretsmanager_vpc_endpoint_id
    ssm             = module.network.ssm_vpc_endpoint_id
  }
}

# Environment Summary
output "environment_summary" {
  description = "Production environment summary"
  value = {
    environment           = "prod"
    vpc_cidr             = module.network.vpc_cidr_block
    availability_zones   = module.network.availability_zones
    production_features = {
      nat_instance_type = "t3.micro"
      flow_logs_enabled = true
      performance_insights_enabled = true
      backup_retention_days = 30
      deletion_protection = true
      ssh_access_disabled = true
    }
    security_features = module.security.security_summary
    compliance_info   = module.security.compliance_info
  }
}