import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seeding...');

  try {
    // No sample tenants or users are seeded.
  } catch (error) {
    logger.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error('Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
