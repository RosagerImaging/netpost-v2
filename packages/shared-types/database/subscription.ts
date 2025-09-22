/**
 * Subscription Database Types
 *
 * Types and interfaces for subscription-related tables:
 * - subscription_tiers
 * - user_subscriptions
 * - subscription_payments
 * - subscription_limits
 * - subscription_history
 * - usage_metrics
 */

/**
 * Subscription tier levels
 */
export type SubscriptionTier = 'basic' | 'pro' | 'enterprise';

/**
 * Subscription status enum
 */
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';

/**
 * Billing cycle options
 */
export type BillingCycle = 'monthly' | 'yearly';

/**
 * Subscription event types for history tracking
 */
export type SubscriptionEventType = 'created' | 'upgraded' | 'downgraded' | 'canceled' | 'renewed' | 'payment_failed' | 'reactivated';

/**
 * Triggered by options for subscription events
 */
export type TriggeredBy = 'user' | 'admin' | 'system' | 'stripe';

/**
 * Usage metric types
 */
export type MetricType = 'inventory_items' | 'listings_created' | 'api_calls' | 'storage_used' | 'marketplace_connections' | 'photos_uploaded';

// ===== SUBSCRIPTION TIERS TABLE =====

/**
 * Database record type for subscription_tiers table
 */
export interface SubscriptionTierRecord {
  id: number;
  tier_name: SubscriptionTier;
  display_name: string;
  max_inventory_items: number;
  max_marketplace_connections: number;
  max_api_calls_per_month: number;
  max_storage_mb: number;
  has_ai_assistant: boolean;
  has_advanced_analytics: boolean;
  has_priority_support: boolean;
  has_bulk_operations: boolean;
  has_custom_branding: boolean;
  monthly_price_cents: number;
  yearly_price_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating a new subscription tier
 */
export interface CreateSubscriptionTierInput {
  tier_name: SubscriptionTier;
  display_name: string;
  max_inventory_items: number;
  max_marketplace_connections: number;
  max_api_calls_per_month: number;
  max_storage_mb: number;
  has_ai_assistant?: boolean;
  has_advanced_analytics?: boolean;
  has_priority_support?: boolean;
  has_bulk_operations?: boolean;
  has_custom_branding?: boolean;
  monthly_price_cents: number;
  yearly_price_cents: number;
  is_active?: boolean;
}

/**
 * Input type for updating a subscription tier
 */
export interface UpdateSubscriptionTierInput {
  tier_name?: SubscriptionTier;
  display_name?: string;
  max_inventory_items?: number;
  max_marketplace_connections?: number;
  max_api_calls_per_month?: number;
  max_storage_mb?: number;
  has_ai_assistant?: boolean;
  has_advanced_analytics?: boolean;
  has_priority_support?: boolean;
  has_bulk_operations?: boolean;
  has_custom_branding?: boolean;
  monthly_price_cents?: number;
  yearly_price_cents?: number;
  is_active?: boolean;
}

// ===== USER SUBSCRIPTIONS TABLE =====

/**
 * Database record type for user_subscriptions table
 */
export interface UserSubscriptionRecord {
  id: string;
  user_id: string;
  tier_id: number;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start: string | null;
  trial_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  is_beta_user: boolean;
  beta_invitation_code: string | null;
  beta_invited_by: string | null;
  beta_feedback_submitted: boolean;
  billing_cycle: BillingCycle;
  last_payment_date: string | null;
  next_billing_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating a new user subscription
 */
export interface CreateUserSubscriptionInput {
  user_id: string;
  tier_id: number;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  status: SubscriptionStatus;
  current_period_start?: string | null;
  current_period_end?: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
  is_beta_user?: boolean;
  beta_invitation_code?: string | null;
  beta_invited_by?: string | null;
  billing_cycle?: BillingCycle;
}

/**
 * Input type for updating a user subscription
 */
export interface UpdateUserSubscriptionInput {
  tier_id?: number;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  status?: SubscriptionStatus;
  current_period_start?: string | null;
  current_period_end?: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
  cancel_at?: string | null;
  canceled_at?: string | null;
  is_beta_user?: boolean;
  beta_invitation_code?: string | null;
  beta_invited_by?: string | null;
  beta_feedback_submitted?: boolean;
  billing_cycle?: BillingCycle;
  last_payment_date?: string | null;
  next_billing_date?: string | null;
}

// ===== SUBSCRIPTION PAYMENTS TABLE =====

/**
 * Database record type for subscription_payments table
 */
export interface SubscriptionPaymentRecord {
  id: string;
  stripe_subscription_id: string;
  stripe_invoice_id: string;
  amount: number;
  currency: string;
  paid_at: string;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating a new subscription payment record
 */
export interface CreateSubscriptionPaymentInput {
  stripe_subscription_id: string;
  stripe_invoice_id: string;
  amount: number;
  currency: string;
  paid_at: string;
  success: boolean;
  failure_reason?: string | null;
}

// ===== SUBSCRIPTION LIMITS TABLE =====

/**
 * Database record type for subscription_limits table
 */
export interface SubscriptionLimitsRecord {
  id: string;
  subscription_id: string;
  current_inventory_items: number;
  current_marketplace_connections: number;
  current_storage_mb: number;
  monthly_api_calls: number;
  monthly_listings_created: number;
  last_monthly_reset: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating subscription limits
 */
export interface CreateSubscriptionLimitsInput {
  subscription_id: string;
  current_inventory_items?: number;
  current_marketplace_connections?: number;
  current_storage_mb?: number;
  monthly_api_calls?: number;
  monthly_listings_created?: number;
  last_monthly_reset?: string;
}

/**
 * Input type for updating subscription limits
 */
export interface UpdateSubscriptionLimitsInput {
  current_inventory_items?: number;
  current_marketplace_connections?: number;
  current_storage_mb?: number;
  monthly_api_calls?: number;
  monthly_listings_created?: number;
  last_monthly_reset?: string;
}

// ===== SUBSCRIPTION HISTORY TABLE =====

/**
 * Database record type for subscription_history table
 */
export interface SubscriptionHistoryRecord {
  id: string;
  user_id: string;
  subscription_id: string;
  event_type: SubscriptionEventType;
  from_tier_id: number | null;
  to_tier_id: number | null;
  reason: string | null;
  triggered_by: TriggeredBy;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Input type for creating subscription history records
 */
export interface CreateSubscriptionHistoryInput {
  user_id: string;
  subscription_id: string;
  event_type: SubscriptionEventType;
  from_tier_id?: number | null;
  to_tier_id?: number | null;
  reason?: string | null;
  triggered_by: TriggeredBy;
  metadata?: Record<string, any>;
}

// ===== USAGE METRICS TABLE =====

/**
 * Database record type for usage_metrics table
 */
export interface UsageMetricRecord {
  id: string;
  user_id: string;
  subscription_id: string | null;
  metric_type: MetricType;
  metric_value: number;
  period_start: string;
  period_end: string;
  is_daily_aggregate: boolean;
  is_monthly_aggregate: boolean;
  recorded_at: string;
  created_at: string;
}

/**
 * Input type for creating usage metrics
 */
export interface CreateUsageMetricInput {
  user_id: string;
  subscription_id?: string | null;
  metric_type: MetricType;
  metric_value: number;
  period_start: string;
  period_end: string;
  is_daily_aggregate: boolean;
  is_monthly_aggregate: boolean;
  recorded_at: string;
}

/**
 * Input type for updating usage metrics
 */
export interface UpdateUsageMetricInput {
  metric_value?: number;
  recorded_at?: string;
}

// ===== ENHANCED TYPES WITH RELATIONS =====

/**
 * User subscription with tier information
 */
export interface UserSubscriptionWithTier extends UserSubscriptionRecord {
  subscription_tiers: SubscriptionTierRecord;
}

/**
 * Subscription history with tier information
 */
export interface SubscriptionHistoryWithTiers extends SubscriptionHistoryRecord {
  from_tier?: SubscriptionTierRecord | null;
  to_tier?: SubscriptionTierRecord | null;
}