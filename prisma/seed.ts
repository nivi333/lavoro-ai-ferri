import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();
import { seedSubscriptionPlans } from './seed_subscription_plans';

async function main() {
  logger.info('Starting database seeding...');

  try {
    // No sample tenants or users are seeded.
    await seedSubscriptionPlans(prisma);
  } catch (error) {
    logger.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    logger.error('Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
