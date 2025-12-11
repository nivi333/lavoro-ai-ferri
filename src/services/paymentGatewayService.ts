import Stripe from 'stripe';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { globalPrisma as prisma } from '../database/connection';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover' as Stripe.LatestApiVersion, // Using latest version with type assertion
  typescript: true,
});

export class PaymentGatewayService {
  /**
   * Create a Stripe customer for a company
   */
  async createStripeCustomer(companyId: string, email: string, name: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          companyId,
        },
      });

      // Update company with Stripe customer ID
      await prisma.companies.update({
        where: { id: companyId },
        data: { stripe_customer_id: customer.id },
      });

      logger.info(`Created Stripe customer for company ${companyId}: ${customer.id}`);
      return customer.id;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create Stripe customer');
    }
  }

  /**
   * Create a subscription for a company
   */
  async createSubscription(
    companyId: string,
    planId: string,
    paymentMethodId?: string
  ): Promise<Stripe.Subscription> {
    try {
      // Get company and plan details
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error('Company not found');
      }

      const plan = await prisma.subscription_plans.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // Create or get Stripe customer
      let stripeCustomerId = company.stripe_customer_id;
      if (!stripeCustomerId) {
        stripeCustomerId = await this.createStripeCustomer(
          companyId,
          company.email || '',
          company.name
        );
      }

      // Attach payment method if provided
      if (paymentMethodId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId,
        });

        // Set as default payment method
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: plan.stripe_price_id || '' }],
        trial_period_days: plan.trial_days,
        metadata: {
          companyId,
          planId,
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription to database
      const now = new Date();
      const trialEnd = new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000);

      await prisma.subscriptions.create({
        data: {
          subscription_id: `SUB-${Date.now()}`,
          company_id: companyId,
          plan_id: planId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: stripeCustomerId,
          status: subscription.status === 'trialing' ? 'TRIAL' : 'ACTIVE',
          current_period_start: new Date((subscription as any).current_period_start * 1000),
          current_period_end: new Date((subscription as any).current_period_end * 1000),
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : trialEnd,
          billing_interval: plan.billing_interval,
          amount: plan.price_monthly,
          currency: plan.currency,
          metadata: subscription.metadata,
        },
      });

      // Update company subscription status
      await prisma.companies.update({
        where: { id: companyId },
        data: {
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status === 'trialing' ? 'TRIAL' : 'ACTIVE',
          trial_ends_at: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : trialEnd,
        },
      });

      logger.info(`Created subscription for company ${companyId}: ${subscription.id}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(companyId: string, immediately: boolean = false): Promise<void> {
    try {
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
      });

      if (!company || !company.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      if (immediately) {
        await stripe.subscriptions.cancel(company.stripe_subscription_id);
      } else {
        await stripe.subscriptions.update(company.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      }

      // Update database
      await prisma.subscriptions.updateMany({
        where: {
          company_id: companyId,
          stripe_subscription_id: company.stripe_subscription_id,
        },
        data: {
          cancel_at_period_end: !immediately,
          canceled_at: immediately ? new Date() : null,
          status: immediately ? 'CANCELED' : 'ACTIVE',
        },
      });

      if (immediately) {
        await prisma.companies.update({
          where: { id: companyId },
          data: {
            subscription_status: 'CANCELED',
          },
        });
      }

      logger.info(`Canceled subscription for company ${companyId}`);
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      logger.info(`Processing Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle subscription update webhook
   */
  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const companyId = subscription.metadata.companyId;

    if (!companyId) {
      logger.warn('No companyId in subscription metadata');
      return;
    }

    const statusMap: Record<string, any> = {
      active: 'ACTIVE',
      trialing: 'TRIAL',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      unpaid: 'UNPAID',
      incomplete: 'INCOMPLETE',
      incomplete_expired: 'INCOMPLETE_EXPIRED',
      paused: 'PAUSED',
    };

    await prisma.subscriptions.updateMany({
      where: {
        company_id: companyId,
        stripe_subscription_id: subscription.id,
      },
      data: {
        status: statusMap[subscription.status] || 'ACTIVE',
        current_period_start: new Date((subscription as any).current_period_start * 1000),
        current_period_end: new Date((subscription as any).current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
    });

    await prisma.companies.update({
      where: { id: companyId },
      data: {
        subscription_status: statusMap[subscription.status] || 'ACTIVE',
      },
    });

    logger.info(`Updated subscription for company ${companyId}`);
  }

  /**
   * Handle subscription deleted webhook
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const companyId = subscription.metadata.companyId;

    if (!companyId) {
      logger.warn('No companyId in subscription metadata');
      return;
    }

    await prisma.subscriptions.updateMany({
      where: {
        company_id: companyId,
        stripe_subscription_id: subscription.id,
      },
      data: {
        status: 'CANCELED',
        canceled_at: new Date(),
      },
    });

    await prisma.companies.update({
      where: { id: companyId },
      data: {
        subscription_status: 'CANCELED',
      },
    });

    logger.info(`Deleted subscription for company ${companyId}`);
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const companyId = invoice.metadata?.companyId;

    if (!companyId) {
      logger.warn('No companyId in invoice metadata');
      return;
    }

    // Record payment transaction
    await prisma.payment_transactions.create({
      data: {
        transaction_id: `TXN-${Date.now()}`,
        company_id: companyId,
        stripe_payment_id: ((invoice as any).payment_intent as string) || null,
        stripe_invoice_id: invoice.id,
        transaction_type: 'SUBSCRIPTION',
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status: 'SUCCEEDED',
        payment_method: (invoice as any).payment_intent ? 'card' : null,
        description: `Subscription payment for invoice ${invoice.number}`,
        receipt_url: invoice.hosted_invoice_url || null,
        invoice_url: invoice.invoice_pdf || null,
        processed_at: new Date(),
        metadata: invoice.metadata,
      },
    });

    logger.info(`Recorded successful payment for company ${companyId}`);
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const companyId = invoice.metadata?.companyId;

    if (!companyId) {
      logger.warn('No companyId in invoice metadata');
      return;
    }

    // Record failed payment transaction
    await prisma.payment_transactions.create({
      data: {
        transaction_id: `TXN-${Date.now()}`,
        company_id: companyId,
        stripe_payment_id: ((invoice as any).payment_intent as string) || null,
        stripe_invoice_id: invoice.id,
        transaction_type: 'SUBSCRIPTION',
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'FAILED',
        description: `Failed subscription payment for invoice ${invoice.number}`,
        failure_reason: 'Payment failed',
        metadata: invoice.metadata,
      },
    });

    logger.info(`Recorded failed payment for company ${companyId}`);
  }

  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(
    companyId: string,
    amount: number,
    currency: string = 'usd',
    description?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error('Company not found');
      }

      let stripeCustomerId = company.stripe_customer_id;
      if (!stripeCustomerId) {
        stripeCustomerId = await this.createStripeCustomer(
          companyId,
          company.email || '',
          company.name
        );
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: stripeCustomerId,
        description,
        metadata: {
          companyId,
        },
      });

      logger.info(`Created payment intent for company ${companyId}: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Get Stripe customer portal URL
   */
  async createCustomerPortalSession(companyId: string, returnUrl: string): Promise<string> {
    try {
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
      });

      if (!company || !company.stripe_customer_id) {
        throw new Error('No Stripe customer found');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: company.stripe_customer_id,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      logger.error('Error creating customer portal session:', error);
      throw new Error('Failed to create customer portal session');
    }
  }
}

export const paymentGatewayService = new PaymentGatewayService();
