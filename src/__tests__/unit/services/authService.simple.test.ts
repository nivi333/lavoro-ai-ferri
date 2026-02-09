/**
 * AuthService Unit Tests
 * Tests password hashing, token generation, and authentication logic
 */

import { AuthService } from '../../../services/authService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  createMockUser,
  createMockRegisterData,
  createMockLoginCredentials,
} from '../../factories/userFactory';
import { globalPrisma } from '../../../database/connection';
import { redisClient } from '../../../utils/redis';
import gdprService from '../../../services/gdprService';

// Mock external dependencies
jest.mock('../../../database/connection', () => {
  const actual = jest.requireActual('../../../database/connection');
  return {
    ...actual,
    globalPrisma: {
      ...actual.globalPrisma,
      users: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      sessions: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };
});

jest.mock('../../../services/gdprService', () => ({
  recordConsent: jest.fn(),
}));

jest.mock('../../../utils/redis', () => ({
  redisClient: {
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('../../../services/gdprService', () => ({
  recordConsent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('AuthService - Password Hashing', () => {
  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'Test123!@#';
      const hashedPassword = await AuthService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(20);
      expect(hashedPassword).toMatch(/^\$2[aby]\$/);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Test123!@#';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching passwords', async () => {
      const plainPassword = 'Test123!@#';
      const hashedPassword = await AuthService.hashPassword(plainPassword);

      const isMatch = await AuthService.verifyPassword(plainPassword, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const plainPassword = 'Test123!@#';
      const wrongPassword = 'WrongPassword';
      const hashedPassword = await AuthService.hashPassword(plainPassword);

      const isMatch = await AuthService.verifyPassword(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });
  });
});

describe('AuthService - User Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register new user successfully', async () => {
    const registerData = createMockRegisterData();
    const mockUser = createMockUser({
      email: registerData.email,
      first_name: registerData.firstName,
      last_name: registerData.lastName,
    });

    (globalPrisma.users.findFirst as jest.Mock).mockResolvedValue(null);
    (globalPrisma.users.create as jest.Mock).mockResolvedValue(mockUser);
    (globalPrisma.sessions.create as jest.Mock).mockResolvedValue({ id: 'session-123' });
    (redisClient.set as jest.Mock).mockResolvedValue('OK');
    (gdprService.recordConsent as jest.Mock).mockResolvedValue(undefined);

    const result = await AuthService.register(registerData);

    expect(result.user.email).toBe(registerData.email);
    expect(result.user.first_name).toBe(registerData.firstName);
    expect(result.user.last_name).toBe(registerData.lastName);
    expect(result.tokens).toBeDefined();
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it('should require email or phone', async () => {
    const invalidData: any = {
      firstName: 'John',
      lastName: 'Doe',
      password: 'Test123!@#',
    };

    await expect(AuthService.register(invalidData)).rejects.toThrow(
      'Email or phone number is required'
    );
  });

  it('should reject duplicate email', async () => {
    const registerData = createMockRegisterData();
    const existingUser = createMockUser({ email: registerData.email });

    (globalPrisma.users.findFirst as jest.Mock).mockResolvedValue(existingUser);

    await expect(AuthService.register(registerData)).rejects.toThrow(
      'User already exists with this email or phone'
    );
  });

  it('should hash password before saving', async () => {
    const registerData = createMockRegisterData();
    const mockUser = createMockUser();

    (globalPrisma.users.findFirst as jest.Mock).mockResolvedValue(null);
    (globalPrisma.users.create as jest.Mock).mockImplementation(async (data: any) => {
      expect(data.data.password).not.toBe(registerData.password);
      expect(data.data.password).toMatch(/^\$2[aby]\$/);
      return mockUser;
    });
    (globalPrisma.sessions.create as jest.Mock).mockResolvedValue({ id: 'session-123' });
    (redisClient.set as jest.Mock).mockResolvedValue('OK');

    await AuthService.register(registerData);

    expect(globalPrisma.users.create).toHaveBeenCalled();
  });

  it('should create GDPR consent records', async () => {
    const registerData = createMockRegisterData({
      hasConsentedToTerms: true,
      hasConsentedToPrivacy: true,
      hasConsentedToCookies: true,
    });
    const mockUser = createMockUser();

    (globalPrisma.users.findFirst as jest.Mock).mockResolvedValue(null);
    (globalPrisma.users.create as jest.Mock).mockResolvedValue(mockUser);
    (globalPrisma.sessions.create as jest.Mock).mockResolvedValue({ id: 'session-123' });
    (redisClient.set as jest.Mock).mockResolvedValue('OK');
    (gdprService.recordConsent as jest.Mock).mockResolvedValue(undefined);

    await AuthService.register(registerData);

    expect(gdprService.recordConsent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUser.id,
        consentType: 'TERMS_AND_CONDITIONS',
        hasConsented: true,
      })
    );
  });
});

describe('AuthService - User Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login with valid credentials', async () => {
    const credentials = createMockLoginCredentials();
    const hashedPassword = await AuthService.hashPassword(credentials.password);
    const mockUser = createMockUser({
      email: credentials.emailOrPhone,
      password: hashedPassword,
    });

    (globalPrisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (globalPrisma.sessions.create as jest.Mock).mockResolvedValue({ id: 'session-123' });
    (redisClient.set as jest.Mock).mockResolvedValue('OK');

    const result = await AuthService.login(credentials);

    expect(result.user.email).toBe(credentials.emailOrPhone);
    expect(result.tokens).toBeDefined();
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const credentials = createMockLoginCredentials({ password: 'WrongPassword' });
    const hashedPassword = await AuthService.hashPassword('CorrectPassword');
    const mockUser = createMockUser({ password: hashedPassword });

    (globalPrisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);

    await expect(AuthService.login(credentials)).rejects.toThrow('Invalid credentials');
  });

  it('should reject non-existent user', async () => {
    const credentials = createMockLoginCredentials({ emailOrPhone: 'nonexistent@example.com' });

    (globalPrisma.users.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(AuthService.login(credentials)).rejects.toThrow('User not found');
  });

  it('should reject inactive user', async () => {
    const credentials = createMockLoginCredentials();
    const hashedPassword = await AuthService.hashPassword(credentials.password);
    const mockUser = createMockUser({ is_active: false, password: hashedPassword });

    (globalPrisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);

    await expect(AuthService.login(credentials)).rejects.toThrow('Invalid credentials');
  });
});

describe('AuthService - Token Management', () => {
  it('should generate access and refresh tokens', () => {
    const userId = 'user-123';
    const sessionId = 'session-456';

    const accessToken = AuthService.generateAccessToken({ userId, sessionId });
    const refreshToken = AuthService.generateRefreshToken({ userId, sessionId });

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
  });

  it('should include user info in JWT payload', () => {
    const payload = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      role: 'OWNER',
      sessionId: 'session-789',
    };

    const accessToken = AuthService.generateAccessToken(payload);
    const decoded = AuthService.verifyToken(accessToken, 'access');

    expect(decoded.userId).toBe('user-123');
    expect(decoded.tenantId).toBe('tenant-456');
    expect(decoded.role).toBe('OWNER');
    expect(decoded.type).toBe('access');
  });

  it('should verify valid tokens', () => {
    const payload = {
      userId: 'user-123',
      sessionId: 'session-456',
    };

    const token = AuthService.generateAccessToken(payload);
    const decoded = AuthService.verifyToken(token, 'access');

    expect(decoded.userId).toBe('user-123');
    expect(decoded.sessionId).toBe('session-456');
    expect(decoded.type).toBe('access');
  });

  it('should verify refresh tokens separately', () => {
    const payload = {
      userId: 'user-123',
      sessionId: 'session-456',
    };

    const refreshToken = AuthService.generateRefreshToken(payload);
    const decoded = AuthService.verifyToken(refreshToken, 'refresh');

    expect(decoded.userId).toBe('user-123');
    expect(decoded.sessionId).toBe('session-456');
    expect(decoded.type).toBe('refresh');
  });
});
