/**
 * Supabase Database Type Definitions
 *
 * This file contains the complete database schema types for Supabase TypeScript client.
 * It includes all tables referenced in the application with proper typing.
 */

import type { BetaInvitationRecord, CreateBetaInvitationInput, UpdateBetaInvitationInput } from './beta-invitation';
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
} from './subscription';

/**
 * Database schema definition for Supabase
 */
export interface Database {
  public: {
    Tables: {
      // Beta invitations table
      beta_invitations: {
        Row: BetaInvitationRecord;
        Insert: CreateBetaInvitationInput;
        Update: UpdateBetaInvitationInput;
        Relationships: [
          {
            foreignKeyName: "beta_invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      // Subscription tiers table
      subscription_tiers: {
        Row: SubscriptionTierRecord;
        Insert: CreateSubscriptionTierInput;
        Update: UpdateSubscriptionTierInput;
        Relationships: [];
      };

      // User subscriptions table
      user_subscriptions: {
        Row: UserSubscriptionRecord;
        Insert: CreateUserSubscriptionInput;
        Update: UpdateUserSubscriptionInput;
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_subscriptions_tier_id_fkey";
            columns: ["tier_id"];
            isOneToOne: false;
            referencedRelation: "subscription_tiers";
            referencedColumns: ["id"];
          }
        ];
      };

      // Subscription payments table
      subscription_payments: {
        Row: SubscriptionPaymentRecord;
        Insert: CreateSubscriptionPaymentInput;
        Update: Partial<CreateSubscriptionPaymentInput>;
        Relationships: [
          {
            foreignKeyName: "subscription_payments_stripe_subscription_id_fkey";
            columns: ["stripe_subscription_id"];
            isOneToOne: false;
            referencedRelation: "user_subscriptions";
            referencedColumns: ["stripe_subscription_id"];
          }
        ];
      };

      // Subscription limits table
      subscription_limits: {
        Row: SubscriptionLimitsRecord;
        Insert: CreateSubscriptionLimitsInput;
        Update: UpdateSubscriptionLimitsInput;
        Relationships: [
          {
            foreignKeyName: "subscription_limits_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: true;
            referencedRelation: "user_subscriptions";
            referencedColumns: ["id"];
          }
        ];
      };

      // Subscription history table
      subscription_history: {
        Row: SubscriptionHistoryRecord;
        Insert: CreateSubscriptionHistoryInput;
        Update: Partial<CreateSubscriptionHistoryInput>;
        Relationships: [
          {
            foreignKeyName: "subscription_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscription_history_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "user_subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscription_history_from_tier_id_fkey";
            columns: ["from_tier_id"];
            isOneToOne: false;
            referencedRelation: "subscription_tiers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscription_history_to_tier_id_fkey";
            columns: ["to_tier_id"];
            isOneToOne: false;
            referencedRelation: "subscription_tiers";
            referencedColumns: ["id"];
          }
        ];
      };

      // Usage metrics table
      usage_metrics: {
        Row: UsageMetricRecord;
        Insert: CreateUsageMetricInput;
        Update: UpdateUsageMetricInput;
        Relationships: [
          {
            foreignKeyName: "usage_metrics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_metrics_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "user_subscriptions";
            referencedColumns: ["id"];
          }
        ];
      };

      // Users table (reference for relationships)
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      // Custom RPC function for incrementing usage
      increment_usage: {
        Args: {
          subscription_id: string;
          field_name: string;
          increment_value: number;
        };
        Returns: void;
      };
    };
    Enums: {
      subscription_tier: "basic" | "pro" | "enterprise";
      subscription_status: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
      billing_cycle: "monthly" | "yearly";
      subscription_event_type: "created" | "upgraded" | "downgraded" | "canceled" | "renewed" | "payment_failed" | "reactivated";
      triggered_by: "user" | "admin" | "system" | "stripe";
      metric_type: "inventory_items" | "listings_created" | "api_calls" | "storage_used" | "marketplace_connections" | "photos_uploaded";
      beta_invitation_status: "active" | "expired" | "used" | "disabled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

/**
 * Type helper for Supabase client with proper database typing
 */
export type TypedSupabaseClient = import('@supabase/supabase-js').SupabaseClient<Database>;

/**
 * Type helper for Supabase server client with proper database typing
 */
export type TypedSupabaseServerClient = import('@supabase/supabase-js').SupabaseClient<Database>;