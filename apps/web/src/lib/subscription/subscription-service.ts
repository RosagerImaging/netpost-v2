/**
 * Subscription Service Layer
 *
 * Core business logic for subscription management including tier validation,
 * status checking, subscription transitions, and usage limit enforcement
 */

import { supabaseAdmin } from '../../../../api/database/supabase';
import { StripeService, SubscriptionTier, SUBSCRIPTION_TIERS } from './stripe-service';

// Type definitions
export interface UserSubscription {
  id: string;
  userId: string;
  tierId: number;
  tier: SubscriptionTier;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAt?: Date;
  canceledAt?: Date;
  isBetaUser: boolean;
  betaInvitationCode?: string;
  betaInvitedBy?: string;
  betaFeedbackSubmitted: boolean;
  billingCycle: 'monthly' | 'yearly';
  lastPaymentDate?: Date;
  nextBillingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionLimits {
  subscriptionId: string;
  currentInventoryItems: number;
  currentMarketplaceConnections: number;
  currentStorageMb: number;
  monthlyApiCalls: number;
  monthlyListingsCreated: number;
  lastMonthlyReset: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionParams {
  userId: string;
  tier: SubscriptionTier;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  isBetaUser?: boolean;
  betaInvitationCode?: string;
  billingCycle?: 'monthly' | 'yearly';
}

export interface UpdateSubscriptionFromStripeParams {
  stripeSubscriptionId: string;
  status?: SubscriptionStatus;
  tier?: SubscriptionTier;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAt?: Date | null;
  canceledAt?: Date | null;
  lastPaymentDate?: Date;
}

export interface RecordPaymentParams {
  stripeSubscriptionId: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  paidAt: Date;
  success: boolean;
  failureReason?: string;
}

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';

export interface UsageCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  isUnlimited: boolean;
  usagePercentage: number;
  nearLimit: boolean; // true if > 80% of limit
}

/**
 * Subscription Service Class
 * Handles all subscription-related business logic
 */
export class SubscriptionService {
  /**
   * Create a new subscription
   */
  static async createSubscription(params: CreateSubscriptionParams): Promise<UserSubscription> {
    try {
      // Get tier ID
      const { data: tierData, error: tierError } = await (supabaseAdmin
        .from('subscription_tiers') as any)
        .select('id')
        .eq('tier_name', params.tier)
        .single();

      if (tierError || !tierData) {
        throw new Error(`Subscription tier not found: ${params.tier}`);
      }

      // Create subscription record
      const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
        .from('user_subscriptions')
        .insert({
          user_id: params.userId,
          tier_id: (tierData as any).id,
          stripe_subscription_id: params.stripeSubscriptionId,
          stripe_customer_id: params.stripeCustomerId,
          status: params.status,
          current_period_start: params.currentPeriodStart?.toISOString(),
          current_period_end: params.currentPeriodEnd?.toISOString(),
          trial_start: params.trialStart?.toISOString(),
          trial_end: params.trialEnd?.toISOString(),
          is_beta_user: params.isBetaUser || false,
          beta_invitation_code: params.betaInvitationCode,
          billing_cycle: params.billingCycle || 'monthly',
        } as any)
        .select(`
          *,
          subscription_tiers!inner(tier_name)
        `)
        .single();

      if (subscriptionError) {
        throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
      }

      // Create initial subscription limits
      await this.initializeSubscriptionLimits((subscriptionData as any).id);

      // Record subscription creation in history
      await this.recordSubscriptionHistory({
        userId: params.userId,
        subscriptionId: (subscriptionData as any).id,
        eventType: 'created',
        toTierId: (tierData as any).id,
        reason: `Subscription created with tier: ${params.tier}`,
        triggeredBy: 'system',
      });

      console.log(`✅ Created subscription for user ${params.userId} with tier ${params.tier}`);

      return this.mapSubscriptionData(subscriptionData);
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_subscriptions')
        .select(`
          *,
          subscription_tiers!inner(tier_name, display_name, max_inventory_items, max_marketplace_connections, max_api_calls_per_month, max_storage_mb, has_ai_assistant, has_advanced_analytics, has_priority_support, has_bulk_operations, has_custom_branding)
        `)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapSubscriptionData(data);
    } catch (error) {
      console.error('❌ Failed to get user subscription:', error);
      return null;
    }
  }

  /**
   * Update subscription from Stripe webhook data
   */
  static async updateSubscriptionFromStripe(params: UpdateSubscriptionFromStripeParams): Promise<void> {
    try {
      const updateData: any = {};

      if (params.status) updateData.status = params.status;
      if (params.currentPeriodStart) updateData.current_period_start = params.currentPeriodStart.toISOString();
      if (params.currentPeriodEnd) updateData.current_period_end = params.currentPeriodEnd.toISOString();
      if (params.cancelAt !== undefined) updateData.cancel_at = params.cancelAt?.toISOString() || null;
      if (params.canceledAt !== undefined) updateData.canceled_at = params.canceledAt?.toISOString() || null;
      if (params.lastPaymentDate) updateData.last_payment_date = params.lastPaymentDate.toISOString();

      // If tier is changing, get the new tier ID
      if (params.tier) {
        const { data: tierData, error: tierError } = await supabaseAdmin
          .from('subscription_tiers')
          .select('id')
          .eq('tier_name', params.tier)
          .single();

        if (tierError || !tierData) {
          throw new Error(`Subscription tier not found: ${params.tier}`);
        }

        updateData.tier_id = (tierData as any).id;
      }

      const { error } = await (supabaseAdmin
        .from('user_subscriptions') as any)
        .update(updateData as any)
        .eq('stripe_subscription_id', params.stripeSubscriptionId);

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      console.log(`✅ Updated subscription from Stripe: ${params.stripeSubscriptionId}`);
    } catch (error) {
      console.error('❌ Failed to update subscription from Stripe:', error);
      throw error;
    }
  }

  /**
   * Check if user can perform an action based on subscription limits
   */
  static async checkUsageLimit(
    userId: string,
    limitType: 'inventory_items' | 'marketplace_connections' | 'api_calls' | 'storage_mb' | 'listings_created'
  ): Promise<UsageCheckResult> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No subscription found for user');
      }

      const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];
      const limits = await this.getSubscriptionLimits(subscription.id);

      let currentUsage: number;
      let limit: number;

      switch (limitType) {
        case 'inventory_items':
          currentUsage = limits.currentInventoryItems;
          limit = tierConfig.features.maxInventoryItems;
          break;
        case 'marketplace_connections':
          currentUsage = limits.currentMarketplaceConnections;
          limit = tierConfig.features.maxMarketplaceConnections;
          break;
        case 'api_calls':
          currentUsage = limits.monthlyApiCalls;
          limit = tierConfig.features.maxApiCallsPerMonth;
          break;
        case 'storage_mb':
          currentUsage = limits.currentStorageMb;
          limit = tierConfig.features.maxStorageMb;
          break;
        case 'listings_created':
          currentUsage = limits.monthlyListingsCreated;
          limit = tierConfig.features.maxApiCallsPerMonth; // Using API calls as proxy for listings
          break;
        default:
          throw new Error(`Unknown limit type: ${limitType}`);
      }

      const isUnlimited = limit === -1;
      const allowed = isUnlimited || currentUsage < limit;
      const usagePercentage = isUnlimited ? 0 : (currentUsage / limit) * 100;
      const nearLimit = usagePercentage > 80;

      return {
        allowed,
        currentUsage,
        limit,
        isUnlimited,
        usagePercentage,
        nearLimit,
      };
    } catch (error) {
      console.error('❌ Failed to check usage limit:', error);
      throw error;
    }
  }

  /**
   * Update usage for a specific limit type
   */
  static async updateUsage(
    userId: string,
    limitType: 'inventory_items' | 'marketplace_connections' | 'api_calls' | 'storage_mb' | 'listings_created',
    increment: number
  ): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No subscription found for user');
      }

      const updateField = {
        inventory_items: 'current_inventory_items',
        marketplace_connections: 'current_marketplace_connections',
        api_calls: 'monthly_api_calls',
        storage_mb: 'current_storage_mb',
        listings_created: 'monthly_listings_created',
      }[limitType];

      const { error } = await (supabaseAdmin as any).rpc('increment_usage', {
        subscription_id: subscription.id,
        field_name: updateField,
        increment_value: increment,
      });

      if (error) {
        throw new Error(`Failed to update usage: ${error.message}`);
      }

      console.log(`✅ Updated ${limitType} usage for user ${userId} by ${increment}`);
    } catch (error) {
      console.error('❌ Failed to update usage:', error);
      throw error;
    }
  }

  /**
   * Record a payment
   */
  static async recordPayment(params: RecordPaymentParams): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('subscription_payments')
        .insert({
          stripe_subscription_id: params.stripeSubscriptionId,
          stripe_invoice_id: params.stripeInvoiceId,
          amount: params.amount,
          currency: params.currency,
          paid_at: params.paidAt.toISOString(),
          success: params.success,
          failure_reason: params.failureReason,
        } as any);

      if (error) {
        throw new Error(`Failed to record payment: ${error.message}`);
      }

      console.log(`✅ Recorded payment for subscription ${params.stripeSubscriptionId}`);
    } catch (error) {
      console.error('❌ Failed to record payment:', error);
      throw error;
    }
  }

  /**
   * Send payment failed notification
   */
  static async notifyPaymentFailed(stripeSubscriptionId: string): Promise<void> {
    try {
      // This would integrate with the email notification system
      // For now, just log it
      console.log(`📧 Payment failed notification needed for subscription: ${stripeSubscriptionId}`);

      // TODO: Implement email notification
      // await EmailService.sendPaymentFailedNotification(subscription);
    } catch (error) {
      console.error('❌ Failed to send payment failed notification:', error);
    }
  }

  /**
   * Get subscription limits for a subscription
   */
  private static async getSubscriptionLimits(subscriptionId: string): Promise<SubscriptionLimits> {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscription_limits')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .single();

      if (error) {
        throw new Error(`Failed to get subscription limits: ${error.message}`);
      }

      return {
        subscriptionId: data.subscription_id,
        currentInventoryItems: data.current_inventory_items,
        currentMarketplaceConnections: data.current_marketplace_connections,
        currentStorageMb: data.current_storage_mb,
        monthlyApiCalls: data.monthly_api_calls,
        monthlyListingsCreated: data.monthly_listings_created,
        lastMonthlyReset: new Date(data.last_monthly_reset),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('❌ Failed to get subscription limits:', error);
      throw error;
    }
  }

  /**
   * Initialize subscription limits for a new subscription
   */
  private static async initializeSubscriptionLimits(subscriptionId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('subscription_limits')
        .insert({
          subscription_id: subscriptionId,
          current_inventory_items: 0,
          current_marketplace_connections: 0,
          current_storage_mb: 0,
          monthly_api_calls: 0,
          monthly_listings_created: 0,
        });

      if (error) {
        throw new Error(`Failed to initialize subscription limits: ${error.message}`);
      }

      console.log(`✅ Initialized subscription limits for subscription: ${subscriptionId}`);
    } catch (error) {
      console.error('❌ Failed to initialize subscription limits:', error);
      throw error;
    }
  }

  /**
   * Record subscription history event
   */
  private static async recordSubscriptionHistory(params: {
    userId: string;
    subscriptionId: string;
    eventType: 'created' | 'upgraded' | 'downgraded' | 'canceled' | 'renewed' | 'payment_failed' | 'reactivated';
    fromTierId?: number;
    toTierId?: number;
    reason?: string;
    triggeredBy: 'user' | 'admin' | 'system' | 'stripe';
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('subscription_history')
        .insert({
          user_id: params.userId,
          subscription_id: params.subscriptionId,
          event_type: params.eventType,
          from_tier_id: params.fromTierId,
          to_tier_id: params.toTierId,
          reason: params.reason,
          triggered_by: params.triggeredBy,
          metadata: params.metadata || {},
        });

      if (error) {
        throw new Error(`Failed to record subscription history: ${error.message}`);
      }

      console.log(`✅ Recorded subscription history: ${params.eventType} for subscription ${params.subscriptionId}`);
    } catch (error) {
      console.error('❌ Failed to record subscription history:', error);
      throw error;
    }
  }

  /**
   * Map database subscription data to TypeScript interface
   */
  private static mapSubscriptionData(data: any): UserSubscription {
    return {
      id: data.id,
      userId: data.user_id,
      tierId: data.tier_id,
      tier: data.subscription_tiers.tier_name as SubscriptionTier,
      stripeSubscriptionId: data.stripe_subscription_id,
      stripeCustomerId: data.stripe_customer_id,
      status: data.status as SubscriptionStatus,
      currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : undefined,
      currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
      trialStart: data.trial_start ? new Date(data.trial_start) : undefined,
      trialEnd: data.trial_end ? new Date(data.trial_end) : undefined,
      cancelAt: data.cancel_at ? new Date(data.cancel_at) : undefined,
      canceledAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
      isBetaUser: data.is_beta_user,
      betaInvitationCode: data.beta_invitation_code,
      betaInvitedBy: data.beta_invited_by,
      betaFeedbackSubmitted: data.beta_feedback_submitted,
      billingCycle: data.billing_cycle,
      lastPaymentDate: data.last_payment_date ? new Date(data.last_payment_date) : undefined,
      nextBillingDate: data.next_billing_date ? new Date(data.next_billing_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export default SubscriptionService;