import { describe, it, expect, beforeEach } from 'vitest';

const inventoryService = {
  async getInventory(filters?: any) {
    const token = localStorage.getItem('accessToken');
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/api/v1/inventory${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch inventory');
    return response.json();
  },

  async recordMovement(data: any) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/v1/inventory/movements', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to record movement');
    return response.json();
  },

  async getAlerts() {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/v1/inventory/alerts', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch alerts');
    return response.json();
  },
};

describe('inventoryService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('accessToken', 'mock-token');
  });

  describe('getInventory', () => {
    it('should fetch inventory items', async () => {
      const result = await inventoryService.getInventory();
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should apply location filter', async () => {
      const result = await inventoryService.getInventory({ location: 'Warehouse A' });
      
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('recordMovement', () => {
    it('should record inventory movement', async () => {
      const movementData = {
        product_id: 'prod-123',
        quantity: 50,
        type: 'TRANSFER',
        from_location: 'Warehouse A',
        to_location: 'Warehouse B',
      };

      const result = await inventoryService.recordMovement(movementData);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
  });

  describe('getAlerts', () => {
    it('should fetch inventory alerts', async () => {
      const result = await inventoryService.getAlerts();
      
      expect(result).toBeInstanceOf(Array);
    });
  });
});
