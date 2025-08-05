import request from 'supertest';
import { app } from '../../server/app';
import { generateJWT } from '../../auth/utils/jwt-validation';

describe('Authentication Security Tests', () => {
  const validPhysicianCredentials = {
    email: 'security.test.physician@hospital.com',
    password: 'SecureTest123!',
    userType: 'physician'
  };

  const validPatientCredentials = {
    email: 'security.test.patient@example.com',
    password: 'PatientSecure456!',
    userType: 'patient'
  };

  describe('Input Validation', () => {
    it('should prevent XSS in login credentials', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '"><img src=x onerror=alert("XSS")>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: payload,
            userType: 'physician'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should prevent SQL injection in login', async () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "1' AND 1=1--+",
        "1 OR '1'='1'"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: payload,
            userType: 'physician'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    let physicianToken: string;
    let patientToken: string;

    beforeAll(async () => {
      const physicianLogin = await request(app)
        .post('/api/auth/login')
        .send(validPhysicianCredentials);
      
      const patientLogin = await request(app)
        .post('/api/auth/login')
        .send(validPatientCredentials);

      physicianToken = physicianLogin.body.accessToken;
      patientToken = patientLogin.body.accessToken;
    });

    it('should prevent patient from accessing physician resources', async () => {
      const response = await request(app)
        .get('/api/physicians/dashboard')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    it('should prevent unauthorized access to sensitive patient data', async () => {
      const response = await request(app)
        .get('/api/patients/medical-records/123')
        .set('Authorization', `Bearer ${physicianToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Unauthorized access');
    });
  });

  describe('Token Security', () => {
    it('should reject expired tokens', async () => {
      const expiredToken = generateJWT(
        { id: 'test-user', userType: 'physician' }, 
        { expiresIn: '1ms' }
      );

      const response = await request(app)
        .get('/api/physicians/dashboard')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Token expired');
    });

    it('should reject tokens with invalid signature', async () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature';

      const response = await request(app)
        .get('/api/physicians/dashboard')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });

  describe('Brute Force Protection', () => {
    it('should lock account after multiple failed login attempts', async () => {
      const failedAttempts = Array(10).fill(null).map(() => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: validPhysicianCredentials.email,
            password: 'WrongPassword123!',
            userType: 'physician'
          })
      );

      const responses = await Promise.all(failedAttempts);
      
      const lockedResponses = responses.filter(res => res.status === 429);
      expect(lockedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Password Reset Security', () => {
    it('should generate time-limited reset tokens', async () => {
      const resetRequest = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validPhysicianCredentials.email });

      expect(resetRequest.status).toBe(200);
      expect(resetRequest.body).toHaveProperty('resetToken');
      expect(resetRequest.body).toHaveProperty('expiresAt');
    });

    it('should prevent password reset with expired token', async () => {
      // Simulating an expired reset token
      const expiredResetToken = 'expired.token.signature';

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken: expiredResetToken,
          newPassword: 'NewSecurePassword789!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid or expired reset token');
    });
  });
});