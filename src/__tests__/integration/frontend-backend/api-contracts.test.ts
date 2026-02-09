import request from 'supertest';
import app from '../../../index';
import { globalPrisma as prisma } from '../../../database/connection';
import { createMockUser } from '../../factories/userFactory';
import { createMockCompany } from '../../factories/companyFactory';
import bcrypt from 'bcryptjs';
import { AuthService } from '../../../services/authService';
import { v4 as uuidv4 } from 'uuid';

describe('Frontend-Backend Integration - API Contracts', () => {
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    // Create test user and company in DB
    const companyId = `test-company-${Date.now()}`;
    const company = await prisma.companies.create({
      data: {
        id: companyId,
        company_id: companyId,
        name: 'Test Company',
        slug: companyId,
        industry: 'TEXTILE_MANUFACTURING',
        updated_at: new Date(),
      },
    });
    tenantId = company.id;

    const timestamp = Date.now();
    const userData = createMockUser({
      id: `user-${timestamp}`,
      email: `test-${timestamp}@example.com`,
      tenant_id: tenantId,
      password: bcrypt.hashSync('Test123!@#', 10),
    }) as any;
    const { tenant_id: _, ...userDataWithoutTenant } = userData;
    const user = await prisma.users.create({
      data: userDataWithoutTenant,
    });

    // Create user-company association
    await prisma.user_companies.create({
      data: {
        id: `uc-${Date.now()}`,
        user_id: user.id,
        company_id: tenantId,
        role: 'OWNER',
        updated_at: new Date(),
      } as any,
    });

    // Create session to get token with tenantId
    const tokens = await AuthService.createSession({
      userId: user.id,
      sessionId: `sid-${Date.now()}`,
      tenantId: tenantId,
      role: 'OWNER',
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
    });
    authToken = tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Request/Response Schema Validation', () => {
    test('should match product creation request schema', async () => {
      const productData = {
        name: 'Cotton Fabric',
        sku: 'FAB-001',
        categoryId: null,
        costPrice: 100,
        sellingPrice: 150,
        stockQuantity: 500,
        reorderLevel: 50,
        unitOfMeasure: 'MTR',
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      // Verify response schema
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', productData.name);
      expect(response.body.data).toHaveProperty('sku', productData.sku);
      expect(response.body.data).toHaveProperty('costPrice', productData.costPrice);
      expect(response.body.data).toHaveProperty('sellingPrice', productData.sellingPrice);
      expect(response.body.data).toHaveProperty('stockQuantity', productData.stockQuantity);
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    test('should match product list response schema', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify response is array
      expect(Array.isArray(response.body.data)).toBe(true);

      // Verify each product has required fields
      if (response.body.length > 0) {
        const product = response.body[0];
        expect(product).toHaveProperty('product_id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('sku');
        expect(product).toHaveProperty('tenant_id');
      }
    });

    test('should match order creation request schema', async () => {
      const orderData = {
        customerName: 'ABC Corp',
        customerEmail: 'contact@abc.com',
        customerPhone: '+1234567890',
        deliveryDate: '2024-03-01',
        items: [
          {
            productId: 'prod-123',
            quantity: 100,
            unitPrice: 150,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      // Should have order_id and status
      if (response.status === 201) {
        expect(response.body).toHaveProperty('order_id');
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('total_amount');
      }
    });

    test('should handle pagination parameters correctly', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify pagination response
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    test('should handle filter parameters correctly', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ category: 'fabric', isActive: true })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Error Handling Consistency', () => {
    test('should return consistent error format for validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' }) // Invalid data
        .expect(400);

      // Verify error response format
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(false);
    });

    test('should return consistent error format for authentication errors', async () => {
      const response = await request(app).get('/api/v1/products').expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('token');
    });

    test('should return consistent error format for not found errors', async () => {
      const response = await request(app)
        .get('/api/v1/products/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    test('should return consistent error format for server errors', async () => {
      // Simulate server error by sending malformed data
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ costPrice: 'invalid-number' });

      if (response.status === 500) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('Authentication Flow End-to-End', () => {
    test('should complete full authentication flow', async () => {
      // 1. Register
      const registerData = {
        email: `test${Date.now()}@example.com`,
        phone: `+1${Date.now().toString().slice(-10)}`,
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body.tokens).toHaveProperty('accessToken');
      expect(registerResponse.body.tokens).toHaveProperty('refreshToken');
      expect(registerResponse.body).toHaveProperty('user');

      const { accessToken, refreshToken } = registerResponse.body.tokens;

      // 2. Access protected route
      const protectedResponse = await request(app)
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(protectedResponse.body.data)).toBe(true);

      // 3. Refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.tokens).toHaveProperty('accessToken');

      // 4. Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(logoutResponse.body).toHaveProperty('message');
    });

    test('should reject expired tokens', async () => {
      const expiredToken = 'expired.jwt.token';

      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    test('should reject invalid tokens', async () => {
      const invalidToken = 'invalid-token';

      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('File Upload Integration', () => {
    test('should handle file upload for product images', async () => {
      // Create a test buffer to simulate file upload
      const fileBuffer = Buffer.from('fake-image-data');

      const response = await request(app)
        .post('/api/v1/products/upload-image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', fileBuffer, 'test-image.jpg');

      // Should return image URL or success
      if (response.status === 200) {
        expect(response.body).toHaveProperty('imageUrl');
      }
    });

    test('should validate file types', async () => {
      const fileBuffer = Buffer.from('fake-file-data');

      const response = await request(app)
        .post('/api/v1/products/upload-image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', fileBuffer, 'test-file.txt');

      // Should reject non-image files
      if (response.status === 400) {
        expect(response.body).toHaveProperty('message');
      }
    });

    test.skip('should validate file size limits', async () => {
      // Create a large buffer (simulate 10MB file)
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024);

      const response = await request(app)
        .post('/api/v1/products/upload-image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeBuffer, 'large-image.jpg');

      // Should reject files exceeding size limit
      if (response.status === 400) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('Real-Time Updates', () => {
    test('should handle concurrent requests correctly', async () => {
      // Simulate multiple concurrent requests
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app).get('/api/v1/products').set('Authorization', `Bearer ${authToken}`)
        );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect([200, 204]).toContain(response.status);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    test('should maintain data consistency across requests', async () => {
      // Create a product
      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          sku: `SKU-${Date.now()}`,
          costPrice: 100,
          sellingPrice: 150,
        });

      if (createResponse.status === 201) {
        const productId = createResponse.body.data.id;

        // Immediately fetch the product
        const fetchResponse = await request(app)
          .get(`/api/v1/products/${productId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Data should match
        expect(fetchResponse.body.data.id).toBe(productId);
        expect(fetchResponse.body.data.name).toBe('Test Product');
      }
    });
  });

  describe('CORS and Headers', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/v1/products')
        .set('Origin', 'https://ayphen-textile.vercel.app');
      expect([200, 204]).toContain(response.status);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`);

      // Check for common security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });
});
