# Database Module Variables
# Configuration for Aurora PostgreSQL Serverless v2 with HIPAA compliance

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "db_subnet_group_name" {
  description = "Name of the database subnet group"
  type        = string
}

variable "database_security_group_id" {
  description = "ID of the database security group"
  type        = string
}

# Aurora Serverless v2 Configuration
variable "cluster_identifier" {
  description = "Identifier for the Aurora cluster"
  type        = string
  default     = null
}

variable "database_name" {
  description = "Name of the initial database"
  type        = string
  default     = "clinical_trial"
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
  default     = "postgres"
}

variable "master_password" {
  description = "Master password for the database (use random if not provided)"
  type        = string
  default     = null
  sensitive   = true
}

variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

# Serverless v2 Scaling Configuration
variable "min_capacity" {
  description = "Minimum Aurora Serverless v2 capacity (ACU)"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Maximum Aurora Serverless v2 capacity (ACU)"
  type        = number
  default     = 16
}

variable "auto_pause" {
  description = "Enable auto-pause for Aurora Serverless v2 (dev only)"
  type        = bool
  default     = false
}

variable "auto_pause_delay" {
  description = "Auto-pause delay in minutes"
  type        = number
  default     = 300
}

# Backup and Recovery
variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 35
}

variable "backup_window" {
  description = "Daily backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Weekly maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "final_snapshot_identifier" {
  description = "Final snapshot identifier when deleting cluster"
  type        = string
  default     = null
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when deleting cluster"
  type        = bool
  default     = false
}

variable "copy_tags_to_snapshot" {
  description = "Copy tags to snapshots"
  type        = bool
  default     = true
}

# Security and Encryption
variable "storage_encrypted" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (customer managed)"
  type        = string
  default     = null
}

variable "enable_iam_database_authentication" {
  description = "Enable IAM database authentication"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

# Monitoring and Performance
variable "enable_performance_insights" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

variable "performance_insights_retention_period" {
  description = "Performance Insights retention period in days"
  type        = number
  default     = 7
}

variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring"
  type        = bool
  default     = true
}

variable "monitoring_interval" {
  description = "Enhanced monitoring interval in seconds"
  type        = number
  default     = 60
}

variable "monitoring_role_arn" {
  description = "ARN of the monitoring role"
  type        = string
  default     = null
}

# Aurora Global Database
variable "enable_global_cluster" {
  description = "Enable Aurora Global Database"
  type        = bool
  default     = false
}

variable "global_cluster_identifier" {
  description = "Global cluster identifier"
  type        = string
  default     = null
}

# Network and Availability
variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = []
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

# Database Parameter Group
variable "parameter_group_family" {
  description = "DB parameter group family"
  type        = string
  default     = "aurora-postgresql15"
}

variable "cluster_parameter_group_name" {
  description = "Custom cluster parameter group name"
  type        = string
  default     = null
}

variable "db_instance_parameter_group_name" {
  description = "Custom DB instance parameter group name"
  type        = string
  default     = null
}

# Instance Configuration
variable "instance_class" {
  description = "Database instance class for Aurora Serverless v2"
  type        = string
  default     = "db.serverless"
}

variable "publicly_accessible" {
  description = "Make database publicly accessible"
  type        = bool
  default     = false
}

# Cost Optimization
variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "snapshot_retention_days" {
  description = "Automated snapshot retention period"
  type        = number
  default     = 35
}

# HIPAA Compliance
variable "enable_hipaa_compliance" {
  description = "Enable HIPAA compliance features"
  type        = bool
  default     = true
}

variable "enable_audit_logging" {
  description = "Enable audit logging for HIPAA compliance"
  type        = bool
  default     = true
}

variable "log_types" {
  description = "List of log types to enable"
  type        = list(string)
  default     = ["postgresql"]
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 90
}

# Alerting and Notifications
variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for database alarms"
  type        = string
  default     = null
}

variable "enable_connection_alarms" {
  description = "Enable database connection alarms"
  type        = bool
  default     = true
}

variable "enable_performance_alarms" {
  description = "Enable database performance alarms"
  type        = bool
  default     = true
}

variable "cpu_utilization_threshold" {
  description = "CPU utilization alarm threshold percentage"
  type        = number
  default     = 80
}

variable "database_connections_threshold" {
  description = "Database connections alarm threshold"
  type        = number
  default     = 80
}

# Tags
variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}