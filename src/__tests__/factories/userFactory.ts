/**
 * User Test Data Factory
 * Provides consistent test data for user-related tests
 */

export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  phone: null,
  first_name: 'John',
  last_name: 'Doe',
  password: '$2a$10$hashedpassword123',
  is_active: true,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  ...overrides,
});

export const createMockRegisterData = (overrides = {}) => ({
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@example.com',
  password: 'Test123!@#',
  hasConsentedToTerms: true,
  hasConsentedToPrivacy: true,
  hasConsentedToCookies: true,
  ...overrides,
});

export const createMockLoginCredentials = (overrides = {}) => ({
  emailOrPhone: 'test@example.com',
  password: 'Test123!@#',
  deviceInfo: 'Test Device',
  userAgent: 'Test User Agent',
  ipAddress: '127.0.0.1',
  ...overrides,
});

export const createMockTokens = (overrides = {}) => ({
  accessToken: 'mock_access_token_123',
  refreshToken: 'mock_refresh_token_456',
  expiresIn: 86400,
  ...overrides,
});

export const createMockJWTPayload = (overrides = {}) => ({
  userId: 'user-123',
  tenantId: 'tenant-456',
  role: 'OWNER',
  type: 'access' as const,
  sessionId: 'session-789',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 86400,
  ...overrides,
});
