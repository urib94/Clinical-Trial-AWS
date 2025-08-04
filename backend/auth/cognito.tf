# AWS Cognito Infrastructure for Clinical Trial Platform
# Dual user pool architecture for physicians and patients

# Google OAuth provider configuration
resource "aws_cognito_identity_provider" "google_physician" {
  user_pool_id  = aws_cognito_user_pool.physician_pool.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    authorize_scopes = "email openid profile"
    client_id        = var.google_oauth_client_id
    client_secret    = var.google_oauth_client_secret
  }

  attribute_mapping = {
    email          = "email"
    given_name     = "given_name"
    family_name    = "family_name"
    picture        = "picture"
    email_verified = "email_verified"
  }
}

# Physician User Pool
resource "aws_cognito_user_pool" "physician_pool" {
  name = "${var.project_name}-physician-pool-${var.environment}"

  # Password policy for healthcare compliance
  password_policy {
    minimum_length                   = 12
    require_lowercase               = true
    require_numbers                 = true
    require_symbols                 = true
    require_uppercase               = true
    temporary_password_validity_days = 1
  }

  # MFA configuration - required for all physicians
  mfa_configuration = "ON"
  software_token_mfa_configuration {
    enabled = true
  }
  sms_configuration {
    external_id    = "physician-mfa-external-id"
    sns_caller_arn = aws_iam_role.cognito_sms_role.arn
  }

  # Auto-verified attributes
  auto_verified_attributes = ["email"]

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Device tracking for enhanced security
  device_configuration {
    challenge_required_on_new_device      = true
    device_only_remembered_on_user_prompt = true
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  # Lambda triggers for custom authentication flows
  lambda_config {
    pre_sign_up          = aws_lambda_function.pre_signup.arn
    post_confirmation    = aws_lambda_function.post_confirmation.arn
    pre_authentication   = aws_lambda_function.pre_authentication.arn
    custom_message       = aws_lambda_function.custom_message.arn
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Schema attributes
  schema {
    attribute_data_type = "String"
    name               = "email"
    required           = true
    mutable            = false
  }

  schema {
    attribute_data_type = "String"
    name               = "given_name"
    required           = true
    mutable            = true
  }

  schema {
    attribute_data_type = "String"
    name               = "family_name"
    required           = true
    mutable            = true
  }

  # Custom attributes for healthcare roles
  schema {
    attribute_data_type      = "String"
    name                    = "medical_license"
    required                = false
    mutable                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  schema {
    attribute_data_type      = "String"
    name                    = "organization_id"
    required                = false
    mutable                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 100
    }
  }

  tags = var.common_tags
}

# Patient User Pool
resource "aws_cognito_user_pool" "patient_pool" {
  name = "${var.project_name}-patient-pool-${var.environment}"

  # Same password policy as physicians
  password_policy {
    minimum_length                   = 12
    require_lowercase               = true
    require_numbers                 = true
    require_symbols                 = true
    require_uppercase               = true
    temporary_password_validity_days = 7
  }

  # MFA configuration - required for all patients
  mfa_configuration = "ON"
  software_token_mfa_configuration {
    enabled = true
  }
  sms_configuration {
    external_id    = "patient-mfa-external-id"
    sns_caller_arn = aws_iam_role.cognito_sms_role.arn
  }

  # Auto-verified attributes
  auto_verified_attributes = ["email"]

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Device tracking
  device_configuration {
    challenge_required_on_new_device      = true
    device_only_remembered_on_user_prompt = true
  }

  # Enhanced security
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  # Lambda triggers
  lambda_config {
    pre_sign_up          = aws_lambda_function.pre_signup.arn
    post_confirmation    = aws_lambda_function.post_confirmation.arn
    pre_authentication   = aws_lambda_function.pre_authentication.arn
    custom_message       = aws_lambda_function.custom_message.arn
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Patient-specific schema
  schema {
    attribute_data_type = "String"
    name               = "email"
    required           = true
    mutable            = false
  }

  schema {
    attribute_data_type = "String"
    name               = "given_name"
    required           = true
    mutable            = true
  }

  schema {
    attribute_data_type = "String"
    name               = "family_name"
    required           = true
    mutable            = true
  }

  schema {
    attribute_data_type = "String"
    name               = "birthdate"
    required           = false
    mutable            = true
  }

  # Custom attributes for patients
  schema {
    attribute_data_type      = "String"
    name                    = "patient_id"
    required                = false
    mutable                 = false
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  schema {
    attribute_data_type      = "String"
    name                    = "invitation_token"
    required                = false
    mutable                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 255
    }
  }

  tags = var.common_tags
}

# Physician Pool Client
resource "aws_cognito_user_pool_client" "physician_client" {
  name         = "${var.project_name}-physician-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.physician_pool.id

  generate_secret = false # For SPA applications

  # OAuth configuration
  supported_identity_providers = ["COGNITO", "Google"]
  
  callback_urls = [
    "https://${var.domain_name}/auth/callback",
    "http://localhost:3000/auth/callback"
  ]
  
  logout_urls = [
    "https://${var.domain_name}/auth/logout",
    "http://localhost:3000/auth/logout"
  ]

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                = ["email", "openid", "profile"]

  # Token validity
  access_token_validity  = 60  # 1 hour
  id_token_validity      = 60  # 1 hour
  refresh_token_validity = 30  # 30 days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Security settings
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation      = true

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_CUSTOM_AUTH"
  ]

  read_attributes = [
    "email",
    "email_verified",
    "given_name",
    "family_name",
    "custom:medical_license",
    "custom:organization_id"
  ]

  write_attributes = [
    "given_name",
    "family_name",
    "custom:medical_license",
    "custom:organization_id"
  ]
}

# Patient Pool Client
resource "aws_cognito_user_pool_client" "patient_client" {
  name         = "${var.project_name}-patient-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.patient_pool.id

  generate_secret = false

  # OAuth configuration
  supported_identity_providers = ["COGNITO"]
  
  callback_urls = [
    "https://${var.domain_name}/patient/auth/callback",
    "http://localhost:3000/patient/auth/callback"
  ]
  
  logout_urls = [
    "https://${var.domain_name}/patient/auth/logout",
    "http://localhost:3000/patient/auth/logout"
  ]

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                = ["email", "openid", "profile"]

  # Token validity
  access_token_validity  = 30  # 30 minutes (shorter for patients)
  id_token_validity      = 30  # 30 minutes
  refresh_token_validity = 7   # 7 days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Security settings
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation      = true

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  read_attributes = [
    "email",
    "email_verified",
    "given_name",
    "family_name",
    "birthdate",
    "custom:patient_id",
    "custom:invitation_token"
  ]

  write_attributes = [
    "given_name",
    "family_name",
    "birthdate"
  ]
}

# Identity Pool for AWS resource access
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name = "${var.project_name}-identity-pool-${var.environment}"
  
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.physician_client.id
    provider_name           = aws_cognito_user_pool.physician_pool.endpoint
    server_side_token_check = false
  }

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.patient_client.id
    provider_name           = aws_cognito_user_pool.patient_pool.endpoint
    server_side_token_check = false
  }

  tags = var.common_tags
}

# IAM roles for Cognito Identity Pool
resource "aws_iam_role" "authenticated_role" {
  name = "${var.project_name}-cognito-authenticated-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role" "unauthenticated_role" {
  name = "${var.project_name}-cognito-unauthenticated-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      }
    ]
  })

  tags = var.common_tags
}

# IAM role for SMS MFA
resource "aws_iam_role" "cognito_sms_role" {
  name = "${var.project_name}-cognito-sms-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cognito-idp.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy" "cognito_sms_policy" {
  name = "${var.project_name}-cognito-sms-policy-${var.environment}"
  role = aws_iam_role.cognito_sms_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "*"
      }
    ]
  })
}

# Identity pool role attachment
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated"   = aws_iam_role.authenticated_role.arn
    "unauthenticated" = aws_iam_role.unauthenticated_role.arn
  }
}

# Physician User Pool Domain
resource "aws_cognito_user_pool_domain" "physician_domain" {
  domain       = "${var.project_name}-physician-${var.environment}"
  user_pool_id = aws_cognito_user_pool.physician_pool.id
}

# Patient User Pool Domain
resource "aws_cognito_user_pool_domain" "patient_domain" {
  domain       = "${var.project_name}-patient-${var.environment}"
  user_pool_id = aws_cognito_user_pool.patient_pool.id
}

# Variables for Cognito configuration
variable "google_oauth_client_id" {
  description = "Google OAuth client ID for physician authentication"
  type        = string
  sensitive   = true
}

variable "google_oauth_client_secret" {
  description = "Google OAuth client secret for physician authentication"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "clinical-trial"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

# Outputs for other modules
output "physician_user_pool_id" {
  description = "ID of the physician user pool"
  value       = aws_cognito_user_pool.physician_pool.id
}

output "patient_user_pool_id" {
  description = "ID of the patient user pool"
  value       = aws_cognito_user_pool.patient_pool.id
}

output "physician_client_id" {
  description = "ID of the physician user pool client"
  value       = aws_cognito_user_pool_client.physician_client.id
}

output "patient_client_id" {
  description = "ID of the patient user pool client"
  value       = aws_cognito_user_pool_client.patient_client.id
}

output "identity_pool_id" {
  description = "ID of the Cognito Identity Pool"
  value       = aws_cognito_identity_pool.main.id
}

output "physician_pool_domain" {
  description = "Domain of the physician user pool"
  value       = aws_cognito_user_pool_domain.physician_domain.domain
}

output "patient_pool_domain" {
  description = "Domain of the patient user pool"
  value       = aws_cognito_user_pool_domain.patient_domain.domain
}