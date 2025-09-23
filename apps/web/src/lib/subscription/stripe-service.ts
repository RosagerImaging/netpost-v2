/**
 * Stripe Integration Service
 *
 * Handles all Stripe-related operations for subscription management
 * including customer creation, subscription management, and webhook processing
 */

import Stripe from 'stripe';

// Stripe Price IDs from environment - lazy loaded
export const STRIPE_PRICES = {
  beta: process.env.STRIPE_BETA_PRICE_ID || '',
  trial: process.env.STRIPE_TRIAL_PRICE_ID || '',
  hobbyist: process.env.STRIPE_HOBBYIST_PRICE_ID || '',
  pro: process.env.STRIPE_PRO_PRICE_ID || '',
} as const;

export type StripePriceIds = typeof STRIPE_PRICES;
export type SubscriptionTier = keyof StripePriceIds;

// Subscription tier configuration
export interface SubscriptionTierConfig {
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number; // in cents
  yearlyPrice: number; // in cents
  features: {
    maxInventoryItems: number; // -1 for unlimited
    maxMarketplaceConnections: number;
    maxApiCallsPerMonth: number;
    maxStorageMb: number;
    hasAiAssistant: boolean;
    hasAdvancedAnalytics: boolean;
    hasPrioritySupport: boolean;
    hasBulkOperations: boolean;
    hasCustomBranding: boolean;
  };
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  beta: {
    name: 'beta',
    displayName: 'Beta Tester',
    description: 'Unlimited access during beta period with premium features',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      maxInventoryItems: -1,
      maxMarketplaceConnections: -1,
      maxApiCallsPerMonth: -1,
      maxStorageMb: -1,
      hasAiAssistant: true,
      hasAdvancedAnalytics: true,
      hasPrioritySupport: true,
      hasBulkOperations: true,
      hasCustomBranding: false,
    },
  },
  trial: {
    name: 'trial',
    displayName: 'Free Trial',
    description: '30-day trial with full Pro features',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      maxInventoryItems: 50,
      maxMarketplaceConnections: 3,
      maxApiCallsPerMonth: 1000,
      maxStorageMb: 500,
      hasAiAssistant: true,
      hasAdvancedAnalytics: false,
      hasPrioritySupport: false,
      hasBulkOperations: false,
      hasCustomBranding: false,
    },
  },
  hobbyist: {
    name: 'hobbyist',
    displayName: 'Hobbyist',
    description: 'Perfect for casual resellers and side businesses',
    monthlyPrice: 999, // $9.99
    yearlyPrice: 9990, // $99.90
    features: {
      maxInventoryItems: 200,
      maxMarketplaceConnections: 3,
      maxApiCallsPerMonth: 5000,
      maxStorageMb: 1000,
      hasAiAssistant: false,
      hasAdvancedAnalytics: false,
      hasPrioritySupport: false,
      hasBulkOperations: true,
      hasCustomBranding: false,
    },
  },
  pro: {
    name: 'pro',
    displayName: 'Professional',
    description: 'Full-featured plan for serious resellers',
    monthlyPrice: 2999, // $29.99
    yearlyPrice: 29990, // $299.90
    features: {
      maxInventoryItems: -1,
      maxMarketplaceConnections: -1,
      maxApiCallsPerMonth: -1,
      maxStorageMb: -1,
      hasAiAssistant: true,
      hasAdvancedAnalytics: true,
      hasPrioritySupport: true,
      hasBulkOperations: true,
      hasCustomBranding: true,
    },
  },
};

export interface CreateCustomerParams {
  userId: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  metadata?: Record<string, string>;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Stripe Service Class
 * Provides methods for managing customers, subscriptions, and billing
 */
class StripeService {
  private static _stripe: Stripe | null = null;

  private static getStripe(): Stripe {
    if (!this._stripe) {
      // Environment variable validation - only when actually needed
      const requiredEnvVars = {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      };

      for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (!value) {
          throw new Error(`Missing required Stripe environment variable: ${key}`);
        }
      }

      this._stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-02-24.acacia',
        typescript: true,
      });
    }
    return this._stripe;
  }

  /**
   * Create a new Stripe customer
   */
  static async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    const stripe = this.getStripe();
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });

    console.log(`✅ Created Stripe customer: ${customer.id} (${params.email})`);
    return customer;
  }

  /**
   * Get or create a Stripe customer
   */
  static async getOrCreateCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    const stripe = this.getStripe();
    // First, try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: params.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      console.log(`📋 Found existing Stripe customer: ${customer.id} (${params.email})`);
      return customer;
    }

    // Create new customer if not found
    return this.createCustomer(params);
  }

  /**
   * Create a new subscription
   */
  static async createSubscription(params: {
    customerId: string;
    priceId: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    const stripe = this.getStripe();
    const subscription = await stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      trial_period_days: params.trialDays,
      metadata: params.metadata,
    });

    console.log(`✅ Created subscription: ${subscription.id} for customer: ${params.customerId}`);
    return subscription;
  }

  /**
   * Update an existing subscription
   */
  static async updateSubscription(params: {
    subscriptionId: string;
    priceId?: string;
    trialEnd?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    const stripe = this.getStripe();
    const updateData: Stripe.SubscriptionUpdateParams = {};

    if (params.priceId) {
      // Get current subscription to update the price
      const currentSub = await stripe.subscriptions.retrieve(params.subscriptionId);
      updateData.items = [
        {
          id: currentSub.items.data[0].id,
          price: params.priceId,
        },
      ];
    }

    if (params.trialEnd) {
      updateData.trial_end = params.trialEnd;
    }

    if (params.metadata) {
      updateData.metadata = params.metadata;
    }

    const subscription = await stripe.subscriptions.update(
      params.subscriptionId,
      updateData
    );

    console.log(`✅ Updated subscription: ${params.subscriptionId}`);
    return subscription;
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd = true
  ): Promise<Stripe.Subscription> {
    const stripe = this.getStripe();
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    console.log(`🗑️ Cancelled subscription: ${subscriptionId} (at period end: ${cancelAtPeriodEnd})`);
    return subscription;
  }

  /**
   * Reactivate a subscription
   */
  static async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const stripe = this.getStripe();
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    console.log(`🔄 Reactivated subscription: ${subscriptionId}`);
    return subscription;
  }

  /**
   * Get subscription by ID
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const stripe = this.getStripe();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error(`❌ Failed to get subscription ${subscriptionId}:`, error);
      return null;
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const stripe = this.getStripe();
      const customer = await stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      console.error(`❌ Failed to get customer ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Create billing portal session
   */
  static async createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    const stripe = this.getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    console.log(`🔗 Created billing portal session for customer: ${params.customerId}`);
    return session;
  }

  /**
   * Create checkout session
   */
  static async createCheckoutSession(params: {
    customerId?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    const stripe = this.getStripe();
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    };

    if (params.customerId) {
      sessionParams.customer = params.customerId;
    }

    if (params.trialDays) {
      sessionParams.subscription_data = {
        trial_period_days: params.trialDays,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`🛒 Created checkout session: ${session.id}`);
    return session;
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(body: string, signature: string): Stripe.Event {
    const stripe = this.getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    }

    try {
      return stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error}`);
    }
  }

  /**
   * Get subscription tier from price ID
   */
  static getSubscriptionTierFromPriceId(priceId: string): SubscriptionTier | null {
    for (const [tier, id] of Object.entries(STRIPE_PRICES)) {
      if (id === priceId) {
        return tier as SubscriptionTier;
      }
    }
    return null;
  }

  /**
   * Get price ID for tier
   */
  static getPriceIdForTier(tier: SubscriptionTier): string {
    return STRIPE_PRICES[tier];
  }

  /**
   * Format price in cents to display format
   */
  static formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export { StripeService };
export default StripeService;