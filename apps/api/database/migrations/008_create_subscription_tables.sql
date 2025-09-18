-- Migration: Create Subscription System Tables
-- Purpose: Implement comprehensive subscription management with beta testing capabilities
-- Date: 2025-09-18
-- Author: BMad Development Agent (Story 1.8)

-- ===============================
-- Subscription Tiers Definition
-- ===============================
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id SERIAL PRIMARY KEY,
  tier_name VARCHAR(50) UNIQUE NOT NULL, -- 'beta', 'trial', 'hobbyist', 'pro'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Pricing
  monthly_price_cents INTEGER NOT NULL DEFAULT 0, -- Price in cents
  yearly_price_cents INTEGER DEFAULT 0,
  stripe_price_id VARCHAR(100), -- Stripe Price ID
  stripe_product_id VARCHAR(100), -- Stripe Product ID

  -- Feature Limits
  max_inventory_items INTEGER DEFAULT -1, -- -1 for unlimited
  max_marketplace_connections INTEGER DEFAULT -1,
  max_api_calls_per_month INTEGER DEFAULT -1,
  max_storage_mb INTEGER DEFAULT -1,

  -- Feature Flags
  has_ai_assistant BOOLEAN DEFAULT FALSE,
  has_advanced_analytics BOOLEAN DEFAULT FALSE,
  has_priority_support BOOLEAN DEFAULT FALSE,
  has_bulk_operations BOOLEAN DEFAULT FALSE,
  has_custom_branding BOOLEAN DEFAULT FALSE,

  -- System Fields
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_tier_name CHECK (tier_name IN ('beta', 'trial', 'hobbyist', 'pro')),
  CONSTRAINT positive_prices CHECK (monthly_price_cents >= 0 AND yearly_price_cents >= 0)
);

-- ===============================
-- User Subscriptions
-- ===============================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id INTEGER NOT NULL REFERENCES public.subscription_tiers(id),

  -- Stripe Integration
  stripe_subscription_id VARCHAR(100) UNIQUE,
  stripe_customer_id VARCHAR(100),

  -- Subscription Status
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'trialing', 'past_due', 'canceled', 'unpaid'

  -- Billing Periods
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,

  -- Beta Program Fields
  is_beta_user BOOLEAN DEFAULT FALSE,
  beta_invitation_code VARCHAR(100),
  beta_invited_by UUID REFERENCES auth.users(id),
  beta_feedback_submitted BOOLEAN DEFAULT FALSE,

  -- Billing
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
  last_payment_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,

  -- System Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly')),
  CONSTRAINT unique_user_active_subscription UNIQUE (user_id) -- Only one active subscription per user
);

-- ===============================
-- Subscription History
-- ===============================
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,

  -- Change Details
  event_type VARCHAR(50) NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'renewed', 'payment_failed'
  from_tier_id INTEGER REFERENCES public.subscription_tiers(id),
  to_tier_id INTEGER REFERENCES public.subscription_tiers(id),

  -- Event Context
  reason TEXT,
  triggered_by VARCHAR(50) DEFAULT 'user', -- 'user', 'admin', 'system', 'stripe'
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  event_date TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_event_type CHECK (event_type IN ('created', 'upgraded', 'downgraded', 'canceled', 'renewed', 'payment_failed', 'reactivated')),
  CONSTRAINT valid_triggered_by CHECK (triggered_by IN ('user', 'admin', 'system', 'stripe'))
);

-- ===============================
-- Usage Metrics
-- ===============================
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,

  -- Metric Details
  metric_type VARCHAR(50) NOT NULL, -- 'inventory_items', 'listings_created', 'api_calls', 'storage_used'
  metric_value BIGINT NOT NULL DEFAULT 0,

  -- Time Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Aggregation
  is_daily_aggregate BOOLEAN DEFAULT FALSE,
  is_monthly_aggregate BOOLEAN DEFAULT FALSE,

  -- System Fields
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_metric_type CHECK (metric_type IN ('inventory_items', 'listings_created', 'api_calls', 'storage_used', 'marketplace_connections', 'photos_uploaded')),
  CONSTRAINT valid_period CHECK (period_end > period_start),
  CONSTRAINT positive_metric_value CHECK (metric_value >= 0)
);

-- ===============================
-- Beta User Invitations
-- ===============================
CREATE TABLE IF NOT EXISTS public.beta_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_code VARCHAR(100) UNIQUE NOT NULL,

  -- Invitation Details
  invited_email VARCHAR(255),
  invited_by UUID REFERENCES auth.users(id),
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,

  -- System Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_max_uses CHECK (max_uses > 0),
  CONSTRAINT valid_uses_count CHECK (uses_count >= 0 AND uses_count <= max_uses)
);

-- ===============================
-- Subscription Limits Tracking
-- ===============================
CREATE TABLE IF NOT EXISTS public.subscription_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,

  -- Current Usage (real-time)
  current_inventory_items INTEGER DEFAULT 0,
  current_marketplace_connections INTEGER DEFAULT 0,
  current_storage_mb INTEGER DEFAULT 0,

  -- Monthly Usage (resets each billing cycle)
  monthly_api_calls INTEGER DEFAULT 0,
  monthly_listings_created INTEGER DEFAULT 0,

  -- Last Reset
  last_monthly_reset TIMESTAMPTZ DEFAULT NOW(),

  -- System Fields
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT non_negative_usage CHECK (
    current_inventory_items >= 0 AND
    current_marketplace_connections >= 0 AND
    current_storage_mb >= 0 AND
    monthly_api_calls >= 0 AND
    monthly_listings_created >= 0
  ),

  -- Only one limit record per subscription
  CONSTRAINT unique_subscription_limits UNIQUE (subscription_id)
);

-- ===============================
-- Indexes for Performance
-- ===============================

-- User subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_beta_user ON public.user_subscriptions(is_beta_user);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_current_period ON public.user_subscriptions(current_period_start, current_period_end);

-- Subscription history indexes
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON public.subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_type ON public.subscription_history(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_date ON public.subscription_history(event_date DESC);

-- Usage metrics indexes
CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_id ON public.usage_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON public.usage_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_period ON public.usage_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_daily ON public.usage_metrics(is_daily_aggregate) WHERE is_daily_aggregate = TRUE;
CREATE INDEX IF NOT EXISTS idx_usage_metrics_monthly ON public.usage_metrics(is_monthly_aggregate) WHERE is_monthly_aggregate = TRUE;

-- Beta invitations indexes
CREATE INDEX IF NOT EXISTS idx_beta_invitations_code ON public.beta_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_email ON public.beta_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_active ON public.beta_invitations(is_active) WHERE is_active = TRUE;

-- ===============================
-- Triggers and Functions
-- ===============================

-- Update updated_at columns
CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON public.subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beta_invitations_updated_at
  BEFORE UPDATE ON public.beta_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_limits_updated_at
  BEFORE UPDATE ON public.subscription_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- Row Level Security (RLS)
-- ===============================

-- Enable RLS on all tables
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;

-- Subscription tiers: Public read access
CREATE POLICY "Subscription tiers are publicly readable" ON public.subscription_tiers
  FOR SELECT USING (is_active = TRUE);

-- User subscriptions: Users can only see their own
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscription history: Users can view their own history
CREATE POLICY "Users can view own subscription history" ON public.subscription_history
  FOR SELECT USING (auth.uid() = user_id);

-- Usage metrics: Users can view their own metrics
CREATE POLICY "Users can view own usage metrics" ON public.usage_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- Beta invitations: Limited access
CREATE POLICY "Beta invitations visible to invited user" ON public.beta_invitations
  FOR SELECT USING (
    auth.uid() = invited_by OR
    auth.email() = invited_email
  );

-- Subscription limits: Users can view their own limits
CREATE POLICY "Users can view own subscription limits" ON public.subscription_limits
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM public.user_subscriptions
      WHERE id = subscription_id
    )
  );

-- Service role policies (admin access)
CREATE POLICY "Service role can manage subscription tiers" ON public.subscription_tiers
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

CREATE POLICY "Service role can manage user subscriptions" ON public.user_subscriptions
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

CREATE POLICY "Service role can manage subscription history" ON public.subscription_history
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

CREATE POLICY "Service role can manage usage metrics" ON public.usage_metrics
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

CREATE POLICY "Service role can manage beta invitations" ON public.beta_invitations
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

CREATE POLICY "Service role can manage subscription limits" ON public.subscription_limits
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

-- ===============================
-- Grant Permissions
-- ===============================

GRANT SELECT ON public.subscription_tiers TO authenticated, anon;
GRANT ALL ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.subscription_history TO authenticated;
GRANT ALL ON public.usage_metrics TO authenticated;
GRANT ALL ON public.beta_invitations TO authenticated;
GRANT ALL ON public.subscription_limits TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ===============================
-- Insert Default Subscription Tiers
-- ===============================

INSERT INTO public.subscription_tiers (tier_name, display_name, description, monthly_price_cents, yearly_price_cents, max_inventory_items, max_marketplace_connections, max_api_calls_per_month, max_storage_mb, has_ai_assistant, has_advanced_analytics, has_priority_support, has_bulk_operations, has_custom_branding)
VALUES
  -- Beta Tier (Free during beta period)
  ('beta', 'Beta Tester', 'Unlimited access during beta period with premium features', 0, 0, -1, -1, -1, -1, TRUE, TRUE, TRUE, TRUE, FALSE),

  -- Free Trial (Post-launch)
  ('trial', 'Free Trial', '30-day trial with full Pro features', 0, 0, 50, 3, 1000, 500, TRUE, FALSE, FALSE, FALSE, FALSE),

  -- Hobbyist Tier
  ('hobbyist', 'Hobbyist', 'Perfect for casual resellers and side businesses', 999, 9990, 200, 3, 5000, 1000, FALSE, FALSE, FALSE, TRUE, FALSE),

  -- Pro Tier
  ('pro', 'Professional', 'Full-featured plan for serious resellers', 2999, 29990, -1, -1, -1, -1, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (tier_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  yearly_price_cents = EXCLUDED.yearly_price_cents,
  max_inventory_items = EXCLUDED.max_inventory_items,
  max_marketplace_connections = EXCLUDED.max_marketplace_connections,
  max_api_calls_per_month = EXCLUDED.max_api_calls_per_month,
  max_storage_mb = EXCLUDED.max_storage_mb,
  has_ai_assistant = EXCLUDED.has_ai_assistant,
  has_advanced_analytics = EXCLUDED.has_advanced_analytics,
  has_priority_support = EXCLUDED.has_priority_support,
  has_bulk_operations = EXCLUDED.has_bulk_operations,
  has_custom_branding = EXCLUDED.has_custom_branding,
  updated_at = NOW();