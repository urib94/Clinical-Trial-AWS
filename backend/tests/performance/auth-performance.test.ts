import request from 'supertest';
import { app } from '../../server/app';
import { generateJWT } from '../../auth/utils/jwt-validation';

describe('Authentication Performance Tests', () => {
  const validPhysicianCredentials = {
    email: 'perf.test.physician@hospital.com',
    password: 'PerfTestSecure123!',
    userType: 'physician'
  };

  describe('Login Performance', () => {
    it('should login under 200ms', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/auth/login')
        .send(validPhysicianCredentials);

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should handle 50 concurrent login attempts', async () => {
      const concurrentLogins = Array(50).fill(null).map(() => 
        request(app)
          .post('/api/auth/login')
          .send(validPhysicianCredentials)
      );

      const responses = await Promise.all(concurrentLogins);

      const successResponses = responses.filter(res => res.status === 200);
      expect(successResponses.length).toBeGreaterThan(40);
    });
  });

  describe('Token Validation Performance', () => {
    let accessToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(validPhysicianCredentials);
      
      accessToken = loginResponse.body.accessToken;
    });

    it('should validate token under 50ms', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/physicians/dashboard')
        .set('Authorization', `Bearer ${accessToken}`);

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(50);
    });

    it('should handle 100 concurrent token validations', async () => {
      const concurrentValidations = Array(100).fill(null).map(() => 
        request(app)
          .get('/api/physicians/dashboard')
          .set('Authorization', `Bearer ${accessToken}`)
      );

      const responses = await Promise.all(concurrentValidations);

      const successResponses = responses.filter(res => res.status === 200);
      expect(successResponses.length).toBe(100);
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should enforce rate limit without significant performance penalty', async () => {
      const loginAttempts = Array(20).fill(null).map(() => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'rate.limit.test@hospital.com',
            password: 'WrongPassword123!',
            userType: 'physician'
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(loginAttempts);
      const responseTime = Date.now() - startTime;

      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(2000); // Total time under 2 seconds
    });
  });
});