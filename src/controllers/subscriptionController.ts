import { Request, Response, NextFunction } from 'express';
import { paymentGatewayService } from '../services/paymentGatewayService';
import { subscriptionService } from '../services/subscriptionService';
import { logger } from '../utils/logger';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover' as any,
});

export class SubscriptionController {
  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, currency, description } = req.body;
      const companyId = req.tenantId!;

      const paymentIntent = await paymentGatewayService.createPaymentIntent(
        companyId,
        amount,
        currency,
        description
      );

      res.status(200).json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      });
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      next(error);
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId, paymentMethodId } = req.body;
      const companyId = req.tenantId!;

      const subscription = await subscriptionService.subscribeCompany(
        companyId,
        planId,
        paymentMethodId
      );

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: subscription,
      });
    } catch (error) {
      logger.error('Error creating subscription:', error);
      next(error);
    }
  }

  /**
   * Get current subscription
   */
  async getCurrentSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.tenantId!;

      const subscription = await subscriptionService.getCompanySubscription(companyId);

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      logger.error('Error fetching subscription:', error);
      next(error);
    }
  }

  /**
   * Get all subscription plans
   */
  async getSubscriptionPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await subscriptionService.getAllPlans();

      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error) {
      logger.error('Error fetching subscription plans:', error);
      next(error);
    }
  }

  /**
   * Change subscription plan
   */
  async changeSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.body;
      const companyId = req.tenantId!;

      const subscription = await subscriptionService.changeSubscription(companyId, planId);

      res.status(200).json({
        success: true,
        message: 'Subscription updated successfully',
        data: subscription,
      });
    } catch (error) {
      logger.error('Error changing subscription:', error);
      next(error);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { immediately } = req.body;
      const companyId = req.tenantId!;

      await subscriptionService.cancelSubscription(companyId, immediately);

      res.status(200).json({
        success: true,
        message: immediately
          ? 'Subscription canceled immediately'
          : 'Subscription will be canceled at the end of the billing period',
      });
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      next(error);
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.tenantId!;
      const limit = parseInt(req.query.limit as string) || 10;

      const transactions = await subscriptionService.getPaymentHistory(companyId, limit);

      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      logger.error('Error fetching payment history:', error);
      next(error);
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.tenantId!;

      const analytics = await subscriptionService.getSubscriptionAnalytics(companyId);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error fetching subscription analytics:', error);
      next(error);
    }
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.tenantId!;
      const { returnUrl } = req.body;

      const portalUrl = await paymentGatewayService.createCustomerPortalSession(
        companyId,
        returnUrl
      );

      res.status(200).json({
        success: true,
        data: { url: portalUrl },
      });
    } catch (error) {
      logger.error('Error creating portal session:', error);
      next(error);
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        logger.error('Webhook signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      // Handle the event
      await paymentGatewayService.handleWebhook(event);

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Error handling webhook:', error);
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
