/**
 * Subscription Middleware
 *
 * Middleware for protecting API routes and components based on subscription status
 * and feature access. Provides automatic usage tracking and limit enforcement.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeatureGates, Feature, UsageLimit } from '../subscription/feature-gates';
import { UsageTracker } from '../subscription/usage-tracker';
import { SubscriptionService } from '../subscription/subscription-service';

export interface SubscriptionMiddlewareOptions {
  requiresFeature?: Feature;
  requiresUsageLimit?: {
    type: UsageLimit;
    amount?: number;
  };
  trackUsage?: {
    type: UsageLimit;
    amount?: number;
  };
  allowBetaUsers?: boolean;
  allowTrialUsers?: boolean;
}

export interface SubscriptionContext {
  userId: string;
  subscription: import('../subscription/subscription-service').UserSubscription;
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
}


// Map UsageLimit enum to UsageTracker MetricType values
function mapUsageLimitToMetricType(limit: UsageLimit): import('../subscription/usage-tracker').MetricType {
  // STORAGE_MB usage limit maps to 'storage_used' metric
  if (limit === UsageLimit.STORAGE_MB) return 'storage_used';
  // Other enum values share the same identifier as MetricType
  return limit as unknown as import('../subscription/usage-tracker').MetricType;
}

/**
 * Middleware function to protect API routes with subscription checks
 */
export function withSubscriptionProtection(
  handler: (request: NextRequest, context: SubscriptionContext) => Promise<NextResponse>,
  options: SubscriptionMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract user ID from request (assumes auth middleware has run first)
      const userId = await getUserIdFromRequest(request);

      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Get user subscription
      const subscription = await SubscriptionService.getUserSubscription(userId);

      if (!subscription) {
        return NextResponse.json(
          { error: 'No subscription found. Please subscribe to access this feature.' },
          { status: 402 } // Payment Required
        );
      }

      // Check if beta users are allowed
      if (!options.allowBetaUsers && subscription.isBetaUser) {
        return NextResponse.json(
          { error: 'This feature is not available during beta period' },
          { status: 403 }
        );
      }

      // Check if trial users are allowed
      if (!options.allowTrialUsers && subscription.tier === 'trial') {
        return NextResponse.json(
          { error: 'This feature requires a paid subscription' },
          { status: 402 }
        );
      }

      // Check feature access if required
      if (options.requiresFeature) {
        const featureAccess = await FeatureGates.hasFeatureAccess(userId, options.requiresFeature);

        if (!featureAccess.hasAccess) {
          return NextResponse.json(
            {
              error: 'Feature not available with current subscription',
              reason: featureAccess.reason,
              upgradeRequired: featureAccess.upgradeRequired,
              requiredTier: featureAccess.requiredTier,
              currentTier: featureAccess.currentTier,
            },
            { status: 402 }
          );
        }
      }

      // Check usage limits if required
      if (options.requiresUsageLimit) {
        const canProceed = await FeatureGates.enforceUsageLimit(
          userId,
          options.requiresUsageLimit.type,
          options.requiresUsageLimit.amount || 1
        );

        if (!canProceed) {
          const limitCheck = await FeatureGates.checkUsageLimit(userId, options.requiresUsageLimit.type);

          return NextResponse.json(
            {
              error: 'Usage limit exceeded',
              currentUsage: limitCheck.currentUsage,
              limit: limitCheck.limit,
              upgradeRequired: limitCheck.upgradeRequired,
              requiredTier: limitCheck.requiredTier,
            },
            { status: 429 } // Too Many Requests
          );
        }
      }

      // Create context for the handler
      const context: SubscriptionContext = {
        userId,
        subscription,
        hasAccess: true,
      };

      // Call the protected handler
      const response = await handler(request, context);

      // Track usage after successful request if configured
      if (options.trackUsage) {
        // Fire and forget - don't wait for usage tracking
        UsageTracker.trackUsage({
          userId,
          metricType: mapUsageLimitToMetricType(options.trackUsage.type),
          value: options.trackUsage.amount || 1,
        }).catch(error => {
          console.error('Failed to track usage:', error);
        });
      }

      return response;
    } catch (error) {
      console.error('Subscription middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
/**
 * Subscription check decorator for API handlers
 */
export function requiresSubscription(options: SubscriptionMiddlewareOptions = {}) {
  return function decorator(
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = withSubscriptionProtection(originalMethod, options);

    return descriptor;
  };
}

/**
 * Usage tracking decorator for API handlers
 */
export function tracksUsage(usageType: UsageLimit, amount = 1) {
  return function decorator(
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: NextRequest, ...args: unknown[]) {
      const result = await originalMethod.call(this, request, ...args);

      // Track usage after successful response
      if (result.status < 400) {
        const userId = await getUserIdFromRequest(request);
        if (userId) {
          UsageTracker.trackUsage({
            userId,
            metricType: mapUsageLimitToMetricType(usageType),
            value: amount,
          }).catch(error => {
            console.error('Failed to track usage:', error);
          });
        }
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Helper function to extract user ID from request
 * This would integrate with your authentication system
 */
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Check for user ID in headers (set by auth middleware)
    const userId = request.headers.get('x-user-id');
    if (userId) {
      return userId;
    }

    // Check for authorization header and extract user ID
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const _token = authHeader.substring(7);
      // Decode JWT or validate token to get user ID
      // This would integrate with your auth system (Supabase, NextAuth, etc.)
      // For now, returning null
      return null;
    }

    return null;
  } catch (error) {
    console.error('Failed to extract user ID from request:', error);
    return null;
  }
}

/**
 * Convenience functions for common subscription checks
 */

export const requiresPaidSubscription = (options: Omit<SubscriptionMiddlewareOptions, 'allowTrialUsers'> = {}) =>
  withSubscriptionProtection(async (_request, _context) => {
    return NextResponse.next();
  }, { ...options, allowTrialUsers: false });

export const requiresProSubscription = (options: SubscriptionMiddlewareOptions = {}) =>
  withSubscriptionProtection(async (_request, context) => {
    if (context.subscription.tier !== 'pro') {
      return NextResponse.json(
        { error: 'Pro subscription required' },
        { status: 402 }
      );
    }
    return NextResponse.next();
  }, options);

export const requiresAIFeature = (options: SubscriptionMiddlewareOptions = {}) =>
  withSubscriptionProtection(async (_request, _context) => {
    return NextResponse.next();
  }, { ...options, requiresFeature: Feature.AI_ASSISTANT });

export const requiresBulkOperations = (options: SubscriptionMiddlewareOptions = {}) =>
  withSubscriptionProtection(async (_request, _context) => {
    return NextResponse.next();
  }, { ...options, requiresFeature: Feature.BULK_OPERATIONS });

export const limitsInventoryItems = (amount = 1, options: SubscriptionMiddlewareOptions = {}) =>
  withSubscriptionProtection(async (_request, _context) => {
    return NextResponse.next();
  }, {
    ...options,
    requiresUsageLimit: { type: UsageLimit.INVENTORY_ITEMS, amount },
    trackUsage: { type: UsageLimit.INVENTORY_ITEMS, amount },
  });

export const limitsApiCalls = (amount = 1, options: SubscriptionMiddlewareOptions = {}) =>
  withSubscriptionProtection(async (_request, _context) => {
    return NextResponse.next();
  }, {
    ...options,
    requiresUsageLimit: { type: UsageLimit.API_CALLS, amount },
    trackUsage: { type: UsageLimit.API_CALLS, amount },
  });

export const limitsMarketplaceConnections = (amount = 1, options: SubscriptionMiddlewareOptions = {}) =>
  withSubscriptionProtection(async (_request, _context) => {
    return NextResponse.next();
  }, {
    ...options,
    requiresUsageLimit: { type: UsageLimit.MARKETPLACE_CONNECTIONS, amount },
    trackUsage: { type: UsageLimit.MARKETPLACE_CONNECTIONS, amount },
  });

export default withSubscriptionProtection;