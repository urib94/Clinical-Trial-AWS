/**
 * Cognito Custom Message Lambda Trigger
 * HIPAA-compliant email templates for authentication flows
 * Customizes verification emails, password reset, and MFA messages
 */

const AWS = require('aws-sdk');

// Environment variables
const DOMAIN_NAME = process.env.DOMAIN_NAME || 'clinicaltrial.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@clinicaltrial.com';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Clinical Trial Platform';

/**
 * Main Lambda handler for custom message generation
 */
exports.handler = async (event) => {
    console.log('Custom message trigger event:', JSON.stringify(event, null, 2));
    
    try {
        const { triggerSource, request, response } = event;
        const { userAttributes, codeParameter } = request;
        
        // Determine user type based on user pool
        const userType = getUserType(event.userPoolId);
        
        // Generate custom message based on trigger source
        switch (triggerSource) {
            case 'CustomMessage_SignUp':
                response.emailMessage = generateSignUpMessage(userAttributes, codeParameter, userType);
                response.emailSubject = generateSignUpSubject(userType);
                break;
                
            case 'CustomMessage_AdminCreateUser':
                response.emailMessage = generateAdminCreateMessage(userAttributes, codeParameter, userType);
                response.emailSubject = generateAdminCreateSubject(userType);
                break;
                
            case 'CustomMessage_ResendCode':
                response.emailMessage = generateResendCodeMessage(userAttributes, codeParameter, userType);
                response.emailSubject = generateResendCodeSubject(userType);
                break;
                
            case 'CustomMessage_ForgotPassword':
                response.emailMessage = generateForgotPasswordMessage(userAttributes, codeParameter, userType);
                response.emailSubject = generateForgotPasswordSubject(userType);
                break;
                
            case 'CustomMessage_UpdateUserAttribute':
                response.emailMessage = generateUpdateAttributeMessage(userAttributes, codeParameter, userType);
                response.emailSubject = generateUpdateAttributeSubject(userType);
                break;
                
            case 'CustomMessage_VerifyUserAttribute':
                response.emailMessage = generateVerifyAttributeMessage(userAttributes, codeParameter, userType);
                response.emailSubject = generateVerifyAttributeSubject(userType);
                break;
                
            case 'CustomMessage_Authentication':
                response.smsMessage = generateMFASMSMessage(codeParameter, userType);
                break;
                
            default:
                console.log('Unknown trigger source:', triggerSource);
        }
        
        console.log('Custom message generated successfully');
        return event;
        
    } catch (error) {
        console.error('Custom message generation failed:', error);
        // Return event without modification to use default messages
        return event;
    }
};

/**
 * Determine user type based on user pool ID
 */
function getUserType(userPoolId) {
    if (userPoolId.includes('physician')) {
        return 'physician';
    } else if (userPoolId.includes('patient')) {
        return 'patient';
    }
    return 'user';
}

/**
 * Generate signup verification message
 */
function generateSignUpMessage(userAttributes, codeParameter, userType) {
    const firstName = userAttributes.given_name || userAttributes.name || 'User';
    const portalName = userType === 'physician' ? 'Physician Portal' : 'Patient Portal';
    const loginUrl = `https://${DOMAIN_NAME}/${userType === 'patient' ? 'patient/' : ''}login`;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to ${COMPANY_NAME}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .verification-code { font-size: 24px; font-weight: bold; color: #2563eb; 
                           background-color: #e6f2ff; padding: 15px; margin: 20px 0; 
                           text-align: center; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; 
                 color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; 
                  margin: 15px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ${COMPANY_NAME}</h1>
            <h2>${portalName}</h2>
        </div>
        
        <div class="content">
            <p>Dear ${firstName},</p>
            
            <p>Welcome to the ${COMPANY_NAME}! To complete your account verification and secure access to the ${portalName}, please use the verification code below:</p>
            
            <div class="verification-code">
                ${codeParameter}
            </div>
            
            <p>This verification code will expire in 15 minutes for your security.</p>
            
            <p>Once verified, you can access your account at:</p>
            <p><a href="${loginUrl}" class="button">Access ${portalName}</a></p>
            
            <div class="warning">
                <strong>Security Notice:</strong> This message contains sensitive healthcare information. 
                If you received this email in error, please delete it immediately and contact our support team.
            </div>
            
            <p>If you did not request this verification, please contact our support team immediately at 
               <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
            
            <p>Thank you for choosing ${COMPANY_NAME} for your clinical trial management needs.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from ${COMPANY_NAME}. Please do not reply to this email.</p>
            <p>For support, contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
            <p><strong>CONFIDENTIAL:</strong> This communication may contain healthcare information protected by HIPAA.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate admin-created user message
 */
function generateAdminCreateMessage(userAttributes, codeParameter, userType) {
    const firstName = userAttributes.given_name || 'User';
    const portalName = userType === 'physician' ? 'Physician Portal' : 'Patient Portal';
    const loginUrl = `https://${DOMAIN_NAME}/${userType === 'patient' ? 'patient/' : ''}login`;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Account Created - ${COMPANY_NAME}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .temp-password { font-size: 18px; font-weight: bold; color: #dc3545; 
                        background-color: #f8d7da; padding: 15px; margin: 20px 0; 
                        text-align: center; border-radius: 5px; border: 1px solid #f5c6cb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; 
                 color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; 
                  margin: 15px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${COMPANY_NAME}</h1>
            <h2>Your ${portalName} Account</h2>
        </div>
        
        <div class="content">
            <p>Dear ${firstName},</p>
            
            <p>Your account has been created for the ${COMPANY_NAME} ${portalName}. 
               To activate your account and set up secure access, please use the temporary password below:</p>
            
            <div class="temp-password">
                Temporary Password: ${codeParameter}
            </div>
            
            <p><strong>Important:</strong> You will be required to:</p>
            <ul>
                <li>Change this temporary password on first login</li>
                <li>Set up multi-factor authentication (MFA)</li>
                <li>Complete your profile information</li>
            </ul>
            
            <p>Access your account here:</p>
            <p><a href="${loginUrl}" class="button">Login to ${portalName}</a></p>
            
            <div class="warning">
                <strong>Security Requirements:</strong>
                <ul>
                    <li>Password must be at least 12 characters</li>
                    <li>Include uppercase, lowercase, numbers, and symbols</li>
                    <li>MFA setup is mandatory for account security</li>
                </ul>
            </div>
            
            <p>If you have any questions or need assistance, please contact our support team at 
               <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from ${COMPANY_NAME}. Please do not reply to this email.</p>
            <p>For support, contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
            <p><strong>CONFIDENTIAL:</strong> This communication contains healthcare information protected by HIPAA.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate password reset message
 */
function generateForgotPasswordMessage(userAttributes, codeParameter, userType) {
    const firstName = userAttributes.given_name || 'User';
    const resetUrl = `https://${DOMAIN_NAME}/${userType === 'patient' ? 'patient/' : ''}reset-password`;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset - ${COMPANY_NAME}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .reset-code { font-size: 24px; font-weight: bold; color: #dc3545; 
                     background-color: #f8d7da; padding: 15px; margin: 20px 0; 
                     text-align: center; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; 
                 color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .security-notice { background-color: #d1ecf1; border: 1px solid #bee5eb; 
                          padding: 15px; margin: 15px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
            <h2>${COMPANY_NAME}</h2>
        </div>
        
        <div class="content">
            <p>Dear ${firstName},</p>
            
            <p>We received a request to reset the password for your ${COMPANY_NAME} account. 
               Use the verification code below to proceed with your password reset:</p>
            
            <div class="reset-code">
                ${codeParameter}
            </div>
            
            <p>This verification code will expire in 15 minutes for your security.</p>
            
            <p>To reset your password:</p>
            <p><a href="${resetUrl}" class="button">Reset Password</a></p>
            
            <div class="security-notice">
                <strong>Security Notice:</strong>
                <ul>
                    <li>If you did not request this password reset, please ignore this email</li>
                    <li>Your account remains secure and no changes have been made</li>
                    <li>Contact support immediately if you suspect unauthorized access</li>
                </ul>
            </div>
            
            <p>For your protection, we recommend:</p>
            <ul>
                <li>Using a strong, unique password</li>
                <li>Enabling two-factor authentication</li>
                <li>Regularly updating your password</li>
            </ul>
            
            <p>If you need assistance, contact our support team at 
               <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from ${COMPANY_NAME}. Please do not reply to this email.</p>
            <p>For support, contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
            <p><strong>CONFIDENTIAL:</strong> This communication contains healthcare information protected by HIPAA.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate resend code message
 */
function generateResendCodeMessage(userAttributes, codeParameter, userType) {
    return generateSignUpMessage(userAttributes, codeParameter, userType)
        .replace('Welcome to', 'Verification Code Resent - ')
        .replace('Welcome to the', 'Your verification code has been resent for the');
}

/**
 * Generate update attribute message
 */
function generateUpdateAttributeMessage(userAttributes, codeParameter, userType) {
    const firstName = userAttributes.given_name || 'User';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Verification - ${COMPANY_NAME}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #17a2b8; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .verification-code { font-size: 24px; font-weight: bold; color: #17a2b8; 
                           background-color: #d1ecf1; padding: 15px; margin: 20px 0; 
                           text-align: center; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Address Update</h1>
            <h2>${COMPANY_NAME}</h2>
        </div>
        
        <div class="content">
            <p>Dear ${firstName},</p>
            
            <p>To complete the update of your email address, please verify your new email with the code below:</p>
            
            <div class="verification-code">
                ${codeParameter}
            </div>
            
            <p>This verification code will expire in 15 minutes.</p>
            
            <p>If you did not request this email change, please contact support immediately.</p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate verify attribute message
 */
function generateVerifyAttributeMessage(userAttributes, codeParameter, userType) {
    return generateUpdateAttributeMessage(userAttributes, codeParameter, userType);
}

/**
 * Generate MFA SMS message
 */
function generateMFASMSMessage(codeParameter, userType) {
    return `${COMPANY_NAME}: Your verification code is ${codeParameter}. This code expires in 3 minutes. Do not share this code.`;
}

/**
 * Generate email subjects
 */
function generateSignUpSubject(userType) {
    const portalName = userType === 'physician' ? 'Physician Portal' : 'Patient Portal';
    return `Welcome to ${COMPANY_NAME} ${portalName} - Verify Your Account`;
}

function generateAdminCreateSubject(userType) {
    const portalName = userType === 'physician' ? 'Physician Portal' : 'Patient Portal';
    return `Your ${COMPANY_NAME} ${portalName} Account Has Been Created`;
}

function generateResendCodeSubject(userType) {
    return `${COMPANY_NAME} - Verification Code Resent`;
}

function generateForgotPasswordSubject(userType) {
    return `${COMPANY_NAME} - Password Reset Request`;
}

function generateUpdateAttributeSubject(userType) {
    return `${COMPANY_NAME} - Verify Your New Email Address`;
}

function generateVerifyAttributeSubject(userType) {
    return `${COMPANY_NAME} - Email Verification Required`;
}