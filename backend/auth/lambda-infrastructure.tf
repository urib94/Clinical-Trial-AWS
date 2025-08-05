# Lambda Infrastructure for Cognito Authentication Functions
# Deploys and configures Lambda functions for custom authentication flows

# Lambda execution role
resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.project_name}-auth-lambda-role-${var.environment}"

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

  tags = var.common_tags
}

# Lambda execution policy
resource "aws_iam_role_policy" "lambda_execution_policy" {
  name = "${var.project_name}-auth-lambda-policy-${var.environment}"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement",
          "rds-data:BeginTransaction",
          "rds-data:CommitTransaction",
          "rds-data:RollbackTransaction"
        ]
        Resource = var.database_arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.database_secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminSetUserMFAPreference"
        ]
        Resource = [
          aws_cognito_user_pool.physician_pool.arn,
          aws_cognito_user_pool.patient_pool.arn
        ]
      }
    ]
  })
}

# Lambda layer for shared dependencies
resource "aws_lambda_layer_version" "auth_dependencies" {
  filename         = "auth-dependencies.zip"
  layer_name       = "${var.project_name}-auth-deps-${var.environment}"
  source_code_hash = data.archive_file.auth_dependencies.output_base64sha256

  compatible_runtimes = ["nodejs20.x"]
  
  description = "Shared dependencies for authentication Lambda functions"
}

# Package dependencies
data "archive_file" "auth_dependencies" {
  type        = "zip"
  output_path = "auth-dependencies.zip"
  
  source {
    content = jsonencode({
      dependencies = {
        "aws-sdk" = "^2.1691.0",
        "jsonwebtoken" = "^9.0.2",
        "speakeasy" = "^2.0.0",
        "qrcode" = "^1.5.3",
        "uuid" = "^9.0.1"
      }
    })
    filename = "package.json"
  }
}

# Pre-signup Lambda function
resource "aws_lambda_function" "pre_signup" {
  filename         = "pre-signup.zip"
  function_name    = "${var.project_name}-pre-signup-${var.environment}"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "pre-signup.handler"
  source_code_hash = data.archive_file.pre_signup.output_base64sha256
  runtime         = "nodejs20.x"
  timeout         = 30
  memory_size     = 256

  layers = [aws_lambda_layer_version.auth_dependencies.arn]

  environment {
    variables = {
      DATABASE_ARN = var.database_arn
      SECRET_ARN   = var.database_secret_arn
      PHYSICIAN_DOMAIN_WHITELIST = var.physician_domain_whitelist
    }
  }

  tags = var.common_tags
}

data "archive_file" "pre_signup" {
  type        = "zip"
  output_path = "pre-signup.zip"
  source_file = "functions/pre-signup.js"
}

# Post-confirmation Lambda function
resource "aws_lambda_function" "post_confirmation" {
  filename         = "post-confirmation.zip"
  function_name    = "${var.project_name}-post-confirmation-${var.environment}"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "post-confirmation.handler"
  source_code_hash = data.archive_file.post_confirmation.output_base64sha256
  runtime         = "nodejs20.x"
  timeout         = 60
  memory_size     = 512

  layers = [aws_lambda_layer_version.auth_dependencies.arn]

  environment {
    variables = {
      DATABASE_ARN = var.database_arn
      SECRET_ARN   = var.database_secret_arn
    }
  }

  tags = var.common_tags
}

data "archive_file" "post_confirmation" {
  type        = "zip"
  output_path = "post-confirmation.zip"
  source_file = "functions/post-confirmation.js"
}

# Pre-authentication Lambda function
resource "aws_lambda_function" "pre_authentication" {
  filename         = "pre-authentication.zip"
  function_name    = "${var.project_name}-pre-authentication-${var.environment}"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "pre-authentication.handler"
  source_code_hash = data.archive_file.pre_authentication.output_base64sha256
  runtime         = "nodejs20.x"
  timeout         = 30
  memory_size     = 256

  layers = [aws_lambda_layer_version.auth_dependencies.arn]

  environment {
    variables = {
      DATABASE_ARN = var.database_arn
      SECRET_ARN   = var.database_secret_arn
      MAX_LOGIN_ATTEMPTS = "5"
      LOCKOUT_DURATION   = "1800"
    }
  }

  tags = var.common_tags
}

data "archive_file" "pre_authentication" {
  type        = "zip"
  output_path = "pre-authentication.zip"
  source_file = "functions/pre-authentication.js"
}

# Custom message Lambda function
resource "aws_lambda_function" "custom_message" {
  filename         = "custom-message.zip"
  function_name    = "${var.project_name}-custom-message-${var.environment}"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "custom-message.handler"
  source_code_hash = data.archive_file.custom_message.output_base64sha256
  runtime         = "nodejs20.x"
  timeout         = 15
  memory_size     = 128

  environment {
    variables = {
      DOMAIN_NAME    = var.domain_name
      SUPPORT_EMAIL  = var.support_email
      COMPANY_NAME   = var.company_name
    }
  }

  tags = var.common_tags
}

data "archive_file" "custom_message" {
  type        = "zip"
  output_path = "custom-message.zip"
  source_file = "functions/custom-message.js"
}

# Authentication API Lambda function
resource "aws_lambda_function" "auth_api" {
  filename         = "auth-api.zip"
  function_name    = "${var.project_name}-auth-api-${var.environment}"
  role            = aws_iam_role.auth_api_role.arn
  handler         = "api/routes.handler"
  source_code_hash = data.archive_file.auth_api.output_base64sha256
  runtime         = "nodejs20.x"
  timeout         = 30
  memory_size     = 512

  layers = [aws_lambda_layer_version.auth_dependencies.arn]

  environment {
    variables = {
      PHYSICIAN_USER_POOL_ID = aws_cognito_user_pool.physician_pool.id
      PATIENT_USER_POOL_ID   = aws_cognito_user_pool.patient_pool.id
      PHYSICIAN_CLIENT_ID    = aws_cognito_user_pool_client.physician_client.id
      PATIENT_CLIENT_ID      = aws_cognito_user_pool_client.patient_client.id
      JWT_SECRET            = var.jwt_secret
      DATABASE_ARN          = var.database_arn
      SECRET_ARN            = var.database_secret_arn
      DOMAIN_NAME           = var.domain_name
    }
  }

  tags = var.common_tags
}

# Separate IAM role for Auth API with additional permissions
resource "aws_iam_role" "auth_api_role" {
  name = "${var.project_name}-auth-api-role-${var.environment}"

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

  tags = var.common_tags
}

resource "aws_iam_role_policy" "auth_api_policy" {
  name = "${var.project_name}-auth-api-policy-${var.environment}"
  role = aws_iam_role.auth_api_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement",
          "rds-data:BeginTransaction",
          "rds-data:CommitTransaction",
          "rds-data:RollbackTransaction"
        ]
        Resource = var.database_arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.database_secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:InitiateAuth",
          "cognito-idp:RespondToAuthChallenge",
          "cognito-idp:GetUser",
          "cognito-idp:ForgotPassword",
          "cognito-idp:ConfirmForgotPassword",
          "cognito-idp:RevokeToken",
          "cognito-idp:AssociateSoftwareToken",
          "cognito-idp:VerifySoftwareToken",
          "cognito-idp:SetUserMFAPreference"
        ]
        Resource = [
          aws_cognito_user_pool.physician_pool.arn,
          aws_cognito_user_pool.patient_pool.arn
        ]
      },
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

data "archive_file" "auth_api" {
  type        = "zip"
  output_path = "auth-api.zip"
  
  source {
    content  = file("api/routes.js")
    filename = "api/routes.js"
  }
  
  source {
    content  = file("middleware/jwt-validation.js")
    filename = "middleware/jwt-validation.js"
  }
  
  source {
    content  = file("middleware/rbac.js")
    filename = "middleware/rbac.js"
  }
  
  source {
    content  = file("utils/mfa-helpers.js")
    filename = "utils/mfa-helpers.js"
  }
}

# Lambda permissions for Cognito triggers
resource "aws_lambda_permission" "cognito_pre_signup" {
  statement_id  = "AllowCognitoPreSignup"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_signup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "${aws_cognito_user_pool.physician_pool.arn}/*"
}

resource "aws_lambda_permission" "cognito_pre_signup_patient" {
  statement_id  = "AllowCognitoPreSignupPatient"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_signup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "${aws_cognito_user_pool.patient_pool.arn}/*"
}

resource "aws_lambda_permission" "cognito_post_confirmation" {
  statement_id  = "AllowCognitoPostConfirmation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "${aws_cognito_user_pool.physician_pool.arn}/*"
}

resource "aws_lambda_permission" "cognito_post_confirmation_patient" {
  statement_id  = "AllowCognitoPostConfirmationPatient"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "${aws_cognito_user_pool.patient_pool.arn}/*"
}

resource "aws_lambda_permission" "cognito_pre_authentication" {
  statement_id  = "AllowCognitoPreAuthentication"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_authentication.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "${aws_cognito_user_pool.physician_pool.arn}/*"
}

resource "aws_lambda_permission" "cognito_pre_authentication_patient" {
  statement_id  = "AllowCognitoPreAuthenticationPatient"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_authentication.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "${aws_cognito_user_pool.patient_pool.arn}/*"
}

resource "aws_lambda_permission" "cognito_custom_message" {
  statement_id  = "AllowCognitoCustomMessage"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.custom_message.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "${aws_cognito_user_pool.physician_pool.arn}/*"
}

resource "aws_lambda_permission" "cognito_custom_message_patient" {
  statement_id  = "AllowCognitoCustomMessagePatient"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.custom_message.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "${aws_cognito_user_pool.patient_pool.arn}/*"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "pre_signup_logs" {
  name              = "/aws/lambda/${aws_lambda_function.pre_signup.function_name}"
  retention_in_days = 30
  tags              = var.common_tags
}

resource "aws_cloudwatch_log_group" "post_confirmation_logs" {
  name              = "/aws/lambda/${aws_lambda_function.post_confirmation.function_name}"
  retention_in_days = 30
  tags              = var.common_tags
}

resource "aws_cloudwatch_log_group" "pre_authentication_logs" {
  name              = "/aws/lambda/${aws_lambda_function.pre_authentication.function_name}"
  retention_in_days = 30
  tags              = var.common_tags
}

resource "aws_cloudwatch_log_group" "custom_message_logs" {
  name              = "/aws/lambda/${aws_lambda_function.custom_message.function_name}"
  retention_in_days = 30
  tags              = var.common_tags
}

resource "aws_cloudwatch_log_group" "auth_api_logs" {
  name              = "/aws/lambda/${aws_lambda_function.auth_api.function_name}"
  retention_in_days = 30
  tags              = var.common_tags
}

# Variables
variable "database_arn" {
  description = "ARN of the Aurora PostgreSQL database"
  type        = string
}

variable "database_secret_arn" {
  description = "ARN of the database credentials secret"
  type        = string
}

variable "physician_domain_whitelist" {
  description = "Comma-separated list of allowed physician email domains"
  type        = string
  default     = "hospital.com,clinic.org,healthcenter.net"
}

variable "jwt_secret" {
  description = "Secret key for JWT token signing"
  type        = string
  sensitive   = true
}

variable "support_email" {
  description = "Support email address for user communications"
  type        = string
  default     = "support@clinicaltrial.com"
}

variable "company_name" {
  description = "Company name for branding"
  type        = string
  default     = "Clinical Trial Platform"
}

# Outputs
output "lambda_function_arns" {
  description = "ARNs of all Lambda functions"
  value = {
    pre_signup        = aws_lambda_function.pre_signup.arn
    post_confirmation = aws_lambda_function.post_confirmation.arn
    pre_authentication = aws_lambda_function.pre_authentication.arn
    custom_message    = aws_lambda_function.custom_message.arn
    auth_api         = aws_lambda_function.auth_api.arn
  }
}

output "auth_api_function_name" {
  description = "Name of the authentication API Lambda function"
  value       = aws_lambda_function.auth_api.function_name
}