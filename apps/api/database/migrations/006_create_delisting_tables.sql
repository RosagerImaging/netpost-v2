-- Migration: Create De-listing System Tables
-- Purpose: Support automated and manual de-listing functionality
-- Date: 2025-09-18
-- Author: BMad Development Agent (James) - Story 1.7

-- Create enum for de-listing job status
CREATE TYPE public.delisting_job_status AS ENUM (
  'pending',          -- Job created but not started
  'processing',       -- Job is being processed
  'completed',        -- Job completed successfully
  'partially_failed', -- Some marketplaces failed
  'failed',           -- All marketplaces failed
  'cancelled'         -- Job was cancelled by user
);

-- Create enum for de-listing trigger type
CREATE TYPE public.delisting_trigger_type AS ENUM (
  'sale_detected',    -- Triggered by sale detection
  'manual',           -- Manually triggered by user
  'scheduled',        -- Scheduled de-listing
  'expired'           -- Listing expired
);

-- Create enum for de-listing preference
CREATE TYPE public.delisting_preference AS ENUM (
  'immediate',        -- De-list immediately
  'delayed',          -- De-list after delay
  'manual_confirmation' -- Require manual confirmation
);

-- Table for user de-listing preferences
CREATE TABLE IF NOT EXISTS public.user_delisting_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Global preferences
  auto_delist_enabled BOOLEAN DEFAULT TRUE,
  default_preference public.delisting_preference DEFAULT 'immediate',
  delay_minutes INTEGER DEFAULT 0, -- Delay in minutes for delayed de-listing
  require_confirmation BOOLEAN DEFAULT FALSE,

  -- Notification preferences
  notification_email BOOLEAN DEFAULT TRUE,
  notification_app BOOLEAN DEFAULT TRUE,
  notification_sms BOOLEAN DEFAULT FALSE,
  notification_webhook_url TEXT, -- Optional webhook for notifications

  -- Marketplace-specific preferences (JSONB allows per-marketplace settings)
  marketplace_preferences JSONB DEFAULT '{}', -- {marketplace: {preference: 'immediate', delay: 30}}

  -- Filtering preferences
  exclude_marketplaces TEXT[] DEFAULT '{}', -- Marketplaces to exclude from auto-delisting
  min_sale_amount DECIMAL(10,2), -- Only auto-delist if sale > this amount
  max_sale_amount DECIMAL(10,2), -- Only auto-delist if sale < this amount

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_delay CHECK (delay_minutes >= 0),
  CONSTRAINT valid_sale_amounts CHECK (
    (min_sale_amount IS NULL OR min_sale_amount >= 0) AND
    (max_sale_amount IS NULL OR max_sale_amount >= 0) AND
    (min_sale_amount IS NULL OR max_sale_amount IS NULL OR min_sale_amount <= max_sale_amount)
  )
);

-- Create unique constraint for user preferences
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_delisting_preferences_user_id
ON public.user_delisting_preferences(user_id);

-- Table for de-listing jobs
CREATE TABLE IF NOT EXISTS public.delisting_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,

  -- Job details
  trigger_type public.delisting_trigger_type NOT NULL,
  trigger_data JSONB DEFAULT '{}', -- Additional data about what triggered the job
  status public.delisting_job_status DEFAULT 'pending',

  -- Targeting information
  sold_on_marketplace public.marketplace_type, -- Which marketplace the item sold on
  sale_price DECIMAL(10,2), -- Sale price that triggered delisting
  sale_date TIMESTAMPTZ, -- When the sale occurred
  sale_external_id VARCHAR(255), -- External sale/transaction ID

  -- De-listing scope
  marketplaces_targeted TEXT[] NOT NULL DEFAULT '{}', -- Which marketplaces to delist from
  marketplaces_completed TEXT[] DEFAULT '{}', -- Which marketplaces completed successfully
  marketplaces_failed TEXT[] DEFAULT '{}', -- Which marketplaces failed

  -- Execution details
  scheduled_for TIMESTAMPTZ DEFAULT NOW(), -- When to execute (for delayed delisting)
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Results and logging
  error_log JSONB DEFAULT '{}', -- Detailed error information per marketplace
  success_log JSONB DEFAULT '{}', -- Success details per marketplace
  total_delisted INTEGER DEFAULT 0, -- Number of successfully delisted items
  total_failed INTEGER DEFAULT 0, -- Number of failed delisting attempts

  -- User interaction
  requires_user_confirmation BOOLEAN DEFAULT FALSE,
  user_confirmed_at TIMESTAMPTZ,
  user_cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries),
  CONSTRAINT valid_totals CHECK (total_delisted >= 0 AND total_failed >= 0),
  CONSTRAINT completed_job_has_completion_time CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed')
  )
);

-- Table for sale events (webhook/polling data)
CREATE TABLE IF NOT EXISTS public.sale_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,

  -- Event source information
  marketplace_type public.marketplace_type NOT NULL,
  event_type VARCHAR(100) NOT NULL, -- 'sale', 'payment_completed', 'item_sold', etc.
  external_event_id VARCHAR(255), -- Unique ID from marketplace
  external_listing_id VARCHAR(255), -- Listing ID on marketplace
  external_transaction_id VARCHAR(255), -- Transaction/sale ID

  -- Sale details
  sale_price DECIMAL(10,2),
  sale_currency VARCHAR(3) DEFAULT 'USD',
  sale_date TIMESTAMPTZ,
  buyer_id VARCHAR(255), -- Buyer's marketplace user ID
  payment_status VARCHAR(100), -- Payment status from marketplace

  -- Raw event data
  raw_webhook_data JSONB, -- Complete webhook payload
  raw_polling_data JSONB, -- Data from polling API

  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processing_error TEXT,
  delisting_job_id UUID REFERENCES public.delisting_jobs(id) ON DELETE SET NULL,

  -- Deduplication
  event_hash VARCHAR(64), -- Hash for duplicate detection
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID REFERENCES public.sale_events(id) ON DELETE SET NULL,

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_attempts INTEGER DEFAULT 0,
  verification_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_verification_attempts CHECK (verification_attempts >= 0)
);

-- Table for de-listing audit trail
CREATE TABLE IF NOT EXISTS public.delisting_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  delisting_job_id UUID REFERENCES public.delisting_jobs(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,

  -- Action details
  action VARCHAR(100) NOT NULL, -- 'job_created', 'delisting_started', 'delisting_completed', etc.
  marketplace_type public.marketplace_type,

  -- Results
  success BOOLEAN NOT NULL,
  error_message TEXT,
  error_code VARCHAR(100),

  -- Timing
  duration_ms INTEGER, -- Time taken for the action

  -- Context data
  context_data JSONB DEFAULT '{}', -- Additional context about the action

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_duration CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delisting_preferences_user_id ON public.user_delisting_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_delisting_jobs_user_id ON public.delisting_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_delisting_jobs_status ON public.delisting_jobs(status);
CREATE INDEX IF NOT EXISTS idx_delisting_jobs_trigger_type ON public.delisting_jobs(trigger_type);
CREATE INDEX IF NOT EXISTS idx_delisting_jobs_scheduled_for ON public.delisting_jobs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_delisting_jobs_inventory_item ON public.delisting_jobs(inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_sale_events_user_id ON public.sale_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_events_marketplace ON public.sale_events(marketplace_type);
CREATE INDEX IF NOT EXISTS idx_sale_events_processed ON public.sale_events(processed);
CREATE INDEX IF NOT EXISTS idx_sale_events_event_hash ON public.sale_events(event_hash);
CREATE INDEX IF NOT EXISTS idx_sale_events_external_event_id ON public.sale_events(external_event_id);
CREATE INDEX IF NOT EXISTS idx_sale_events_created_at ON public.sale_events(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.delisting_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_job_id ON public.delisting_audit_log(delisting_job_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.delisting_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.delisting_audit_log(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_delisting_jobs_user_status ON public.delisting_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sale_events_user_processed ON public.sale_events(user_id, processed);
CREATE INDEX IF NOT EXISTS idx_sale_events_marketplace_processed ON public.sale_events(marketplace_type, processed);

-- Unique constraints for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_events_event_hash_unique
ON public.sale_events(event_hash) WHERE event_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_events_external_unique
ON public.sale_events(marketplace_type, external_event_id)
WHERE external_event_id IS NOT NULL;

-- Create triggers for updated_at
CREATE TRIGGER update_delisting_preferences_updated_at
  BEFORE UPDATE ON public.user_delisting_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delisting_jobs_updated_at
  BEFORE UPDATE ON public.delisting_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_events_updated_at
  BEFORE UPDATE ON public.sale_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.user_delisting_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delisting_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delisting_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_delisting_preferences
CREATE POLICY "Users can view own delisting preferences" ON public.user_delisting_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own delisting preferences" ON public.user_delisting_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own delisting preferences" ON public.user_delisting_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own delisting preferences" ON public.user_delisting_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for delisting_jobs
CREATE POLICY "Users can view own delisting jobs" ON public.delisting_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own delisting jobs" ON public.delisting_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own delisting jobs" ON public.delisting_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for sale_events
CREATE POLICY "Users can view own sale events" ON public.sale_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sale events" ON public.sale_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sale events" ON public.sale_events
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for delisting_audit_log
CREATE POLICY "Users can view own audit log" ON public.delisting_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Service role policies (for system operations)
CREATE POLICY "Service role can manage all delisting data" ON public.user_delisting_preferences
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

CREATE POLICY "Service role can manage all delisting jobs" ON public.delisting_jobs
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

CREATE POLICY "Service role can manage all sale events" ON public.sale_events
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

CREATE POLICY "Service role can insert audit logs" ON public.delisting_audit_log
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

-- Grant permissions
GRANT ALL ON public.user_delisting_preferences TO authenticated;
GRANT ALL ON public.user_delisting_preferences TO service_role;

GRANT ALL ON public.delisting_jobs TO authenticated;
GRANT ALL ON public.delisting_jobs TO service_role;

GRANT ALL ON public.sale_events TO authenticated;
GRANT ALL ON public.sale_events TO service_role;

GRANT ALL ON public.delisting_audit_log TO authenticated;
GRANT ALL ON public.delisting_audit_log TO service_role;

-- Create function to generate event hash for deduplication
CREATE OR REPLACE FUNCTION generate_sale_event_hash(
  p_marketplace_type text,
  p_external_event_id text,
  p_external_listing_id text,
  p_sale_price decimal,
  p_sale_date timestamptz
) RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(
    sha256(
      (COALESCE(p_marketplace_type, '') || '|' ||
       COALESCE(p_external_event_id, '') || '|' ||
       COALESCE(p_external_listing_id, '') || '|' ||
       COALESCE(p_sale_price::text, '') || '|' ||
       COALESCE(p_sale_date::text, ''))::bytea
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to create default user preferences
CREATE OR REPLACE FUNCTION create_default_delisting_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_delisting_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create default preferences for new users
CREATE TRIGGER create_default_delisting_preferences_trigger
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_delisting_preferences();

-- Create function to process sale event and create delisting job
CREATE OR REPLACE FUNCTION process_sale_event(sale_event_id UUID)
RETURNS UUID AS $$
DECLARE
  v_sale_event public.sale_events;
  v_preferences public.user_delisting_preferences;
  v_job_id UUID;
  v_marketplaces_to_delist TEXT[];
  v_scheduled_for TIMESTAMPTZ;
BEGIN
  -- Get sale event details
  SELECT * INTO v_sale_event
  FROM public.sale_events
  WHERE id = sale_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale event not found: %', sale_event_id;
  END IF;

  -- Get user preferences
  SELECT * INTO v_preferences
  FROM public.user_delisting_preferences
  WHERE user_id = v_sale_event.user_id;

  -- Skip if auto-delisting is disabled
  IF NOT v_preferences.auto_delist_enabled THEN
    RETURN NULL;
  END IF;

  -- Get active listings for this item on other marketplaces
  SELECT ARRAY_AGG(DISTINCT marketplace_type::text) INTO v_marketplaces_to_delist
  FROM public.listings
  WHERE inventory_item_id = v_sale_event.inventory_item_id
    AND marketplace_type != v_sale_event.marketplace_type
    AND status IN ('active', 'pending')
    AND deleted_at IS NULL;

  -- Skip if no other active listings
  IF v_marketplaces_to_delist IS NULL OR array_length(v_marketplaces_to_delist, 1) = 0 THEN
    RETURN NULL;
  END IF;

  -- Determine scheduled time based on preferences
  CASE v_preferences.default_preference
    WHEN 'immediate' THEN
      v_scheduled_for := NOW();
    WHEN 'delayed' THEN
      v_scheduled_for := NOW() + (v_preferences.delay_minutes || ' minutes')::INTERVAL;
    WHEN 'manual_confirmation' THEN
      v_scheduled_for := NOW() + INTERVAL '7 days'; -- Hold for a week for confirmation
  END CASE;

  -- Create delisting job
  INSERT INTO public.delisting_jobs (
    user_id,
    inventory_item_id,
    trigger_type,
    trigger_data,
    sold_on_marketplace,
    sale_price,
    sale_date,
    sale_external_id,
    marketplaces_targeted,
    scheduled_for,
    requires_user_confirmation
  ) VALUES (
    v_sale_event.user_id,
    v_sale_event.inventory_item_id,
    'sale_detected',
    jsonb_build_object(
      'sale_event_id', sale_event_id,
      'webhook_data', v_sale_event.raw_webhook_data
    ),
    v_sale_event.marketplace_type,
    v_sale_event.sale_price,
    v_sale_event.sale_date,
    v_sale_event.external_transaction_id,
    v_marketplaces_to_delist,
    v_scheduled_for,
    v_preferences.default_preference = 'manual_confirmation'
  ) RETURNING id INTO v_job_id;

  -- Update sale event as processed
  UPDATE public.sale_events
  SET processed = TRUE, delisting_job_id = v_job_id, updated_at = NOW()
  WHERE id = sale_event_id;

  -- Log the action
  INSERT INTO public.delisting_audit_log (
    user_id,
    delisting_job_id,
    action,
    marketplace_type,
    success,
    context_data
  ) VALUES (
    v_sale_event.user_id,
    v_job_id,
    'job_created',
    v_sale_event.marketplace_type,
    TRUE,
    jsonb_build_object(
      'triggered_by', 'sale_detected',
      'sale_event_id', sale_event_id,
      'marketplaces_count', array_length(v_marketplaces_to_delist, 1)
    )
  );

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for pending delisting jobs
CREATE OR REPLACE VIEW public.pending_delisting_jobs AS
SELECT
  dj.*,
  i.title as item_title,
  i.brand as item_brand,
  i.category as item_category,
  up.business_name,
  CASE
    WHEN dj.requires_user_confirmation AND dj.user_confirmed_at IS NULL THEN 'awaiting_confirmation'
    WHEN dj.scheduled_for <= NOW() THEN 'ready_to_process'
    ELSE 'scheduled'
  END as processing_status
FROM public.delisting_jobs dj
JOIN public.inventory_items i ON dj.inventory_item_id = i.id
JOIN public.user_profiles up ON dj.user_id = up.id
WHERE dj.status = 'pending'
  AND dj.user_cancelled_at IS NULL
ORDER BY dj.scheduled_for ASC;

-- Grant permissions on views and functions
GRANT SELECT ON public.pending_delisting_jobs TO authenticated;
GRANT SELECT ON public.pending_delisting_jobs TO service_role;

GRANT EXECUTE ON FUNCTION generate_sale_event_hash(text, text, text, decimal, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_sale_event_hash(text, text, text, decimal, timestamptz) TO service_role;

GRANT EXECUTE ON FUNCTION process_sale_event(UUID) TO service_role;