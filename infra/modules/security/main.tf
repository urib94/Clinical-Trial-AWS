# Security Groups Module - HIPAA-Compliant Security Groups
# Healthcare-focused security groups with least-privilege access

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Application Load Balancer Security Group
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  # HTTPS traffic from internet
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  # HTTP traffic (redirect to HTTPS)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet (redirect to HTTPS)"
  }

  # Health check traffic to targets
  egress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "HTTP to Lambda functions for health checks"
  }

  egress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "HTTPS to Lambda functions"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-alb-sg"
    Type = "load-balancer"
  })
}

# Lambda Functions Security Group
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  # HTTP/HTTPS from ALB
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTP from ALB"
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTPS from ALB"
  }

  # HTTPS outbound for API calls and VPC endpoints
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound for AWS services and external APIs"
  }

  # Database access
  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.database.id]
    description     = "PostgreSQL to Aurora database"
  }

  # DNS resolution
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS resolution"
  }

  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS resolution (TCP)"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-sg"
    Type = "application"
  })
}

# Aurora Database Security Group
resource "aws_security_group" "database" {
  name        = "${var.project_name}-database"
  description = "Security group for Aurora PostgreSQL database"
  vpc_id      = var.vpc_id

  # PostgreSQL access from Lambda functions only
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "PostgreSQL from Lambda functions"
  }

  # Optional: Database management access (remove in production)
  dynamic "ingress" {
    for_each = var.enable_database_management_access ? [1] : []
    content {
      from_port       = 5432
      to_port         = 5432
      protocol        = "tcp"
      security_groups = [aws_security_group.database_management.id]
      description     = "PostgreSQL from management instances"
    }
  }

  # No outbound rules - database should not initiate connections
  # Outbound rules are implicitly denied by default

  tags = merge(var.tags, {
    Name = "${var.project_name}-database-sg"
    Type = "database"
  })
}

# Database Management Security Group (optional, for administrative access)
resource "aws_security_group" "database_management" {
  count = var.enable_database_management_access ? 1 : 0

  name        = "${var.project_name}-db-management"
  description = "Security group for database management access"
  vpc_id      = var.vpc_id

  # SSH access for management (restricted IP ranges)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.management_cidr_blocks
    description = "SSH from management networks"
  }

  # PostgreSQL client access
  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.database.id]
    description     = "PostgreSQL to database"
  }

  # HTTPS for package updates
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for updates"
  }

  # DNS resolution
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS resolution"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-db-management-sg"
    Type = "management"
  })
}

# CloudFront Origin Security Group (for S3 and ALB)
resource "aws_security_group" "cloudfront_origin" {
  name        = "${var.project_name}-cloudfront-origin"
  description = "Security group for CloudFront origin access"
  vpc_id      = var.vpc_id

  # HTTPS from CloudFront IP ranges
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = data.aws_ip_ranges.cloudfront.cidr_blocks
    description = "HTTPS from CloudFront"
  }

  # HTTP from CloudFront IP ranges
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = data.aws_ip_ranges.cloudfront.cidr_blocks
    description = "HTTP from CloudFront"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudfront-origin-sg"
    Type = "cdn-origin"
  })
}

# Data source for CloudFront IP ranges
data "aws_ip_ranges" "cloudfront" {
  regions  = ["global"]
  services = ["cloudfront"]
}

# Security Group for Redis Cache (optional)
resource "aws_security_group" "redis" {
  count = var.enable_redis_cache ? 1 : 0

  name        = "${var.project_name}-redis"
  description = "Security group for Redis cache"
  vpc_id      = var.vpc_id

  # Redis access from Lambda functions only
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Redis from Lambda functions"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-redis-sg"
    Type = "cache"
  })
}

# Security Group for API Gateway VPC Link (if needed)
resource "aws_security_group" "api_gateway_vpc_link" {
  count = var.enable_api_gateway_vpc_link ? 1 : 0

  name        = "${var.project_name}-api-gateway-vpc-link"
  description = "Security group for API Gateway VPC Link"
  vpc_id      = var.vpc_id

  # HTTP/HTTPS from API Gateway
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "HTTP from API Gateway"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "HTTPS from API Gateway"
  }

  # Access to Lambda functions
  egress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "HTTP to Lambda functions"
  }

  egress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "HTTPS to Lambda functions"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-api-gateway-vpc-link-sg"
    Type = "api-gateway"
  })
}