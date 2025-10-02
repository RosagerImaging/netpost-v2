/**
 * Usage Metrics Collection Service
 *
 * Tracks user activity and usage patterns for subscription enforcement
 * and analytics. Collects metrics on inventory, listings, API calls, storage, etc.
 */

import { createClient } from '@supabase/supabase-js';

// Create a properly typed supabase admin client for the web app
// Temporarily using any to bypass type resolution issues in monorepo
const supabaseAdmin = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import { SubscriptionService } from './subscription-service';

export type MetricType =
  | 'inventory_items'
  | 'listings_created'
  | 'api_calls'
  | 'storage_used'
  | 'marketplace_connections'
  | 'photos_uploaded';

export interface UsageMetric {
  id: string;
  userId: string;
  subscriptionId?: string;
  metricType: MetricType;
  metricValue: number;
  periodStart: Date;
  periodEnd: Date;
  isDailyAggregate: boolean;
  isMonthlyAggregate: boolean;
  recordedAt: Date;
}

export interface UsageAggregation {
  metricType: MetricType;
  totalValue: number;
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface UsageReport {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  metrics: UsageAggregation[];
  generatedAt: Date;
}

export interface TrackUsageParams {
  userId: string;
  metricType: MetricType;
  value: number;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * Usage Tracker Service Class
 * Handles metrics collection, aggregation, and reporting
 */
export class UsageTracker {
  /**
   * Track a single usage event
   */
  static async trackUsage(params: TrackUsageParams): Promise<void> {
    try {
      const timestamp = params.timestamp || new Date();
      const startOfDay = new Date(timestamp);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(timestamp);
      endOfDay.setHours(23, 59, 59, 999);

      // Get user's subscription
      const subscription = await SubscriptionService.getUserSubscription(params.userId);
      const subscriptionId = subscription?.id;

      // Check if we already have a daily record for this metric
      const { data: existingRecord, error: fetchError } = await supabaseAdmin
        .from('usage_metrics')
        .select('*')
        .eq('user_id', params.userId)
        .eq('metric_type', params.metricType)
        .eq('is_daily_aggregate', true)
        .gte('period_start', startOfDay.toISOString())
        .lte('period_end', endOfDay.toISOString())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError;
      }

      if (existingRecord) {
        // Update existing daily record
        const { error: updateError } = await supabaseAdmin
          .from('usage_metrics')
          .update({
            metric_value: existingRecord.metric_value + params.value,
            recorded_at: timestamp.toISOString(),
          })
          .eq('id', existingRecord.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new daily record
        const { error: insertError } = await supabaseAdmin
          .from('usage_metrics')
          .insert({
            user_id: params.userId,
            subscription_id: subscriptionId,
            metric_type: params.metricType,
            metric_value: params.value,
            period_start: startOfDay.toISOString(),
            period_end: endOfDay.toISOString(),
            is_daily_aggregate: true,
            is_monthly_aggregate: false,
            recorded_at: timestamp.toISOString(),
          });

        if (insertError) {
          throw insertError;
        }
      }

      // Update real-time subscription limits if applicable
      if (subscription) {
        await this.updateSubscriptionLimits(params.userId, params.metricType, params.value);
      }

      console.log(`✅ Tracked usage: ${params.metricType} = ${params.value} for user ${params.userId}`);
    } catch (error) {
      console.error('❌ Failed to track usage:', error);
      throw error;
    }
  }

  /**
   * Track multiple usage events in batch
   */
  static async trackUsageBatch(usageEvents: TrackUsageParams[]): Promise<void> {
    try {
      for (const event of usageEvents) {
        await this.trackUsage(event);
      }

      console.log(`✅ Tracked ${usageEvents.length} usage events in batch`);
    } catch (error) {
      console.error('❌ Failed to track usage batch:', error);
      throw error;
    }
  }

  /**
   * Get usage metrics for a user within a time period
   */
  static async getUserUsage(
    userId: string,
    metricType?: MetricType,
    startDate?: Date,
    endDate?: Date,
    aggregationType: 'daily' | 'monthly' = 'daily'
  ): Promise<UsageMetric[]> {
    try {
      let query = supabaseAdmin
        .from('usage_metrics')
        .select('*')
        .eq('user_id', userId);

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      if (aggregationType === 'daily') {
        query = query.eq('is_daily_aggregate', true);
      } else {
        query = query.eq('is_monthly_aggregate', true);
      }

      if (startDate) {
        query = query.gte('period_start', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('period_end', endDate.toISOString());
      }

      query = query.order('period_start', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(this.mapUsageMetricData);
    } catch (error) {
      console.error('❌ Failed to get user usage:', error);
      throw error;
    }
  }

  /**
   * Generate usage report for a user
   */
  static async generateUsageReport(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly',
    metricTypes?: MetricType[]
  ): Promise<UsageReport> {
    try {
      const endDate = new Date();
      const startDate = new Date();

      // Set the date range based on period
      switch (period) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const typesToReport = metricTypes || [
        'inventory_items',
        'listings_created',
        'api_calls',
        'storage_used',
        'marketplace_connections',
        'photos_uploaded',
      ];

      const metrics: UsageAggregation[] = [];

      for (const metricType of typesToReport) {
        const usage = await this.getUserUsage(userId, metricType, startDate, endDate, 'daily');

        const totalValue = usage.reduce((sum, metric) => sum + metric.metricValue, 0);
        const days = Math.max(1, usage.length);

        const aggregation: UsageAggregation = {
          metricType,
          totalValue,
          dailyAverage: totalValue / days,
          weeklyAverage: totalValue / Math.max(1, days / 7),
          monthlyAverage: totalValue / Math.max(1, days / 30),
          periodStart: startDate,
          periodEnd: endDate,
        };

        metrics.push(aggregation);
      }

      return {
        userId,
        period,
        metrics,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('❌ Failed to generate usage report:', error);
      throw error;
    }
  }

  /**
   * Get current usage for subscription limit checking
   */
  static async getCurrentUsage(userId: string, metricType: MetricType): Promise<number> {
    try {
      const subscription = await SubscriptionService.getUserSubscription(userId);
      if (!subscription) {
        return 0;
      }

      // For real-time metrics, get from subscription_limits
      if (['inventory_items', 'marketplace_connections', 'storage_used'].includes(metricType)) {
        const { data, error } = await supabaseAdmin
          .from('subscription_limits')
          .select('*')
          .eq('subscription_id', subscription.id)
          .single();

        if (error || !data) {
          return 0;
        }

        switch (metricType) {
          case 'inventory_items':
            return data.current_inventory_items;
          case 'marketplace_connections':
            return data.current_marketplace_connections;
          case 'storage_used':
            return data.current_storage_mb;
          default:
            return 0;
        }
      }

      // For monthly metrics, get from current billing period
      const startOfMonth = new Date();
      if (subscription.currentPeriodStart) {
        startOfMonth.setTime(subscription.currentPeriodStart.getTime());
      } else {
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
      }

      const { data, error } = await supabaseAdmin
        .from('usage_metrics')
        .select('metric_value')
        .eq('user_id', userId)
        .eq('metric_type', metricType)
        .eq('is_daily_aggregate', true)
        .gte('period_start', startOfMonth.toISOString());

      if (error) {
        throw error;
      }

      return (data || []).reduce((sum, metric) => sum + metric.metric_value, 0);
    } catch (error) {
      console.error('❌ Failed to get current usage:', error);
      throw error;
    }
  }

  /**
   * Create monthly aggregates (to be run as a scheduled job)
   */
  static async createMonthlyAggregates(): Promise<void> {
    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Get all unique user-metric combinations for the month
      const { data: dailyData, error } = await supabaseAdmin
        .from('usage_metrics')
        .select('user_id, subscription_id, metric_type, metric_value')
        .eq('is_daily_aggregate', true)
        .gte('period_start', startOfMonth.toISOString())
        .lte('period_end', endOfMonth.toISOString());

      if (error) {
        throw error;
      }

      if (!dailyData || dailyData.length === 0) {
        console.log('No daily data found for monthly aggregation');
        return;
      }

      // Group by user and metric type
      const aggregates = new Map<string, { userId: string; subscriptionId?: string; metricType: MetricType; totalValue: number }>();

      for (const record of dailyData) {
        const key = `${record.user_id}-${record.metric_type}`;

        if (aggregates.has(key)) {
          aggregates.get(key)!.totalValue += record.metric_value;
        } else {
          aggregates.set(key, {
            userId: record.user_id,
            subscriptionId: record.subscription_id,
            metricType: record.metric_type as MetricType,
            totalValue: record.metric_value,
          });
        }
      }

      // Insert monthly aggregates
      const monthlyRecords = Array.from(aggregates.values()).map(aggregate => ({
        user_id: aggregate.userId,
        subscription_id: aggregate.subscriptionId,
        metric_type: aggregate.metricType,
        metric_value: aggregate.totalValue,
        period_start: startOfMonth.toISOString(),
        period_end: endOfMonth.toISOString(),
        is_daily_aggregate: false,
        is_monthly_aggregate: true,
        recorded_at: new Date().toISOString(),
      }));

      if (monthlyRecords.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('usage_metrics')
          .insert(monthlyRecords);

        if (insertError) {
          throw insertError;
        }

        console.log(`✅ Created ${monthlyRecords.length} monthly usage aggregates`);
      }
    } catch (error) {
      console.error('❌ Failed to create monthly aggregates:', error);
      throw error;
    }
  }

  /**
   * Update subscription limits based on usage
   */
  private static async updateSubscriptionLimits(
    userId: string,
    metricType: MetricType,
    value: number
  ): Promise<void> {
    try {
      const limitType = this.mapMetricTypeToLimitType(metricType);
      if (limitType) {
        await SubscriptionService.updateUsage(userId, limitType, value);
      }
    } catch (error) {
      console.error('❌ Failed to update subscription limits:', error);
      // Don't throw here - we don't want usage tracking to fail if limit update fails
    }
  }

  /**
   * Map metric type to subscription limit type
   */
  private static mapMetricTypeToLimitType(metricType: MetricType): 'inventory_items' | 'marketplace_connections' | 'api_calls' | 'storage_mb' | 'listings_created' | null {
    switch (metricType) {
      case 'inventory_items':
        return 'inventory_items';
      case 'marketplace_connections':
        return 'marketplace_connections';
      case 'api_calls':
        return 'api_calls';
      case 'storage_used':
        return 'storage_mb';
      case 'listings_created':
        return 'listings_created';
      default:
        return null;
    }
  }

  /**
   * Map database usage metric data to TypeScript interface
   * SECURITY: Type-safe mapping from database records
   */
  private static mapUsageMetricData(data: Record<string, unknown>): UsageMetric {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      subscriptionId: data.subscription_id as string | undefined,
      metricType: data.metric_type as MetricType,
      metricValue: data.metric_value as number,
      periodStart: new Date(data.period_start as string),
      periodEnd: new Date(data.period_end as string),
      isDailyAggregate: data.is_daily_aggregate as boolean,
      isMonthlyAggregate: data.is_monthly_aggregate as boolean,
      recordedAt: new Date(data.recorded_at as string),
    };
  }
}

/**
 * Convenience functions for common usage tracking
 */

export async function trackInventoryItemAdded(userId: string, count = 1): Promise<void> {
  await UsageTracker.trackUsage({
    userId,
    metricType: 'inventory_items',
    value: count,
  });
}

export async function trackInventoryItemRemoved(userId: string, count = 1): Promise<void> {
  await UsageTracker.trackUsage({
    userId,
    metricType: 'inventory_items',
    value: -count,
  });
}

export async function trackListingCreated(userId: string, count = 1): Promise<void> {
  await UsageTracker.trackUsage({
    userId,
    metricType: 'listings_created',
    value: count,
  });
}

export async function trackApiCall(userId: string, count = 1): Promise<void> {
  await UsageTracker.trackUsage({
    userId,
    metricType: 'api_calls',
    value: count,
  });
}

export async function trackStorageUsed(userId: string, megabytes: number): Promise<void> {
  await UsageTracker.trackUsage({
    userId,
    metricType: 'storage_used',
    value: megabytes,
  });
}

export async function trackMarketplaceConnectionAdded(userId: string, count = 1): Promise<void> {
  await UsageTracker.trackUsage({
    userId,
    metricType: 'marketplace_connections',
    value: count,
  });
}

export async function trackMarketplaceConnectionRemoved(userId: string, count = 1): Promise<void> {
  await UsageTracker.trackUsage({
    userId,
    metricType: 'marketplace_connections',
    value: -count,
  });
}

export async function trackPhotoUploaded(userId: string, count = 1): Promise<void> {
  await UsageTracker.trackUsage({
    userId,
    metricType: 'photos_uploaded',
    value: count,
  });
}

export default UsageTracker;