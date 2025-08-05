import { generateJWT, verifyToken, hashPassword, comparePassword, validateUserRole } from '../../auth/utils/auth';
import { getUserRolePermissions } from '../../auth/middleware/rbac';
import jwt from 'jsonwebtoken';

describe('Authentication Utilities', () => {
  // Additional imports for mocking
  const crypto = require('crypto');
  const mockSecretKey = 'test_secret_key';
  const testUser = {
    id: '1',
    email: 'test@example.com',
    role: 'physician'
  };

  describe('JWT Generation', () => {
    it('should generate a valid JWT token', () => {
      const token = generateJWT(testUser);
      expect(token).toBeTruthy();
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      expect(decoded).toHaveProperty('id', testUser.id);
      expect(decoded).toHaveProperty('email', testUser.email);
      expect(decoded).toHaveProperty('role', testUser.role);
    });

    it('should generate tokens with correct expiration', () => {
      const token = generateJWT(testUser);
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      
      expect(decoded.exp).toBeDefined();
      const expiresIn = (decoded.exp || 0) - (decoded.iat || 0);
      expect(expiresIn).toBe(3600); // 1 hour default
    });
  });

  describe('Token Verification', () => {
    it('should verify a valid token', () => {
      const token = generateJWT(testUser);
      const verified = verifyToken(token);
      
      expect(verified).toBeTruthy();
      expect(verified).toHaveProperty('id', testUser.id);
    });

    it('should reject an invalid token', () => {
      const invalidToken = 'clearly.not.a.valid.token';
      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should handle token tampering detection', () => {
      const originalToken = generateJWT(testUser);
      const tamperedToken = originalToken.replace(/^(.+?\.)(.+?)(\..+?)$/, '$1' + crypto.randomBytes(20).toString('base64') + '$3');
      
      expect(() => verifyToken(tamperedToken)).toThrow('invalid token');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should validate user roles correctly', () => {
      const physicianPermissions = getUserRolePermissions('physician');
      const patientPermissions = getUserRolePermissions('patient');
      
      expect(physicianPermissions).toContain('read:patient_records');
      expect(patientPermissions).not.toContain('write:patient_records');
    });

    it('should reject invalid roles', () => {
      expect(() => getUserRolePermissions('hacker')).toThrow('Invalid user role');
    });
  });

  describe('Password Hashing', () => {
    const plainPassword = 'TestPassword123!';

    it('should hash a password', async () => {
      const hashedPassword = await hashPassword(plainPassword);
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(20);
    });

    it('should compare passwords correctly', async () => {
      const hashedPassword = await hashPassword(plainPassword);
      
      const matchResult = await comparePassword(plainPassword, hashedPassword);
      expect(matchResult).toBe(true);

      const wrongPasswordResult = await comparePassword('WrongPassword', hashedPassword);
      expect(wrongPasswordResult).toBe(false);
    });
  });
});