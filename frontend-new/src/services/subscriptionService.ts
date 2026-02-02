import { API_BASE_URL } from '../config/api';
import { AuthStorage } from '../utils/storage';


export interface SubscriptionPlan {
  id: string;
  plan_id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  billing_interval: string;
  trial_days: number;
  features: string[]; // Parsed JSON
  limits: Record<string, number>; // Parsed JSON
  is_popular: boolean;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan: SubscriptionPlan;
}

export class SubscriptionService {
  private getAuthHeaders() {
    const tokens = AuthStorage.getTokens();
    if (!tokens) {
      throw new Error('No authentication tokens found');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.accessToken}`,
    };
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch subscription plans');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(result.message || 'Failed to fetch current subscription');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      throw error;
    }
  }

  async createPaymentIntent(
    planId: string,
    billingInterval: 'month' | 'year'
  ): Promise<{ clientSecret: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/payment-intent`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ planId, billingInterval }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create payment intent');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async createSubscription(
    planId: string,
    paymentMethodId: string,
    billingInterval: 'month' | 'year'
  ): Promise<Subscription> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ planId, paymentMethodId, billingInterval }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create subscription');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async createPortalSession(): Promise<{ url: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/portal`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create portal session');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();
