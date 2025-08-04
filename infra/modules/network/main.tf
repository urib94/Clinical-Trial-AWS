# Network Module - Core VPC Infrastructure for Clinical Trial Platform
# Healthcare-compliant multi-AZ network architecture with cost optimization

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Main VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc"
    Type = "network"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-igw"
  })
}

# Public Subnets (for ALB and NAT instance)
resource "aws_subnet" "public" {
  count = var.availability_zone_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-public-${data.aws_availability_zones.available.names[count.index]}"
    Type = "public"
    Tier = "public"
  })
}

# Private Subnets for Application (Lambda functions)
resource "aws_subnet" "private_app" {
  count = var.availability_zone_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-app-${data.aws_availability_zones.available.names[count.index]}"
    Type = "private"
    Tier = "application"
  })
}

# Private Subnets for Database
resource "aws_subnet" "private_db" {
  count = var.availability_zone_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-db-${data.aws_availability_zones.available.names[count.index]}"
    Type = "private"
    Tier = "database"
  })
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-public-rt"
  })
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count = var.availability_zone_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets (one per AZ for NAT instance routing)
resource "aws_route_table" "private" {
  count = var.availability_zone_count

  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-rt-${data.aws_availability_zones.available.names[count.index]}"
  })
}

# Route to NAT instance for private subnets (added in nat.tf)
resource "aws_route" "private_nat" {
  count = var.availability_zone_count

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  instance_id            = count.index == 0 ? aws_instance.nat[0].id : aws_instance.nat[0].id
}

# Route Table Associations for Private App Subnets
resource "aws_route_table_association" "private_app" {
  count = var.availability_zone_count

  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Route Table Associations for Private DB Subnets
resource "aws_route_table_association" "private_db" {
  count = var.availability_zone_count

  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC S3 Endpoint (cost optimization - avoid NAT charges for S3)
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
  
  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )

  tags = merge(var.tags, {
    Name = "${var.project_name}-s3-endpoint"
  })
}

# VPC DynamoDB Endpoint (cost optimization)
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"
  
  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )

  tags = merge(var.tags, {
    Name = "${var.project_name}-dynamodb-endpoint"
  })
}

# VPC Secrets Manager Endpoint (HIPAA compliance)
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-secretsmanager-endpoint"
  })
}

# VPC SSM Endpoint (for Lambda parameter access)
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-ssm-endpoint"
  })
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.project_name}-vpc-endpoints"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc-endpoints-sg"
  })
}

# Database Subnet Group for Aurora
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private_db[*].id

  tags = merge(var.tags, {
    Name = "${var.project_name}-db-subnet-group"
  })
}