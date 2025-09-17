/**
 * Marketplace Connection Database Types
 *
 * TypeScript definitions for marketplace connection data models
 * Generated from database schema with additional business logic types
 */

import { MarketplaceType } from './listing';

// Enum types from database
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'suspended'
  | 'rate_limited'
  | 'error'
  | 'maintenance';

export type AuthMethod =
  | 'oauth1'
  | 'oauth2'
  | 'api_key'
  | 'username_password'
  | 'app_password'
  | 'session_cookie';

// Credential data structures (these are stored encrypted in the database)
export interface OAuth1Credentials {
  consumer_key: string;
  consumer_secret: string;
  access_token: string;
  access_token_secret: string;
  oauth_verifier?: string;
}

export interface OAuth2Credentials {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}

export interface ApiKeyCredentials {
  api_key: string;
  api_secret?: string;
  client_id?: string;
  client_secret?: string;
}

export interface UsernamePasswordCredentials {
  username: string;
  password: string;
  api_key?: string;
}

export type MarketplaceCredentials =
  | OAuth1Credentials
  | OAuth2Credentials
  | ApiKeyCredentials
  | UsernamePasswordCredentials;

// Rate limiting tracking
export interface RateLimitUsage {
  current_hour?: {
    requests: number;
    reset_time: string; // ISO timestamp
  };
  current_minute?: {
    requests: number;
    reset_time: string;
  };
  daily?: {
    requests: number;
    reset_time: string;
  };
}

// Notification preferences
export interface NotificationPreferences {
  connection_status_changes: boolean;
  token_expiry_warnings: boolean;
  sync_errors: boolean;
  rate_limit_warnings: boolean;
  new_sales: boolean;
  new_messages: boolean;
  listing_ended: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

// Marketplace-specific metadata
export interface EBayMetadata {
  developer_id?: string;
  application_id?: string;
  certificate_id?: string;
  site_id?: number; // eBay site (0 = US, 3 = UK, etc.)
  environment?: 'sandbox' | 'production';
  user_token?: string;
  store_category_preferences?: Record<string, string>;
}

export interface PoshmarkMetadata {
  closet_name?: string;
  social_username?: string;
  follower_count?: number;
  following_count?: number;
  listing_count?: number;
  sales_count?: number;
  average_ship_time?: number;
}

export interface MercariMetadata {
  seller_rating?: number;
  response_rate?: number;
  ship_time?: number;
  profile_completion?: number;
}

export interface FacebookMarketplaceMetadata {
  page_id?: string;
  page_name?: string;
  page_category?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    country: string;
  };
}

export type MarketplaceSpecificMetadata =
  | EBayMetadata
  | PoshmarkMetadata
  | MercariMetadata
  | FacebookMarketplaceMetadata
  | Record<string, any>;

// Fee structures
export interface MarketplaceFeeStructure {
  listing_fee?: number;
  final_value_fee_percentage?: number;
  final_value_fee_minimum?: number;
  final_value_fee_maximum?: number;
  payment_processing_fee_percentage?: number;
  international_fee?: number;
  promoted_listing_fee_percentage?: number;
  store_subscription_fee?: number;
  currency?: string;
}

// Platform limits
export interface MarketplaceLimits {
  max_listings_per_month?: number;
  max_photos_per_listing?: number;
  max_title_length?: number;
  max_description_length?: number;
  max_category_depth?: number;
  supported_currencies?: string[];
  min_listing_price?: number;
  max_listing_price?: number;
  supported_countries?: string[];
  auction_duration_options?: number[]; // in days
}

// Main marketplace connection record
export interface MarketplaceConnectionRecord {
  // Primary Key
  id: string; // UUID

  // User Association
  user_id: string; // UUID

  // Marketplace Information
  marketplace_type: MarketplaceType;
  marketplace_user_id: string | null;
  marketplace_username: string | null;
  marketplace_store_name: string | null;

  // Connection Status
  connection_status: ConnectionStatus;
  auth_method: AuthMethod;
  status_message: string | null;
  last_connection_check: string | null; // ISO timestamp

  // Note: Encrypted credential fields are not included in the TypeScript interface
  // They are handled separately through secure API endpoints

  // OAuth Flow Data
  oauth_state: string | null;
  oauth_verifier: string | null;
  authorization_url: string | null;
  callback_url: string | null;

  // Token Information
  access_token_expires_at: string | null; // ISO timestamp
  refresh_token_expires_at: string | null; // ISO timestamp
  scope_granted: string[];
  token_type: string;

  // API Configuration
  api_endpoint_base: string | null;
  api_version: string | null;
  rate_limit_per_hour: number | null;
  rate_limit_per_minute: number | null;
  current_rate_limit_usage: RateLimitUsage;

  // Marketplace Settings & Preferences
  auto_sync_enabled: boolean;
  sync_frequency_minutes: number;
  listing_auto_end: boolean;
  notification_preferences: NotificationPreferences;

  // Business Settings
  default_shipping_policy_id: string | null;
  default_return_policy_id: string | null;
  default_payment_methods: string[];
  default_handling_time: number;

  // Performance & Health Monitoring
  last_successful_sync: string | null; // ISO timestamp
  last_sync_error: string | null;
  consecutive_errors: number;
  total_api_calls: number;
  total_errors: number;
  average_response_time_ms: number | null;

  // Connection Metadata
  connection_source: string;
  user_agent: string | null;
  ip_address: string | null;
  connection_notes: string | null;

  // Webhook Information
  webhook_url: string | null;
  webhook_events: string[];

  // Marketplace-Specific Data
  marketplace_metadata: MarketplaceSpecificMetadata;
  marketplace_fees: MarketplaceFeeStructure;
  marketplace_limits: MarketplaceLimits;

  // System Fields
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  connected_at: string | null; // ISO timestamp
  last_used_at: string | null; // ISO timestamp
  deleted_at: string | null; // ISO timestamp
}

// Safe view without encrypted credentials
export interface MarketplaceConnectionSafe extends MarketplaceConnectionRecord {
  // Computed fields from the view
  token_expired: boolean;
  hours_until_expiry: number | null;
  error_rate_percentage: number;
}

// Input types for creating/updating connections
export interface CreateMarketplaceConnectionInput {
  marketplace_type: MarketplaceType;
  auth_method: AuthMethod;
  marketplace_user_id?: string;
  marketplace_username?: string;
  marketplace_store_name?: string;
  api_endpoint_base?: string;
  api_version?: string;
  callback_url?: string;
  auto_sync_enabled?: boolean;
  sync_frequency_minutes?: number;
  listing_auto_end?: boolean;
  notification_preferences?: Partial<NotificationPreferences>;
  default_shipping_policy_id?: string;
  default_return_policy_id?: string;
  default_payment_methods?: string[];
  default_handling_time?: number;
  webhook_url?: string;
  webhook_events?: string[];
  marketplace_metadata?: MarketplaceSpecificMetadata;
  connection_notes?: string;
  user_agent?: string;
}

export interface UpdateMarketplaceConnectionInput extends Partial<CreateMarketplaceConnectionInput> {
  connection_status?: ConnectionStatus;
  status_message?: string;
  oauth_state?: string;
  oauth_verifier?: string;
  authorization_url?: string;
  access_token_expires_at?: string;
  refresh_token_expires_at?: string;
  scope_granted?: string[];
  token_type?: string;
  rate_limit_per_hour?: number;
  rate_limit_per_minute?: number;
  current_rate_limit_usage?: RateLimitUsage;
  last_sync_error?: string;
  marketplace_fees?: MarketplaceFeeStructure;
  marketplace_limits?: MarketplaceLimits;
}

// Credential management types
export interface StoreCredentialsInput {
  connection_id: string;
  credentials: MarketplaceCredentials;
  refresh_token?: string;
  webhook_secret?: string;
}

export interface CredentialValidationResult {
  is_valid: boolean;
  error_message?: string;
  expires_at?: string;
  scope?: string[];
  user_info?: {
    user_id: string;
    username: string;
    email?: string;
    store_name?: string;
  };
}

// OAuth flow types
export interface OAuth1FlowData {
  request_token: string;
  request_token_secret: string;
  oauth_verifier?: string;
  oauth_callback_confirmed?: boolean;
}

export interface OAuth2FlowData {
  authorization_url: string;
  state: string;
  code_verifier?: string; // for PKCE
  redirect_uri: string;
}

export interface OAuthCallback {
  code?: string;
  oauth_token?: string;
  oauth_verifier?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

// Health monitoring types
export interface ConnectionHealth {
  connection_id: string;
  marketplace_type: MarketplaceType;
  status: ConnectionStatus;
  last_check: string;
  response_time_ms: number | null;
  error_rate: number;
  consecutive_errors: number;
  token_expires_in_hours: number | null;
  needs_attention: boolean;
  issues: string[];
}

export interface HealthCheckResult {
  success: boolean;
  status: ConnectionStatus;
  response_time_ms: number;
  error_message?: string;
  rate_limit_remaining?: number;
  token_info?: {
    expires_at: string;
    scope: string[];
  };
}

// Analytics and reporting
export interface ConnectionAnalytics {
  total_connections: number;
  active_connections: number;
  connections_by_marketplace: Record<MarketplaceType, number>;
  connections_by_status: Record<ConnectionStatus, number>;
  average_uptime_percentage: number;
  total_api_calls: number;
  total_errors: number;
  average_response_time_ms: number;
  connections_expiring_soon: number; // within 24 hours
  most_reliable_marketplace: MarketplaceType | null;
  least_reliable_marketplace: MarketplaceType | null;
}

// Search and filter types
export interface ConnectionFilters {
  marketplace_type?: MarketplaceType[];
  connection_status?: ConnectionStatus[];
  auth_method?: AuthMethod[];
  auto_sync_enabled?: boolean;
  token_expires_within_hours?: number;
  has_errors?: boolean;
  last_used_after?: string; // ISO date
  last_used_before?: string; // ISO date
  created_after?: string; // ISO date
  created_before?: string; // ISO date
}

// Business logic helpers
export function getConnectionStatusDisplayName(status: ConnectionStatus): string {
  const displayNames: Record<ConnectionStatus, string> = {
    disconnected: 'Disconnected',
    connecting: 'Connecting',
    active: 'Active',
    expired: 'Expired',
    revoked: 'Revoked',
    suspended: 'Suspended',
    rate_limited: 'Rate Limited',
    error: 'Error',
    maintenance: 'Maintenance',
  };
  return displayNames[status];
}

export function getAuthMethodDisplayName(method: AuthMethod): string {
  const displayNames: Record<AuthMethod, string> = {
    oauth1: 'OAuth 1.0',
    oauth2: 'OAuth 2.0',
    api_key: 'API Key',
    username_password: 'Username/Password',
    app_password: 'App Password',
    session_cookie: 'Session Cookie',
  };
  return displayNames[method];
}

export function isConnectionHealthy(connection: MarketplaceConnectionSafe): boolean {
  return connection.connection_status === 'active' &&
         !connection.token_expired &&
         connection.consecutive_errors < 5;
}

export function needsTokenRefresh(connection: MarketplaceConnectionSafe, hoursThreshold: number = 24): boolean {
  return connection.hours_until_expiry !== null &&
         connection.hours_until_expiry <= hoursThreshold &&
         connection.hours_until_expiry > 0;
}

export function getConnectionUptimePercentage(connection: MarketplaceConnectionSafe): number {
  if (connection.total_api_calls === 0) return 100;
  const successfulCalls = connection.total_api_calls - connection.total_errors;
  return (successfulCalls / connection.total_api_calls) * 100;
}

export function getDaysSinceLastSync(connection: MarketplaceConnectionSafe): number | null {
  if (!connection.last_successful_sync) return null;
  const lastSync = new Date(connection.last_successful_sync);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastSync.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Validation helpers
export function validateConnectionSettings(input: CreateMarketplaceConnectionInput | UpdateMarketplaceConnectionInput): string[] {
  const errors: string[] = [];

  if (input.sync_frequency_minutes !== undefined && input.sync_frequency_minutes <= 0) {
    errors.push('Sync frequency must be greater than 0 minutes');
  }

  if (input.default_handling_time !== undefined && input.default_handling_time < 1) {
    errors.push('Handling time must be at least 1 day');
  }

  if (input.webhook_url && !isValidUrl(input.webhook_url)) {
    errors.push('Webhook URL must be a valid HTTPS URL');
  }

  return errors;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Error types
export class MarketplaceConnectionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'MarketplaceConnectionError';
  }
}

export class ConnectionNotFoundError extends MarketplaceConnectionError {
  constructor(connectionId: string) {
    super(`Marketplace connection not found: ${connectionId}`, 'CONNECTION_NOT_FOUND');
  }
}

export class InvalidCredentialsError extends MarketplaceConnectionError {
  constructor(marketplace: MarketplaceType) {
    super(`Invalid credentials for ${marketplace}`, 'INVALID_CREDENTIALS');
  }
}

export class TokenExpiredError extends MarketplaceConnectionError {
  constructor(marketplace: MarketplaceType) {
    super(`Access token expired for ${marketplace}`, 'TOKEN_EXPIRED');
  }
}

export class RateLimitExceededError extends MarketplaceConnectionError {
  constructor(marketplace: MarketplaceType, resetTime?: string) {
    const message = resetTime
      ? `Rate limit exceeded for ${marketplace}. Resets at ${resetTime}`
      : `Rate limit exceeded for ${marketplace}`;
    super(message, 'RATE_LIMIT_EXCEEDED');
  }
}

export class MarketplaceApiError extends MarketplaceConnectionError {
  constructor(marketplace: MarketplaceType, apiError: string) {
    super(`${marketplace} API error: ${apiError}`, 'MARKETPLACE_API_ERROR');
  }
}