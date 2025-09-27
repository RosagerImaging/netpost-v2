/**
 * User Profile Database Types
 *
 * TypeScript definitions for user profile data models
 * Generated from database schema with additional business logic types
 */

// Base user profile record from database
export interface UserProfileRecord {
  id: string; // UUID, references auth.users.id

  // Business Information
  business_name: string | null;
  business_type: 'individual' | 'business' | 'llc' | 'corporation';
  tax_id: string | null;

  // Subscription & Account Status
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'past_due' | 'cancelled' | 'trial';
  subscription_expires_at: string | null; // ISO timestamp
  trial_ends_at: string | null; // ISO timestamp

  // Onboarding & Profile Completion
  onboarding_completed: boolean;
  onboarding_step: number;
  profile_completion_percentage: number;

  // User Preferences
  preferred_currency: string;
  preferred_timezone: string;
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;

  // Platform Settings
  default_listing_duration: number; // Days
  auto_relist: boolean;
  default_shipping_policy: string | null;
  default_return_policy: string | null;

  // Profile Metadata
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  social_links: Record<string, string>; // JSONB

  // Location Information
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string;

  // Performance Metrics
  total_listings: number;
  total_sales: number;
  total_revenue: number;
  average_sale_price: number;
  seller_rating: number;

  // System Fields
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  last_login_at: string | null; // ISO timestamp
  is_active: boolean;
  deleted_at: string | null; // ISO timestamp
}

// Public profile view (safe for public display)
export interface UserProfilePublic {
  id: string;
  business_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  social_links: Record<string, string>;
  city: string | null;
  state_province: string | null;
  country: string;
  seller_rating: number;
  total_listings: number;
  total_sales: number;
  created_at: string;
}

// Input types for creating/updating profiles
export interface CreateUserProfileInput {
  business_name?: string;
  business_type?: UserProfileRecord['business_type'];
  tax_id?: string;
  preferred_currency?: string;
  preferred_timezone?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_emails?: boolean;
  default_listing_duration?: number;
  auto_relist?: boolean;
  default_shipping_policy?: string;
  default_return_policy?: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  social_links?: Record<string, string>;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
}

export interface UpdateUserProfileInput extends Partial<CreateUserProfileInput> {
  onboarding_completed?: boolean;
  onboarding_step?: number;
  profile_completion_percentage?: number;
}

// Subscription-related types
export interface SubscriptionInfo {
  tier: UserProfileRecord['subscription_tier'];
  status: UserProfileRecord['subscription_status'];
  expires_at: string | null;
  trial_ends_at: string | null;
}

// Onboarding step definitions
export interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
}

export const ONBOARDING_STEPS: Record<number, Omit<OnboardingStep, 'step' | 'completed'>> = {
  0: {
    title: 'Welcome',
    description: 'Get started with NetPost',
    required: true,
  },
  1: {
    title: 'Business Information',
    description: 'Tell us about your reselling business',
    required: true,
  },
  2: {
    title: 'Connect Marketplaces',
    description: 'Link your marketplace accounts',
    required: false,
  },
  3: {
    title: 'Set Preferences',
    description: 'Configure your default settings',
    required: false,
  },
  4: {
    title: 'Complete Profile',
    description: 'Add profile picture and bio',
    required: false,
  },
};

// Business validation helpers
export function isBusinessProfile(profile: UserProfileRecord): boolean {
  return profile.business_type !== 'individual';
}

export function hasActiveSubscription(profile: UserProfileRecord): boolean {
  return profile.subscription_status === 'active' ||
         (profile.subscription_status === 'trial' &&
          profile.trial_ends_at !== null &&
          new Date(profile.trial_ends_at) > new Date());
}

export function getSubscriptionDisplayName(tier: UserProfileRecord['subscription_tier']): string {
  const displayNames = {
    free: 'Free',
    basic: 'Basic',
    pro: 'Professional',
    enterprise: 'Enterprise',
  };
  return displayNames[tier];
}

// Profile completion calculation
export function calculateProfileCompletion(profile: UserProfileRecord): number {
  const fields = [
    'business_name',
    'avatar_url',
    'bio',
    'city',
    'state_province',
    'country',
    'default_shipping_policy',
    'default_return_policy',
  ];

  const completedFields = fields.filter(field => {
    const value = profile[field as keyof UserProfileRecord];
    return value !== null && value !== '' && value !== undefined;
  });

  return Math.round((completedFields.length / fields.length) * 100);
}

// Address formatting helper
export function formatAddress(profile: UserProfileRecord): string {
  const parts = [
    profile.address_line1,
    profile.city,
    profile.state_province,
    profile.postal_code,
    profile.country,
  ].filter(Boolean);

  return parts.join(', ');
}

// Social links type definitions
export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  pinterest?: string;
  website?: string;
}

// Error types for user operations
export class UserProfileError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'UserProfileError';
  }
}

export class ProfileNotFoundError extends UserProfileError {
  constructor(userId: string) {
    super(`User profile not found for user ID: ${userId}`, 'PROFILE_NOT_FOUND');
  }
}

export class ProfileValidationError extends UserProfileError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}