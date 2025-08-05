import request from 'supertest';
import { app } from '../../server/app';
import { performance } from 'perf_hooks';

describe('API Performance Tests', () => {
  const validPhysicianCredentials = {
    email: 'perf.test.physician@hospital.com',
    password: 'PerfTestPass123!',
    userType: 'physician'
  };

  beforeAll(async () => {
    // Ensure test user exists
    // This would typically involve setting up a test user in the database
  });

  describe('Login Performance', () => {
    it('should login within acceptable response time', async () => {
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(validPhysicianCredentials)
        .expect(200);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200); // 200ms threshold
      expect(response.body).toHaveProperty('accessToken');
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 50 concurrent login requests', async () => {
      const loginRequests = Array(50).fill(null).map(() => 
        request(app)
          .post('/api/auth/login')
          .send(validPhysicianCredentials)
      );

      const responses = await Promise.all(loginRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
      });
    });
  });

  describe('API Endpoint Response Times', () => {
    const endpoints = [
      { method: 'get', path: '/api/health', name: 'Health Check' },
      { method: 'get', path: '/api/physicians/dashboard', name: 'Physician Dashboard', requireAuth: true },
      { method: 'get', path: '/api/patients/studies', name: 'Patient Studies', requireAuth: true }
    ];

    endpoints.forEach(endpoint => {
      it(`${endpoint.name} should respond within 300ms`, async () => {
        let authToken = '';
        
        // Get authentication token if required
        if (endpoint.requireAuth) {
          const loginResponse = await request(app)
            .post('/api/auth/login')
            .send(validPhysicianCredentials);
          
          authToken = loginResponse.body.accessToken;
        }

        const startTime = performance.now();
        
        const response = await request(app)[endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(300); // 300ms threshold
      });
    });
  });

  describe('Database Query Performance', () => {
    it('should fetch physician dashboard data efficiently', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(validPhysicianCredentials);
      
      const authToken = loginResponse.body.accessToken;

      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/physicians/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(500); // 500ms threshold for complex dashboard query
      expect(response.body).toHaveProperty('totalPatients');
      expect(response.body).toHaveProperty('activeStudies');
    });
  });
});