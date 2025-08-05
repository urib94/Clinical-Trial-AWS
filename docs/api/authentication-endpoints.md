# Authentication API Endpoints

This document describes the authentication API endpoints for the Clinical Trial Platform, supporting both physician and patient portals with comprehensive security features.

## Base URL
```
Production: https://api.clinicaltrial.com/auth
Development: https://dev-api.clinicaltrial.com/auth
```

## Authentication Flow

### 1. User Registration
Users are registered through invitation-only system:
- **Physicians**: Invited by administrators with organization verification
- **Patients**: Invited by physicians with secure token-based registration

### 2. Login Process
1. User provides credentials (email/password)
2. System validates credentials and account status
3. If MFA is enabled, system sends MFA challenge
4. User provides MFA code
5. System returns JWT tokens and user data

### 3. Token Management
- **Access Token**: Short-lived (30-60 minutes) for API access
- **ID Token**: Contains user identity information
- **Refresh Token**: Long-lived (7-30 days) for token renewal
- **Custom JWT**: Application-specific claims and permissions

## Endpoints

### POST /auth/login
Universal login endpoint for both physician and patient portals.

**Request Body:**
```json
{
  "email": "doctor@hospital.com",
  "password": "SecurePassword123!",
  "userType": "physician", // Optional: "physician" | "patient"
  "mfaCode": "123456", // Required if MFA challenge is active
  "session": "session_token" // Required with mfaCode
}
```

**Response (Success - No MFA):**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
  "customToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "username": "12345678-1234-1234-1234-123456789012",
    "email": "doctor@hospital.com",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "physician",
    "emailVerified": true,
    "attributes": {
      "custom:medical_license": "MD123456",
      "custom:organization_id": "org_123"
    }
  },
  "expiresIn": 3600
}
```

**Response (MFA Challenge Required):**
```json
{
  "challengeName": "SOFTWARE_TOKEN_MFA",
  "session": "AYABeO1lT...",
  "challengeParameters": {
    "USER_ID_FOR_SRP": "12345678-1234-1234-1234-123456789012"
  }
}
```

**Error Response:**
```json
{
  "error": "Invalid credentials",
  "details": "The username or password is incorrect"
}
```

### POST /auth/logout
Securely logs out user and revokes tokens.

**Request Body:**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIs..." // Optional but recommended
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### POST /auth/refresh
Refreshes access tokens using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
  "userType": "physician"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "customToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "username": "12345678-1234-1234-1234-123456789012",
    "email": "doctor@hospital.com",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "physician",
    "emailVerified": true
  },
  "expiresIn": 3600
}
```

### POST /auth/mfa/setup
Initiates MFA setup process with QR code generation.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "manualEntryKey": "JBSWY3DPEHPK3PXP"
}
```

### POST /auth/mfa/verify
Verifies MFA setup and enables MFA for the user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "token": "123456",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

**Response:**
```json
{
  "message": "MFA enabled successfully",
  "recoveryCodes": [
    "ABCD1234",
    "EFGH5678",
    "IJKL9012",
    "MNOP3456",
    "QRST7890",
    "UVWX1234",
    "YZAB5678",
    "CDEF9012",
    "GHIJ3456",
    "KLMN7890"
  ]
}
```

### POST /auth/password/reset
Initiates password reset process.

**Request Body:**
```json
{
  "email": "user@example.com",
  "userType": "patient" // Optional: "physician" | "patient"
}
```

**Response:**
```json
{
  "message": "Password reset instructions sent to your email"
}
```

### POST /auth/password/confirm
Confirms password reset with verification code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "confirmationCode": "123456",
  "newPassword": "NewSecurePassword123!",
  "userType": "patient"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

## Security Features

### Rate Limiting
- **Authentication endpoints**: 20 requests per 15 minutes per IP/user
- **General API**: 100 requests per hour per user
- **IP-based limit**: 500 requests per hour per IP

### Account Security
- **Failed login attempts**: Account locked after 5 failed attempts
- **Lockout duration**: 30 minutes (configurable)
- **Session timeout**: 30 minutes for patients, 60 minutes for physicians
- **Password requirements**: 12+ characters, mixed case, numbers, symbols

### MFA Requirements
- **TOTP (Authenticator apps)**: Primary MFA method
- **SMS backup**: Available for physicians (emergency access)
- **Recovery codes**: 10 one-time use codes generated during setup
- **Emergency access**: Physicians can request temporary MFA bypass

### Token Security
- **JWT signing**: RS256 for Cognito tokens, HS256 for custom tokens
- **Token rotation**: Refresh tokens are rotated on use
- **Token blacklisting**: Revoked tokens are blacklisted
- **Short expiration**: Access tokens expire in 30-60 minutes

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Username or password is incorrect |
| `ACCOUNT_LOCKED` | 401 | Account locked due to failed login attempts |
| `MFA_REQUIRED` | 401 | Multi-factor authentication required |
| `INVALID_MFA_CODE` | 401 | MFA code is invalid or expired |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `TOKEN_INVALID` | 401 | Token is malformed or invalid |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests, rate limit exceeded |
| `ACCOUNT_DISABLED` | 403 | User account has been disabled |
| `EMAIL_NOT_VERIFIED` | 403 | Email address must be verified |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |

## Authentication Headers

### Required Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Optional Headers
```
X-User-Type: physician|patient  // Helps with request routing
X-Client-Version: 1.0.0         // Client version for compatibility
X-Request-ID: <uuid>            // Request tracking
```

## User Types and Permissions

### Physician Portal
- **Base permissions**: patient management, questionnaire creation, data analysis
- **MFA requirement**: Required for all physicians
- **Session duration**: 60 minutes
- **Google OAuth**: Supported for organization-verified accounts

### Patient Portal
- **Base permissions**: profile management, questionnaire responses, file uploads
- **MFA requirement**: Required for all patients
- **Session duration**: 30 minutes
- **Registration**: Invitation-only through secure tokens

## Compliance and Auditing

### HIPAA Compliance
- All authentication events are logged with user identification
- PHI access is tracked and auditable
- Session data is encrypted at rest and in transit
- Password history prevents reuse of last 12 passwords

### Audit Logging
Events logged include:
- Login attempts (successful and failed)
- MFA setup and usage
- Password changes
- Account lockouts
- Token generation and revocation
- Permission denials

### Data Retention
- Audit logs: Retained for 7 years
- Session data: Cleared on logout or expiration
- Failed login attempts: Cleared after successful login
- Blacklisted tokens: Cleared after expiration

## Integration Examples

### Frontend Integration
```javascript
// Login with MFA handling
async function login(email, password, userType) {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, userType })
  });
  
  const data = await response.json();
  
  if (data.challengeName === 'SOFTWARE_TOKEN_MFA') {
    // Handle MFA challenge
    const mfaCode = await promptUserForMFA();
    return await completeMFAChallenge(data.session, mfaCode);
  }
  
  // Store tokens securely
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data.user;
}

// Automatic token refresh
async function refreshTokenIfNeeded() {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken, userType: 'physician' })
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  }
  
  // Redirect to login if refresh fails
  window.location.href = '/login';
}
```

### Backend API Integration
```javascript
// Middleware for protected routes
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based access control
const requirePhysician = (req, res, next) => {
  if (req.user.userType !== 'physician') {
    return res.status(403).json({ error: 'Physician access required' });
  }
  next();
};
```

## Testing

### Unit Tests
- Token validation logic
- MFA code generation and verification
- Rate limiting functionality
- Password policy enforcement

### Integration Tests
- End-to-end authentication flows
- MFA setup and verification
- Token refresh scenarios
- Error handling and edge cases

### Security Tests
- Penetration testing for authentication bypasses
- Rate limiting effectiveness
- Token manipulation attempts
- Session fixation and hijacking tests