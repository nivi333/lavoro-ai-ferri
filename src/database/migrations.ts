import { Pool } from 'pg';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { databaseManager } from './connection';

/**
 * Database migration utilities for multi-tenant schema management
 */
export class MigrationManager {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      max: 5, // Limited connections for migrations
    });
  }

  /**
   * Run initial database setup (global tables)
   */
  async runInitialMigrations(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      logger.info('Running initial database migrations...');
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
      await this.createGlobalTables(client);
      logger.info('Initial database migrations completed');
    } catch (error) {
      logger.error('Error running initial migrations:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create global tables (users, tenants, sessions, etc.)
   */
  private async createGlobalTables(client: any): Promise<void> {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50) UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT users_email_or_phone_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
      )
    `);

    // Tenants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        industry VARCHAR(100),
        description TEXT,
        default_location TEXT,
        country VARCHAR(100),
        logo_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // User-Tenant relationships
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, tenant_id)
      )
    `);

    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        refresh_token VARCHAR(500) UNIQUE NOT NULL,
        device_info TEXT,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await this.createGlobalIndexes(client);
  }

  /**
   * Create indexes for global tables
   */
  private async createGlobalIndexes(client: any): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)',
      'CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug)',
      'CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)',
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
      } catch (error) {
        logger.warn(`Index creation warning: ${error}`);
      }
    }
  }

  /**
   * Create a new tenant with isolated schema
   */
  async createTenant(tenantData: {
    name: string;
    slug: string;
    industry?: string;
    description?: string;
    country?: string;
    userId: string;
  }): Promise<string> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const tenantResult = await client.query(
        `INSERT INTO tenants (name, slug, industry, description, country) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [tenantData.name, tenantData.slug, tenantData.industry, tenantData.description, tenantData.country]
      );
      
      const tenantId = tenantResult.rows[0].id;
      
      await client.query(
        `INSERT INTO user_tenants (user_id, tenant_id, role) VALUES ($1, $2, 'OWNER')`,
        [tenantData.userId, tenantId]
      );
      
      await databaseManager.createTenantSchema(tenantId);
      await client.query('COMMIT');
      
      logger.info(`Created tenant: ${tenantData.name} (${tenantId})`);
      return tenantId;
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add user to existing tenant
   */
  async addUserToTenant(userId: string, tenantId: string, role: string = 'EMPLOYEE'): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(
        `INSERT INTO user_tenants (user_id, tenant_id, role) VALUES ($1, $2, $3) 
         ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = $3, is_active = TRUE, updated_at = NOW()`,
        [userId, tenantId, role]
      );
      logger.info(`Added user ${userId} to tenant ${tenantId}`);
    } catch (error) {
      logger.error('Error adding user to tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove user from tenant
   */
  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(
        `UPDATE user_tenants SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1 AND tenant_id = $2`,
        [userId, tenantId]
      );
      logger.info(`Removed user ${userId} from tenant ${tenantId}`);
    } catch (error) {
      logger.error('Error removing user from tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's tenants with roles
   */
  async getUserTenants(userId: string): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT t.id, t.name, t.slug, t.industry, ut.role, t.created_at
         FROM tenants t JOIN user_tenants ut ON t.id = ut.tenant_id
         WHERE ut.user_id = $1 AND ut.is_active = TRUE AND t.is_active = TRUE
         ORDER BY t.name`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting user tenants:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate tenant access for user
   */
  async validateTenantAccess(userId: string, tenantId: string): Promise<{ hasAccess: boolean; role?: string }> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT role FROM user_tenants WHERE user_id = $1 AND tenant_id = $2 AND is_active = TRUE`,
        [userId, tenantId]
      );
      return result.rows.length === 0 ? { hasAccess: false } : { hasAccess: true, role: result.rows[0].role };
    } catch (error) {
      logger.error('Error validating tenant access:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Drop tenant schema and data (DANGEROUS - use with caution)
   */
  async dropTenant(tenantId: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(`DROP SCHEMA IF EXISTS tenant_${tenantId} CASCADE`);
      await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      await client.query('COMMIT');
      logger.warn(`Dropped tenant: ${tenantId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error dropping tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close migration manager connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const migrationManager = new MigrationManager();
