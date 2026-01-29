import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/mocks/server';

const productService = {
  async getProducts(filters?: any) {
    const token = localStorage.getItem('accessToken');
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/api/v1/products${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  async createProduct(data: any) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/v1/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
  },

  async adjustStock(productId: string, data: any) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/v1/products/${productId}/stock-adjustment`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to adjust stock');
    return response.json();
  },
};

describe('productService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('accessToken', 'mock-token');
  });

  describe('getProducts', () => {
    it('should fetch products', async () => {
      const result = await productService.getProducts();
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should apply filters', async () => {
      const result = await productService.getProducts({ category: 'fabric', search: 'cotton' });
      
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('createProduct', () => {
    it('should create product', async () => {
      const productData = {
        name: 'Cotton Fabric',
        sku: 'FAB-001',
        costPrice: 100,
        sellingPrice: 150,
      };

      const result = await productService.createProduct(productData);
      expect(result).toHaveProperty('id');
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock quantity', async () => {
      const adjustmentData = {
        adjustmentType: 'ADD',
        quantity: 100,
        reason: 'Purchase',
      };

      const result = await productService.adjustStock('prod-123', adjustmentData);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
  });
});
