-- Migration: Create User Profiles Table
-- Purpose: Extend Supabase Auth users with reseller-specific profile data
-- Date: 2025-09-17
-- Author: BMad Development Agent (James)

-- Create the user_profiles table that extends auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  -- Primary key links to auth.users.id
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business Information
  business_name VARCHAR(255),
  business_type VARCHAR(100) DEFAULT 'individual', -- 'individual', 'business', 'llc', 'corporation'
  tax_id VARCHAR(50), -- EIN or SSN for tax purposes

  -- Subscription & Account Status
  subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'basic', 'pro', 'enterprise'
  subscription_status VARCHAR(50) DEFAULT 'active', -- 'active', 'past_due', 'cancelled', 'trial'
  subscription_expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,

  -- Onboarding & Profile Completion
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0, -- Track current onboarding step
  profile_completion_percentage INTEGER DEFAULT 0,

  -- User Preferences
  preferred_currency VARCHAR(3) DEFAULT 'USD',
  preferred_timezone VARCHAR(100) DEFAULT 'America/New_York',
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,

  -- Platform Settings
  default_listing_duration INTEGER DEFAULT 30, -- Days
  auto_relist BOOLEAN DEFAULT FALSE,
  default_shipping_policy TEXT,
  default_return_policy TEXT,

  -- Profile Metadata
  avatar_url TEXT,
  bio TEXT,
  website_url TEXT,
  social_links JSONB DEFAULT '{}', -- Store social media links

  -- Location Information
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'US',

  -- Performance Metrics (computed fields)
  total_listings INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  average_sale_price DECIMAL(10,2) DEFAULT 0.00,
  seller_rating DECIMAL(3,2) DEFAULT 0.00,

  -- System Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,

  -- Soft Delete
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trial')),
  CONSTRAINT valid_business_type CHECK (business_type IN ('individual', 'business', 'llc', 'corporation')),
  CONSTRAINT valid_profile_completion CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
  CONSTRAINT valid_seller_rating CHECK (seller_rating >= 0.00 AND seller_rating <= 5.00),
  CONSTRAINT valid_country_code CHECK (length(country) = 2)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_name ON public.user_profiles(business_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_at ON public.user_profiles(deleted_at) WHERE deleted_at IS NULL;

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, created_at, updated_at)
  VALUES (
    NEW.id,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger to auto-create profile for new auth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) Policies

-- Enable RLS on the table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Service role can do everything (for admin operations)
CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

-- Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- Create a view for public profile information (no sensitive data)
CREATE OR REPLACE VIEW public.user_profiles_public AS
SELECT
  id,
  business_name,
  bio,
  avatar_url,
  website_url,
  social_links,
  city,
  state_province,
  country,
  seller_rating,
  total_listings,
  total_sales,
  created_at
FROM public.user_profiles
WHERE is_active = TRUE AND deleted_at IS NULL;

-- RLS for public view
ALTER VIEW public.user_profiles_public OWNER TO supabase_admin;
GRANT SELECT ON public.user_profiles_public TO anon;
GRANT SELECT ON public.user_profiles_public TO authenticated;