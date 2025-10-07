/**
 * Subscription Service Layer
 *
 * Core business logic for subscription management including tier validation,
 * status checking, subscription transitions, and usage limit enforcement
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Create a properly typed supabase admin client for the web app
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import { SubscriptionTier, SUBSCRIPTION_TIERS } from './stripe-service';

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
type SubscriptionRow = Database['public']['Tables']['user_subscriptions']['Row'] & {
  subscription_tiers: Pick<
    Database['public']['Tables']['subscription_tiers']['Row'],
    | 'tier_name'
    | 'display_name'
    | 'max_inventory_items'
    | 'max_marketplace_connections'
    | 'max_api_calls_per_month'
    | 'max_storage_mb'
    | 'has_ai_assistant'
    | 'has_advanced_analytics'
    | 'has_priority_support'
    | 'has_bulk_operations'
    | 'has_custom_branding'
  >;
};

function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  return new Date(value);
}

function parseMandatoryDate(value: string | null | undefined, field: string): Date {
  if (!value) {
    throw new Error(`Expected ${field} to be present on subscription record.`);
  }
  return new Date(value);
}

function resolveBillingCycle(value: string | null | undefined): UserSubscription['billingCycle'] {
  return value === 'yearly' ? 'yearly' : 'monthly';
}

type UserSubscriptionsInsert = Database['public']['Tables']['user_subscriptions']['Insert'];
type UserSubscriptionsUpdate = Database['public']['Tables']['user_subscriptions']['Update'];
type SubscriptionLimitsInsert = Database['public']['Tables']['subscription_limits']['Insert'];
type SubscriptionHistoryInsert = Database['public']['Tables']['subscription_history']['Insert'];
type SubscriptionPaymentsInsert = Database['public']['Tables']['subscription_payments']['Insert'];

type IncrementUsageArgs = Parameters<typeof supabaseAdmin.rpc<'increment_usage'>>[1];

function buildSubscriptionInsert(
  params: CreateSubscriptionParams,
  tierId: number
): UserSubscriptionsInsert {
  return {
    user_id: params.userId,
    tier_id: tierId,
    stripe_subscription_id: params.stripeSubscriptionId ?? null,
    stripe_customer_id: params.stripeCustomerId ?? null,
    status: params.status,
    current_period_start: params.currentPeriodStart?.toISOString() ?? null,
    current_period_end: params.currentPeriodEnd?.toISOString() ?? null,
    trial_start: params.trialStart ? params.trialStart.toISOString() : null,
    trial_end: params.trialEnd ? params.trialEnd.toISOString() : null,
    is_beta_user: params.isBetaUser ?? false,
    beta_invitation_code: params.betaInvitationCode ?? null,
    billing_cycle: params.billingCycle ?? 'monthly',
  } satisfies UserSubscriptionsInsert;
}

function buildSubscriptionUpdate(
  updates: Partial<{
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAt: Date | null;
    canceledAt: Date | null;
    lastPaymentDate: Date;
    tierId: number;
  }>
): UserSubscriptionsUpdate {
  const payload: UserSubscriptionsUpdate = {};
  if (updates.status) payload.status = updates.status;
  if (updates.currentPeriodStart) payload.current_period_start = updates.currentPeriodStart.toISOString();
  if (updates.currentPeriodEnd) payload.current_period_end = updates.currentPeriodEnd.toISOString();
  if (updates.cancelAt !== undefined) payload.cancel_at = updates.cancelAt instanceof Date ? updates.cancelAt.toISOString() : null;
  if (updates.canceledAt !== undefined) payload.canceled_at = updates.canceledAt instanceof Date ? updates.canceledAt.toISOString() : null;
  if (updates.lastPaymentDate) payload.last_payment_date = updates.lastPaymentDate.toISOString();
  if (updates.tierId !== undefined) payload.tier_id = updates.tierId;
  return payload;
}

function buildSubscriptionLimitsInsert(subscriptionId: string): SubscriptionLimitsInsert {
  return {
    subscription_id: subscriptionId,
    current_inventory_items: 0,
    current_marketplace_connections: 0,
    current_storage_mb: 0,
    monthly_api_calls: 0,
    monthly_listings_created: 0,
  } satisfies SubscriptionLimitsInsert;
}

function buildSubscriptionHistoryInsert(params: {
  userId: string;
  subscriptionId: string;
  eventType: SubscriptionHistoryInsert['event_type'];
  fromTierId?: number;
  toTierId?: number;
  reason?: string;
  triggeredBy: SubscriptionHistoryInsert['triggered_by'];
  metadata?: Record<string, unknown>;
}): SubscriptionHistoryInsert {
  return {
    user_id: params.userId,
    subscription_id: params.subscriptionId,
    event_type: params.eventType,
    from_tier_id: params.fromTierId ?? null,
    to_tier_id: params.toTierId ?? null,
    reason: params.reason ?? null,
    triggered_by: params.triggeredBy,
    metadata: params.metadata ?? {},
  } satisfies SubscriptionHistoryInsert;
}

function buildSubscriptionPaymentInsert(params: RecordPaymentParams): SubscriptionPaymentsInsert {
  return {
    stripe_subscription_id: params.stripeSubscriptionId,
    stripe_invoice_id: params.stripeInvoiceId,
    amount: params.amount,
    currency: params.currency,
    paid_at: params.paidAt.toISOString(),
    success: params.success,
    failure_reason: params.failureReason ?? null,
  } satisfies SubscriptionPaymentsInsert;
}

function buildIncrementUsageArgs(
  subscriptionId: string,
  fieldName: string,
  increment: number
): IncrementUsageArgs {
  return {
    subscription_id: subscriptionId,
    field_name: fieldName,
    increment_value: increment,
  } as IncrementUsageArgs;
}

export class SubscriptionService {
  /**
   * Create a new subscription
   */
  static async createSubscription(params: CreateSubscriptionParams): Promise<UserSubscription> {
    try {
      // Get tier ID
      const { data: tierData, error: tierError } = await supabaseAdmin
        .from('subscription_tiers')
        .select('id')
        .eq('tier_name', params.tier)
        .single();

      if (tierError || !tierData) {
        throw new Error(`Subscription tier not found: ${params.tier}`);
      }

      // Create subscription record
      const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
        .from('user_subscriptions')
        .insert(buildSubscriptionInsert(params, (tierData as { id: number }).id))
        .select(`
          *,
          subscription_tiers!inner(tier_name)
        `)
        .single();

      if (subscriptionError) {
        throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
      }

      // Create initial subscription limits
      await this.initializeSubscriptionLimits((subscriptionData as SubscriptionRow).id);

      // Record subscription creation in history
      await this.recordSubscriptionHistory({
        userId: params.userId,
        subscriptionId: (subscriptionData as SubscriptionRow).id,
        eventType: 'created',
        toTierId: (tierData as { id: number }).id,
        reason: `Subscription created with tier: ${params.tier}`,
        triggeredBy: 'system',
      });

      console.log(`✅ Created subscription for user ${params.userId} with tier ${params.tier}`);

      return this.mapSubscriptionData(subscriptionData as SubscriptionRow);
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

      return this.mapSubscriptionData(data as SubscriptionRow);
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
      const updateData: Record<string, unknown> = {};

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

        updateData.tier_id = (tierData as { id: number }).id;
      }

      const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .update(updateData)
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

      const { error } = await supabaseAdmin.rpc('increment_usage', {
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
        .insert(buildSubscriptionPaymentInsert(params));

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
        .insert(buildSubscriptionLimitsInsert(subscriptionId));

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
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('subscription_history')
        .insert(buildSubscriptionHistoryInsert(params));

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
  private static mapSubscriptionData(data: SubscriptionRow): UserSubscription {
    return {
      id: data.id,
      userId: data.user_id,
      tierId: data.tier_id,
      tier: data.subscription_tiers.tier_name as SubscriptionTier,
      stripeSubscriptionId: data.stripe_subscription_id ?? undefined,
      stripeCustomerId: data.stripe_customer_id ?? undefined,
      status: data.status as SubscriptionStatus,
      currentPeriodStart: parseDate(data.current_period_start),
      currentPeriodEnd: parseDate(data.current_period_end),
      trialStart: parseDate(data.trial_start),
      trialEnd: parseDate(data.trial_end),
      cancelAt: parseDate(data.cancel_at),
      canceledAt: parseDate(data.canceled_at),
      isBetaUser: Boolean(data.is_beta_user),
      betaInvitationCode: data.beta_invitation_code ?? undefined,
      betaInvitedBy: data.beta_invited_by ?? undefined,
      betaFeedbackSubmitted: Boolean(data.beta_feedback_submitted),
      billingCycle: resolveBillingCycle(data.billing_cycle),
      lastPaymentDate: parseDate(data.last_payment_date),
      nextBillingDate: parseDate(data.next_billing_date),
      createdAt: parseMandatoryDate(data.created_at, 'created_at'),
      updatedAt: parseMandatoryDate(data.updated_at, 'updated_at'),
    };
  }
}

export default SubscriptionService;