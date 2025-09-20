/**
 * User Repository
 *
 * Manages user profile data and operations
 * Extends BaseRepository with user-specific functionality
 */

import { BaseRepository } from './base-repository';
import {
  UserProfileRecord,
  UserProfilePublic,
  CreateUserProfileInput,
  UpdateUserProfileInput,
  ValidationResult,
  SingleResult,
  QueryResult,
  hasActiveSubscription,
  calculateProfileCompletion,
  isBusinessProfile,
} from '@netpost/shared-types/database';

export class UserRepository extends BaseRepository<
  UserProfileRecord,
  CreateUserProfileInput,
  UpdateUserProfileInput
> {
  constructor() {
    super('user_profiles');
  }

  /**
   * Find user by auth user ID
   */
  async findByAuthId(authUserId: string): Promise<SingleResult<UserProfileRecord>> {
    try {
      const { data, error } = await this.client
        .from('user_profiles')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return {
        data: data as UserProfileRecord | null,
        found: data !== null,
      };
    } catch (error) {
      throw new Error(`Failed to find user by auth ID: ${error}`);
    }
  }

  /**
   * Get public profile (safe for public display)
   */
  async getPublicProfile(userId: string): Promise<SingleResult<UserProfilePublic>> {
    try {
      const { data, error } = await this.client
        .from('user_profiles_public')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return {
        data: data as UserProfilePublic | null,
        found: data !== null,
      };
    } catch (error) {
      throw new Error(`Failed to get public profile: ${error}`);
    }
  }

  /**
   * Search users by business name
   */
  async searchByBusinessName(query: string, limit: number = 10): Promise<UserProfilePublic[]> {
    try {
      const { data, error } = await this.client
        .from('user_profiles_public')
        .select('*')
        .ilike('business_name', `%${query}%`)
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data as UserProfilePublic[]) || [];
    } catch (error) {
      throw new Error(`Failed to search users by business name: ${error}`);
    }
  }

  /**
   * Update user subscription
   */
  async updateSubscription(
    userId: string,
    subscriptionData: {
      subscription_tier: UserProfileRecord['subscription_tier'];
      subscription_status: UserProfileRecord['subscription_status'];
      subscription_expires_at?: string;
      trial_ends_at?: string;
    }
  ): Promise<SingleResult<UserProfileRecord>> {
    try {
      const { data, error } = await this.client
        .from('user_profiles')
        .update(subscriptionData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data: data as UserProfileRecord,
        found: true,
      };
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error}`);
    }
  }

  /**
   * Complete onboarding step
   */
  async completeOnboardingStep(
    userId: string,
    step: number,
    data?: Partial<UpdateUserProfileInput>
  ): Promise<SingleResult<UserProfileRecord>> {
    try {
      const updateData = {
        ...data,
        onboarding_step: step,
        onboarding_completed: step >= 4, // Assuming 5 steps (0-4)
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await this.client
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Recalculate profile completion percentage
      const profileCompletion = calculateProfileCompletion(result as UserProfileRecord);
      if (profileCompletion !== result.profile_completion_percentage) {
        await this.client
          .from('user_profiles')
          .update({ profile_completion_percentage: profileCompletion })
          .eq('id', userId);

        (result as any).profile_completion_percentage = profileCompletion;
      }

      return {
        data: result as UserProfileRecord,
        found: true,
      };
    } catch (error) {
      throw new Error(`Failed to complete onboarding step: ${error}`);
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to update last login:', error);
      return false;
    }
  }

  /**
   * Get users by subscription tier
   */
  async getUsersBySubscriptionTier(
    tier: UserProfileRecord['subscription_tier']
  ): Promise<QueryResult<UserProfileRecord>> {
    return this.findMany({
      filters: { subscription_tier: tier } as any,
    });
  }

  /**
   * Get users with expiring subscriptions
   */
  async getUsersWithExpiringSubscriptions(
    hoursThreshold: number = 72
  ): Promise<UserProfileRecord[]> {
    try {
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() + hoursThreshold);

      const { data, error } = await this.client
        .from('user_profiles')
        .select('*')
        .eq('subscription_status', 'active')
        .not('subscription_expires_at', 'is', null)
        .lte('subscription_expires_at', thresholdDate.toISOString());

      if (error) {
        throw error;
      }

      return (data as UserProfileRecord[]) || [];
    } catch (error) {
      throw new Error(`Failed to get users with expiring subscriptions: ${error}`);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    totalListings: number;
    totalSales: number;
    totalRevenue: number;
    averageSalePrice: number;
    sellerRating: number;
    profileCompletion: number;
    daysActive: number;
  }> {
    try {
      const { data: user, error } = await this.client
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      const profile = user as UserProfileRecord;
      const daysActive = Math.ceil(
        (new Date().getTime() - new Date(profile.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
      );

      return {
        totalListings: profile.total_listings,
        totalSales: profile.total_sales,
        totalRevenue: profile.total_revenue,
        averageSalePrice: profile.average_sale_price,
        sellerRating: profile.seller_rating,
        profileCompletion: profile.profile_completion_percentage,
        daysActive,
      };
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error}`);
    }
  }

  /**
   * Update user performance metrics
   */
  async updatePerformanceMetrics(userId: string): Promise<boolean> {
    try {
      // This would typically be called by a background job
      // to update user performance metrics based on their activity
      const { error } = await this.client.rpc('update_user_inventory_counts', {
        user_id: userId,
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to update performance metrics:', error);
      return false;
    }
  }

  /**
   * Delete user account (soft delete with data retention)
   */
  async deleteAccount(userId: string): Promise<boolean> {
    try {
      // Soft delete the user profile
      const { error } = await this.client
        .from('user_profiles')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          // Clear sensitive data but keep aggregated stats
          business_name: null,
          tax_id: null,
          email_notifications: false,
          push_notifications: false,
          marketing_emails: false,
          address_line1: null,
          address_line2: null,
          city: null,
          state_province: null,
          postal_code: null,
          avatar_url: null,
          bio: null,
          website_url: null,
          social_links: {},
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete user account: ${error}`);
    }
  }

  /**
   * Validate user profile data
   */
  protected async validateRecord(
    data: CreateUserProfileInput | UpdateUserProfileInput
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate business type and related fields
    if (data.business_type && data.business_type !== 'individual') {
      if (!data.business_name) {
        errors.push('Business name is required for business accounts');
      }
    }

    // Validate email format if provided
    if (data.website_url) {
      try {
        new URL(data.website_url);
      } catch {
        errors.push('Invalid website URL format');
      }
    }

    // Validate country code
    if (data.country && data.country.length !== 2) {
      errors.push('Country must be a 2-letter ISO code');
    }

    // Validate subscription tier transitions
    if (data.subscription_tier) {
      const validTiers = ['free', 'basic', 'pro', 'enterprise'];
      if (!validTiers.includes(data.subscription_tier)) {
        errors.push('Invalid subscription tier');
      }
    }

    // Check profile completion
    if (data.business_name && !data.city) {
      warnings.push('Adding location information will improve your profile');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get business users in the same location
   */
  async getBusinessUsersInLocation(
    city: string,
    stateProvince?: string,
    limit: number = 20
  ): Promise<UserProfilePublic[]> {
    try {
      let query = this.client
        .from('user_profiles_public')
        .select('*')
        .eq('city', city)
        .not('business_name', 'is', null)
        .limit(limit);

      if (stateProvince) {
        query = query.eq('state_province', stateProvince);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data as UserProfilePublic[]) || [];
    } catch (error) {
      throw new Error(`Failed to get business users in location: ${error}`);
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const result = await this.findByAuthId(userId);
      if (!result.found || !result.data) {
        return false;
      }

      return hasActiveSubscription(result.data);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(): Promise<{
    totalUsers: number;
    usersByTier: Record<string, number>;
    usersByStatus: Record<string, number>;
    revenueByTier: Record<string, number>;
    churnRate: number;
    growthRate: number;
  }> {
    try {
      const { data, error } = await this.adminClient
        .from('user_profiles')
        .select('subscription_tier, subscription_status, created_at')
        .eq('is_active', true)
        .is('deleted_at', null);

      if (error) {
        throw error;
      }

      const profiles = data as Pick<UserProfileRecord, 'subscription_tier' | 'subscription_status' | 'created_at'>[];

      const usersByTier: Record<string, number> = {};
      const usersByStatus: Record<string, number> = {};

      profiles.forEach(profile => {
        usersByTier[profile.subscription_tier] = (usersByTier[profile.subscription_tier] || 0) + 1;
        usersByStatus[profile.subscription_status] = (usersByStatus[profile.subscription_status] || 0) + 1;
      });

      // Calculate growth rate (simplified)
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const newUsersThisMonth = profiles.filter(p => new Date(p.created_at) >= lastMonth).length;
      const growthRate = profiles.length > 0 ? (newUsersThisMonth / profiles.length) * 100 : 0;

      return {
        totalUsers: profiles.length,
        usersByTier,
        usersByStatus,
        revenueByTier: {}, // This would require subscription pricing data
        churnRate: 0, // This would require historical subscription data
        growthRate,
      };
    } catch (error) {
      throw new Error(`Failed to get subscription analytics: ${error}`);
    }
  }
}