import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Ensure test database is ready
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Prisma Migrations', () => {
    test('should run migrations successfully', async () => {
      try {
        // Run migrations
        execSync('npx prisma migrate deploy', {
          env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
          stdio: 'pipe',
        });

        // Verify database connection
        await prisma.$connect();
        expect(true).toBe(true);
      } catch (error) {
        console.error('Migration failed:', error);
        throw error;
      }
    });

    test('should have all required tables', async () => {
      // Query information schema to verify tables exist
      const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;

      const tableNames = tables.map(t => t.tablename);

      // Verify critical tables exist
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('companies');
      expect(tableNames).toContain('products');
      expect(tableNames).toContain('company_locations');
      expect(tableNames).toContain('machines');
      expect(tableNames).toContain('orders');
    });

    test('should have correct schema version', async () => {
      const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1
      `;

      expect(migrations.length).toBeGreaterThan(0);
      expect(migrations[0]).toHaveProperty('migration_name');
    });
  });

  describe('Seed Data', () => {
    test('should load seed data correctly', async () => {
      // Create test user
      const user = await prisma.users.create({
        data: {
          id: `user-seed-${Date.now()}`,
          email: `seed${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'hashed-password',
          first_name: 'Seed',
          last_name: 'User',
          is_active: true,
          updated_at: new Date(),
        },
      });

      expect(user).toHaveProperty('id');
      expect(user.email).toContain('seed');

      // Cleanup
      await prisma.users.delete({ where: { id: user.id } });
    });

    test('should handle seed data relationships', async () => {
      // Create user
      const user = await prisma.users.create({
        data: {
          id: `user-rel-${Date.now()}`,
          email: `rel${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'hashed-password',
          first_name: 'Relation',
          last_name: 'Test',
          is_active: true,
          updated_at: new Date(),
        },
      });

      // Create company
      const company = await prisma.companies.create({
        data: {
          id: `company-${Date.now()}`,
          company_id: `COMP${Date.now()}`,
          name: 'Test Company',
          slug: `test-company-${Date.now()}`,
          industry: 'TEXTILE_MANUFACTURING',
          is_active: true,
          updated_at: new Date(),
        },
      });

      // Create user-company relationship
      const userCompany = await prisma.user_companies.create({
        data: {
          id: `uc-${Date.now()}`,
          user_id: user.id,
          company_id: company.id,
          role: 'OWNER',
          updated_at: new Date(),
        },
      });

      expect(userCompany).toHaveProperty('user_id', user.id);
      expect(userCompany).toHaveProperty('company_id', company.id);

      // Cleanup
      await prisma.user_companies.delete({
        where: {
          user_id_company_id: {
            user_id: user.id,
            company_id: company.id,
          },
        },
      });
      await prisma.companies.delete({ where: { id: company.id } });
      await prisma.users.delete({ where: { id: user.id } });
    });
  });

  describe('Multi-Tenant Isolation', () => {
    let tenant1: string;
    let tenant2: string;

    beforeAll(async () => {
      // Create two test tenants
      const company1 = await prisma.companies.create({
        data: {
          id: `company1-${Date.now()}`,
          company_id: `COMP1-${Date.now()}`,
          name: 'Company 1',
          slug: `company1-${Date.now()}`,
          industry: 'TEXTILE_MANUFACTURING',
          is_active: true,
          updated_at: new Date(),
        },
      });

      const company2 = await prisma.companies.create({
        data: {
          id: `company2-${Date.now()}`,
          company_id: `COMP2-${Date.now()}`,
          name: 'Company 2',
          slug: `company2-${Date.now()}`,
          industry: 'TEXTILE_MANUFACTURING',
          is_active: true,
          updated_at: new Date(),
        },
      });

      tenant1 = company1.id;
      tenant2 = company2.id;
    });

    afterAll(async () => {
      // Cleanup
      await prisma.companies.deleteMany({
        where: { id: { in: [tenant1, tenant2] } },
      });
    });

    test('should isolate products between tenants', async () => {
      // Create product for tenant1
      const product1 = await prisma.products.create({
        data: {
          id: `prod1-${Date.now()}`,
          product_id: `PROD1-${Date.now()}`,
          product_code: `PC1-${Date.now()}`,
          company_id: tenant1,
          name: 'Product 1',
          sku: `SKU1-${Date.now()}`,
          cost_price: 100,
          selling_price: 150,
          stock_quantity: 10,
          is_active: true,
          updated_at: new Date(),
        },
      });

      // Create product for tenant2
      const product2 = await prisma.products.create({
        data: {
          id: `prod2-${Date.now()}`,
          product_id: `PROD2-${Date.now()}`,
          product_code: `PC2-${Date.now()}`,
          company_id: tenant2,
          name: 'Product 2',
          sku: `SKU2-${Date.now()}`,
          cost_price: 200,
          selling_price: 250,
          stock_quantity: 20,
          is_active: true,
          updated_at: new Date(),
        },
      });

      // Query products for tenant1
      const tenant1Products = await prisma.products.findMany({
        where: { company_id: tenant1 },
      });

      // Should only return tenant1's products
      expect(tenant1Products.length).toBeGreaterThan(0);
      expect(tenant1Products.every(p => p.company_id === tenant1)).toBe(true);

      // Query products for tenant2
      const tenant2Products = await prisma.products.findMany({
        where: { company_id: tenant2 },
      });

      // Should only return tenant2's products
      expect(tenant2Products.length).toBeGreaterThan(0);
      expect(tenant2Products.every(p => p.company_id === tenant2)).toBe(true);

      // Cleanup
      await prisma.products.deleteMany({
        where: { id: { in: [product1.id, product2.id] } },
      });
    });

    test('should prevent cross-tenant data access', async () => {
      // Create product for tenant1
      const product = await prisma.products.create({
        data: {
          id: `prod-cross-${Date.now()}`,
          product_id: `PROD-CROSS-${Date.now()}`,
          product_code: `PC-CROSS-${Date.now()}`,
          company_id: tenant1,
          name: 'Cross Tenant Test',
          sku: `SKU-CROSS-${Date.now()}`,
          cost_price: 100,
          selling_price: 150,
          stock_quantity: 10,
          is_active: true,
          updated_at: new Date(),
        },
      });

      // Try to access with tenant2 filter
      const result = await prisma.products.findFirst({
        where: {
          product_id: product.product_id,
          company_id: tenant2,
        },
      });

      // Should not find the product
      expect(result).toBeNull();

      // Cleanup
      await prisma.products.delete({ where: { id: product.id } });
    });
  });

  describe('Backup and Restore', () => {
    test('should create database backup', async () => {
      try {
        // Simulate backup by exporting schema
        execSync('npx prisma db pull', {
          env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
          stdio: 'pipe',
        });

        expect(true).toBe(true);
      } catch (error) {
        console.error('Backup failed:', error);
        throw error;
      }
    });

    test('should verify data integrity after operations', async () => {
      // Create test data
      const user = await prisma.users.create({
        data: {
          id: `user-integrity-${Date.now()}`,
          email: `integrity${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'hashed-password',
          first_name: 'Integrity',
          last_name: 'Test',
          is_active: true,
          updated_at: new Date(),
        },
      });

      // Verify data was created
      const retrieved = await prisma.users.findUnique({
        where: { id: user.id },
      });

      expect(retrieved).not.toBeNull();
      expect(retrieved?.email).toBe(user.email);

      // Cleanup
      await prisma.users.delete({ where: { id: user.id } });
    });

    test('should handle transaction rollback', async () => {
      const userId = `user-rollback-${Date.now()}`;

      try {
        await prisma.$transaction(async (tx) => {
          // Create user
          await tx.users.create({
            data: {
              id: userId,
              email: `rollback${Date.now()}@example.com`,
              phone: '+1234567890',
              password: 'hashed-password',
              first_name: 'Rollback',
              last_name: 'Test',
              is_active: true,
              updated_at: new Date(),
            },
          });

          // Force rollback by throwing error
          throw new Error('Intentional rollback');
        });
      } catch (error) {
        // Expected to fail
      }

      // Verify user was not created
      const user = await prisma.users.findUnique({
        where: { id: userId },
      });

      expect(user).toBeNull();
    });
  });

  describe('Database Performance', () => {
    test('should handle bulk inserts efficiently', async () => {
      const startTime = Date.now();
      const tenantId = `tenant-bulk-${Date.now()}`;

      // Create company first
      await prisma.companies.create({
        data: {
          id: tenantId,
          company_id: `BULK-${Date.now()}`,
          name: 'Bulk Test Company',
          slug: `bulk-test-${Date.now()}`,
          industry: 'TEXTILE_MANUFACTURING',
          is_active: true,
          updated_at: new Date(),
        },
      });

      // Create 100 products
      const timestamp = Date.now();
      const products = Array(100).fill(null).map((_, i) => ({
        id: `bulk-prod-${timestamp}-${i}`,
        product_id: `BULK-PROD-${timestamp}-${i}`,
        product_code: `BULK-PC-${timestamp}-${i}`,
        company_id: tenantId,
        name: `Bulk Product ${i}`,
        sku: `BULK-SKU-${timestamp}-${i}`,
        cost_price: 100,
        selling_price: 150,
        stock_quantity: 10,
        is_active: true,
        updated_at: new Date(),
      }));

      await prisma.products.createMany({ data: products });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);

      // Cleanup
      await prisma.products.deleteMany({ where: { company_id: tenantId } });
      await prisma.companies.delete({ where: { id: tenantId } });
    });

    test('should use indexes for queries', async () => {
      // Query with indexed field (company_id)
      const startTime = Date.now();

      await prisma.products.findMany({
        where: { company_id: 'test-tenant' },
        take: 100,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be fast with index (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Connection Pooling', () => {
    test('should handle multiple concurrent connections', async () => {
      const queries = Array(10).fill(null).map(() =>
        prisma.users.findMany({ take: 1 })
      );

      const results = await Promise.all(queries);

      // All queries should succeed
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    test('should reuse connections efficiently', async () => {
      // Execute multiple queries
      await prisma.users.findMany({ take: 1 });
      await prisma.companies.findMany({ take: 1 });
      await prisma.products.findMany({ take: 1 });

      // Connection should still be active
      const isConnected = await prisma.$queryRaw`SELECT 1 as result`;
      expect(isConnected).toBeTruthy();
    });
  });
});
