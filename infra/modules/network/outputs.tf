# Network Module Outputs
# Essential networking information for other modules

# VPC Information
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = aws_vpc.main.arn
}

# Internet Gateway
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.igw.id
}

# Availability Zones
output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

# Public Subnets
output "public_subnet_ids" {
  description = "List of IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "public_subnet_cidrs" {
  description = "List of CIDR blocks of the public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "public_subnet_arns" {
  description = "List of ARNs of the public subnets"
  value       = aws_subnet.public[*].arn
}

# Private Application Subnets
output "private_app_subnet_ids" {
  description = "List of IDs of the private application subnets"
  value       = aws_subnet.private_app[*].id
}

output "private_app_subnet_cidrs" {
  description = "List of CIDR blocks of the private application subnets"
  value       = aws_subnet.private_app[*].cidr_block
}

output "private_app_subnet_arns" {
  description = "List of ARNs of the private application subnets"
  value       = aws_subnet.private_app[*].arn
}

# Private Database Subnets
output "private_db_subnet_ids" {
  description = "List of IDs of the private database subnets"
  value       = aws_subnet.private_db[*].id
}

output "private_db_subnet_cidrs" {
  description = "List of CIDR blocks of the private database subnets"
  value       = aws_subnet.private_db[*].cidr_block
}

output "private_db_subnet_arns" {
  description = "List of ARNs of the private database subnets"
  value       = aws_subnet.private_db[*].arn
}

# Database Subnet Group (for Aurora)
output "db_subnet_group_name" {
  description = "Name of the database subnet group"
  value       = aws_db_subnet_group.main.name
}

# Route Tables
output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

# NAT Instance Information
output "nat_instance_id" {
  description = "ID of the NAT instance"
  value       = length(aws_instance.nat) > 0 ? aws_instance.nat[0].id : null
}

output "nat_instance_public_ip" {
  description = "Public IP address of the NAT instance"
  value       = length(aws_eip.nat) > 0 ? aws_eip.nat[0].public_ip : null
}

output "nat_instance_private_ip" {
  description = "Private IP address of the NAT instance"
  value       = length(aws_instance.nat) > 0 ? aws_instance.nat[0].private_ip : null
}

output "nat_security_group_id" {
  description = "ID of the NAT instance security group"
  value       = aws_security_group.nat_instance.id
}

# VPC Endpoints
output "s3_vpc_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "dynamodb_vpc_endpoint_id" {
  description = "ID of the DynamoDB VPC endpoint"
  value       = aws_vpc_endpoint.dynamodb.id
}

output "secretsmanager_vpc_endpoint_id" {
  description = "ID of the Secrets Manager VPC endpoint"
  value       = aws_vpc_endpoint.secretsmanager.id
}

output "ssm_vpc_endpoint_id" {
  description = "ID of the SSM VPC endpoint"
  value       = aws_vpc_endpoint.ssm.id
}

output "vpc_endpoints_security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.id
}

# Network Configuration Summary (for documentation)
output "network_summary" {
  description = "Summary of network configuration"
  value = {
    vpc_id                    = aws_vpc.main.id
    vpc_cidr                  = aws_vpc.main.cidr_block
    availability_zones        = data.aws_availability_zones.available.names
    public_subnets_count      = length(aws_subnet.public)
    private_app_subnets_count = length(aws_subnet.private_app)
    private_db_subnets_count  = length(aws_subnet.private_db)
    nat_instance_type         = var.nat_instance_type
    cost_optimization = {
      nat_instance_instead_of_gateway = true
      vpc_endpoints_enabled           = true
      single_nat_for_all_azs         = true
    }
  }
}