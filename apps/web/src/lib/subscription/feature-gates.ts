/**
 * Feature Gating System
 *
 * Provides subscription-based access control throughout the application.
 * Checks feature availability, usage limits, and provides upgrade prompts.
 */

import { SubscriptionService, type UserSubscription } from './subscription-service';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from './stripe-service';


// Feature flags enum
export enum Feature {
  AI_ASSISTANT = 'ai_assistant',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  PRIORITY_SUPPORT = 'priority_support',
  BULK_OPERATIONS = 'bulk_operations',
  CUSTOM_BRANDING = 'custom_branding',
  UNLIMITED_INVENTORY = 'unlimited_inventory',
  UNLIMITED_MARKETPLACES = 'unlimited_marketplaces',
  UNLIMITED_API_CALLS = 'unlimited_api_calls',
  UNLIMITED_STORAGE = 'unlimited_storage',
}

// Usage limit types
export enum UsageLimit {
  INVENTORY_ITEMS = 'inventory_items',
  MARKETPLACE_CONNECTIONS = 'marketplace_connections',
  API_CALLS = 'api_calls',
  STORAGE_MB = 'storage_mb',
  LISTINGS_CREATED = 'listings_created',
}

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  requiredTier?: SubscriptionTier;
  currentTier?: SubscriptionTier;
}

export interface UsageLimitCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  isUnlimited: boolean;
  usagePercentage: number;
  nearLimit: boolean;
  upgradeRequired?: boolean;
  requiredTier?: SubscriptionTier;
}

export interface UpgradePrompt {
  show: boolean;
  title: string;
  description: string;
  currentTier: SubscriptionTier;
  suggestedTier: SubscriptionTier;
  features: string[];
  ctaText: string;
}

/**
 * Feature Gates Service Class
 * Centralized feature access control and usage limit enforcement
 */
export class FeatureGates {
  private static subscriptionCache = new Map<string, { subscription: UserSubscription; timestamp: number }>();
  private static cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a user has access to a specific feature
   */
  static async hasFeatureAccess(userId: string, feature: Feature): Promise<FeatureAccess> {
    try {
      const subscription = await this.getUserSubscriptionCached(userId);

      if (!subscription) {
        return {
          hasAccess: false,
          reason: 'No active subscription found',
          upgradeRequired: true,
          requiredTier: 'trial',
        };
      }

      const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];
      let hasAccess = false;

      switch (feature) {
        case Feature.AI_ASSISTANT:
          hasAccess = tierConfig.features.hasAiAssistant;
          break;
        case Feature.ADVANCED_ANALYTICS:
          hasAccess = tierConfig.features.hasAdvancedAnalytics;
          break;
        case Feature.PRIORITY_SUPPORT:
          hasAccess = tierConfig.features.hasPrioritySupport;
          break;
        case Feature.BULK_OPERATIONS:
          hasAccess = tierConfig.features.hasBulkOperations;
          break;
        case Feature.CUSTOM_BRANDING:
          hasAccess = tierConfig.features.hasCustomBranding;
          break;
        case Feature.UNLIMITED_INVENTORY:
          hasAccess = tierConfig.features.maxInventoryItems === -1;
          break;
        case Feature.UNLIMITED_MARKETPLACES:
          hasAccess = tierConfig.features.maxMarketplaceConnections === -1;
          break;
        case Feature.UNLIMITED_API_CALLS:
          hasAccess = tierConfig.features.maxApiCallsPerMonth === -1;
          break;
        case Feature.UNLIMITED_STORAGE:
          hasAccess = tierConfig.features.maxStorageMb === -1;
          break;
        default:
          hasAccess = false;
      }

      if (hasAccess) {
        return { hasAccess: true };
      }

      // Determine required tier
      const requiredTier = this.getRequiredTierForFeature(feature);

      return {
        hasAccess: false,
        reason: `Feature requires ${requiredTier} subscription`,
        upgradeRequired: true,
        requiredTier,
        currentTier: subscription.tier,
      };
    } catch (error) {
      console.error('❌ Failed to check feature access:', error);
      return {
        hasAccess: false,
        reason: 'Error checking feature access',
      };
    }
  }

  /**
   * Check usage limits for a user
   */
  static async checkUsageLimit(userId: string, limitType: UsageLimit): Promise<UsageLimitCheck> {
    try {
      const subscription = await this.getUserSubscriptionCached(userId);

      if (!subscription) {
        return {
          allowed: false,
          currentUsage: 0,
          limit: 0,
          isUnlimited: false,
          usagePercentage: 100,
          nearLimit: true,
          upgradeRequired: true,
          requiredTier: 'trial',
        };
      }

      const result = await SubscriptionService.checkUsageLimit(userId, limitType);

      if (!result.allowed && !result.isUnlimited) {
        // Determine which tier would provide more capacity
        const suggestedTier = this.getSuggestedTierForLimit(subscription.tier, limitType);

        return {
          ...result,
          upgradeRequired: suggestedTier !== subscription.tier,
          requiredTier: suggestedTier,
        };
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to check usage limit:', error);
      throw error;
    }
  }

  /**
   * Enforce usage limit before allowing an action
   */
  static async enforceUsageLimit(userId: string, limitType: UsageLimit, requestedAmount = 1): Promise<boolean> {
    try {
      const currentLimit = await this.checkUsageLimit(userId, limitType);

      if (currentLimit.isUnlimited) {
        return true;
      }

      return currentLimit.currentUsage + requestedAmount <= currentLimit.limit;
    } catch (error) {
      console.error('❌ Failed to enforce usage limit:', error);
      return false;
    }
  }

  /**
   * Get upgrade prompt for a user when they hit limits or need features
   */
  static async getUpgradePrompt(
    userId: string,
    context: { feature?: Feature; limitType?: UsageLimit }
  ): Promise<UpgradePrompt | null> {
    try {
      const subscription = await this.getUserSubscriptionCached(userId);

      if (!subscription) {
        return this.createUpgradePrompt('beta', 'trial', 'get-started', [
          'Start your free trial',
          'Access all Pro features for 30 days',
          'No credit card required',
        ]);
      }

      let suggestedTier: SubscriptionTier = subscription.tier;

      if (context.feature) {
        suggestedTier = this.getRequiredTierForFeature(context.feature);
      } else if (context.limitType) {
        suggestedTier = this.getSuggestedTierForLimit(subscription.tier, context.limitType);
      }

      if (suggestedTier === subscription.tier) {
        return null; // No upgrade needed
      }

      const features = this.getUpgradeFeatures(subscription.tier, suggestedTier);
      const ctaType = subscription.tier === 'beta' ? 'start-trial' : 'upgrade';

      return this.createUpgradePrompt(subscription.tier, suggestedTier, ctaType, features);
    } catch (error) {
      console.error('❌ Failed to get upgrade prompt:', error);
      return null;
    }
  }

  /**
   * Check multiple features at once
   */
  static async checkMultipleFeatures(
    userId: string,
    features: Feature[]
  ): Promise<Record<Feature, FeatureAccess>> {
    const results: Partial<Record<Feature, FeatureAccess>> = {};

    for (const feature of features) {
      results[feature] = await this.hasFeatureAccess(userId, feature);
    }

    return results as Record<Feature, FeatureAccess>;
  }

  /**
   * Get user subscription with caching
   */
  private static async getUserSubscriptionCached(userId: string): Promise<UserSubscription | null> {
    const cached = this.subscriptionCache.get(userId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.cacheTimeout) {
      return cached.subscription;
    }

    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (subscription) {
      this.subscriptionCache.set(userId, {
        subscription,
        timestamp: now,
      });
    }

    return subscription;
  }

  /**
   * Clear cache for a user (call when subscription changes)
   */
  static clearUserCache(userId: string): void {
    this.subscriptionCache.delete(userId);
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    this.subscriptionCache.clear();
  }

  /**
   * Get the minimum tier required for a feature
   */
  private static getRequiredTierForFeature(feature: Feature): SubscriptionTier {
    switch (feature) {
      case Feature.AI_ASSISTANT:
        return 'trial'; // Available in trial and above
      case Feature.ADVANCED_ANALYTICS:
        return 'pro';
      case Feature.PRIORITY_SUPPORT:
        return 'pro';
      case Feature.BULK_OPERATIONS:
        return 'hobbyist';
      case Feature.CUSTOM_BRANDING:
        return 'pro';
      case Feature.UNLIMITED_INVENTORY:
        return 'pro';
      case Feature.UNLIMITED_MARKETPLACES:
        return 'pro';
      case Feature.UNLIMITED_API_CALLS:
        return 'pro';
      case Feature.UNLIMITED_STORAGE:
        return 'pro';
      default:
        return 'pro';
    }
  }

  /**
   * Get suggested tier for usage limit upgrade
   */
  private static getSuggestedTierForLimit(currentTier: SubscriptionTier, limitType: UsageLimit): SubscriptionTier {
    // If already on pro, can't upgrade further
    if (currentTier === 'pro') {
      return 'pro';
    }

    // For most limits, pro tier provides unlimited access
    if ([
      UsageLimit.INVENTORY_ITEMS,
      UsageLimit.MARKETPLACE_CONNECTIONS,
      UsageLimit.API_CALLS,
      UsageLimit.STORAGE_MB,
    ].includes(limitType)) {
      // If on trial or beta, suggest hobbyist first for gradual upgrade
      if (currentTier === 'trial' || currentTier === 'beta') {
        return 'hobbyist';
      }
      // If on hobbyist, suggest pro
      return 'pro';
    }

    return 'pro';
  }

  /**
   * Create upgrade prompt object
   */
  private static createUpgradePrompt(
    currentTier: SubscriptionTier,
    suggestedTier: SubscriptionTier,
    ctaType: 'get-started' | 'start-trial' | 'upgrade',
    features: string[]
  ): UpgradePrompt {
    const tierConfig = SUBSCRIPTION_TIERS[suggestedTier];

    let title: string;
    let description: string;
    let ctaText: string;

    switch (ctaType) {
      case 'get-started':
        title = 'Get Started with NetPost';
        description = 'Start your journey with our powerful reselling platform';
        ctaText = 'Start Free Trial';
        break;
      case 'start-trial':
        title = 'Start Your Free Trial';
        description = 'Try all Pro features free for 30 days';
        ctaText = 'Start Trial';
        break;
      case 'upgrade':
        title = `Upgrade to ${tierConfig.displayName}`;
        description = `Unlock more features and higher limits with ${tierConfig.displayName}`;
        ctaText = `Upgrade to ${tierConfig.displayName}`;
        break;
    }

    return {
      show: true,
      title,
      description,
      currentTier,
      suggestedTier,
      features,
      ctaText,
    };
  }

  /**
   * Get features unlocked by upgrading from one tier to another
   */
  private static getUpgradeFeatures(fromTier: SubscriptionTier, toTier: SubscriptionTier): string[] {
    const fromConfig = SUBSCRIPTION_TIERS[fromTier];
    const toConfig = SUBSCRIPTION_TIERS[toTier];

    const features: string[] = [];

    // Compare feature flags
    if (!fromConfig.features.hasAiAssistant && toConfig.features.hasAiAssistant) {
      features.push('AI-powered listing assistant');
    }
    if (!fromConfig.features.hasAdvancedAnalytics && toConfig.features.hasAdvancedAnalytics) {
      features.push('Advanced analytics & insights');
    }
    if (!fromConfig.features.hasPrioritySupport && toConfig.features.hasPrioritySupport) {
      features.push('Priority customer support');
    }
    if (!fromConfig.features.hasBulkOperations && toConfig.features.hasBulkOperations) {
      features.push('Bulk operations & automation');
    }
    if (!fromConfig.features.hasCustomBranding && toConfig.features.hasCustomBranding) {
      features.push('Custom branding & white-label');
    }

    // Compare limits
    if (fromConfig.features.maxInventoryItems !== -1 && toConfig.features.maxInventoryItems === -1) {
      features.push('Unlimited inventory items');
    } else if (toConfig.features.maxInventoryItems > fromConfig.features.maxInventoryItems) {
      features.push(`Up to ${toConfig.features.maxInventoryItems.toLocaleString()} inventory items`);
    }

    if (fromConfig.features.maxMarketplaceConnections !== -1 && toConfig.features.maxMarketplaceConnections === -1) {
      features.push('Unlimited marketplace connections');
    } else if (toConfig.features.maxMarketplaceConnections > fromConfig.features.maxMarketplaceConnections) {
      features.push(`${toConfig.features.maxMarketplaceConnections} marketplace connections`);
    }

    if (fromConfig.features.maxApiCallsPerMonth !== -1 && toConfig.features.maxApiCallsPerMonth === -1) {
      features.push('Unlimited API calls');
    } else if (toConfig.features.maxApiCallsPerMonth > fromConfig.features.maxApiCallsPerMonth) {
      features.push(`${toConfig.features.maxApiCallsPerMonth.toLocaleString()} API calls per month`);
    }

    if (fromConfig.features.maxStorageMb !== -1 && toConfig.features.maxStorageMb === -1) {
      features.push('Unlimited storage');
    } else if (toConfig.features.maxStorageMb > fromConfig.features.maxStorageMb) {
      features.push(`${(toConfig.features.maxStorageMb / 1024).toFixed(1)}GB storage`);
    }

    return features;
  }
}

/**
 * React hook for feature gating (to be used in components)
 */
export interface UseFeatureGatesResult {
  hasFeatureAccess: (feature: Feature) => Promise<FeatureAccess>;
  checkUsageLimit: (limitType: UsageLimit) => Promise<UsageLimitCheck>;
  enforceUsageLimit: (limitType: UsageLimit, amount?: number) => Promise<boolean>;
  getUpgradePrompt: (context: { feature?: Feature; limitType?: UsageLimit }) => Promise<UpgradePrompt | null>;
  clearCache: () => void;
}

export function createFeatureGatesForUser(userId: string): UseFeatureGatesResult {
  return {
    hasFeatureAccess: (feature: Feature) => FeatureGates.hasFeatureAccess(userId, feature),
    checkUsageLimit: (limitType: UsageLimit) => FeatureGates.checkUsageLimit(userId, limitType),
    enforceUsageLimit: (limitType: UsageLimit, amount?: number) =>
      FeatureGates.enforceUsageLimit(userId, limitType, amount),
    getUpgradePrompt: (context) => FeatureGates.getUpgradePrompt(userId, context),
    clearCache: () => FeatureGates.clearUserCache(userId),
  };
}

export default FeatureGates;