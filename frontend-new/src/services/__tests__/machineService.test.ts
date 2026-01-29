import { describe, it, expect, beforeEach } from 'vitest';

const machineService = {
  async getMachines(filters?: any) {
    const token = localStorage.getItem('accessToken');
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/api/v1/machines${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch machines');
    return response.json();
  },

  async createMachine(data: any) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/v1/machines', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create machine');
    return response.json();
  },

  async scheduleMaintenance(data: any) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/v1/machines/maintenance/schedules', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to schedule maintenance');
    return response.json();
  },
};

describe('machineService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('accessToken', 'mock-token');
  });

  describe('getMachines', () => {
    it('should fetch machines', async () => {
      const result = await machineService.getMachines();
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should apply status filter', async () => {
      const result = await machineService.getMachines({ status: 'IN_USE' });
      
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('createMachine', () => {
    it('should create machine', async () => {
      const machineData = {
        name: 'Loom Machine 01',
        machineType: 'WEAVING_LOOM',
        serialNumber: 'WL-2024-001',
      };

      const result = await machineService.createMachine(machineData);
      expect(result).toHaveProperty('id');
    });
  });

  describe('scheduleMaintenance', () => {
    it('should schedule maintenance', async () => {
      const maintenanceData = {
        machine_id: 'mach-123',
        maintenanceType: 'PREVENTIVE',
        scheduledDate: '2024-02-01',
      };

      const result = await machineService.scheduleMaintenance(maintenanceData);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
  });
});
