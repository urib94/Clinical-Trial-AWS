# Clinical Trial Platform API Documentation

## Overview

The Clinical Trial Platform provides a comprehensive REST API for managing clinical trial patient data collection. This API is designed with HIPAA compliance in mind, featuring end-to-end encryption, audit logging, and role-based access control.

## 🚀 Quick Start

### Access the Interactive Documentation

Once the server is running, you can access the interactive API documentation at:

- **Interactive Swagger UI**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
- **OpenAPI JSON**: [http://localhost:3001/api-docs/json](http://localhost:3001/api-docs/json)
- **OpenAPI YAML**: [http://localhost:3001/api-docs/yaml](http://localhost:3001/api-docs/yaml)

### Start the Development Server

```bash
# Install dependencies
npm install

# Setup API documentation
npm run docs:setup

# Start the development server
npm run dev:server

# Validate API documentation
npm run docs:validate

# Test API documentation endpoints
npm run docs:test
```

## 📊 API Statistics

- **Total Endpoints**: 28+
- **Authentication Endpoints**: 5
- **Physician Portal Endpoints**: 5
- **Patient Portal Endpoints**: 5
- **Questionnaire Management**: 2
- **Response Management**: 5
- **Media Upload**: 6
- **System Endpoints**: 3

## 🔐 Authentication

The API uses JWT Bearer token authentication with optional MFA support.

### Login Flow

1. **POST** `/api/auth/login` - Authenticate with email/password
2. Receive access token (30-minute expiration)
3. Include token in Authorization header: `Bearer <token>`
4. Refresh token before expiration using `/api/auth/refresh`

### Example Authentication

```bash
# Login request
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.smith@centralmedical.com",
    "password": "DevPassword123!",
    "userType": "physician"
  }'

# Use the returned token in subsequent requests
curl -X GET http://localhost:3001/api/physicians/dashboard \
  -H "Authorization: Bearer <your-token-here>"
```

## 👥 User Roles

### Physicians
- Full access to patient management
- Create and assign questionnaires
- Review patient responses
- Export data for analysis
- Access study analytics

### Patients
- View assigned questionnaires
- Submit responses with auto-save
- Upload media files
- View their own response history
- Manage personal profile

## 📝 Core Endpoint Categories

### Authentication (`/api/auth`)
- User login/logout
- Token refresh
- MFA setup and verification
- Password reset
- Account registration (invitation-based)

### Physician Portal (`/api/physicians`)
- Dashboard analytics
- Patient management
- Study oversight
- Response review
- Data export

### Patient Portal (`/api/patients`)
- Profile management
- Questionnaire access
- Response submission
- File uploads
- Notification management

### Questionnaire Management (`/api/questionnaires`)
- Create and update questionnaires
- Version management
- Patient assignment
- Access control

### Response Management (`/api/responses`)
- Create and update responses
- Auto-save functionality
- Submission workflow
- Review and approval

### Media Management (`/api/media`)
- Secure file uploads
- Virus scanning
- File download with access control
- Multiple file types support

## 🛡️ Security Features

### HIPAA Compliance
- Column-level encryption for PHI
- Comprehensive audit logging
- Access control and permissions
- Data anonymization options

### Security Measures
- JWT token authentication
- Rate limiting (100 requests/hour per user)
- Input validation and sanitization
- Virus scanning for uploads
- Secure session management

### Data Protection
- All PII encrypted at rest
- Secure token-based sessions
- HTTPS enforcement in production
- OWASP Top 10 compliance

## 📋 Request/Response Format

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Standard Error Response
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": [
    // Validation errors or additional details
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "unique-request-identifier"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

## 🔄 Common HTTP Status Codes

- `200 OK` - Successful GET request
- `201 Created` - Successful POST request
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `413 Payload Too Large` - File too large
- `423 Locked` - Account temporarily locked
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## 🧪 Testing the API

### Using the Interactive Documentation

1. Visit [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
2. Click "Authorize" to enter your JWT token
3. Expand any endpoint to see details
4. Click "Try it out" to test endpoints directly
5. View real responses and examples

### Using cURL

```bash
# Health check (no auth required)
curl http://localhost:3001/health

# Login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","userType":"patient"}'

# Use token for authenticated requests
curl -X GET http://localhost:3001/api/patients/profile \
  -H "Authorization: Bearer <your-token>"
```

### Using Postman

1. Import the OpenAPI specification:
   - Go to File → Import
   - Select "Link" and paste: `http://localhost:3001/api-docs/json`
2. Set up authentication:
   - Add Authorization header with `Bearer <token>`
3. Test endpoints using the pre-configured requests

## 📱 Android App Integration

### Ready for Integration

This API is specifically designed for Android app integration with:

- Complete OpenAPI 3.0 specification
- Consistent JSON responses
- Proper HTTP status codes
- Comprehensive error handling
- File upload support
- Offline-capable design patterns

### Integration Checklist

- [ ] Import OpenAPI spec into Android project
- [ ] Configure HTTP client with JWT authentication
- [ ] Implement token refresh logic
- [ ] Add file upload capabilities
- [ ] Handle offline data synchronization
- [ ] Implement proper error handling
- [ ] Add network security configuration

### Recommended Android Libraries

- **HTTP Client**: Retrofit + OkHttp
- **JSON Parsing**: Gson or Moshi
- **Authentication**: Android KeyStore for token storage
- **File Upload**: Retrofit with multipart support

## 🔧 Development Commands

```bash
# Setup and validation
npm run docs:setup          # Setup API documentation
npm run docs:validate       # Validate OpenAPI specification
npm run docs:test          # Test documentation endpoints

# Development
npm run dev:server         # Start development server
npm run dev:db            # Start database services
npm run dev:seed          # Seed database with test data

# Testing
npm run test              # Run all tests
npm run test:integration  # Run integration tests
npm run test:security     # Run security tests
```

## 📚 Additional Resources

### Documentation Files
- `openapi.yaml` - Complete OpenAPI 3.0 specification
- `authentication-endpoints.md` - Detailed auth documentation
- `clinical-trial-platform.postman_collection.json` - Postman collection

### Development Tools
- Interactive Swagger UI for testing
- OpenAPI JSON/YAML exports
- Automated endpoint validation
- Security compliance checking

### Support
- Use the interactive documentation for endpoint details
- Check the OpenAPI specification for complete schemas
- Review error codes and responses in the documentation
- Test endpoints directly in the Swagger UI

---

**Note**: This API documentation is generated from the live OpenAPI specification and is always up-to-date with the current implementation. For the most current information, visit the interactive documentation at `/api-docs` when the server is running.