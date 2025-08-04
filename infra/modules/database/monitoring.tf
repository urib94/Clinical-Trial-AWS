# Database Monitoring and Alerting Configuration
# CloudWatch metrics, alarms, and dashboards for Aurora PostgreSQL

# SNS topic for database alerts (if not provided)
resource "aws_sns_topic" "database_alerts" {
  count = var.alarm_sns_topic_arn == null ? 1 : 0
  name  = "${var.project_name}-database-alerts-${var.environment}"
  
  kms_master_key_id = var.kms_key_id != null ? var.kms_key_id : (length(aws_kms_key.database_key) > 0 ? aws_kms_key.database_key[0].arn : null)
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-alerts"
    Environment = var.environment
    Type        = "sns-topic"
  })
}

# Local variable for SNS topic ARN
locals {
  sns_topic_arn = var.alarm_sns_topic_arn != null ? var.alarm_sns_topic_arn : aws_sns_topic.database_alerts[0].arn
}

# CloudWatch Dashboard for Database Monitoring
resource "aws_cloudwatch_dashboard" "database_dashboard" {
  dashboard_name = "${var.project_name}-database-${var.environment}"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", aws_rds_cluster.aurora_cluster.cluster_identifier],
            [".", "DatabaseConnections", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Database Performance Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/RDS", "ServerlessDatabaseCapacity", "DBClusterIdentifier", aws_rds_cluster.aurora_cluster.cluster_identifier],
            [".", "ACUUtilization", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Serverless v2 Capacity Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/RDS", "ReadIOPS", "DBClusterIdentifier", aws_rds_cluster.aurora_cluster.cluster_identifier],
            [".", "WriteIOPS", ".", "."],
            [".", "ReadThroughput", ".", "."],
            [".", "WriteThroughput", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Database I/O Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", "DBClusterIdentifier", aws_rds_cluster.aurora_cluster.cluster_identifier],
            [".", "FreeableMemory", ".", "."],
            [".", "SwapUsage", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Storage and Memory Metrics"
          period  = 300
        }
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-dashboard"
    Environment = var.environment
    Type        = "cloudwatch-dashboard"
  })
}

# CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  count = var.enable_performance_alarms ? 1 : 0
  
  alarm_name          = "${var.project_name}-database-cpu-utilization-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.cpu_utilization_threshold
  alarm_description   = "This metric monitors database cpu utilization"
  alarm_actions       = [local.sns_topic_arn]
  ok_actions          = [local.sns_topic_arn]
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_cluster.cluster_identifier
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-cpu-alarm"
    Environment = var.environment
    Type        = "cloudwatch-alarm"
  })
}

# Database Connections Alarm
resource "aws_cloudwatch_metric_alarm" "database_connections" {
  count = var.enable_connection_alarms ? 1 : 0
  
  alarm_name          = "${var.project_name}-database-connections-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.database_connections_threshold
  alarm_description   = "This metric monitors database connection count"
  alarm_actions       = [local.sns_topic_arn]
  ok_actions          = [local.sns_topic_arn]
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_cluster.cluster_identifier
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-connections-alarm"
    Environment = var.environment
    Type        = "cloudwatch-alarm"
  })
}

# Read Latency Alarm
resource "aws_cloudwatch_metric_alarm" "read_latency" {
  count = var.enable_performance_alarms ? 1 : 0
  
  alarm_name          = "${var.project_name}-database-read-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0.2"  # 200ms
  alarm_description   = "This metric monitors database read latency"
  alarm_actions       = [local.sns_topic_arn]
  ok_actions          = [local.sns_topic_arn]
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_cluster.cluster_identifier
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-read-latency-alarm"
    Environment = var.environment
    Type        = "cloudwatch-alarm"
  })
}

# Write Latency Alarm
resource "aws_cloudwatch_metric_alarm" "write_latency" {
  count = var.enable_performance_alarms ? 1 : 0
  
  alarm_name          = "${var.project_name}-database-write-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "WriteLatency"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0.2"  # 200ms
  alarm_description   = "This metric monitors database write latency"
  alarm_actions       = [local.sns_topic_arn]
  ok_actions          = [local.sns_topic_arn]
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_cluster.cluster_identifier
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-write-latency-alarm"
    Environment = var.environment
    Type        = "cloudwatch-alarm"
  })
}

# Aurora Serverless v2 Capacity Alarm
resource "aws_cloudwatch_metric_alarm" "serverless_capacity" {
  count = var.enable_performance_alarms ? 1 : 0
  
  alarm_name          = "${var.project_name}-database-serverless-capacity-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "ServerlessDatabaseCapacity"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.max_capacity * 0.8  # 80% of max capacity
  alarm_description   = "This metric monitors Aurora Serverless v2 capacity utilization"
  alarm_actions       = [local.sns_topic_arn]
  ok_actions          = [local.sns_topic_arn]
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_cluster.cluster_identifier
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-capacity-alarm"
    Environment = var.environment
    Type        = "cloudwatch-alarm"
  })
}

# Free Storage Space Alarm
resource "aws_cloudwatch_metric_alarm" "free_storage_space" {
  count = var.enable_performance_alarms ? 1 : 0
  
  alarm_name          = "${var.project_name}-database-free-storage-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000"  # 2GB in bytes
  alarm_description   = "This metric monitors database free storage space"
  alarm_actions       = [local.sns_topic_arn]
  ok_actions          = [local.sns_topic_arn]
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_cluster.cluster_identifier
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-storage-alarm"
    Environment = var.environment
    Type        = "cloudwatch-alarm"
  })
}

# Database Backup Failure Alarm
resource "aws_cloudwatch_metric_alarm" "backup_failure" {
  alarm_name          = "${var.project_name}-database-backup-failure-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BackupRetentionPeriodStorageUsed"
  namespace           = "AWS/RDS"
  period              = "86400"  # 24 hours
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This alarm triggers when database backup fails"
  alarm_actions       = [local.sns_topic_arn]
  treat_missing_data  = "breaching"
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_cluster.cluster_identifier
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-backup-alarm"
    Environment = var.environment
    Type        = "cloudwatch-alarm"
  })
}

# Custom CloudWatch Metrics for HIPAA Compliance
resource "aws_cloudwatch_log_metric_filter" "failed_connections" {
  count = var.enable_audit_logging ? 1 : 0
  
  name           = "${var.project_name}-failed-database-connections-${var.environment}"
  log_group_name = "/aws/rds/cluster/${aws_rds_cluster.aurora_cluster.cluster_identifier}/postgresql"
  pattern        = "[timestamp, request_id, session_id, session_line_num, session_start_time, virtual_transaction_id, transaction_id, error_severity=\"FATAL\", sql_state_code, message=\"password authentication failed*\"]"
  
  metric_transformation {
    name      = "FailedDatabaseConnections"
    namespace = "ClinicalTrial/Database"
    value     = "1"
  }
  
  depends_on = [aws_cloudwatch_log_group.aurora_logs]
}

# Alarm for failed database connections
resource "aws_cloudwatch_metric_alarm" "failed_connections" {
  count = var.enable_audit_logging ? 1 : 0
  
  alarm_name          = "${var.project_name}-database-failed-connections-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FailedDatabaseConnections"
  namespace           = "ClinicalTrial/Database"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This alarm triggers when there are multiple failed database connection attempts"
  alarm_actions       = [local.sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-failed-connections-alarm"
    Environment = var.environment
    Type        = "security-alarm"
  })
  
  depends_on = [aws_cloudwatch_log_metric_filter.failed_connections]
}

# Cost monitoring metric filter
resource "aws_cloudwatch_log_metric_filter" "database_cost_tracking" {
  count = var.enable_cost_optimization ? 1 : 0
  
  name           = "${var.project_name}-database-cost-tracking-${var.environment}"
  log_group_name = "/aws/rds/cluster/${aws_rds_cluster.aurora_cluster.cluster_identifier}/postgresql"
  pattern        = "[timestamp, request_id, session_id, session_line_num, session_start_time, virtual_transaction_id, transaction_id, error_severity, sql_state_code, message]"
  
  metric_transformation {
    name      = "DatabaseQueryCount"
    namespace = "ClinicalTrial/Cost"
    value     = "1"
  }
  
  depends_on = [aws_cloudwatch_log_group.aurora_logs]
}

# Budget alarm for database costs
resource "aws_budgets_budget" "database_cost" {
  count = var.enable_cost_optimization ? 1 : 0
  
  name       = "${var.project_name}-database-cost-budget-${var.environment}"
  budget_type = "COST"
  limit_amount = var.environment == "prod" ? "15" : "8"  # USD per month
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  time_period_start = "2024-01-01_00:00"
  
  cost_filters = {
    Service = ["Amazon Relational Database Service"]
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = []
    subscriber_sns_topic_arns  = [local.sns_topic_arn]
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = []
    subscriber_sns_topic_arns  = [local.sns_topic_arn]
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-cost-budget"
    Environment = var.environment
    Type        = "cost-budget"
  })
}

# Aurora performance insights custom dashboard
resource "aws_cloudwatch_dashboard" "performance_insights" {
  count = var.enable_performance_insights ? 1 : 0
  
  dashboard_name = "${var.project_name}-database-performance-insights-${var.environment}"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 24
        height = 6
        
        properties = {
          metrics = [
            ["AWS/RDS", "DBLoad", "DBInstanceIdentifier", aws_rds_cluster_instance.aurora_instances[0].identifier],
            [".", "DBLoadCPU", ".", "."],
            [".", "DBLoadNonCPU", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Database Load Analysis"
          period  = 300
        }
      }
    ]
  })
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-database-performance-insights"
    Environment = var.environment
    Type        = "cloudwatch-dashboard"
  })
}

# Custom metric for tracking Aurora Serverless v2 scaling events
resource "aws_cloudwatch_log_metric_filter" "scaling_events" {
  name           = "${var.project_name}-aurora-scaling-events-${var.environment}"
  log_group_name = "/aws/rds/cluster/${aws_rds_cluster.aurora_cluster.cluster_identifier}/postgresql"
  pattern        = "[timestamp, request_id, session_id, session_line_num, session_start_time, virtual_transaction_id, transaction_id, error_severity, sql_state_code, message=\"*scaling*\"]"
  
  metric_transformation {
    name      = "AuroraScalingEvents"
    namespace = "ClinicalTrial/Database"
    value     = "1"
  }
  
  depends_on = [aws_cloudwatch_log_group.aurora_logs]
}

# EventBridge rule for Aurora events
resource "aws_cloudwatch_event_rule" "aurora_events" {
  name        = "${var.project_name}-aurora-events-${var.environment}"
  description = "Capture Aurora database events"
  
  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Cluster Event"]
    detail = {
      SourceId = [aws_rds_cluster.aurora_cluster.cluster_identifier]
    }
  })
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-aurora-events"
    Environment = var.environment
    Type        = "eventbridge-rule"
  })
}

# EventBridge target to send Aurora events to SNS
resource "aws_cloudwatch_event_target" "aurora_events_sns" {
  rule      = aws_cloudwatch_event_rule.aurora_events.name
  target_id = "AuroraEventsToSNS"
  arn       = local.sns_topic_arn
}