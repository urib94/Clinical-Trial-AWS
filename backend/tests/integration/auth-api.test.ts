import request from 'supertest';
import { app } from '../../server/app';
import { testPool } from '../setup';
import { generateJWT } from '../../auth/utils/jwt-validation';

describe('Authentication API', () => {
  const validPhysicianCredentials = {
    email: 'test.physician@hospital.com',
    password: 'SecurePassword123!',
    userType: 'physician'
  };

  const validPatientCredentials = {
    email: 'test.patient@example.com',
    password: 'PatientPass456!',
    userType: 'patient'
  };

  beforeAll(async () => {
    // Setup test users in the database
    await testPool.query(`
      INSERT INTO physicians (email, password, first_name, last_name) 
      VALUES ($1, crypt($2, gen_salt('bf')), 'Test', 'Physician')
      ON CONFLICT (email) DO NOTHING
    `, [validPhysicianCredentials.email, validPhysicianCredentials.password]);

    await testPool.query(`
      INSERT INTO patients (email, password, first_name, last_name) 
      VALUES ($1, crypt($2, gen_salt('bf')), 'Test', 'Patient')
      ON CONFLICT (email) DO NOTHING
    `, [validPatientCredentials.email, validPatientCredentials.password]);
  });

  describe('User Login', () => {
    it('should login physician successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(validPhysicianCredentials)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(validPhysicianCredentials.email);
    });

    it('should login patient successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(validPatientCredentials)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(validPatientCredentials.email);
    });

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'WrongPassword',
          userType: 'physician'
        })
        .expect(401);
    });

    it('should rate limit repeated login attempts', async () => {
      // Simulate multiple login attempts
      const promises = Array(10).fill(null).map(() => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'invalid@example.com',
            password: 'WrongPassword',
            userType: 'physician'
          })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should handle malformed login requests', async () => {
      const invalidRequests = [
        { email: 'test', password: '', userType: '' },
        { email: '', password: 'password', userType: 'hacker' },
        {}
      ];

      for (const req of invalidRequests) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(req);
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Password Reset', () => {
    it('should initiate password reset for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validPhysicianCredentials.email })
        .expect(200);

      expect(response.body).toHaveProperty('resetToken');
      expect(response.body).toHaveProperty('message');
    });

    it('should reject password reset for non-existent email', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);
    });

    it('should handle password reset with valid reset token', async () => {
      // First, request a reset token
      const resetRequest = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validPhysicianCredentials.email });

      const { resetToken } = resetRequest.body;

      // Then attempt to reset password
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'NewSecurePassword789!'
        });

      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body).toHaveProperty('message', 'Password reset successfully');
    });
  });

  describe('MFA (Multi-Factor Authentication)', () => {
    it('should require MFA for login from new device', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(validPhysicianCredentials)
        .expect(200);

      expect(loginResponse.body).toHaveProperty('mfaRequired', true);
      expect(loginResponse.body).toHaveProperty('mfaToken');
    });
  });
});