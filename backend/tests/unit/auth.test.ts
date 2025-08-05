import { generateJWT, verifyToken, hashPassword, comparePassword } from '../../utils/auth';
import jwt from 'jsonwebtoken';

describe('Authentication Utilities', () => {
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