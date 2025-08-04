# Production Environment Variables

variable "aws_region" {
  description = "AWS region for production environment"
  type        = string
  default     = "us-east-1"
}

variable "key_name" {
  description = "EC2 Key Pair name for instance access (optional in prod)"
  type        = string
  default     = ""
}

variable "security_alert_email" {
  description = "Email address for security alerts (required in prod)"
  type        = string
  validation {
    condition     = var.security_alert_email != ""
    error_message = "Security alert email is required for production environment."
  }
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms (required in prod)"
  type        = string
  validation {
    condition     = can(regex("^arn:aws:sns:", var.alarm_sns_topic_arn))
    error_message = "Alarm SNS topic ARN must be a valid SNS topic ARN."
  }
}