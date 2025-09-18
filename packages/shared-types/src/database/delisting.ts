/**
 * TypeScript types for the automated de-listing system
 * Generated from database schema migration 006_create_delisting_tables.sql
 * Author: BMad Development Agent (James) - Story 1.7
 * Date: 2025-09-18
 */

import { MarketplaceType } from './marketplace-connection';

/**
 * Enum types from database
 */
export type DelistingJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'partially_failed'
  | 'failed'
  | 'cancelled';

export type DelistingTriggerType =
  | 'sale_detected'
  | 'manual'
  | 'scheduled'
  | 'expired';

export type DelistingPreference =
  | 'immediate'
  | 'delayed'
  | 'manual_confirmation';

/**
 * User de-listing preferences
 */
export interface UserDelistingPreferences {
  id: string;
  user_id: string;

  // Global preferences
  auto_delist_enabled: boolean;
  default_preference: DelistingPreference;
  delay_minutes: number;
  require_confirmation: boolean;

  // Notification preferences
  notification_email: boolean;
  notification_app: boolean;
  notification_sms: boolean;
  notification_webhook_url?: string;

  // Marketplace-specific preferences
  marketplace_preferences: Record<MarketplaceType, {
    preference?: DelistingPreference;
    delay?: number;
    enabled?: boolean;
  }>;

  // Filtering preferences
  exclude_marketplaces: MarketplaceType[];
  min_sale_amount?: number;
  max_sale_amount?: number;

  created_at: string;
  updated_at: string;
}

/**
 * De-listing job record
 */
export interface DelistingJob {
  id: string;
  user_id: string;
  inventory_item_id: string;

  // Job details
  trigger_type: DelistingTriggerType;
  trigger_data: Record<string, any>;
  status: DelistingJobStatus;

  // Sale information
  sold_on_marketplace?: MarketplaceType;
  sale_price?: number;
  sale_date?: string;
  sale_external_id?: string;

  // Targeting information
  marketplaces_targeted: MarketplaceType[];
  marketplaces_completed: MarketplaceType[];
  marketplaces_failed: MarketplaceType[];

  // Execution details
  scheduled_for: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
  max_retries: number;

  // Results and logging
  error_log: Record<MarketplaceType, {
    error: string;
    code?: string;
    timestamp: string;
    retry_count: number;
  }>;
  success_log: Record<MarketplaceType, {
    delisted_at: string;
    external_response?: any;
    duration_ms?: number;
  }>;
  total_delisted: number;
  total_failed: number;

  // User interaction
  requires_user_confirmation: boolean;
  user_confirmed_at?: string;
  user_cancelled_at?: string;
  cancellation_reason?: string;

  created_at: string;
  updated_at: string;
}

/**
 * Sale event record from webhooks or polling
 */
export interface SaleEvent {
  id: string;
  user_id: string;
  inventory_item_id?: string;
  listing_id?: string;

  // Event source information
  marketplace_type: MarketplaceType;
  event_type: string;
  external_event_id?: string;
  external_listing_id?: string;
  external_transaction_id?: string;

  // Sale details
  sale_price?: number;
  sale_currency: string;
  sale_date?: string;
  buyer_id?: string;
  payment_status?: string;

  // Raw event data
  raw_webhook_data?: Record<string, any>;
  raw_polling_data?: Record<string, any>;

  // Processing status
  processed: boolean;
  processing_error?: string;
  delisting_job_id?: string;

  // Deduplication
  event_hash?: string;
  is_duplicate: boolean;
  duplicate_of?: string;

  // Verification
  verified: boolean;
  verification_attempts: number;
  verification_error?: string;

  created_at: string;
  updated_at: string;
}

/**
 * De-listing audit log entry
 */
export interface DelistingAuditLog {
  id: string;
  user_id: string;
  delisting_job_id?: string;
  listing_id?: string;

  // Action details
  action: string;
  marketplace_type?: MarketplaceType;

  // Results
  success: boolean;
  error_message?: string;
  error_code?: string;

  // Timing
  duration_ms?: number;

  // Context data
  context_data: Record<string, any>;

  created_at: string;
}

/**
 * Pending delisting jobs view
 */
export interface PendingDelistingJob extends DelistingJob {
  item_title: string;
  item_brand?: string;
  item_category?: string;
  business_name?: string;
  processing_status: 'awaiting_confirmation' | 'ready_to_process' | 'scheduled';
}

/**
 * Request/Response types for API operations
 */

// Create delisting job
export interface CreateDelistingJobRequest {
  inventory_item_id: string;
  trigger_type: DelistingTriggerType;
  marketplaces_targeted: MarketplaceType[];
  scheduled_for?: string;
  trigger_data?: Record<string, any>;
  requires_user_confirmation?: boolean;
}

export interface CreateDelistingJobResponse {
  success: boolean;
  job_id?: string;
  error?: string;
}

// Update delisting preferences
export interface UpdateDelistingPreferencesRequest {
  auto_delist_enabled?: boolean;
  default_preference?: DelistingPreference;
  delay_minutes?: number;
  require_confirmation?: boolean;
  notification_email?: boolean;
  notification_app?: boolean;
  notification_sms?: boolean;
  notification_webhook_url?: string;
  marketplace_preferences?: Record<MarketplaceType, {
    preference?: DelistingPreference;
    delay?: number;
    enabled?: boolean;
  }>;
  exclude_marketplaces?: MarketplaceType[];
  min_sale_amount?: number;
  max_sale_amount?: number;
}

export interface UpdateDelistingPreferencesResponse {
  success: boolean;
  preferences?: UserDelistingPreferences;
  error?: string;
}

// Process sale event
export interface ProcessSaleEventRequest {
  marketplace_type: MarketplaceType;
  event_type: string;
  external_event_id?: string;
  external_listing_id?: string;
  external_transaction_id?: string;
  sale_price?: number;
  sale_currency?: string;
  sale_date?: string;
  buyer_id?: string;
  payment_status?: string;
  raw_data?: Record<string, any>;
}

export interface ProcessSaleEventResponse {
  success: boolean;
  event_id?: string;
  job_id?: string;
  duplicate?: boolean;
  requires_verification?: boolean;
  error?: string;
}

// Job confirmation
export interface ConfirmDelistingJobRequest {
  job_id: string;
  confirmed: boolean;
  cancellation_reason?: string;
}

export interface ConfirmDelistingJobResponse {
  success: boolean;
  job?: DelistingJob;
  error?: string;
}

// Bulk delisting
export interface BulkDelistingRequest {
  inventory_item_ids: string[];
  marketplaces: MarketplaceType[];
  reason?: string;
}

export interface BulkDelistingResponse {
  success: boolean;
  job_ids: string[];
  failed_items: Array<{
    inventory_item_id: string;
    error: string;
  }>;
}

// Dashboard stats
export interface DelistingStats {
  total_jobs: number;
  pending_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_delisted: number;
  success_rate: number;
  avg_processing_time_ms: number;
  by_marketplace: Record<MarketplaceType, {
    total: number;
    success: number;
    failed: number;
    success_rate: number;
  }>;
  recent_activity: Array<{
    date: string;
    jobs_created: number;
    jobs_completed: number;
    items_delisted: number;
  }>;
}

/**
 * Webhook payload types for different marketplaces
 */

// eBay webhook payload
export interface EBayWebhookPayload {
  notificationId: string;
  publishedDate: string;
  notificationType: string;
  eBayEventType: string;
  categoryId: string;
  itemId: string;
  transactionId?: string;
  itemTitle: string;
  currentPrice: {
    amount: number;
    currency: string;
  };
  buyerId: string;
  sellerId: string;
  saleDate: string;
  paymentStatus: string;
  shippingRequired: boolean;
}

// Poshmark webhook payload (hypothetical structure)
export interface PoshmarkWebhookPayload {
  event_id: string;
  event_type: string;
  created_at: string;
  data: {
    listing_id: string;
    title: string;
    price: number;
    currency: string;
    buyer_username: string;
    seller_username: string;
    transaction_id: string;
    payment_status: string;
    sold_at: string;
  };
}

// Facebook Marketplace webhook payload (hypothetical structure)
export interface FacebookWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: string;
      value: {
        marketplace_listing_id: string;
        status: string;
        buyer_id?: string;
        transaction_id?: string;
        sale_price?: number;
        currency?: string;
        sold_at?: string;
      };
    }>;
  }>;
}

/**
 * Polling response types for marketplaces without webhooks
 */
export interface PollingResult<T = any> {
  success: boolean;
  data?: T[];
  has_more: boolean;
  next_page_token?: string;
  error?: string;
}

/**
 * Error types specific to delisting operations
 */
export interface DelistingError {
  code: string;
  message: string;
  marketplace: MarketplaceType;
  listing_id?: string;
  external_id?: string;
  retry_after?: number;
  permanent?: boolean;
}

// Common error codes
export const DELISTING_ERROR_CODES = {
  // Authentication errors
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // API errors
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_REQUEST: 'INVALID_REQUEST',

  // Business logic errors
  LISTING_NOT_FOUND: 'LISTING_NOT_FOUND',
  LISTING_ALREADY_ENDED: 'LISTING_ALREADY_ENDED',
  LISTING_CANNOT_BE_ENDED: 'LISTING_CANNOT_BE_ENDED',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type DelistingErrorCode = typeof DELISTING_ERROR_CODES[keyof typeof DELISTING_ERROR_CODES];

/**
 * Utility functions
 */
export function isRetryableError(errorCode: DelistingErrorCode): boolean {
  const retryableErrors: DelistingErrorCode[] = [
    DELISTING_ERROR_CODES.API_UNAVAILABLE,
    DELISTING_ERROR_CODES.RATE_LIMITED,
    DELISTING_ERROR_CODES.NETWORK_ERROR,
    DELISTING_ERROR_CODES.TIMEOUT
  ];

  return retryableErrors.includes(errorCode);
}

export function getRetryDelay(attempt: number, errorCode?: DelistingErrorCode): number {
  // Base exponential backoff: 2^attempt * 1000ms
  let baseDelay = Math.pow(2, attempt) * 1000;

  // Add jitter (±25%)
  const jitter = (Math.random() - 0.5) * 0.5 * baseDelay;
  baseDelay += jitter;

  // Special handling for rate limiting
  if (errorCode === DELISTING_ERROR_CODES.RATE_LIMITED) {
    baseDelay = Math.max(baseDelay, 60000); // At least 1 minute for rate limits
  }

  // Cap at 5 minutes
  return Math.min(baseDelay, 300000);
}

export function calculateSuccessRate(completed: number, failed: number): number {
  const total = completed + failed;
  return total > 0 ? (completed / total) * 100 : 0;
}