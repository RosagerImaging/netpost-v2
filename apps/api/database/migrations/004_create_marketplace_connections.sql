-- Migration: Create Marketplace Connections Table
-- Purpose: Secure storage of marketplace API credentials and connection management
-- Date: 2025-09-17
-- Author: BMad Development Agent (James)

-- First, create the pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum types for marketplace connection fields
CREATE TYPE public.connection_status AS ENUM (
  'disconnected',    -- Not connected
  'connecting',      -- In process of connecting
  'active',          -- Successfully connected and active
  'expired',         -- Token/credentials expired
  'revoked',         -- Access revoked by marketplace
  'suspended',       -- Account suspended
  'rate_limited',    -- Temporarily rate limited
  'error',           -- Connection error
  'maintenance'      -- Marketplace under maintenance
);

CREATE TYPE public.auth_method AS ENUM (
  'oauth1',          -- OAuth 1.0/1.0a (like eBay)
  'oauth2',          -- OAuth 2.0 (most modern platforms)
  'api_key',         -- Simple API key
  'username_password', -- Username/password (deprecated but some platforms)
  'app_password',    -- App-specific password
  'session_cookie'   -- Session-based authentication
);

-- Create the marketplace_connections table
CREATE TABLE IF NOT EXISTS public.marketplace_connections (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Association
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Marketplace Information
  marketplace_type public.marketplace_type NOT NULL,
  marketplace_user_id VARCHAR(255), -- User's ID on the marketplace
  marketplace_username VARCHAR(255), -- User's username on marketplace
  marketplace_store_name VARCHAR(255), -- Store/shop name on marketplace

  -- Connection Status
  connection_status public.connection_status DEFAULT 'disconnected',
  auth_method public.auth_method NOT NULL,
  status_message TEXT, -- Human readable status message
  last_connection_check TIMESTAMPTZ,

  -- Authentication Credentials (ENCRYPTED)
  -- Note: These fields store encrypted JSON objects containing credentials
  credentials_encrypted BYTEA, -- Main encrypted credentials blob
  refresh_token_encrypted BYTEA, -- Encrypted refresh token (for OAuth)

  -- OAuth Flow Data
  oauth_state VARCHAR(255), -- OAuth state parameter for security
  oauth_verifier VARCHAR(255), -- OAuth verifier for OAuth 1.0a
  authorization_url TEXT, -- URL for user authorization
  callback_url TEXT, -- Registered callback URL

  -- Token Information
  access_token_expires_at TIMESTAMPTZ, -- When access token expires
  refresh_token_expires_at TIMESTAMPTZ, -- When refresh token expires
  scope_granted TEXT[], -- Granted permissions/scopes
  token_type VARCHAR(50) DEFAULT 'Bearer', -- Token type (Bearer, etc.)

  -- API Configuration
  api_endpoint_base VARCHAR(255), -- Base API endpoint URL
  api_version VARCHAR(50), -- API version being used
  rate_limit_per_hour INTEGER, -- Rate limit from marketplace
  rate_limit_per_minute INTEGER, -- Per-minute rate limit
  current_rate_limit_usage JSONB DEFAULT '{}', -- Current usage tracking

  -- Marketplace Settings & Preferences
  auto_sync_enabled BOOLEAN DEFAULT TRUE, -- Auto-sync listings/inventory
  sync_frequency_minutes INTEGER DEFAULT 60, -- How often to sync
  listing_auto_end BOOLEAN DEFAULT FALSE, -- Auto-end listings
  notification_preferences JSONB DEFAULT '{}', -- Notification settings

  -- Business Settings
  default_shipping_policy_id VARCHAR(255), -- Default shipping policy on platform
  default_return_policy_id VARCHAR(255), -- Default return policy on platform
  default_payment_methods TEXT[], -- Accepted payment methods
  default_handling_time INTEGER DEFAULT 1, -- Default handling time in days

  -- Performance & Health Monitoring
  last_successful_sync TIMESTAMPTZ, -- Last successful sync operation
  last_sync_error TEXT, -- Last sync error message
  consecutive_errors INTEGER DEFAULT 0, -- Count of consecutive errors
  total_api_calls INTEGER DEFAULT 0, -- Total API calls made
  total_errors INTEGER DEFAULT 0, -- Total errors encountered
  average_response_time_ms INTEGER, -- Average API response time

  -- Connection Metadata
  connection_source VARCHAR(100) DEFAULT 'manual', -- How connection was created
  user_agent TEXT, -- User agent used for API calls
  ip_address INET, -- IP address when connection was created
  connection_notes TEXT, -- Private notes about this connection

  -- Webhook Information
  webhook_url TEXT, -- Webhook URL if supported
  webhook_secret_encrypted BYTEA, -- Encrypted webhook secret
  webhook_events TEXT[], -- Subscribed webhook events

  -- Marketplace-Specific Data
  marketplace_metadata JSONB DEFAULT '{}', -- Platform-specific metadata
  marketplace_fees JSONB DEFAULT '{}', -- Fee structure from platform
  marketplace_limits JSONB DEFAULT '{}', -- Platform limits and restrictions

  -- System Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  connected_at TIMESTAMPTZ, -- When connection was first established
  last_used_at TIMESTAMPTZ, -- Last time connection was used
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Constraints
  CONSTRAINT valid_rate_limits CHECK (
    (rate_limit_per_hour IS NULL OR rate_limit_per_hour > 0) AND
    (rate_limit_per_minute IS NULL OR rate_limit_per_minute > 0)
  ),
  CONSTRAINT valid_sync_frequency CHECK (sync_frequency_minutes > 0),
  CONSTRAINT valid_handling_time CHECK (default_handling_time >= 1),
  CONSTRAINT positive_counters CHECK (
    consecutive_errors >= 0 AND
    total_api_calls >= 0 AND
    total_errors >= 0
  ),
  CONSTRAINT valid_response_time CHECK (
    average_response_time_ms IS NULL OR average_response_time_ms >= 0
  ),
  CONSTRAINT valid_token_expiry CHECK (
    access_token_expires_at IS NULL OR
    refresh_token_expires_at IS NULL OR
    access_token_expires_at <= refresh_token_expires_at
  )
);

-- Create unique constraint: one active connection per user per marketplace
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_connections_user_marketplace_unique
ON public.marketplace_connections(user_id, marketplace_type)
WHERE deleted_at IS NULL AND connection_status != 'disconnected';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_user_id ON public.marketplace_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_marketplace_type ON public.marketplace_connections(marketplace_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_status ON public.marketplace_connections(connection_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_created_at ON public.marketplace_connections(created_at);
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_last_used ON public.marketplace_connections(last_used_at);
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_expires_at ON public.marketplace_connections(access_token_expires_at) WHERE access_token_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_deleted_at ON public.marketplace_connections(deleted_at) WHERE deleted_at IS NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_user_status ON public.marketplace_connections(user_id, connection_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_marketplace_status ON public.marketplace_connections(marketplace_type, connection_status);

-- Create trigger for updated_at
CREATE TRIGGER update_marketplace_connections_updated_at
  BEFORE UPDATE ON public.marketplace_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle connection status changes
CREATE OR REPLACE FUNCTION handle_marketplace_connection_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update connected_at timestamp when status changes to active
  IF NEW.connection_status = 'active' AND OLD.connection_status != 'active' THEN
    NEW.connected_at = NOW();
    NEW.consecutive_errors = 0; -- Reset error count on successful connection
  END IF;

  -- Increment consecutive errors on error status
  IF NEW.connection_status = 'error' AND OLD.connection_status != 'error' THEN
    NEW.consecutive_errors = COALESCE(OLD.consecutive_errors, 0) + 1;
    NEW.total_errors = COALESCE(OLD.total_errors, 0) + 1;
  END IF;

  -- Update last_used_at when connection is actively used
  IF NEW.total_api_calls > COALESCE(OLD.total_api_calls, 0) THEN
    NEW.last_used_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for status changes
CREATE TRIGGER handle_marketplace_connection_status_changes
  BEFORE UPDATE ON public.marketplace_connections
  FOR EACH ROW
  EXECUTE FUNCTION handle_marketplace_connection_status_change();

-- Encryption/Decryption Functions
-- Note: In production, you should use a proper key management system

-- Function to encrypt credentials
CREATE OR REPLACE FUNCTION encrypt_credentials(data JSONB, encryption_key TEXT DEFAULT NULL)
RETURNS BYTEA AS $$
DECLARE
  key_to_use TEXT;
BEGIN
  -- Use provided key or get from environment/config
  key_to_use := COALESCE(encryption_key, current_setting('app.encryption_key', true));

  IF key_to_use IS NULL THEN
    RAISE EXCEPTION 'Encryption key not provided';
  END IF;

  RETURN pgp_sym_encrypt(data::TEXT, key_to_use);
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to decrypt credentials
CREATE OR REPLACE FUNCTION decrypt_credentials(encrypted_data BYTEA, encryption_key TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  key_to_use TEXT;
  decrypted_text TEXT;
BEGIN
  -- Use provided key or get from environment/config
  key_to_use := COALESCE(encryption_key, current_setting('app.encryption_key', true));

  IF key_to_use IS NULL THEN
    RAISE EXCEPTION 'Encryption key not provided';
  END IF;

  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;

  decrypted_text := pgp_sym_decrypt(encrypted_data, key_to_use);
  RETURN decrypted_text::JSONB;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to safely store credentials
CREATE OR REPLACE FUNCTION store_marketplace_credentials(
  connection_id UUID,
  credentials JSONB,
  refresh_token TEXT DEFAULT NULL,
  webhook_secret TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.marketplace_connections
  SET
    credentials_encrypted = encrypt_credentials(credentials),
    refresh_token_encrypted = CASE
      WHEN refresh_token IS NOT NULL
      THEN encrypt_credentials(jsonb_build_object('refresh_token', refresh_token))
      ELSE NULL
    END,
    webhook_secret_encrypted = CASE
      WHEN webhook_secret IS NOT NULL
      THEN encrypt_credentials(jsonb_build_object('webhook_secret', webhook_secret))
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = connection_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to check if tokens are expiring soon
CREATE OR REPLACE FUNCTION get_expiring_connections(hours_threshold INTEGER DEFAULT 24)
RETURNS TABLE(
  connection_id UUID,
  user_id UUID,
  marketplace_type public.marketplace_type,
  expires_in_hours INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id,
    mc.user_id,
    mc.marketplace_type,
    EXTRACT(EPOCH FROM (mc.access_token_expires_at - NOW()))::INTEGER / 3600 as expires_in_hours
  FROM public.marketplace_connections mc
  WHERE mc.access_token_expires_at IS NOT NULL
    AND mc.access_token_expires_at <= NOW() + INTERVAL '1 hour' * hours_threshold
    AND mc.connection_status = 'active'
    AND mc.deleted_at IS NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Row Level Security (RLS) Policies
ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own marketplace connections
CREATE POLICY "Users can view own marketplace connections" ON public.marketplace_connections
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own marketplace connections
CREATE POLICY "Users can insert own marketplace connections" ON public.marketplace_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own marketplace connections
CREATE POLICY "Users can update own marketplace connections" ON public.marketplace_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own marketplace connections
CREATE POLICY "Users can delete own marketplace connections" ON public.marketplace_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Service role can manage all marketplace connections
CREATE POLICY "Service role can manage all marketplace connections" ON public.marketplace_connections
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

-- Grant permissions
GRANT ALL ON public.marketplace_connections TO authenticated;
GRANT ALL ON public.marketplace_connections TO service_role;

-- Create a safe view that excludes encrypted credentials
CREATE OR REPLACE VIEW public.marketplace_connections_safe AS
SELECT
  id,
  user_id,
  marketplace_type,
  marketplace_user_id,
  marketplace_username,
  marketplace_store_name,
  connection_status,
  auth_method,
  status_message,
  last_connection_check,
  access_token_expires_at,
  refresh_token_expires_at,
  scope_granted,
  api_endpoint_base,
  api_version,
  rate_limit_per_hour,
  rate_limit_per_minute,
  current_rate_limit_usage,
  auto_sync_enabled,
  sync_frequency_minutes,
  listing_auto_end,
  notification_preferences,
  default_shipping_policy_id,
  default_return_policy_id,
  default_payment_methods,
  default_handling_time,
  last_successful_sync,
  last_sync_error,
  consecutive_errors,
  total_api_calls,
  total_errors,
  average_response_time_ms,
  connection_source,
  webhook_url,
  webhook_events,
  marketplace_metadata,
  marketplace_fees,
  marketplace_limits,
  created_at,
  updated_at,
  connected_at,
  last_used_at,

  -- Computed fields
  CASE
    WHEN access_token_expires_at IS NOT NULL AND access_token_expires_at <= NOW()
    THEN TRUE
    ELSE FALSE
  END as token_expired,

  CASE
    WHEN access_token_expires_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (access_token_expires_at - NOW()))::INTEGER / 3600
    ELSE NULL
  END as hours_until_expiry,

  CASE
    WHEN total_api_calls > 0
    THEN ROUND((total_errors::DECIMAL / total_api_calls::DECIMAL) * 100, 2)
    ELSE 0
  END as error_rate_percentage

FROM public.marketplace_connections
WHERE deleted_at IS NULL;

-- RLS for safe view
ALTER VIEW public.marketplace_connections_safe OWNER TO supabase_admin;
GRANT SELECT ON public.marketplace_connections_safe TO authenticated;

-- Function for soft delete
CREATE OR REPLACE FUNCTION soft_delete_marketplace_connection(connection_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.marketplace_connections
  SET deleted_at = NOW(), updated_at = NOW(), connection_status = 'disconnected'
  WHERE id = connection_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to update connection health
CREATE OR REPLACE FUNCTION update_connection_health(
  connection_id UUID,
  new_status public.connection_status,
  status_msg TEXT DEFAULT NULL,
  response_time_ms INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.marketplace_connections
  SET
    connection_status = new_status,
    status_message = COALESCE(status_msg, status_message),
    last_connection_check = NOW(),
    average_response_time_ms = CASE
      WHEN response_time_ms IS NOT NULL AND total_api_calls > 0
      THEN (COALESCE(average_response_time_ms, 0) + response_time_ms) / 2
      ELSE COALESCE(response_time_ms, average_response_time_ms)
    END,
    total_api_calls = total_api_calls + 1,
    updated_at = NOW()
  WHERE id = connection_id;

  RETURN FOUND;
END;
$$ language 'plpgsql' SECURITY DEFINER;