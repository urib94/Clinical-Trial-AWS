# Clinical Trial Platform - Backend Development Environment

## Overview
This local development environment provides a complete backend simulation of the Clinical Trial Platform, featuring secure patient data management, questionnaire systems, and file uploads with comprehensive authentication and authorization.

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

### One-Command Setup
```bash
# Run the automated setup script
npm run dev:setup

# Or manually:
node scripts/setup-local.js
```

This will:
- ✅ Install all dependencies
- ✅ Start Docker services (PostgreSQL, Redis, MinIO)
- ✅ Initialize the database with schema
- ✅ Seed test data
- ✅ Configure environment variables

### Start Development Server
```bash
npm run dev:server
```

Your API will be available at: **http://localhost:3001**

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev:server` | Start API server with auto-reload |
| `npm run dev:services` | Start all Docker services |
| `npm run dev:db` | Start only database services |
| `npm run dev:seed` | Re-seed database with test data |
| `npm run dev:reset` | Reset and re-seed database |
| `npm run dev:migrate` | Run database migrations |
| `npm run dev:clean` | Clean up Docker resources |

## 🌐 Available Services

| Service | URL | Purpose |
|---------|-----|---------|
| **API Server** | http://localhost:3001 | Main backend API |
| **Health Check** | http://localhost:3001/health | System status |
| **API Docs** | http://localhost:3001/api | API documentation |
| **pgAdmin** | http://localhost:5050 | Database management |
| **MinIO Console** | http://localhost:9001 | File storage management |

## 🔐 Test Credentials

### Physician Login
- **Email:** `dr.smith@centralmedical.com`
- **Password:** `DevPassword123!`

### Patient Login
- **Email:** `patient1@example.com`
- **Password:** `PatientPass123!`

### Database Access (pgAdmin)
- **Email:** `admin@clinical-trial.local`
- **Password:** `admin123`

### File Storage (MinIO)
- **Username:** `minioadmin`
- **Password:** `minioadmin123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration (invitation-based)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Physicians
- `GET /api/physicians/dashboard` - Dashboard overview
- `GET /api/physicians/patients` - List patients
- `GET /api/physicians/profile` - Get physician profile
- `PUT /api/physicians/profile` - Update physician profile

### Patients
- `GET /api/patients/dashboard` - Patient dashboard
- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update patient profile
- `GET /api/patients/questionnaires` - Available questionnaires

### Questionnaires
- `GET /api/questionnaires` - List questionnaires
- `GET /api/questionnaires/:id` - Get questionnaire details
- `POST /api/questionnaires` - Create questionnaire (physicians only)

### Responses
- `GET /api/responses` - List responses
- `POST /api/responses` - Create/submit response
- `PUT /api/responses/:id` - Update response
- `POST /api/responses/:id/submit` - Submit response

### Media Upload
- `POST /api/media/upload` - Upload single file
- `POST /api/media/upload-multiple` - Upload multiple files
- `GET /api/media` - List uploaded files

## 🗄️ Database Schema

### Core Tables
- **organizations** - Healthcare organizations
- **physicians** - Healthcare professionals
- **patients** - Trial participants (with encrypted PII)
- **studies** - Clinical trial studies
- **questionnaires** - Assessment forms
- **patient_responses** - Encrypted patient responses
- **media_uploads** - File uploads with virus scanning

### Security Tables
- **user_sessions** - Active user sessions
- **token_blacklist** - Revoked JWT tokens
- **access_audit_log** - Comprehensive audit trail
- **security_incidents** - Security event tracking

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based authentication** with refresh tokens
- **Role-based access control** (RBAC)
- **Session management** with Redis
- **MFA support** (simulated in development)
- **Rate limiting** on all endpoints

### Data Protection
- **Column-level encryption** for patient PII
- **HIPAA-aligned security controls**
- **Comprehensive audit logging**
- **Input validation and sanitization**
- **File upload security** with virus scanning simulation

### Development Safety
- **Simulated encryption** (not production-ready)
- **Mock external services**
- **Detailed error logging**
- **Request/response auditing**

## 📊 Sample Data

The system includes realistic test data:
- **3 Organizations** (Hospital, Research Center, Clinic)
- **3 Physicians** with different specializations
- **3 Patients** with encrypted medical data
- **3 Clinical Studies** in various phases
- **3 Questionnaires** with validation rules
- **Physician-patient relationships**
- **Patient study enrollments**

## 🔧 Development Tips

### Environment Variables
The `.env` file contains all configuration. Key variables:
```bash
NODE_ENV=development
PORT=3001
DB_HOST=localhost
JWT_SECRET=dev-jwt-secret-change-in-production-2024
```

### Database Operations
```bash
# Run migrations
node backend/database/migrate.js up

# Seed test data
node backend/database/seed-data.js seed

# Reset everything
node backend/database/seed-data.js reset
```

### Docker Management
```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Clean everything
docker-compose down -v
```

## 🧪 Testing

### Manual API Testing
Use tools like Postman or curl:

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dr.smith@centralmedical.com","password":"DevPassword123!","userType":"physician"}'

# Get dashboard (replace TOKEN with actual JWT)
curl http://localhost:3001/api/physicians/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Database Queries
Connect to PostgreSQL directly:
```bash
# Using psql
psql -h localhost -p 5432 -U api_user -d clinical_trial_dev

# View physicians
SELECT id, email, first_name, last_name, specialization FROM physicians;

# View encrypted patient data (shows encrypted fields)
SELECT id, email, first_name_encrypted, status FROM patients;
```

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port 3001
netstat -ano | findstr :3001
# Kill the process
taskkill /PID <process_id> /F
```

**Docker Services Won't Start**
```bash
# Clean up Docker
npm run dev:clean
# Restart Docker Desktop
# Try setup again
npm run dev:setup
```

**Database Connection Errors**
```bash
# Check PostgreSQL is running
docker-compose ps
# View logs
docker-compose logs postgres
# Restart database
docker-compose restart postgres
```

**Permission Errors**
- Run terminal as Administrator (Windows)
- Check Docker Desktop is running
- Ensure ports 3001, 5432, 6379, 9000, 9001, 5050 are available

### Getting Help
1. Check the [Issues](../../issues) section
2. Review Docker logs: `docker-compose logs`
3. Check API logs in the console
4. Verify all services are running: `docker-compose ps`

## 🎯 Next Steps

1. **Start the API server**: `npm run dev:server`
2. **Test the health endpoint**: http://localhost:3001/health
3. **Explore the API**: http://localhost:3001/api
4. **Login with test credentials** and explore endpoints
5. **Check the database** via pgAdmin at http://localhost:5050

## 📚 Architecture Notes

This local environment simulates the production AWS architecture:
- **Express.js** simulates AWS Lambda functions
- **PostgreSQL** simulates Aurora Serverless v2
- **Redis** simulates ElastiCache
- **MinIO** simulates S3 storage
- **Local JWT** simulates AWS Cognito

The code is structured to be easily deployable to AWS with minimal changes.

---

Happy coding! 🎉