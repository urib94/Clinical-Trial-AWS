# Security Module Outputs
# Security group and network ACL identifiers for other modules

# Security Group IDs
output "alb_security_group_id" {
  description = "ID of the Application Load Balancer security group"
  value       = aws_security_group.alb.id
}

output "lambda_security_group_id" {
  description = "ID of the Lambda functions security group"
  value       = aws_security_group.lambda.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "database_management_security_group_id" {
  description = "ID of the database management security group (if enabled)"
  value       = var.enable_database_management_access ? aws_security_group.database_management[0].id : null
}

output "cloudfront_origin_security_group_id" {
  description = "ID of the CloudFront origin security group"
  value       = aws_security_group.cloudfront_origin.id
}

output "redis_security_group_id" {
  description = "ID of the Redis cache security group (if enabled)"
  value       = var.enable_redis_cache ? aws_security_group.redis[0].id : null
}

output "api_gateway_vpc_link_security_group_id" {
  description = "ID of the API Gateway VPC Link security group (if enabled)"
  value       = var.enable_api_gateway_vpc_link ? aws_security_group.api_gateway_vpc_link[0].id : null
}

# Security Group ARNs
output "alb_security_group_arn" {
  description = "ARN of the Application Load Balancer security group"
  value       = aws_security_group.alb.arn
}

output "lambda_security_group_arn" {
  description = "ARN of the Lambda functions security group"
  value       = aws_security_group.lambda.arn
}

output "database_security_group_arn" {
  description = "ARN of the database security group"
  value       = aws_security_group.database.arn
}

# Network ACL IDs
output "public_network_acl_id" {
  description = "ID of the public subnet network ACL"
  value       = aws_network_acl.public.id
}

output "private_app_network_acl_id" {
  description = "ID of the private application subnet network ACL"
  value       = aws_network_acl.private_app.id
}

output "private_db_network_acl_id" {
  description = "ID of the private database subnet network ACL"
  value       = aws_network_acl.private_db.id
}

# Security Configuration Summary
output "security_summary" {
  description = "Summary of security configuration"
  value = {
    security_groups = {
      alb                    = aws_security_group.alb.id
      lambda                 = aws_security_group.lambda.id
      database              = aws_security_group.database.id
      cloudfront_origin     = aws_security_group.cloudfront_origin.id
      database_management   = var.enable_database_management_access ? aws_security_group.database_management[0].id : null
      redis                 = var.enable_redis_cache ? aws_security_group.redis[0].id : null
      api_gateway_vpc_link  = var.enable_api_gateway_vpc_link ? aws_security_group.api_gateway_vpc_link[0].id : null
    }
    network_acls = {
      public      = aws_network_acl.public.id
      private_app = aws_network_acl.private_app.id
      private_db  = aws_network_acl.private_db.id
    }
    security_features = {
      hipaa_compliance         = var.enable_hipaa_compliance
      security_hardening      = var.enable_security_hardening
      database_management     = var.enable_database_management_access
      security_monitoring     = var.enable_security_monitoring
      encryption_enabled      = var.enable_db_encryption
    }
  }
}

# Security Compliance Information
output "compliance_info" {
  description = "Security compliance information"
  value = {
    hipaa_enabled              = var.enable_hipaa_compliance
    encryption_at_rest        = var.enable_db_encryption
    backup_retention_days     = var.db_backup_retention_period
    allowed_countries         = var.allowed_countries
    security_headers_enabled  = length(var.security_headers) > 0
    management_access_enabled = var.enable_database_management_access
  }
}

# Cost Optimization Information
output "cost_optimization_info" {
  description = "Cost optimization configuration"
  value = {
    cost_optimization_enabled = var.enable_cost_optimization
    auto_scaling_target_cpu   = var.auto_scaling_target_cpu
    lambda_reserved_concurrency = var.lambda_reserved_concurrency
    lambda_timeout            = var.lambda_timeout
    alb_idle_timeout         = var.alb_idle_timeout
  }
}

# Security Group Rules Count (for monitoring)
output "security_group_rules_count" {
  description = "Count of security group rules for monitoring"
  value = {
    alb_ingress_rules      = length(aws_security_group.alb.ingress)
    alb_egress_rules       = length(aws_security_group.alb.egress)
    lambda_ingress_rules   = length(aws_security_group.lambda.ingress)
    lambda_egress_rules    = length(aws_security_group.lambda.egress)
    database_ingress_rules = length(aws_security_group.database.ingress)
    database_egress_rules  = length(aws_security_group.database.egress)
  }
}

# Network ACL Rules Count
output "network_acl_rules_count" {
  description = "Count of network ACL rules for monitoring"
  value = {
    public_ingress_rules      = length(aws_network_acl.public.ingress)
    public_egress_rules       = length(aws_network_acl.public.egress)
    private_app_ingress_rules = length(aws_network_acl.private_app.ingress)
    private_app_egress_rules  = length(aws_network_acl.private_app.egress)
    private_db_ingress_rules  = length(aws_network_acl.private_db.ingress)
    private_db_egress_rules   = length(aws_network_acl.private_db.egress)
  }
}