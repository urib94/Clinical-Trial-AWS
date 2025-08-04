# Development Environment Variables

variable "aws_region" {
  description = "AWS region for development environment"
  type        = string
  default     = "us-east-1"
}

variable "key_name" {
  description = "EC2 Key Pair name for instance access"
  type        = string
  default     = ""
}

variable "security_alert_email" {
  description = "Email address for security alerts"
  type        = string
  default     = ""
}