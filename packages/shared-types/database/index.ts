/**
 * Database Types Index
 *
 * Central export point for all database-related TypeScript types
 * Auto-generated types from Supabase schema with business logic extensions
 */

// Import types that will be used in the Database interface
import type {
  UserProfileRecord,
  UserProfilePublic,
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from './user';

import type {
  InventoryItemRecord,
  InventoryItemEnhanced,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  InventoryItemStatus,
  InventoryItemCondition,
  SizeType,
} from './inventory-item';

import type {
  ListingRecord,
  ActiveListingView,
  CreateListingInput,
  UpdateListingInput,
  ListingStatus,
  MarketplaceType,
  ListingFormat,
  ShippingMethod,
} from './listing';

import type {
  MarketplaceConnectionRecord,
  MarketplaceConnectionSafe,
  CreateMarketplaceConnectionInput,
  UpdateMarketplaceConnectionInput,
  ConnectionStatus,
  AuthMethod,
} from './marketplace-connection';

import type {
  BetaInvitationRecord,
  BetaInvitationEnhanced,
  BetaInvitationPublic,
  CreateBetaInvitationInput,
  UpdateBetaInvitationInput,
  BetaInvitationStatus,
} from './beta-invitation';

import type {
  SubscriptionTierRecord,
  CreateSubscriptionTierInput,
  UpdateSubscriptionTierInput,
  UserSubscriptionRecord,
  CreateUserSubscriptionInput,
  UpdateUserSubscriptionInput,
  SubscriptionPaymentRecord,
  CreateSubscriptionPaymentInput,
  SubscriptionLimitsRecord,
  CreateSubscriptionLimitsInput,
  UpdateSubscriptionLimitsInput,
  SubscriptionHistoryRecord,
  CreateSubscriptionHistoryInput,
  UsageMetricRecord,
  CreateUsageMetricInput,
  UpdateUsageMetricInput,
  SubscriptionTier,
  SubscriptionStatus,
  BillingCycle,
  SubscriptionEventType,
  TriggeredBy,
  MetricType,
} from './subscription';

// Re-export all types from individual modules
export * from './user';
export * from './inventory-item';
export * from './listing';
export * from './marketplace-connection';
export * from './beta-invitation';
export * from './subscription';
export * from './supabase';

// Re-export specific types for convenience
export type {
  UserProfileRecord,
  UserProfilePublic,
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from './user';

export type {
  InventoryItemRecord,
  InventoryItemEnhanced,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  InventoryItemStatus,
  InventoryItemCondition,
  SizeType,
} from './inventory-item';

export type {
  ListingRecord,
  ActiveListingView,
  CreateListingInput,
  UpdateListingInput,
  ListingStatus,
  MarketplaceType,
  ListingFormat,
  ShippingMethod,
} from './listing';

export type {
  MarketplaceConnectionRecord,
  MarketplaceConnectionSafe,
  CreateMarketplaceConnectionInput,
  UpdateMarketplaceConnectionInput,
  ConnectionStatus,
  AuthMethod,
} from './marketplace-connection';

export type {
  BetaInvitationRecord,
  BetaInvitationEnhanced,
  BetaInvitationPublic,
  CreateBetaInvitationInput,
  UpdateBetaInvitationInput,
  BetaInvitationStatus,
} from './beta-invitation';

export type {
  SubscriptionTierRecord,
  CreateSubscriptionTierInput,
  UpdateSubscriptionTierInput,
  UserSubscriptionRecord,
  CreateUserSubscriptionInput,
  UpdateUserSubscriptionInput,
  SubscriptionPaymentRecord,
  CreateSubscriptionPaymentInput,
  SubscriptionLimitsRecord,
  CreateSubscriptionLimitsInput,
  UpdateSubscriptionLimitsInput,
  SubscriptionHistoryRecord,
  CreateSubscriptionHistoryInput,
  UsageMetricRecord,
  CreateUsageMetricInput,
  UpdateUsageMetricInput,
  SubscriptionTier,
  SubscriptionStatus,
  BillingCycle,
  SubscriptionEventType,
  TriggeredBy,
  MetricType,
} from './subscription';

// Database schema type (generated from Supabase)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfileRecord;
        Insert: CreateUserProfileInput & { id: string };
        Update: UpdateUserProfileInput;
      };
      inventory_items: {
        Row: InventoryItemRecord;
        Insert: CreateInventoryItemInput & { id?: string; user_id: string };
        Update: UpdateInventoryItemInput;
      };
      listings: {
        Row: ListingRecord;
        Insert: CreateListingInput & { id?: string; user_id: string };
        Update: UpdateListingInput;
      };
      marketplace_connections: {
        Row: MarketplaceConnectionRecord;
        Insert: CreateMarketplaceConnectionInput & { id?: string; user_id: string };
        Update: UpdateMarketplaceConnectionInput;
      };
      beta_invitations: {
        Row: BetaInvitationRecord;
        Insert: CreateBetaInvitationInput & { id?: string };
        Update: UpdateBetaInvitationInput;
      };
      subscription_tiers: {
        Row: SubscriptionTierRecord;
        Insert: CreateSubscriptionTierInput;
        Update: UpdateSubscriptionTierInput;
      };
      user_subscriptions: {
        Row: UserSubscriptionRecord;
        Insert: CreateUserSubscriptionInput;
        Update: UpdateUserSubscriptionInput;
      };
      subscription_payments: {
        Row: SubscriptionPaymentRecord;
        Insert: CreateSubscriptionPaymentInput;
        Update: Partial<CreateSubscriptionPaymentInput>;
      };
      subscription_limits: {
        Row: SubscriptionLimitsRecord;
        Insert: CreateSubscriptionLimitsInput;
        Update: UpdateSubscriptionLimitsInput;
      };
      subscription_history: {
        Row: SubscriptionHistoryRecord;
        Insert: CreateSubscriptionHistoryInput;
        Update: Partial<CreateSubscriptionHistoryInput>;
      };
      usage_metrics: {
        Row: UsageMetricRecord;
        Insert: CreateUsageMetricInput;
        Update: UpdateUsageMetricInput;
      };
      schema_migrations: {
        Row: {
          id: number;
          name: string;
          filename: string;
          checksum: string;
          executed_at: string;
          execution_time_ms: number;
          success: boolean;
          error_message: string | null;
          rollback_sql: string | null;
        };
        Insert: {
          name: string;
          filename: string;
          checksum: string;
          execution_time_ms: number;
          success?: boolean;
          error_message?: string;
          rollback_sql?: string;
        };
        Update: {
          name?: string;
          filename?: string;
          checksum?: string;
          execution_time_ms?: number;
          success?: boolean;
          error_message?: string;
          rollback_sql?: string;
        };
      };
    };
    Views: {
      user_profiles_public: {
        Row: UserProfilePublic;
      };
      inventory_items_enhanced: {
        Row: InventoryItemEnhanced;
      };
      active_listings: {
        Row: ActiveListingView;
      };
      marketplace_connections_safe: {
        Row: MarketplaceConnectionSafe;
      };
      beta_invitations_enhanced: {
        Row: BetaInvitationEnhanced;
      };
      beta_invitations_public: {
        Row: BetaInvitationPublic;
      };
    };
    Functions: {
      // User profile functions
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };

      // Inventory item functions
      calculate_days_in_inventory: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      soft_delete_inventory_item: {
        Args: { item_id: string };
        Returns: boolean;
      };
      validate_inventory_item_data: {
        Args: { item_id: string };
        Returns: { validation_passed: boolean; errors: string[] };
      };

      // Listing functions
      calculate_listing_profit: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      handle_listing_status_change: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      soft_delete_listing: {
        Args: { listing_id: string };
        Returns: boolean;
      };
      validate_listing_data: {
        Args: { listing_id: string };
        Returns: { validation_passed: boolean; errors: string[] };
      };

      // Marketplace connection functions
      encrypt_credentials: {
        Args: { data: any; encryption_key?: string };
        Returns: Uint8Array;
      };
      decrypt_credentials: {
        Args: { encrypted_data: Uint8Array; encryption_key?: string };
        Returns: any;
      };
      store_marketplace_credentials: {
        Args: {
          connection_id: string;
          credentials: any;
          refresh_token?: string;
          webhook_secret?: string;
        };
        Returns: boolean;
      };
      get_expiring_connections: {
        Args: { hours_threshold?: number };
        Returns: Array<{
          connection_id: string;
          user_id: string;
          marketplace_type: MarketplaceType;
          expires_in_hours: number;
        }>;
      };
      soft_delete_marketplace_connection: {
        Args: { connection_id: string };
        Returns: boolean;
      };
      update_connection_health: {
        Args: {
          connection_id: string;
          new_status: ConnectionStatus;
          status_msg?: string;
          response_time_ms?: number;
        };
        Returns: boolean;
      };

      // Subscription functions
      increment_usage: {
        Args: {
          subscription_id: string;
          field_name: string;
          increment_value: number;
        };
        Returns: void;
      };

      // System functions
      analyze_database_performance: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{
          table_name: string;
          total_rows: number;
          table_size: string;
          index_size: string;
          total_size: string;
          seq_scan: number;
          idx_scan: number;
        }>;
      };
      cleanup_old_deleted_records: {
        Args: { days_old?: number };
        Returns: Array<{
          table_name: string;
          records_deleted: number;
        }>;
      };

      // Utility functions
      exec_sql: {
        Args: { sql: string };
        Returns: undefined;
      };
      get_table_info: {
        Args: { table_name: string };
        Returns: any[];
      };
    };
    Enums: {
      inventory_item_status: InventoryItemStatus;
      inventory_item_condition: InventoryItemCondition;
      size_type: SizeType;
      listing_status: ListingStatus;
      marketplace_type: MarketplaceType;
      listing_format: ListingFormat;
      shipping_method: ShippingMethod;
      connection_status: ConnectionStatus;
      auth_method: AuthMethod;
      beta_invitation_status: BetaInvitationStatus;
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
      billing_cycle: BillingCycle;
      subscription_event_type: SubscriptionEventType;
      triggered_by: TriggeredBy;
      metric_type: MetricType;
    };
  };
}

// Type helpers for working with the database
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Utility types for common operations
export type DatabaseError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type DatabaseResponse<T> = {
  data: T | null;
  error: DatabaseError | null;
  count?: number | null;
  status: number;
  statusText: string;
};

export type PaginationOptions = {
  page?: number;
  limit?: number;
  offset?: number;
};

export type SortOptions<T> = {
  column: keyof T;
  ascending?: boolean;
};

export type FilterOptions<T> = Partial<T> & {
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
};

// Common query result types
export type QueryResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type SingleResult<T> = {
  data: T | null;
  found: boolean;
};

// Aggregation result types
export type CountResult = {
  count: number;
};

export type SumResult = {
  sum: number;
};

export type AverageResult = {
  average: number;
};

// Real-time subscription types
export type RealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  errors: string[] | null;
};

export type SubscriptionCallback<T> = (payload: RealtimePayload<T>) => void;

// Transaction types
export type TransactionCallback<T> = () => Promise<T>;
export type TransactionResult<T> = {
  success: boolean;
  data?: T;
  error?: DatabaseError;
};

// Validation result types
export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings?: string[];
};

// Health check types
export type DatabaseHealthCheck = {
  connected: boolean;
  latency_ms: number;
  version: string;
  migrations_current: boolean;
  last_migration?: string;
  timestamp: string;
};

// Import/Export types
export type ExportOptions = {
  tables?: string[];
  include_data?: boolean;
  format?: 'sql' | 'json' | 'csv';
};

export type ImportResult = {
  success: boolean;
  records_imported: number;
  errors: string[];
  warnings?: string[];
};

// Type guards for runtime type checking
export function isUserProfile(obj: any): obj is UserProfileRecord {
  return obj && typeof obj.id === 'string' && typeof obj.subscription_tier === 'string';
}

export function isInventoryItem(obj: any): obj is InventoryItemRecord {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string' && typeof obj.condition === 'string';
}

export function isListing(obj: any): obj is ListingRecord {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string' && typeof obj.marketplace_type === 'string';
}

export function isMarketplaceConnection(obj: any): obj is MarketplaceConnectionRecord {
  return obj && typeof obj.id === 'string' && typeof obj.marketplace_type === 'string' && typeof obj.connection_status === 'string';
}

// Default values and constants
export const DEFAULT_PAGINATION_LIMIT = 25;
export const MAX_PAGINATION_LIMIT = 100;

export const DEFAULT_USER_PROFILE: Partial<CreateUserProfileInput> = {
  preferred_currency: 'USD',
  preferred_timezone: 'America/New_York',
  email_notifications: true,
  push_notifications: true,
  marketing_emails: false,
  default_listing_duration: 30,
  auto_relist: false,
  country: 'US',
};

export const DEFAULT_INVENTORY_ITEM: Partial<CreateInventoryItemInput> = {
  condition: 'good',
  quantity: 1,
  needs_photography: true,
  needs_research: false,
  is_bundle: false,
  tags: [],
};

export const DEFAULT_LISTING: Partial<CreateListingInput> = {
  listing_format: 'fixed_price',
  currency: 'USD',
  quantity_available: 1,
  auto_relist: false,
  shipping_method: 'calculated',
  free_shipping: false,
  expedited_shipping: false,
  international_shipping: false,
  handling_time: 1,
  promoted: false,
  tags: [],
};

export const DEFAULT_MARKETPLACE_CONNECTION: Partial<CreateMarketplaceConnectionInput> = {
  auto_sync_enabled: true,
  sync_frequency_minutes: 60,
  listing_auto_end: false,
  default_handling_time: 1,
  default_payment_methods: [],
  webhook_events: [],
};