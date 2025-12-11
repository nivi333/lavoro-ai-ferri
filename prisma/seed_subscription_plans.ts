import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

export async function seedSubscriptionPlans(prisma: PrismaClient) {
  logger.info('Seeding subscription plans...');

  const plans = [
    {
      plan_id: 'plan_free_trial',
      name: 'free_trial',
      display_name: 'Free Trial',
      description: 'Full access to all features for 14 days',
      price_monthly: 0,
      price_yearly: 0,
      currency: 'USD',
      billing_interval: 'month',
      trial_days: 14,
      is_active: true,
      is_popular: false,
      sort_order: 1,
      features: JSON.stringify([
        'Unlimited Users',
        'All Modules Access',
        'Basic Support',
        '10GB Storage',
      ]),
      limits: JSON.stringify({
        users: 5,
        storage_gb: 10,
        orders_per_month: 100,
      }),
    },
    {
      plan_id: 'plan_starter',
      name: 'starter',
      display_name: 'Starter',
      description: 'Perfect for small businesses starting out',
      price_monthly: 29.0,
      price_yearly: 290.0,
      currency: 'USD',
      billing_interval: 'month',
      trial_days: 0,
      is_active: true,
      is_popular: false,
      sort_order: 2,
      features: JSON.stringify([
        'Up to 10 Users',
        'Core Modules (Sales, Inventory, Production)',
        'Email Support',
        '50GB Storage',
      ]),
      limits: JSON.stringify({
        users: 10,
        storage_gb: 50,
        orders_per_month: 500,
      }),
    },
    {
      plan_id: 'plan_professional',
      name: 'professional',
      display_name: 'Professional',
      description: 'For growing businesses with advanced needs',
      price_monthly: 99.0,
      price_yearly: 990.0,
      currency: 'USD',
      billing_interval: 'month',
      trial_days: 0,
      is_active: true,
      is_popular: true,
      sort_order: 3,
      features: JSON.stringify([
        'Unlimited Users',
        'All Modules + Advanced Reporting',
        'Priority Support',
        '500GB Storage',
        'API Access',
      ]),
      limits: JSON.stringify({
        users: -1, // Unlimited
        storage_gb: 500,
        orders_per_month: -1,
      }),
    },
    {
      plan_id: 'plan_enterprise',
      name: 'enterprise',
      display_name: 'Enterprise',
      description: 'Custom solutions for large organizations',
      price_monthly: 299.0,
      price_yearly: 2990.0,
      currency: 'USD',
      billing_interval: 'month',
      trial_days: 0,
      is_active: true,
      is_popular: false,
      sort_order: 4,
      features: JSON.stringify([
        'Unlimited Users',
        'All Features + Custom Integrations',
        'Dedicated Success Manager',
        'Unlimited Storage',
        'SLA Support',
      ]),
      limits: JSON.stringify({
        users: -1,
        storage_gb: -1,
        orders_per_month: -1,
      }),
    },
  ];

  for (const plan of plans) {
    await prisma.subscription_plans.upsert({
      where: { plan_id: plan.plan_id },
      update: plan,
      create: plan,
    });
  }

  logger.info('Subscription plans seeded successfully.');
}
