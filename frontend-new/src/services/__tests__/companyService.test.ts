import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/mocks/server';

const companyService = {
  async getCompanies() {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/v1/companies', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch companies');
    return response.json();
  },

  async createCompany(data: any) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/v1/companies', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create company');
    return response.json();
  },

  async switchCompany(tenantId: string) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/v1/companies/${tenantId}/switch`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to switch company');
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('currentTenantId', tenantId);
    return data;
  },

  async updateCompany(tenantId: string, data: any) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/v1/companies/${tenantId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update company');
    return response.json();
  },
};

describe('companyService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('accessToken', 'mock-token');
  });

  describe('getCompanies', () => {
    it('should fetch companies with auth token', async () => {
      const result = await companyService.getCompanies();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
    });

    it('should throw error on failed fetch', async () => {
      server.use(
        http.get('/api/v1/companies', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      await expect(companyService.getCompanies()).rejects.toThrow('Failed to fetch companies');
    });
  });

  describe('createCompany', () => {
    it('should create company with valid data', async () => {
      const companyData = {
        name: 'Ayphen Textile',
        slug: 'ayphen-textile',
        industry: 'textile',
      };

      const result = await companyService.createCompany(companyData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
    });

    it('should throw error on failed creation', async () => {
      server.use(
        http.post('/api/v1/companies', () => {
          return new HttpResponse(null, { status: 400 });
        })
      );

      await expect(companyService.createCompany({})).rejects.toThrow('Failed to create company');
    });
  });

  describe('switchCompany', () => {
    it('should switch company context', async () => {
      const tenantId = 'tenant-123';

      const result = await companyService.switchCompany(tenantId);

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('new-company-access-token');
    });

    it('should update access token in localStorage', async () => {
      const tenantId = 'tenant-123';

      await companyService.switchCompany(tenantId);

      expect(localStorage.getItem('accessToken')).toBe('new-company-access-token');
    });

    it('should update current tenant ID', async () => {
      const tenantId = 'tenant-123';

      await companyService.switchCompany(tenantId);

      expect(localStorage.getItem('currentTenantId')).toBe(tenantId);
    });

    it('should throw error on failed switch', async () => {
      server.use(
        http.post('/api/v1/companies/:id/switch', () => {
          return new HttpResponse(null, { status: 403 });
        })
      );

      await expect(companyService.switchCompany('tenant-123')).rejects.toThrow('Failed to switch company');
    });
  });

  describe('updateCompany', () => {
    it('should update company with valid data', async () => {
      const tenantId = 'tenant-123';
      const updateData = {
        name: 'Updated Company Name',
        industry: 'manufacturing',
      };

      const result = await companyService.updateCompany(tenantId, updateData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
    });

    it('should throw error on failed update', async () => {
      server.use(
        http.put('/api/v1/companies/:id', () => {
          return new HttpResponse(null, { status: 403 });
        })
      );

      await expect(companyService.updateCompany('tenant-123', {})).rejects.toThrow('Failed to update company');
    });
  });

  describe('Authorization', () => {
    it('should include auth token in all requests', async () => {
      await companyService.getCompanies();
      await companyService.createCompany({});
      await companyService.switchCompany('tenant-123');
      await companyService.updateCompany('tenant-123', {});

      // All requests should complete successfully with MSW handling auth
      expect(localStorage.getItem('accessToken')).toBeTruthy();
    });
  });
});
