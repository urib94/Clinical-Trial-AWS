import request from 'supertest';
import { app } from '../../server/app';
import { testPool } from '../setup';

describe('Patient API Endpoints', () => {
  let authToken: string;
  let patientTestData: any[];

  beforeAll(async () => {
    // Login and get authentication token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test.patient@example.com',
        password: 'PatientPass456!',
        userType: 'patient'
      });

    authToken = loginResponse.body.accessToken;

    // Insert test patients
    patientTestData = [
      {
        first_name: 'Emma',
        last_name: 'Wilson',
        email: 'emma.wilson@example.com',
        date_of_birth: '1990-05-15'
      },
      {
        first_name: 'Michael',
        last_name: 'Brown',
        email: 'michael.brown@example.com',
        date_of_birth: '1985-11-22'
      }
    ];

    await Promise.all(patientTestData.map(async (patient) => {
      await testPool.query(`
        INSERT INTO patients (first_name, last_name, email, date_of_birth) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
      `, [
        patient.first_name, 
        patient.last_name, 
        patient.email, 
        patient.date_of_birth
      ]);
    }));
  });

  describe('GET /api/patients/profile', () => {
    it('should retrieve patient profile', async () => {
      const response = await request(app)
        .get('/api/patients/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
    });
  });

  describe('GET /api/patients/studies', () => {
    it('should list patient clinical studies', async () => {
      const response = await request(app)
        .get('/api/patients/studies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('studies');
      expect(Array.isArray(response.body.studies)).toBe(true);
    });

    it('should filter studies by status', async () => {
      const response = await request(app)
        .get('/api/patients/studies?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.studies.every(
        (study: any) => study.status === 'ACTIVE'
      )).toBe(true);
    });
  });

  describe('PUT /api/patients/profile', () => {
    it('should update patient profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Patient',
        phoneNumber: '+1234567890'
      };

      const response = await request(app)
        .put('/api/patients/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.lastName).toBe(updateData.lastName);
      expect(response.body.phoneNumber).toBe(updateData.phoneNumber);
    });

    it('should reject invalid profile updates', async () => {
      const invalidUpdateData = {
        email: 'hacker@evil.com', // Attempting to change email
        firstName: '' // Invalid empty first name
      };

      await request(app)
        .put('/api/patients/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400);
    });
  });

  describe('POST /api/patients/study-enrollment', () => {
    it('should enroll patient in a clinical study', async () => {
      // First, create a test study
      const studyResponse = await request(app)
        .post('/api/clinical-trials')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Enrollment Study',
          description: 'A study for testing enrollment',
          status: 'RECRUITING'
        });

      const studyId = studyResponse.body.id;

      const enrollmentResponse = await request(app)
        .post('/api/patients/study-enrollment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ studyId })
        .expect(201);

      expect(enrollmentResponse.body).toHaveProperty('enrollmentId');
      expect(enrollmentResponse.body.studyId).toBe(studyId);
    });

    it('should prevent duplicate study enrollment', async () => {
      // Attempt to enroll in the same study twice
      const studyId = 1; // Assuming a pre-existing study ID

      await request(app)
        .post('/api/patients/study-enrollment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ studyId })
        .expect(201);

      await request(app)
        .post('/api/patients/study-enrollment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ studyId })
        .expect(400);
    });
  });
});