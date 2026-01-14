import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { config } from '../config/config';
import { logger } from '../utils/logger';

// Global Prisma client for shared tables (users, tenants, sessions)
export const globalPrisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
  log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Enable connection pooling
globalPrisma.$connect().catch(err => {
  logger.error('Failed to connect to database:', err);
  process.exit(1);
});

// Connection pool manager for tenant-specific databases
class DatabaseManager {
  private tenantPools = new Map<string, Pool>();
  private tenantPrismaClients = new Map<string, PrismaClient>();

  /**
   * Compute sanitized schema name for a tenant
   */
  getSchemaName(tenantId: string): string {
    const safeId = tenantId.replace(/-/g, '_');
    return `tenant_${safeId}`;
  }

  /**
   * Get or create a connection pool for a specific tenant
   */
  getTenantPool(tenantId: string): Pool {
    if (!this.tenantPools.has(tenantId)) {
      const schemaName = this.getSchemaName(tenantId);
      const pool = new Pool({
        connectionString: config.database.url,
        max: config.database.maxConnections,
        idleTimeoutMillis: config.database.idleTimeout,
        connectionTimeoutMillis: config.database.connectionTimeout,
        options: `-c search_path=${schemaName},public`,
      });

      pool.on('error', (err) => logger.error(`Pool error for tenant ${tenantId}:`, err));
      this.tenantPools.set(tenantId, pool);
      logger.info(`Created pool for tenant: ${tenantId}`);
    }

    return this.tenantPools.get(tenantId)!;
  }

  /**
   * Get or create a Prisma client for a specific tenant
   */
  getTenantPrisma(tenantId: string): PrismaClient {
    if (!this.tenantPrismaClients.has(tenantId)) {
      const schemaName = this.getSchemaName(tenantId);
      // Create a connection URL that includes the schema search_path
      const tenantUrl = `${config.database.url}?options=-c%20search_path%3D${schemaName}%2Cpublic`;

      const prismaClient = new PrismaClient({
        datasources: {
          db: { url: tenantUrl },
        },
        log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      });

      this.tenantPrismaClients.set(tenantId, prismaClient);
      logger.info(`Created Prisma client for tenant: ${tenantId} with schema: ${schemaName}`);
    }

    return this.tenantPrismaClients.get(tenantId)!;
  }

  /**
   * Create tenant-specific schema and tables
   */
  async createTenantSchema(tenantId: string): Promise<void> {
    const pool = this.getTenantPool(tenantId);
    const client = await pool.connect();

    try {
      const schemaName = this.getSchemaName(tenantId);
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      await this.createTenantTables(client, tenantId);
      logger.info(`Created schema and tables for tenant: ${tenantId}`);
    } catch (error) {
      logger.error(`Error creating tenant schema for ${tenantId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create all tenant-specific tables
   */
  private async createTenantTables(client: any, tenantId: string): Promise<void> {
    const schemaName = this.getSchemaName(tenantId);

    // Locations table (matches TenantLocation Prisma model)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tenant_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        country VARCHAR(100) NOT NULL,
        address_line_1 TEXT,
        address_line_2 TEXT,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        is_headquarters BOOLEAN DEFAULT FALSE,
        location_type VARCHAR(50) DEFAULT 'BRANCH',
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Inventory items table (matches TenantInventoryItem Prisma model)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tenant_inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        location_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        sub_category VARCHAR(100),
        fiber_type VARCHAR(100),
        yarn_count VARCHAR(50),
        gsm DECIMAL(10,2),
        fabric_type VARCHAR(100),
        color VARCHAR(100),
        width DECIMAL(15,4),
        weight DECIMAL(15,4),
        uom VARCHAR(20) DEFAULT 'METER',
        current_stock DECIMAL(15,4) DEFAULT 0,
        reserved_stock DECIMAL(15,4) DEFAULT 0,
        available_stock DECIMAL(15,4) DEFAULT 0,
        min_stock_level DECIMAL(15,4) DEFAULT 0,
        max_stock_level DECIMAL(15,4),
        reorder_point DECIMAL(15,4) DEFAULT 0,
        unit_cost DECIMAL(15,4),
        average_cost DECIMAL(15,4) DEFAULT 0,
        last_purchase_price DECIMAL(15,4),
        last_purchase_date TIMESTAMP,
        primary_supplier_id UUID,
        supplier_sku VARCHAR(100),
        batch_number VARCHAR(100),
        lot_number VARCHAR(100),
        expiry_date TIMESTAMP,
        quality_status VARCHAR(20) DEFAULT 'PENDING',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, sku)
      )
    `);

    // Production orders table (matches TenantProductionOrder Prisma model)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tenant_production_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        location_id UUID NOT NULL,
        order_number VARCHAR(100) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_sku VARCHAR(100),
        category VARCHAR(50),
        fiber_type VARCHAR(100),
        yarn_count VARCHAR(50),
        gsm DECIMAL(10,2),
        fabric_type VARCHAR(100),
        color VARCHAR(100),
        width DECIMAL(10,2),
        design_pattern VARCHAR(255),
        ordered_quantity DECIMAL(15,4),
        produced_quantity DECIMAL(15,4) DEFAULT 0,
        rejected_quantity DECIMAL(15,4) DEFAULT 0,
        unit_of_measure VARCHAR(20) DEFAULT 'METER',
        status VARCHAR(50) DEFAULT 'DRAFT',
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        planned_start_date TIMESTAMP,
        planned_end_date TIMESTAMP,
        actual_start_date TIMESTAMP,
        actual_end_date TIMESTAMP,
        estimated_cost DECIMAL(15,4),
        actual_cost DECIMAL(15,4),
        quality_status VARCHAR(20) DEFAULT 'PENDING',
        batch_number VARCHAR(100),
        lot_number VARCHAR(100),
        sales_order_id UUID,
        customer_id UUID,
        assigned_to UUID,
        approved_by UUID,
        approved_at TIMESTAMP,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, order_number)
      )
    `);

    // Work orders table (matches TenantWorkOrder Prisma model)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tenant_work_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        production_order_id UUID NOT NULL,
        location_id UUID NOT NULL,
        work_order_number VARCHAR(100) NOT NULL,
        operation_name VARCHAR(255) NOT NULL,
        operation_type VARCHAR(50) NOT NULL,
        machine_id UUID,
        operator_id UUID,
        planned_quantity DECIMAL(15,4),
        completed_quantity DECIMAL(15,4) DEFAULT 0,
        rejected_quantity DECIMAL(15,4) DEFAULT 0,
        unit_of_measure VARCHAR(20) DEFAULT 'METER',
        planned_start_time TIMESTAMP,
        actual_start_time TIMESTAMP,
        planned_end_time TIMESTAMP,
        actual_end_time TIMESTAMP,
        status VARCHAR(50) DEFAULT 'PENDING',
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        quality_check_required BOOLEAN DEFAULT FALSE,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, work_order_number)
      )
    `);

    // Quality records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.quality_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        location_id UUID NOT NULL,
        production_order_id UUID,
        inspector_id UUID NOT NULL,
        inspection_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        defect_count INTEGER DEFAULT 0,
        passed_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        notes TEXT,
        inspected_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Financial transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.financial_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        location_id UUID,
        transaction_type VARCHAR(100) NOT NULL,
        reference_id UUID,
        amount DECIMAL(15,4),
        currency VARCHAR(10) DEFAULT 'USD',
        description TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        transaction_date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Sales invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        location_id UUID NOT NULL,
        invoice_number VARCHAR(100) NOT NULL,
        customer_id UUID,
        issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE,
        subtotal DECIMAL(15,4) DEFAULT 0,
        tax_total DECIMAL(15,4) DEFAULT 0,
        total DECIMAL(15,4) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(50) DEFAULT 'DRAFT',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, invoice_number)
      )
    `);

    // Purchase orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.purchase_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        location_id UUID NOT NULL,
        po_number VARCHAR(100) NOT NULL,
        supplier_id UUID,
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        expected_date DATE,
        subtotal DECIMAL(15,4) DEFAULT 0,
        tax_total DECIMAL(15,4) DEFAULT 0,
        total DECIMAL(15,4) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(50) DEFAULT 'DRAFT',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, po_number)
      )
    `);

    // Bills (AP invoices) table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.bills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        location_id UUID NOT NULL,
        bill_number VARCHAR(100) NOT NULL,
        supplier_id UUID,
        bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE,
        subtotal DECIMAL(15,4) DEFAULT 0,
        tax_total DECIMAL(15,4) DEFAULT 0,
        total DECIMAL(15,4) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(50) DEFAULT 'DRAFT',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, bill_number)
      )
    `);

    // Stock movements table (matches TenantStockMovement Prisma model)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tenant_stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        item_id UUID NOT NULL,
        from_location_id UUID,
        to_location_id UUID,
        movement_type VARCHAR(50) NOT NULL,
        quantity DECIMAL(15,4) NOT NULL,
        unit_cost DECIMAL(15,4),
        reference_type VARCHAR(50),
        reference_id UUID,
        batch_number VARCHAR(100),
        lot_number VARCHAR(100),
        notes TEXT,
        performed_by UUID NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Suppliers table (matches TenantSupplier Prisma model)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tenant_suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        pincode VARCHAR(20),
        tax_id VARCHAR(100),
        payment_terms TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        pincode VARCHAR(20),
        tax_id VARCHAR(100),
        credit_limit DECIMAL(15,4),
        payment_terms TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await this.createTenantIndexes(client, schemaName);
  }

  /**
   * Create indexes for tenant tables
   */
  private async createTenantIndexes(client: any, schemaName: string): Promise<void> {
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_locations_tenant ON ${schemaName}.tenant_locations(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_inventory_tenant_location ON ${schemaName}.tenant_inventory_items(tenant_id, location_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_inventory_sku ON ${schemaName}.tenant_inventory_items(sku)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_production_tenant_location ON ${schemaName}.tenant_production_orders(tenant_id, location_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_work_orders_tenant_production ON ${schemaName}.tenant_work_orders(tenant_id, production_order_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_stock_movements_tenant_item ON ${schemaName}.tenant_stock_movements(tenant_id, item_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_quality_tenant_location ON ${schemaName}.quality_records(tenant_id, location_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_financial_tenant ON ${schemaName}.financial_transactions(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_suppliers_tenant ON ${schemaName}.tenant_suppliers(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_customers_tenant ON ${schemaName}.customers(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_invoices_tenant_location ON ${schemaName}.invoices(tenant_id, location_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_purchase_orders_tenant_location ON ${schemaName}.purchase_orders(tenant_id, location_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${schemaName}_bills_tenant_location ON ${schemaName}.bills(tenant_id, location_id)`
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
   * Close all connections for a specific tenant
   */
  async closeTenantConnections(tenantId: string): Promise<void> {
    if (this.tenantPrismaClients.has(tenantId)) {
      await this.tenantPrismaClients.get(tenantId)!.$disconnect();
      this.tenantPrismaClients.delete(tenantId);
    }

    if (this.tenantPools.has(tenantId)) {
      await this.tenantPools.get(tenantId)!.end();
      this.tenantPools.delete(tenantId);
    }

    logger.info(`Closed connections for tenant: ${tenantId}`);
  }

  /**
   * Close all connections
   */
  async closeAllConnections(): Promise<void> {
    for (const [, prismaClient] of this.tenantPrismaClients) {
      await prismaClient.$disconnect();
    }
    this.tenantPrismaClients.clear();

    for (const [, pool] of this.tenantPools) {
      await pool.end();
    }
    this.tenantPools.clear();

    await globalPrisma.$disconnect();
    logger.info('Closed all database connections');
  }
}

export const databaseManager = new DatabaseManager();

// Graceful shutdown
process.on('SIGINT', async () => {
  await databaseManager.closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await databaseManager.closeAllConnections();
  process.exit(0);
});
