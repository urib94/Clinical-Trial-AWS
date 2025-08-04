# Development Environment Outputs

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

output "nat_instance_public_ip" {
  description = "Public IP of NAT instance"
  value       = module.network.nat_instance_public_ip
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

# Environment Summary
output "environment_summary" {
  description = "Development environment summary"
  value = {
    environment           = "dev"
    vpc_cidr             = module.network.vpc_cidr_block
    availability_zones   = module.network.availability_zones
    cost_optimizations = {
      nat_instance_type = "t3.nano"
      flow_logs_disabled = true
      performance_insights_disabled = true
      backup_retention_days = 3
    }
    security_features = module.security.security_summary
  }
}