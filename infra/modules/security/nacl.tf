# Network ACLs - Subnet-level security controls
# Defense-in-depth security for healthcare data protection

# Public Subnet Network ACL
resource "aws_network_acl" "public" {
  vpc_id     = var.vpc_id
  subnet_ids = var.public_subnet_ids

  # Inbound Rules
  
  # Allow HTTPS from internet
  ingress {
    rule_no    = 100
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Allow HTTP from internet (for redirect to HTTPS)
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    from_port  = 80
    to_port    = 80
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Allow SSH for NAT instance management (optional)
  dynamic "ingress" {
    for_each = var.enable_nat_ssh_access ? [1] : []
    content {
      rule_no    = 120
      protocol   = "tcp"
      from_port  = 22
      to_port    = 22
      cidr_block = "0.0.0.0/0"
      action     = "allow"
    }
  }

  # Allow return traffic (ephemeral ports)
  ingress {
    rule_no    = 200
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Allow ping/ICMP for health checks
  ingress {
    rule_no    = 300
    protocol   = "icmp"
    icmp_type  = -1
    icmp_code  = -1
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Outbound Rules

  # Allow HTTPS outbound
  egress {
    rule_no    = 100
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Allow HTTP outbound
  egress {
    rule_no    = 110
    protocol   = "tcp"
    from_port  = 80
    to_port    = 80
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Allow DNS outbound
  egress {
    rule_no    = 120
    protocol   = "udp"
    from_port  = 53
    to_port    = 53
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  egress {
    rule_no    = 125
    protocol   = "tcp"
    from_port  = 53
    to_port    = 53
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Allow traffic to private subnets
  egress {
    rule_no    = 130
    protocol   = "tcp"
    from_port  = 80
    to_port    = 80
    cidr_block = var.vpc_cidr
    action     = "allow"
  }

  egress {
    rule_no    = 135
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidr_block = var.vpc_cidr
    action     = "allow"
  }

  # Allow return traffic (ephemeral ports)
  egress {
    rule_no    = 200
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Allow ping/ICMP outbound
  egress {
    rule_no    = 300
    protocol   = "icmp"
    icmp_type  = -1
    icmp_code  = -1
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-public-nacl"
  })
}

# Private Application Subnet Network ACL
resource "aws_network_acl" "private_app" {
  vpc_id     = var.vpc_id
  subnet_ids = var.private_app_subnet_ids

  # Inbound Rules

  # Allow HTTP/HTTPS from public subnets (ALB)
  ingress {
    rule_no    = 100
    protocol   = "tcp"
    from_port  = 80
    to_port    = 80
    cidr_block = var.vpc_cidr
    action     = "allow"
  }

  ingress {
    rule_no    = 110
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidr_block = var.vpc_cidr
    action     = "allow"
  }

  # Allow Lambda runtime communication (ephemeral ports)
  ingress {
    rule_no    = 200
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Block known malicious ports (example - adjust as needed)
  ingress {
    rule_no    = 900
    protocol   = "tcp"
    from_port  = 135
    to_port    = 139
    cidr_block = "0.0.0.0/0"
    action     = "deny"
  }

  ingress {
    rule_no    = 910
    protocol   = "tcp"
    from_port  = 445
    to_port    = 445
    cidr_block = "0.0.0.0/0"
    action     = "deny"
  }

  # Outbound Rules

  # Allow HTTPS for AWS services and external APIs
  egress {
    rule_no    = 100
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Allow HTTP for health checks
  egress {
    rule_no    = 110
    protocol   = "tcp"
    from_port  = 80
    to_port    = 80
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Allow DNS
  egress {
    rule_no    = 120
    protocol   = "udp"
    from_port  = 53
    to_port    = 53
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  egress {
    rule_no    = 125
    protocol   = "tcp"
    from_port  = 53
    to_port    = 53
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  # Allow PostgreSQL to database subnets
  egress {
    rule_no    = 130
    protocol   = "tcp"
    from_port  = 5432
    to_port    = 5432
    cidr_block = var.vpc_cidr
    action     = "allow"
  }

  # Allow Redis access (if enabled)
  dynamic "egress" {
    for_each = var.enable_redis_cache ? [1] : []
    content {
      rule_no    = 140
      protocol   = "tcp"
      from_port  = 6379
      to_port    = 6379
      cidr_block = var.vpc_cidr
      action     = "allow"
    }
  }

  # Allow return traffic
  egress {
    rule_no    = 200
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-app-nacl"
  })
}

# Private Database Subnet Network ACL
resource "aws_network_acl" "private_db" {
  vpc_id     = var.vpc_id
  subnet_ids = var.private_db_subnet_ids

  # Inbound Rules

  # Allow PostgreSQL from application subnets only
  ingress {
    rule_no    = 100
    protocol   = "tcp"
    from_port  = 5432
    to_port    = 5432
    cidr_block = var.vpc_cidr
    action     = "allow"
  }

  # Allow return traffic (ephemeral ports)
  ingress {
    rule_no    = 200
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = var.vpc_cidr
    action     = "allow"
  }

  # Block all other inbound traffic (implicit deny)
  # Explicitly deny common attack vectors
  ingress {
    rule_no    = 900
    protocol   = "tcp"
    from_port  = 22
    to_port    = 22
    cidr_block = "0.0.0.0/0"
    action     = "deny"
  }

  ingress {
    rule_no    = 910
    protocol   = "tcp"
    from_port  = 3389
    to_port    = 3389
    cidr_block = "0.0.0.0/0"
    action     = "deny"
  }

  # Outbound Rules

  # Allow PostgreSQL responses back to application subnets
  egress {
    rule_no    = 100
    protocol   = "tcp"
    from_port  = 5432
    to_port    = 5432
    cidr_block = var.vpc_cidr
    action     = "allow"
  }

  # Allow return traffic to application subnets
  egress {
    rule_no    = 200
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = var.vpc_cidr
    action     = "allow"
  }

  # Block all outbound internet access for database subnets
  egress {
    rule_no    = 900
    protocol   = "-1"
    from_port  = 0
    to_port    = 0
    cidr_block = "0.0.0.0/0"
    action     = "deny"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-db-nacl"
  })
}

# HIPAA Compliance: Audit and monitoring network ACL rules
resource "aws_network_acl_rule" "audit_logging" {
  count = var.enable_hipaa_compliance ? 1 : 0

  network_acl_id = aws_network_acl.private_db.id
  rule_number    = 950
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

# Security baseline: Block common malicious traffic patterns
locals {
  blocked_ports = [
    { port = 135, description = "Microsoft RPC" },
    { port = 139, description = "NetBIOS Session Service" },
    { port = 445, description = "Microsoft SMB" },
    { port = 1433, description = "Microsoft SQL Server" },
    { port = 1521, description = "Oracle Database" },
    { port = 3306, description = "MySQL" },
    { port = 5000, description = "UPnP" },
    { port = 8080, description = "HTTP Proxy" }
  ]
}

resource "aws_network_acl_rule" "block_malicious_inbound" {
  count = var.enable_security_hardening ? length(local.blocked_ports) : 0

  network_acl_id = aws_network_acl.public.id
  rule_number    = 800 + count.index
  protocol       = "tcp"
  rule_action    = "deny"
  cidr_block     = "0.0.0.0/0"
  from_port      = local.blocked_ports[count.index].port
  to_port        = local.blocked_ports[count.index].port
}