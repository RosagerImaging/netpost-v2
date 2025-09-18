-- Migration: Create Subscription Helper Functions
-- Purpose: Add database functions for subscription system operations
-- Date: 2025-09-18
-- Author: BMad Development Agent (Story 1.8)

-- ===============================
-- Usage Increment Function
-- ===============================
CREATE OR REPLACE FUNCTION increment_usage(
  subscription_id UUID,
  field_name TEXT,
  increment_value INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update the specified usage field
  CASE field_name
    WHEN 'current_inventory_items' THEN
      UPDATE public.subscription_limits
      SET current_inventory_items = current_inventory_items + increment_value,
          updated_at = NOW()
      WHERE subscription_id = subscription_id;

    WHEN 'current_marketplace_connections' THEN
      UPDATE public.subscription_limits
      SET current_marketplace_connections = current_marketplace_connections + increment_value,
          updated_at = NOW()
      WHERE subscription_id = subscription_id;

    WHEN 'current_storage_mb' THEN
      UPDATE public.subscription_limits
      SET current_storage_mb = current_storage_mb + increment_value,
          updated_at = NOW()
      WHERE subscription_id = subscription_id;

    WHEN 'monthly_api_calls' THEN
      UPDATE public.subscription_limits
      SET monthly_api_calls = monthly_api_calls + increment_value,
          updated_at = NOW()
      WHERE subscription_id = subscription_id;

    WHEN 'monthly_listings_created' THEN
      UPDATE public.subscription_limits
      SET monthly_listings_created = monthly_listings_created + increment_value,
          updated_at = NOW()
      WHERE subscription_id = subscription_id;

    ELSE
      RAISE EXCEPTION 'Invalid field_name: %', field_name;
  END CASE;

  -- Ensure no negative values
  UPDATE public.subscription_limits
  SET current_inventory_items = GREATEST(0, current_inventory_items),
      current_marketplace_connections = GREATEST(0, current_marketplace_connections),
      current_storage_mb = GREATEST(0, current_storage_mb),
      monthly_api_calls = GREATEST(0, monthly_api_calls),
      monthly_listings_created = GREATEST(0, monthly_listings_created)
  WHERE subscription_id = subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- Reset Monthly Usage Function
-- ===============================
CREATE OR REPLACE FUNCTION reset_monthly_usage(subscription_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.subscription_limits
  SET monthly_api_calls = 0,
      monthly_listings_created = 0,
      last_monthly_reset = NOW(),
      updated_at = NOW()
  WHERE subscription_id = subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- Get User Subscription with Limits Function
-- ===============================
CREATE OR REPLACE FUNCTION get_user_subscription_with_limits(user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  tier_name VARCHAR(50),
  status VARCHAR(50),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  is_beta_user BOOLEAN,
  max_inventory_items INTEGER,
  max_marketplace_connections INTEGER,
  max_api_calls_per_month INTEGER,
  max_storage_mb INTEGER,
  current_inventory_items INTEGER,
  current_marketplace_connections INTEGER,
  current_storage_mb INTEGER,
  monthly_api_calls INTEGER,
  monthly_listings_created INTEGER,
  has_ai_assistant BOOLEAN,
  has_advanced_analytics BOOLEAN,
  has_priority_support BOOLEAN,
  has_bulk_operations BOOLEAN,
  has_custom_branding BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.id as subscription_id,
    st.tier_name,
    us.status,
    us.current_period_start,
    us.current_period_end,
    us.trial_end,
    us.is_beta_user,
    st.max_inventory_items,
    st.max_marketplace_connections,
    st.max_api_calls_per_month,
    st.max_storage_mb,
    sl.current_inventory_items,
    sl.current_marketplace_connections,
    sl.current_storage_mb,
    sl.monthly_api_calls,
    sl.monthly_listings_created,
    st.has_ai_assistant,
    st.has_advanced_analytics,
    st.has_priority_support,
    st.has_bulk_operations,
    st.has_custom_branding
  FROM public.user_subscriptions us
  JOIN public.subscription_tiers st ON us.tier_id = st.id
  LEFT JOIN public.subscription_limits sl ON us.id = sl.subscription_id
  WHERE us.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- Check Usage Limit Function
-- ===============================
CREATE OR REPLACE FUNCTION check_usage_limit(
  user_id UUID,
  limit_type VARCHAR(50)
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_usage INTEGER,
  limit_value INTEGER,
  is_unlimited BOOLEAN,
  usage_percentage NUMERIC
) AS $$
DECLARE
  subscription_record RECORD;
  current_val INTEGER;
  limit_val INTEGER;
BEGIN
  -- Get subscription and limits
  SELECT * INTO subscription_record
  FROM get_user_subscription_with_limits(user_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No subscription found for user: %', user_id;
  END IF;

  -- Determine current usage and limit based on type
  CASE limit_type
    WHEN 'inventory_items' THEN
      current_val := subscription_record.current_inventory_items;
      limit_val := subscription_record.max_inventory_items;

    WHEN 'marketplace_connections' THEN
      current_val := subscription_record.current_marketplace_connections;
      limit_val := subscription_record.max_marketplace_connections;

    WHEN 'api_calls' THEN
      current_val := subscription_record.monthly_api_calls;
      limit_val := subscription_record.max_api_calls_per_month;

    WHEN 'storage_mb' THEN
      current_val := subscription_record.current_storage_mb;
      limit_val := subscription_record.max_storage_mb;

    WHEN 'listings_created' THEN
      current_val := subscription_record.monthly_listings_created;
      limit_val := subscription_record.max_api_calls_per_month; -- Using API calls as proxy

    ELSE
      RAISE EXCEPTION 'Invalid limit_type: %', limit_type;
  END CASE;

  -- Return results
  RETURN QUERY SELECT
    (limit_val = -1 OR current_val < limit_val) as allowed,
    current_val as current_usage,
    limit_val as limit_value,
    (limit_val = -1) as is_unlimited,
    CASE
      WHEN limit_val = -1 THEN 0::NUMERIC
      ELSE ROUND((current_val::NUMERIC / limit_val::NUMERIC) * 100, 2)
    END as usage_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- Auto-reset Monthly Usage (for scheduled jobs)
-- ===============================
CREATE OR REPLACE FUNCTION auto_reset_monthly_usage()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER := 0;
  subscription_record RECORD;
BEGIN
  -- Reset monthly usage for subscriptions where the billing cycle has rolled over
  FOR subscription_record IN
    SELECT sl.subscription_id, us.current_period_start
    FROM public.subscription_limits sl
    JOIN public.user_subscriptions us ON sl.subscription_id = us.id
    WHERE sl.last_monthly_reset < us.current_period_start
      AND us.status IN ('active', 'trialing')
  LOOP
    PERFORM reset_monthly_usage(subscription_record.subscription_id);
    reset_count := reset_count + 1;
  END LOOP;

  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- Create Subscription Payments Table
-- ===============================
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id VARCHAR(100) NOT NULL,
  stripe_invoice_id VARCHAR(100) NOT NULL UNIQUE,

  -- Payment Details
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  paid_at TIMESTAMPTZ NOT NULL,

  -- Status
  success BOOLEAN NOT NULL DEFAULT TRUE,
  failure_reason TEXT,

  -- System Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_amount CHECK (amount >= 0)
);

-- Create indexes for subscription payments
CREATE INDEX IF NOT EXISTS idx_subscription_payments_stripe_subscription_id ON public.subscription_payments(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_stripe_invoice_id ON public.subscription_payments(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_paid_at ON public.subscription_payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_success ON public.subscription_payments(success);

-- ===============================
-- Row Level Security for Payments
-- ===============================
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Service role can manage all payments
CREATE POLICY "Service role can manage subscription payments" ON public.subscription_payments
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

-- Users can view their own payments
CREATE POLICY "Users can view own subscription payments" ON public.subscription_payments
  FOR SELECT USING (
    stripe_subscription_id IN (
      SELECT stripe_subscription_id FROM public.user_subscriptions
      WHERE user_id = auth.uid()
    )
  );

-- ===============================
-- Grant Permissions
-- ===============================
GRANT ALL ON public.subscription_payments TO authenticated;
GRANT ALL ON public.subscription_payments TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_monthly_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_with_limits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_reset_monthly_usage() TO service_role;