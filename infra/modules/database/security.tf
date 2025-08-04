# Database Security Configuration
# HIPAA-compliant security controls for Aurora PostgreSQL

# Database encryption key rotation schedule
resource "aws_kms_key_rotation" "database_key_rotation" {
  count = var.kms_key_id == null && var.enable_hipaa_compliance ? 1 : 0
  
  key_id           = aws_kms_key.database_key[0].id
  rotation_enabled = true
}

# IAM role for Lambda to access database
resource "aws_iam_role" "lambda_db_access" {
  name = "${var.project_name}-lambda-db-access-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-lambda-db-access"
    Environment = var.environment
    Type        = "lambda-execution-role"
  })
}

# IAM policy for Lambda database access
resource "aws_iam_policy" "lambda_db_access" {
  name        = "${var.project_name}-lambda-db-access-${var.environment}"
  description = "Policy for Lambda functions to access Aurora PostgreSQL"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = [
          "arn:aws:rds-db:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:dbuser:${aws_rds_cluster.aurora_cluster.cluster_identifier}/${var.master_username}",
          "arn:aws:rds-db:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:dbuser:${aws_rds_cluster.aurora_cluster.cluster_identifier}/lambda_user"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_master_password.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          var.kms_key_id != null ? var.kms_key_id : aws_kms_key.database_key[0].arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_db_access" {
  role       = aws_iam_role.lambda_db_access.name
  policy_arn = aws_iam_policy.lambda_db_access.arn
}

# Database connection proxy for enhanced security (optional)
resource "aws_db_proxy" "aurora_proxy" {
  count                  = var.environment == "prod" ? 1 : 0
  name                   = "${var.project_name}-aurora-proxy-${var.environment}"
  engine_family         = "POSTGRESQL"
  idle_client_timeout   = 1800
  max_connections_percent = 100
  max_idle_connections_percent = 50
  require_tls           = true
  role_arn              = aws_iam_role.db_proxy_role[0].arn
  vpc_subnet_ids        = data.aws_subnets.database.ids
  
  auth {
    auth_scheme = "SECRETS"
    secret_arn  = aws_secretsmanager_secret.db_master_password.arn
    iam_auth    = "REQUIRED"
  }
  
  target {
    db_cluster_identifier = aws_rds_cluster.aurora_cluster.cluster_identifier
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-aurora-proxy"
    Environment = var.environment
    Type        = "database-proxy"
  })
  
  depends_on = [
    aws_iam_role.db_proxy_role,
    aws_rds_cluster.aurora_cluster
  ]
}

# IAM role for RDS Proxy
resource "aws_iam_role" "db_proxy_role" {
  count = var.environment == "prod" ? 1 : 0
  name  = "${var.project_name}-db-proxy-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-db-proxy-role"
    Environment = var.environment
    Type        = "proxy-execution-role"
  })
}

# IAM policy for RDS Proxy
resource "aws_iam_policy" "db_proxy_policy" {
  count       = var.environment == "prod" ? 1 : 0
  name        = "${var.project_name}-db-proxy-policy-${var.environment}"
  description = "Policy for RDS Proxy to access secrets and KMS"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_master_password.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          var.kms_key_id != null ? var.kms_key_id : aws_kms_key.database_key[0].arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "db_proxy_policy" {
  count      = var.environment == "prod" ? 1 : 0
  role       = aws_iam_role.db_proxy_role[0].name
  policy_arn = aws_iam_policy.db_proxy_policy[0].arn
}

# Security group for RDS Proxy
resource "aws_security_group" "db_proxy" {
  count       = var.environment == "prod" ? 1 : 0
  name        = "${var.project_name}-db-proxy-sg-${var.environment}"
  description = "Security group for RDS Proxy"
  vpc_id      = var.vpc_id
  
  ingress {
    description = "PostgreSQL from Lambda functions"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [var.database_security_group_id]
  }
  
  egress {
    description = "PostgreSQL to Aurora cluster"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [var.database_security_group_id]
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-db-proxy-sg"
    Environment = var.environment
    Type        = "security-group"
  })
}

# Database audit trail configuration
resource "aws_cloudtrail" "database_audit" {
  count                        = var.enable_hipaa_compliance ? 1 : 0
  name                        = "${var.project_name}-database-audit-${var.environment}"
  s3_bucket_name              = aws_s3_bucket.audit_logs[0].bucket
  s3_key_prefix              = "database-audit"
  include_global_service_events = false
  is_multi_region_trail       = false
  enable_logging             = true
  
  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []
    
    data_resource {
      type   = "AWS::RDS::DBCluster"
      values = [aws_rds_cluster.aurora_cluster.arn]
    }
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-audit"
    Environment = var.environment
    Type        = "audit-trail"
  })
  
  depends_on = [aws_s3_bucket_policy.audit_logs]
}

# S3 bucket for audit logs
resource "aws_s3_bucket" "audit_logs" {
  count  = var.enable_hipaa_compliance ? 1 : 0
  bucket = "${var.project_name}-database-audit-logs-${var.environment}-${random_id.bucket_suffix[0].hex}"
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-audit-logs"
    Environment = var.environment
    Type        = "audit-storage"
  })
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  count  = var.enable_hipaa_compliance ? 1 : 0
  bucket = aws_s3_bucket.audit_logs[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "audit_logs" {
  count  = var.enable_hipaa_compliance ? 1 : 0
  bucket = aws_s3_bucket.audit_logs[0].id
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = var.kms_key_id != null ? var.kms_key_id : aws_kms_key.database_key[0].arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_logs" {
  count  = var.enable_hipaa_compliance ? 1 : 0
  bucket = aws_s3_bucket.audit_logs[0].id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "audit_logs" {
  count  = var.enable_hipaa_compliance ? 1 : 0
  bucket = aws_s3_bucket.audit_logs[0].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit_logs[0].arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-database-audit-${var.environment}"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit_logs[0].arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-database-audit-${var.environment}"
          }
        }
      }
    ]
  })
}

# Random ID for unique bucket naming
resource "random_id" "bucket_suffix" {
  count       = var.enable_hipaa_compliance ? 1 : 0
  byte_length = 4
}

# Database backup encryption validation
resource "aws_config_configuration_recorder" "database_backup_encryption" {
  count    = var.enable_hipaa_compliance && var.environment == "prod" ? 1 : 0
  name     = "${var.project_name}-db-backup-encryption-${var.environment}"
  role_arn = aws_iam_role.config_role[0].arn
  
  recording_group {
    all_supported                 = false
    include_global_resource_types = false
    resource_types               = ["AWS::RDS::DBCluster", "AWS::RDS::DBClusterSnapshot"]
  }
  
  depends_on = [aws_config_delivery_channel.database_backup_encryption]
}

resource "aws_config_delivery_channel" "database_backup_encryption" {
  count          = var.enable_hipaa_compliance && var.environment == "prod" ? 1 : 0
  name           = "${var.project_name}-db-backup-encryption-${var.environment}"
  s3_bucket_name = aws_s3_bucket.config_bucket[0].bucket
}

resource "aws_s3_bucket" "config_bucket" {
  count  = var.enable_hipaa_compliance && var.environment == "prod" ? 1 : 0
  bucket = "${var.project_name}-aws-config-${var.environment}-${random_id.config_bucket_suffix[0].hex}"
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-aws-config"
    Environment = var.environment
    Type        = "config-storage"
  })
}

resource "aws_config_rule" "rds_cluster_encrypted" {
  count = var.enable_hipaa_compliance && var.environment == "prod" ? 1 : 0
  name  = "${var.project_name}-rds-cluster-encrypted-${var.environment}"
  
  source {
    owner             = "AWS"
    source_identifier = "RDS_CLUSTER_ENCRYPTED"
  }
  
  depends_on = [aws_config_configuration_recorder.database_backup_encryption]
}

# IAM role for AWS Config
resource "aws_iam_role" "config_role" {
  count = var.enable_hipaa_compliance && var.environment == "prod" ? 1 : 0
  name  = "${var.project_name}-aws-config-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config_role" {
  count      = var.enable_hipaa_compliance && var.environment == "prod" ? 1 : 0
  role       = aws_iam_role.config_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# Random ID for Config bucket
resource "random_id" "config_bucket_suffix" {
  count       = var.enable_hipaa_compliance && var.environment == "prod" ? 1 : 0
  byte_length = 4
}

# Data source for database subnets
data "aws_subnets" "database" {
  filter {
    name   = "vpc-id"
    values = [var.vpc_id]
  }
  
  filter {
    name   = "tag:Type"
    values = ["database"]
  }
}