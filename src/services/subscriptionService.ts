import { globalPrisma as prisma } from '../database/connection';
import { logger } from '../utils/logger';
import { paymentGatewayService } from './paymentGatewayService';

export class SubscriptionService {
  /**
   * Get all subscription plans
   */
  async getAllPlans(activeOnly: boolean = true) {
    try {
      const plans = await prisma.subscription_plans.findMany({
        where: activeOnly ? { is_active: true } : {},
        orderBy: { sort_order: 'asc' },
      });

      return plans;
    } catch (error) {
      logger.error('Error fetching subscription plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  /**
   * Get a specific subscription plan
   */
  async getPlanById(planId: string) {
    try {
      const plan = await prisma.subscription_plans.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      return plan;
    } catch (error) {
      logger.error('Error fetching subscription plan:', error);
      throw error;
    }
  }

  /**
   * Get company's current subscription
   */
  async getCompanySubscription(companyId: string) {
    try {
      const subscription = await prisma.subscriptions.findFirst({
        where: {
          company_id: companyId,
          is_active: true,
        },
        include: {
          plan: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return subscription;
    } catch (error) {
      logger.error('Error fetching company subscription:', error);
      throw new Error('Failed to fetch subscription');
    }
  }

  /**
   * Subscribe company to a plan
   */
  async subscribeCompany(companyId: string, planId: string, paymentMethodId?: string) {
    try {
      // Check if company already has an active subscription
      const existingSubscription = await this.getCompanySubscription(companyId);

      if (existingSubscription && existingSubscription.status !== 'CANCELED') {
        throw new Error('Company already has an active subscription');
      }

      // Create subscription via Stripe
      const stripeSubscription = await paymentGatewayService.createSubscription(
        companyId,
        planId,
        paymentMethodId
      );

      logger.info(`Company ${companyId} subscribed to plan ${planId}`);
      return stripeSubscription;
    } catch (error) {
      logger.error('Error subscribing company:', error);
      throw error;
    }
  }

  /**
   * Upgrade/downgrade subscription
   */
  async changeSubscription(companyId: string, newPlanId: string) {
    try {
      const currentSubscription = await this.getCompanySubscription(companyId);

      if (!currentSubscription || !currentSubscription.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      const newPlan = await this.getPlanById(newPlanId);

      // Update subscription in Stripe
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const stripeSubscription = await stripe.subscriptions.retrieve(
        currentSubscription.stripe_subscription_id
      );

      const updatedSubscription = await stripe.subscriptions.update(
        currentSubscription.stripe_subscription_id,
        {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPlan.stripe_price_id,
            },
          ],
          proration_behavior: 'create_prorations',
        }
      );

      // Update in database
      await prisma.subscriptions.update({
        where: { id: currentSubscription.id },
        data: {
          plan_id: newPlanId,
          amount: newPlan.price_monthly,
          billing_interval: newPlan.billing_interval,
        },
      });

      logger.info(`Changed subscription for company ${companyId} to plan ${newPlanId}`);
      return updatedSubscription;
    } catch (error) {
      logger.error('Error changing subscription:', error);
      throw new Error('Failed to change subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(companyId: string, immediately: boolean = false) {
    try {
      await paymentGatewayService.cancelSubscription(companyId, immediately);
      logger.info(`Canceled subscription for company ${companyId}`);
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Check if company has access to a feature based on their plan
   */
  async hasFeatureAccess(companyId: string, featureName: string): Promise<boolean> {
    try {
      const subscription = await this.getCompanySubscription(companyId);

      if (!subscription || subscription.status === 'CANCELED') {
        return false;
      }

      // Check if in trial period
      if (subscription.status === 'TRIAL' && subscription.trial_end) {
        const now = new Date();
        if (now > subscription.trial_end) {
          return false;
        }
      }

      // Check if feature is included in plan
      const features = subscription.plan.features as any;
      return features.includes(featureName);
    } catch (error) {
      logger.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Check if company has reached usage limit
   */
  async checkUsageLimit(companyId: string, limitType: string): Promise<boolean> {
    try {
      const subscription = await this.getCompanySubscription(companyId);

      if (!subscription) {
        return false;
      }

      const limits = subscription.plan.limits as any;
      const limit = limits[limitType];

      if (!limit || limit === -1) {
        // Unlimited
        return true;
      }

      // Get current usage based on limit type
      let currentUsage = 0;

      switch (limitType) {
        case 'users':
          currentUsage = await prisma.user_companies.count({
            where: { company_id: companyId, is_active: true },
          });
          break;
        case 'products':
          currentUsage = await prisma.products.count({
            where: { company_id: companyId, is_active: true },
          });
          break;
        case 'orders':
          currentUsage = await prisma.orders.count({
            where: { company_id: companyId, is_active: true },
          });
          break;
        case 'locations':
          currentUsage = await prisma.company_locations.count({
            where: { company_id: companyId, is_active: true },
          });
          break;
        default:
          return true;
      }

      return currentUsage < limit;
    } catch (error) {
      logger.error('Error checking usage limit:', error);
      return false;
    }
  }

  /**
   * Get company's payment history
   */
  async getPaymentHistory(companyId: string, limit: number = 10) {
    try {
      const transactions = await prisma.payment_transactions.findMany({
        where: { company_id: companyId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      return transactions;
    } catch (error) {
      logger.error('Error fetching payment history:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  /**
   * Get subscription analytics for a company
   */
  async getSubscriptionAnalytics(companyId: string) {
    try {
      const subscription = await this.getCompanySubscription(companyId);

      if (!subscription) {
        return null;
      }

      // Calculate days remaining in trial/subscription
      const now = new Date();
      let daysRemaining = 0;

      if (subscription.status === 'TRIAL' && subscription.trial_end) {
        daysRemaining = Math.ceil(
          (subscription.trial_end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
      } else if (subscription.current_period_end) {
        daysRemaining = Math.ceil(
          (subscription.current_period_end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      // Get usage statistics
      const [userCount, productCount, orderCount, locationCount] = await Promise.all([
        prisma.user_companies.count({ where: { company_id: companyId, is_active: true } }),
        prisma.products.count({ where: { company_id: companyId, is_active: true } }),
        prisma.orders.count({ where: { company_id: companyId, is_active: true } }),
        prisma.company_locations.count({ where: { company_id: companyId, is_active: true } }),
      ]);

      const limits = subscription.plan.limits as any;

      return {
        subscription: {
          status: subscription.status,
          plan_name: subscription.plan.display_name,
          amount: subscription.amount,
          currency: subscription.currency,
          billing_interval: subscription.billing_interval,
          days_remaining: daysRemaining,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
        usage: {
          users: { current: userCount, limit: limits.users || -1 },
          products: { current: productCount, limit: limits.products || -1 },
          orders: { current: orderCount, limit: limits.orders || -1 },
          locations: { current: locationCount, limit: limits.locations || -1 },
        },
      };
    } catch (error) {
      logger.error('Error fetching subscription analytics:', error);
      throw new Error('Failed to fetch subscription analytics');
    }
  }
}

export const subscriptionService = new SubscriptionService();
