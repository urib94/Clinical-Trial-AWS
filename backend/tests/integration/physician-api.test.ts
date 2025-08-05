import request from 'supertest';
import { app } from '../../server/app';
import { testPool } from '../setup';

describe('Physician API Endpoints', () => {
  let authToken: string;
  let physiciansTestData: any[];

  beforeAll(async () => {
    // Login and get authentication token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test.physician@hospital.com',
        password: 'SecurePassword123!',
        userType: 'physician'
      });

    authToken = loginResponse.body.accessToken;

    // Insert test physicians
    physiciansTestData = [
      {
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice.johnson@hospital.com',
        specialization: 'Cardiology'
      },
      {
        first_name: 'Bob',
        last_name: 'Smith',
        email: 'bob.smith@hospital.com',
        specialization: 'Neurology'
      }
    ];

    await Promise.all(physiciansTestData.map(async (physician) => {
      await testPool.query(`
        INSERT INTO physicians (first_name, last_name, email, specialization) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
      `, [
        physician.first_name, 
        physician.last_name, 
        physician.email, 
        physician.specialization
      ]);
    }));
  });

  describe('GET /api/physicians/profile', () => {
    it('should retrieve physician profile', async () => {
      const response = await request(app)
        .get('/api/physicians/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
    });
  });

  describe('GET /api/physicians', () => {
    it('should list physicians with pagination', async () => {
      const response = await request(app)
        .get('/api/physicians?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('physicians');
      expect(response.body).toHaveProperty('total');
      expect(response.body.physicians.length).toBeGreaterThan(0);
    });

    it('should filter physicians by specialization', async () => {
      const response = await request(app)
        .get('/api/physicians?specialization=Cardiology')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.physicians.every(
        (p: any) => p.specialization === 'Cardiology'
      )).toBe(true);
    });
  });

  describe('PUT /api/physicians/profile', () => {
    it('should update physician profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Physician',
        specialization: 'Oncology'
      };

      const response = await request(app)
        .put('/api/physicians/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.lastName).toBe(updateData.lastName);
      expect(response.body.specialization).toBe(updateData.specialization);
    });

    it('should reject invalid profile updates', async () => {
      const invalidUpdateData = {
        email: 'hacker@evil.com', // Attempting to change email
        firstName: '' // Invalid empty first name
      };

      await request(app)
        .put('/api/physicians/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400);
    });
  });

  describe('GET /api/physicians/dashboard', () => {
    it('should retrieve dashboard data', async () => {
      const response = await request(app)
        .get('/api/physicians/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalPatients');
      expect(response.body).toHaveProperty('activeStudies');
      expect(response.body).toHaveProperty('recentActivities');
    });
  });
});