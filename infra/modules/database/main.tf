# Database Module - Aurora PostgreSQL Serverless v2
# HIPAA-compliant database infrastructure with encryption and monitoring

terraform {
  required_version = ">= 1.8"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

# Local variables
locals {
  cluster_identifier = var.cluster_identifier != null ? var.cluster_identifier : "${var.project_name}-aurora-cluster"
  
  # Final snapshot identifier
  final_snapshot_id = var.final_snapshot_identifier != null ? var.final_snapshot_identifier : "${local.cluster_identifier}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  # Enhanced monitoring role name
  monitoring_role_name = "${var.project_name}-rds-enhanced-monitoring-${var.environment}"
  
  # Common tags
  common_tags = merge(var.tags, {
    Module      = "database"
    Component   = "aurora-postgresql"
    Environment = var.environment
    Terraform   = "true"
  })
}

# Random password for master user if not provided
resource "random_password" "master_password" {
  count   = var.master_password == null ? 1 : 0
  length  = 32
  special = true
}

# Store master password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_master_password" {
  name        = "${var.project_name}-db-master-password-${var.environment}"
  description = "Master password for Aurora PostgreSQL cluster"
  
  # Automatic rotation configuration (HIPAA compliance)
  replica {
    region = data.aws_region.current.name
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-master-password"
    Type = "database-credential"
  })
}

resource "aws_secretsmanager_secret_version" "db_master_password" {
  secret_id = aws_secretsmanager_secret.db_master_password.id
  secret_string = jsonencode({
    username = var.master_username
    password = var.master_password != null ? var.master_password : random_password.master_password[0].result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora_cluster.endpoint
    port     = aws_rds_cluster.aurora_cluster.port
    dbname   = aws_rds_cluster.aurora_cluster.database_name
  })
  
  depends_on = [aws_rds_cluster.aurora_cluster]
}

# Customer-managed KMS key for database encryption
resource "aws_kms_key" "database_key" {
  count = var.kms_key_id == null ? 1 : 0
  
  description             = "KMS key for Aurora PostgreSQL cluster encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS Service"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-database-key"
    Type = "database-encryption"
  })
}

resource "aws_kms_alias" "database_key" {
  count         = var.kms_key_id == null ? 1 : 0
  name          = "alias/${var.project_name}-database-${var.environment}"
  target_key_id = aws_kms_key.database_key[0].key_id
}

# Aurora PostgreSQL Cluster Parameter Group for HIPAA compliance
resource "aws_rds_cluster_parameter_group" "aurora_cluster_pg" {
  count  = var.cluster_parameter_group_name == null ? 1 : 0
  family = var.parameter_group_family
  name   = "${var.project_name}-aurora-cluster-pg-${var.environment}"
  
  description = "Aurora PostgreSQL cluster parameter group for HIPAA compliance"
  
  # HIPAA compliance parameters
  parameter {
    name  = "log_statement"
    value = "all"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log statements taking longer than 1 second
  }
  
  parameter {
    name  = "log_connections"
    value = "1"
  }
  
  parameter {
    name  = "log_disconnections"
    value = "1"
  }
  
  parameter {
    name  = "log_checkpoints"
    value = "1"
  }
  
  parameter {
    name  = "log_lock_waits"
    value = "1"
  }
  
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,pgaudit"
  }
  
  # Security parameters
  parameter {
    name  = "ssl"
    value = "1"
  }
  
  parameter {
    name  = "force_ssl"
    value = "1"
  }
  
  # Performance parameters
  parameter {
    name  = "max_connections"
    value = "LEAST({DBInstanceClassMemory/9531392},5000)"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-cluster-pg"
    Type = "parameter-group"
  })
}

# Aurora PostgreSQL DB Parameter Group
resource "aws_db_parameter_group" "aurora_db_pg" {
  count  = var.db_instance_parameter_group_name == null ? 1 : 0
  family = var.parameter_group_family
  name   = "${var.project_name}-aurora-db-pg-${var.environment}"
  
  description = "Aurora PostgreSQL DB parameter group for HIPAA compliance"
  
  # HIPAA audit logging
  parameter {
    name  = "pgaudit.log"
    value = "all"
  }
  
  parameter {
    name  = "pgaudit.log_catalog"
    value = "1"
  }
  
  parameter {
    name  = "pgaudit.log_parameter"
    value = "1"
  }
  
  parameter {
    name  = "pgaudit.log_relation"
    value = "1"
  }
  
  parameter {
    name  = "pgaudit.log_statement_once"
    value = "1"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-db-pg"
    Type = "parameter-group"
  })
}

# Enhanced monitoring IAM role
resource "aws_iam_role" "rds_enhanced_monitoring" {
  count = var.enable_enhanced_monitoring && var.monitoring_role_arn == null ? 1 : 0
  name  = local.monitoring_role_name
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = local.monitoring_role_name
    Type = "monitoring-role"
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  count      = var.enable_enhanced_monitoring && var.monitoring_role_arn == null ? 1 : 0
  role       = aws_iam_role.rds_enhanced_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Aurora PostgreSQL Serverless v2 Cluster
resource "aws_rds_cluster" "aurora_cluster" {
  cluster_identifier      = local.cluster_identifier
  engine                 = "aurora-postgresql"
  engine_mode           = "provisioned"
  engine_version        = var.engine_version
  database_name         = var.database_name
  master_username       = var.master_username
  master_password       = var.master_password != null ? var.master_password : random_password.master_password[0].result
  
  # Network configuration
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.database_security_group_id]
  availability_zones     = length(var.availability_zones) > 0 ? var.availability_zones : null
  
  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    max_capacity = var.max_capacity
    min_capacity = var.min_capacity
  }
  
  # Backup configuration
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = var.backup_window
  preferred_maintenance_window = var.maintenance_window
  copy_tags_to_snapshot   = var.copy_tags_to_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : local.final_snapshot_id
  skip_final_snapshot     = var.skip_final_snapshot
  
  # Security and encryption
  storage_encrypted       = var.storage_encrypted
  kms_key_id             = var.kms_key_id != null ? var.kms_key_id : (length(aws_kms_key.database_key) > 0 ? aws_kms_key.database_key[0].arn : null)
  iam_database_authentication_enabled = var.enable_iam_database_authentication
  deletion_protection    = var.deletion_protection
  
  # Parameter groups
  db_cluster_parameter_group_name = var.cluster_parameter_group_name != null ? var.cluster_parameter_group_name : aws_rds_cluster_parameter_group.aurora_cluster_pg[0].name
  
  # Logging configuration
  enabled_cloudwatch_logs_exports = var.log_types
  
  # Global cluster configuration
  global_cluster_identifier = var.enable_global_cluster ? var.global_cluster_identifier : null
  
  # Apply changes immediately in development
  apply_immediately = var.environment == "dev"
  
  tags = merge(local.common_tags, {
    Name = local.cluster_identifier
    Type = "aurora-cluster"
  })
  
  depends_on = [
    aws_rds_cluster_parameter_group.aurora_cluster_pg,
    aws_kms_key.database_key
  ]
}

# Aurora PostgreSQL Serverless v2 Cluster Instances
resource "aws_rds_cluster_instance" "aurora_instances" {
  count              = var.enable_multi_az ? 2 : 1
  identifier         = "${local.cluster_identifier}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora_cluster.id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.aurora_cluster.engine
  engine_version     = aws_rds_cluster.aurora_cluster.engine_version
  
  # Parameter group
  db_parameter_group_name = var.db_instance_parameter_group_name != null ? var.db_instance_parameter_group_name : aws_db_parameter_group.aurora_db_pg[0].name
  
  # Monitoring configuration
  performance_insights_enabled          = var.enable_performance_insights
  performance_insights_retention_period = var.enable_performance_insights ? var.performance_insights_retention_period : null
  performance_insights_kms_key_id      = var.enable_performance_insights ? (var.kms_key_id != null ? var.kms_key_id : aws_kms_key.database_key[0].arn) : null
  monitoring_interval                   = var.enable_enhanced_monitoring ? var.monitoring_interval : 0
  monitoring_role_arn                   = var.enable_enhanced_monitoring ? (var.monitoring_role_arn != null ? var.monitoring_role_arn : aws_iam_role.rds_enhanced_monitoring[0].arn) : null
  
  # Network configuration
  publicly_accessible = var.publicly_accessible
  
  # Apply changes immediately in development
  apply_immediately = var.environment == "dev"
  
  tags = merge(local.common_tags, {
    Name = "${local.cluster_identifier}-instance-${count.index + 1}"
    Type = "aurora-instance"
  })
  
  depends_on = [
    aws_rds_cluster.aurora_cluster,
    aws_db_parameter_group.aurora_db_pg,
    aws_iam_role.rds_enhanced_monitoring
  ]
}

# CloudWatch Log Groups for Aurora logs
resource "aws_cloudwatch_log_group" "aurora_logs" {
  for_each = toset(var.log_types)
  
  name              = "/aws/rds/cluster/${aws_rds_cluster.aurora_cluster.cluster_identifier}/${each.value}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id       = var.kms_key_id != null ? var.kms_key_id : (length(aws_kms_key.database_key) > 0 ? aws_kms_key.database_key[0].arn : null)
  
  tags = merge(local.common_tags, {
    Name    = "${local.cluster_identifier}-${each.value}-logs"
    Type    = "cloudwatch-log-group"
    LogType = each.value
  })
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}