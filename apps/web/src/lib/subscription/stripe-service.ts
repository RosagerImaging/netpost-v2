/**
 * Stripe Integration Service
 *
 * Handles all Stripe-related operations for subscription management
 * including customer creation, subscription management, and webhook processing
 */

import Stripe from 'stripe';

// Environment variable validation
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

// Initialize Stripe client
export const stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Stripe Price IDs from environment
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
export class StripeService {
  /**
   * Create a new Stripe customer
   */
  static async createCustomer({
    userId,
    email,
    name,
    metadata = {},
  }: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          ...metadata,
        },
      });

      console.log(`✅ Created Stripe customer: ${customer.id} for user: ${userId}`);
      return customer;
    } catch (error) {
      console.error('❌ Failed to create Stripe customer:', error);
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get or create a Stripe customer for a user
   */
  static async getOrCreateCustomer({
    userId,
    email,
    name,
    metadata = {},
  }: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      // Try to find existing customer by user ID in metadata
      const existingCustomers = await stripe.customers.list({
        limit: 1,
        metadata: { userId },
      });

      if (existingCustomers.data.length > 0) {
        console.log(`✅ Found existing Stripe customer: ${existingCustomers.data[0].id}`);
        return existingCustomers.data[0];
      }

      // Create new customer if not found
      return await this.createCustomer({ userId, email, name, metadata });
    } catch (error) {
      console.error('❌ Failed to get or create Stripe customer:', error);
      throw new Error(`Failed to get or create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new subscription
   */
  static async createSubscription({
    customerId,
    priceId,
    metadata = {},
    trialPeriodDays,
  }: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      };

      if (trialPeriodDays && trialPeriodDays > 0) {
        subscriptionParams.trial_period_days = trialPeriodDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      console.log(`✅ Created Stripe subscription: ${subscription.id} for customer: ${customerId}`);
      return subscription;
    } catch (error) {
      console.error('❌ Failed to create Stripe subscription:', error);
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing subscription
   */
  static async updateSubscription({
    subscriptionId,
    priceId,
    metadata,
    cancelAtPeriodEnd,
  }: UpdateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {};

      if (priceId) {
        // Get current subscription to modify items
        const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        updateParams.items = [
          {
            id: currentSubscription.items.data[0].id,
            price: priceId,
          },
        ];
        updateParams.proration_behavior = 'create_prorations';
      }

      if (metadata) {
        updateParams.metadata = metadata;
      }

      if (cancelAtPeriodEnd !== undefined) {
        updateParams.cancel_at_period_end = cancelAtPeriodEnd;
      }

      const subscription = await stripe.subscriptions.update(subscriptionId, updateParams);

      console.log(`✅ Updated Stripe subscription: ${subscription.id}`);
      return subscription;
    } catch (error) {
      console.error('❌ Failed to update Stripe subscription:', error);
      throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    try {
      let subscription: Stripe.Subscription;

      if (immediately) {
        subscription = await stripe.subscriptions.cancel(subscriptionId);
      } else {
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      console.log(`✅ ${immediately ? 'Canceled' : 'Scheduled cancellation for'} subscription: ${subscription.id}`);
      return subscription;
    } catch (error) {
      console.error('❌ Failed to cancel Stripe subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  static async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      console.log(`✅ Reactivated subscription: ${subscription.id}`);
      return subscription;
    } catch (error) {
      console.error('❌ Failed to reactivate Stripe subscription:', error);
      throw new Error(`Failed to reactivate subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice', 'customer'],
      });

      return subscription;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      console.error('❌ Failed to get Stripe subscription:', error);
      throw new Error(`Failed to get subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get customer details
   */
  static async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        return null;
      }

      return customer as Stripe.Customer;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      console.error('❌ Failed to get Stripe customer:', error);
      throw new Error(`Failed to get customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a billing portal session
   */
  static async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      console.log(`✅ Created billing portal session for customer: ${customerId}`);
      return session;
    } catch (error) {
      console.error('❌ Failed to create billing portal session:', error);
      throw new Error(`Failed to create billing portal session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession({
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    metadata = {},
    trialPeriodDays,
  }: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    trialPeriodDays?: number;
  }): Promise<Stripe.Checkout.Session> {
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        payment_method_collection: 'if_required',
        subscription_data: {
          metadata,
        },
      };

      if (trialPeriodDays && trialPeriodDays > 0) {
        sessionParams.subscription_data!.trial_period_days = trialPeriodDays;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      console.log(`✅ Created checkout session: ${session.id} for customer: ${customerId}`);
      return session;
    } catch (error) {
      console.error('❌ Failed to create checkout session:', error);
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(body: string, signature: string): Stripe.Event {
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        requiredEnvVars.STRIPE_WEBHOOK_SECRET!
      );

      return event;
    } catch (error) {
      console.error('❌ Failed to verify webhook signature:', error);
      throw new Error(`Invalid webhook signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the subscription tier from a Stripe price ID
   */
  static getSubscriptionTierFromPriceId(priceId: string): SubscriptionTier | null {
    for (const [tier, tierPriceId] of Object.entries(STRIPE_PRICES)) {
      if (tierPriceId === priceId) {
        return tier as SubscriptionTier;
      }
    }
    return null;
  }

  /**
   * Get price ID for a subscription tier
   */
  static getPriceIdForTier(tier: SubscriptionTier): string {
    return STRIPE_PRICES[tier];
  }

  /**
   * Format price in cents to display format
   */
  static formatPrice(priceInCents: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(priceInCents / 100);
  }
}

export default StripeService;