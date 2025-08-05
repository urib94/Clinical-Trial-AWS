import request from 'supertest';
import { app } from '../../server/app';
import sanitizeHtml from 'sanitize-html';

describe('Security Input Validation', () => {
  describe('XSS Protection', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
      '<svg/onload=alert("XSS")>'
    ];

    it('should sanitize XSS attempts in patient registration', async () => {
      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/patients/register')
          .send({
            firstName: payload,
            lastName: 'Doe',
            email: 'xss-test@example.com',
            password: 'SecurePassword123!'
          });

        const sanitizedFirstName = sanitizeHtml(payload, {
          allowedTags: [],
          allowedAttributes: {}
        });

        expect(response.body.firstName).toBe(sanitizedFirstName);
      }
    });

    it('should prevent SQL injection in login', async () => {
      const sqlInjectionPayloads = [
        "' OR 1=1 --",
        "' UNION SELECT * FROM users --",
        "admin' --"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: payload,
            userType: 'physician'
          })
          .expect(401);

        expect(response.body).not.toHaveProperty('accessToken');
      }
    });
  });

  describe('Input Length Validation', () => {
    it('should reject extremely long inputs', async () => {
      const longString = 'a'.repeat(5000);

      const response = await request(app)
        .post('/api/patients/register')
        .send({
          firstName: longString,
          lastName: 'Doe',
          email: 'long-input@example.com',
          password: 'SecurePassword123!'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Email Validation', () => {
    const invalidEmails = [
      'invalid-email',
      'invalid@',
      '@invalid.com',
      'invalid@invalid',
      'invalid@.com'
    ];

    it('should reject invalid email formats', async () => {
      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/patients/register')
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: email,
            password: 'SecurePassword123!'
          })
          .expect(400);

        expect(response.body).toHaveProperty('errors');
      }
    });
  });

  describe('Password Complexity', () => {
    const weakPasswords = [
      'password',
      '12345678',
      'qwerty',
      'password123'
    ];

    it('should reject weak passwords', async () => {
      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/patients/register')
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: 'weak-pass@example.com',
            password: password
          })
          .expect(400);

        expect(response.body).toHaveProperty('errors');
      }
    });
  });
});