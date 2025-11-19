#!/usr/bin/env ts-node

/**
 * Database initialization script
 * Run this to set up the initial database structure
 */

import { migrationManager } from './migrations';
import { logger } from '@/utils/logger';
import { config } from '@/config/config';

async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Starting database initialization...');
    logger.info(`Database URL: ${config.database.url.replace(/:[^:@]*@/, ':****@')}`);
    
    // Run initial migrations (global tables)
    await migrationManager.runInitialMigrations();
    
    logger.info('Database initialization completed successfully!');
    logger.info('You can now start creating tenants and users.');
    
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await migrationManager.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}
