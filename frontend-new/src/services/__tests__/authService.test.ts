import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/mocks/server';

const authService = {
  async login(credentials: { identifier: string; password: string }) {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  async register(data: { email: string; phone: string; password: string; firstName: string; lastName: string }) {
    const response = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  async logout() {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Logout failed');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return response.json();
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) throw new Error('Token refresh failed');
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    return data;
  },
};

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('login', () => {
    it('should send login request with credentials', async () => {
      const credentials = { identifier: 'test@example.com', password: 'Test123!@#' };
      const result = await authService.login(credentials);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw error on failed login', async () => {
      server.use(
        http.post('/api/v1/auth/login', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const credentials = { identifier: 'test@example.com', password: 'wrong' };
      
      await expect(authService.login(credentials)).rejects.toThrow('Login failed');
    });

    it('should handle network errors', async () => {
      server.use(
        http.post('/api/v1/auth/login', () => {
          return HttpResponse.error();
        })
      );

      const credentials = { identifier: 'test@example.com', password: 'Test123!@#' };
      
      await expect(authService.login(credentials)).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('should send registration request with user data', async () => {
      const userData = {
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await authService.register(userData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw error on failed registration', async () => {
      server.use(
        http.post('/api/v1/auth/register', () => {
          return new HttpResponse(null, { status: 400 });
        })
      );

      const userData = {
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
      };
      
      await expect(authService.register(userData)).rejects.toThrow('Registration failed');
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post('/api/v1/auth/register', () => {
          return new HttpResponse(null, { status: 422 });
        })
      );

      const userData = {
        email: 'invalid-email',
        phone: '',
        password: '123',
        firstName: '',
        lastName: '',
      };
      
      await expect(authService.register(userData)).rejects.toThrow('Registration failed');
    });
  });

  describe('logout', () => {
    it('should send logout request with token', async () => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');

      const result = await authService.logout();

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Logged out successfully');
    });

    it('should clear tokens from localStorage', async () => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');

      await authService.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('should throw error on failed logout', async () => {
      localStorage.setItem('accessToken', 'mock-access-token');

      server.use(
        http.post('/api/v1/auth/logout', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );
      
      await expect(authService.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('refreshToken', () => {
    it('should send refresh token request', async () => {
      localStorage.setItem('refreshToken', 'mock-refresh-token');

      const result = await authService.refreshToken();

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('new-mock-access-token');
    });

    it('should update access token in localStorage', async () => {
      localStorage.setItem('refreshToken', 'mock-refresh-token');

      await authService.refreshToken();

      expect(localStorage.getItem('accessToken')).toBe('new-mock-access-token');
    });

    it('should throw error on failed refresh', async () => {
      localStorage.setItem('refreshToken', 'expired-refresh-token');

      server.use(
        http.post('/api/v1/auth/refresh', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );
      
      await expect(authService.refreshToken()).rejects.toThrow('Token refresh failed');
    });
  });

  describe('Token Management', () => {
    it('should handle missing refresh token', async () => {
      localStorage.removeItem('refreshToken');

      const result = await authService.refreshToken();

      expect(result).toHaveProperty('accessToken');
      expect(localStorage.getItem('accessToken')).toBe('new-mock-access-token');
    });

    it('should handle missing access token in logout', async () => {
      localStorage.removeItem('accessToken');

      const result = await authService.logout();

      expect(result).toHaveProperty('message');
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });
});
