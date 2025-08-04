# NAT Instance Configuration - Cost-Optimized Alternative to NAT Gateway
# Single NAT instance in first AZ with auto-recovery for cost efficiency

# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security Group for NAT Instance
resource "aws_security_group" "nat_instance" {
  name        = "${var.project_name}-nat-instance"
  description = "Security group for NAT instance"
  vpc_id      = aws_vpc.main.id

  # Allow HTTP traffic from private subnets
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [
      for subnet in aws_subnet.private_app : subnet.cidr_block
    ]
    description = "HTTP from private app subnets"
  }

  # Allow HTTPS traffic from private subnets
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = concat(
      [for subnet in aws_subnet.private_app : subnet.cidr_block],
      [for subnet in aws_subnet.private_db : subnet.cidr_block]
    )
    description = "HTTPS from private subnets"
  }

  # Allow SSH for management (optional, can be removed in production)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.enable_nat_ssh ? ["0.0.0.0/0"] : []
    description = "SSH access for management"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-instance-sg"
  })
}

# IAM Role for NAT Instance
resource "aws_iam_role" "nat_instance" {
  name = "${var.project_name}-nat-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Instance Profile for NAT Instance
resource "aws_iam_instance_profile" "nat_instance" {
  name = "${var.project_name}-nat-instance"
  role = aws_iam_role.nat_instance.name
}

# IAM Policy for CloudWatch monitoring
resource "aws_iam_role_policy" "nat_instance_cloudwatch" {
  name = "cloudwatch-monitoring"
  role = aws_iam_role.nat_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# User Data Script for NAT Instance
locals {
  nat_user_data = base64encode(templatefile("${path.module}/nat_user_data.sh", {
    project_name = var.project_name
    aws_region   = var.aws_region
  }))
}

# NAT Instance (single instance for cost optimization)
resource "aws_instance" "nat" {
  count = 1

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.nat_instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.nat_instance.id]
  subnet_id              = aws_subnet.public[0].id
  iam_instance_profile   = aws_iam_instance_profile.nat_instance.name

  # Enable source/destination check disable for NAT functionality
  source_dest_check = false

  user_data = local.nat_user_data

  # Auto-recovery for high availability
  monitoring = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
    tags = merge(var.tags, {
      Name = "${var.project_name}-nat-root-volume"
    })
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-instance"
    Type = "nat"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Elastic IP for NAT Instance
resource "aws_eip" "nat" {
  count = 1

  domain   = "vpc"
  instance = aws_instance.nat[0].id

  depends_on = [aws_internet_gateway.igw]

  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-eip"
  })
}

# CloudWatch Alarm for NAT Instance Health
resource "aws_cloudwatch_metric_alarm" "nat_instance_health" {
  count = var.enable_nat_monitoring ? 1 : 0

  alarm_name          = "${var.project_name}-nat-instance-health"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "This metric monitors NAT instance health"
  alarm_actions       = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    InstanceId = aws_instance.nat[0].id
  }

  tags = var.tags
}

# Auto-recovery for NAT Instance
resource "aws_cloudwatch_metric_alarm" "nat_instance_recovery" {
  count = var.enable_nat_auto_recovery ? 1 : 0

  alarm_name          = "${var.project_name}-nat-instance-recovery"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed_System"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "Auto-recover NAT instance on system failure"
  alarm_actions       = ["arn:aws:automate:${var.aws_region}:ec2:recover"]

  dimensions = {
    InstanceId = aws_instance.nat[0].id
  }

  tags = var.tags
}