# Database Module Outputs
# Essential database connection and configuration information

# Aurora Cluster Information
output "cluster_id" {
  description = "ID of the Aurora cluster"
  value       = aws_rds_cluster.aurora_cluster.id
}

output "cluster_identifier" {
  description = "Identifier of the Aurora cluster"
  value       = aws_rds_cluster.aurora_cluster.cluster_identifier
}

output "cluster_arn" {
  description = "ARN of the Aurora cluster"
  value       = aws_rds_cluster.aurora_cluster.arn
}

output "cluster_endpoint" {
  description = "Writer endpoint for the Aurora cluster"
  value       = aws_rds_cluster.aurora_cluster.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint for the Aurora cluster"
  value       = aws_rds_cluster.aurora_cluster.reader_endpoint
}

output "cluster_port" {
  description = "Port for the Aurora cluster"
  value       = aws_rds_cluster.aurora_cluster.port
}

output "cluster_database_name" {
  description = "Name of the default database"
  value       = aws_rds_cluster.aurora_cluster.database_name
}

output "cluster_master_username" {
  description = "Master username for the Aurora cluster"
  value       = aws_rds_cluster.aurora_cluster.master_username
  sensitive   = true
}

# Aurora Cluster Instances
output "cluster_instance_ids" {
  description = "List of instance IDs in the Aurora cluster"
  value       = aws_rds_cluster_instance.aurora_instances[*].identifier
}

output "cluster_instance_endpoints" {
  description = "List of instance endpoints in the Aurora cluster"
  value       = aws_rds_cluster_instance.aurora_instances[*].endpoint
}

output "cluster_instance_arns" {
  description = "List of instance ARNs in the Aurora cluster"
  value       = aws_rds_cluster_instance.aurora_instances[*].arn
}

# Security and Encryption
output "kms_key_id" {
  description = "KMS key ID used for database encryption"
  value       = var.kms_key_id != null ? var.kms_key_id : (length(aws_kms_key.database_key) > 0 ? aws_kms_key.database_key[0].id : null)
}

output "kms_key_arn" {
  description = "KMS key ARN used for database encryption"
  value       = var.kms_key_id != null ? var.kms_key_id : (length(aws_kms_key.database_key) > 0 ? aws_kms_key.database_key[0].arn : null)
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_master_password.arn
}

output "secrets_manager_secret_name" {
  description = "Name of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_master_password.name
}

# IAM Roles and Policies
output "lambda_db_access_role_arn" {
  description = "ARN of the IAM role for Lambda database access"
  value       = aws_iam_role.lambda_db_access.arn
}

output "lambda_db_access_role_name" {
  description = "Name of the IAM role for Lambda database access"
  value       = aws_iam_role.lambda_db_access.name
}

output "enhanced_monitoring_role_arn" {
  description = "ARN of the enhanced monitoring IAM role"
  value       = var.enable_enhanced_monitoring && var.monitoring_role_arn == null ? aws_iam_role.rds_enhanced_monitoring[0].arn : var.monitoring_role_arn
}

# Database Proxy (Production only)
output "db_proxy_endpoint" {
  description = "Endpoint of the RDS Proxy (if enabled)"
  value       = var.environment == "prod" ? aws_db_proxy.aurora_proxy[0].endpoint : null
}

output "db_proxy_arn" {
  description = "ARN of the RDS Proxy (if enabled)"
  value       = var.environment == "prod" ? aws_db_proxy.aurora_proxy[0].arn : null
}

# Parameter Groups
output "cluster_parameter_group_name" {
  description = "Name of the cluster parameter group"
  value       = var.cluster_parameter_group_name != null ? var.cluster_parameter_group_name : aws_rds_cluster_parameter_group.aurora_cluster_pg[0].name
}

output "db_parameter_group_name" {
  description = "Name of the DB parameter group"
  value       = var.db_instance_parameter_group_name != null ? var.db_instance_parameter_group_name : aws_db_parameter_group.aurora_db_pg[0].name
}

# Monitoring and Alerting
output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.database_dashboard.dashboard_name}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for database alerts"
  value       = var.alarm_sns_topic_arn != null ? var.alarm_sns_topic_arn : aws_sns_topic.database_alerts[0].arn
}

output "cloudwatch_log_groups" {
  description = "Map of CloudWatch log groups created for Aurora logs"
  value = {
    for log_type in var.log_types : log_type => "/aws/rds/cluster/${aws_rds_cluster.aurora_cluster.cluster_identifier}/${log_type}"
  }
}

# Backup and Recovery
output "backup_retention_period" {
  description = "Backup retention period in days"
  value       = aws_rds_cluster.aurora_cluster.backup_retention_period
}

output "backup_window" {
  description = "Daily backup window"
  value       = aws_rds_cluster.aurora_cluster.preferred_backup_window
}

output "maintenance_window" {
  description = "Weekly maintenance window"
  value       = aws_rds_cluster.aurora_cluster.preferred_maintenance_window
}

# Serverless v2 Configuration
output "serverless_v2_scaling_configuration" {
  description = "Serverless v2 scaling configuration"
  value = {
    min_capacity = var.min_capacity
    max_capacity = var.max_capacity
    auto_pause   = var.auto_pause
  }
}

# Performance Insights
output "performance_insights_enabled" {
  description = "Whether Performance Insights is enabled"
  value       = var.enable_performance_insights
}

output "performance_insights_kms_key_id" {
  description = "KMS key ID for Performance Insights encryption"
  value       = var.enable_performance_insights ? (var.kms_key_id != null ? var.kms_key_id : aws_kms_key.database_key[0].arn) : null
}

# Compliance and Audit
output "audit_trail_arn" {
  description = "ARN of the CloudTrail for database audit (if enabled)"
  value       = var.enable_hipaa_compliance ? aws_cloudtrail.database_audit[0].arn : null
}

output "audit_logs_bucket" {
  description = "S3 bucket for audit logs (if enabled)"
  value       = var.enable_hipaa_compliance ? aws_s3_bucket.audit_logs[0].bucket : null
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder for compliance monitoring"
  value       = var.enable_hipaa_compliance && var.environment == "prod" ? aws_config_configuration_recorder.database_backup_encryption[0].name : null
}

# Cost Optimization
output "cost_budget_name" {
  description = "Name of the cost budget for database monitoring"
  value       = var.enable_cost_optimization ? aws_budgets_budget.database_cost[0].name : null
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost based on configuration"
  value = {
    environment = var.environment
    min_capacity = var.min_capacity
    max_capacity = var.max_capacity
    backup_retention_days = var.backup_retention_period
    multi_az = var.enable_multi_az
    performance_insights = var.enable_performance_insights
    enhanced_monitoring = var.enable_enhanced_monitoring
    estimated_cost_usd = var.environment == "prod" ? "12-15" : "5-8"
  }
}

# Connection Information Summary
output "connection_info" {
  description = "Database connection information summary"
  value = {
    endpoint                = aws_rds_cluster.aurora_cluster.endpoint
    reader_endpoint        = aws_rds_cluster.aurora_cluster.reader_endpoint
    port                   = aws_rds_cluster.aurora_cluster.port
    database_name          = aws_rds_cluster.aurora_cluster.database_name
    username               = aws_rds_cluster.aurora_cluster.master_username
    secrets_manager_secret = aws_secretsmanager_secret.db_master_password.name
    proxy_endpoint         = var.environment == "prod" ? aws_db_proxy.aurora_proxy[0].endpoint : null
    ssl_required          = true
    iam_auth_enabled      = var.enable_iam_database_authentication
  }
  sensitive = true
}

# Security Configuration Summary
output "security_config" {
  description = "Database security configuration summary"
  value = {
    storage_encrypted             = var.storage_encrypted
    kms_key_managed              = var.kms_key_id == null
    deletion_protection          = var.deletion_protection
    iam_database_authentication  = var.enable_iam_database_authentication
    audit_logging_enabled        = var.enable_audit_logging
    hipaa_compliance_enabled     = var.enable_hipaa_compliance
    backup_encrypted             = true
    vpc_security_groups          = [var.database_security_group_id]
    publicly_accessible          = var.publicly_accessible
  }
}

# Monitoring Configuration Summary
output "monitoring_config" {
  description = "Database monitoring configuration summary"
  value = {
    performance_insights_enabled = var.enable_performance_insights
    enhanced_monitoring_enabled  = var.enable_enhanced_monitoring
    cloudwatch_logs_enabled      = length(var.log_types) > 0
    alarms_enabled               = var.enable_performance_alarms || var.enable_connection_alarms
    dashboard_created            = true
    cost_monitoring_enabled      = var.enable_cost_optimization
    audit_trail_enabled          = var.enable_hipaa_compliance
  }
}

# Operational Information
output "operational_info" {
  description = "Operational information for database management"
  value = {
    cluster_identifier           = aws_rds_cluster.aurora_cluster.cluster_identifier
    engine_version              = aws_rds_cluster.aurora_cluster.engine_version
    parameter_group_family      = var.parameter_group_family
    availability_zones          = aws_rds_cluster.aurora_cluster.availability_zones
    backup_retention_period     = aws_rds_cluster.aurora_cluster.backup_retention_period
    maintenance_window          = aws_rds_cluster.aurora_cluster.preferred_maintenance_window
    multi_az_enabled            = var.enable_multi_az
    serverless_v2_enabled       = true
    auto_pause_enabled          = var.auto_pause
  }
}