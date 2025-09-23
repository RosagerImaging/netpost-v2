/**
 * Supabase Client Type Configuration
 *
 * This file provides properly typed Supabase clients with full database schema.
 * Import these typed clients instead of the generic ones to get full type safety.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@netpost/shared-types';

/**
 * Type for the properly typed Supabase client
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Type for the properly typed Supabase server client
 * Note: Using SupabaseClient type from @supabase/supabase-js for server client too
 */
export type TypedSupabaseServerClient = SupabaseClient<Database>;

/**
 * Create a typed Supabase client for browser usage
 */
export function createTypedSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string
): TypedSupabaseClient {
  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Create a typed Supabase server client for SSR usage
 */
export function createTypedSupabaseServerClient(
  supabaseUrl: string,
  supabaseKey: string,
  cookieStore: any
): TypedSupabaseServerClient {
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: cookieStore,
  }) as TypedSupabaseServerClient;
}

/**
 * Type helper for table operations
 */
export type TableName = keyof Database['public']['Tables'];

/**
 * Type helper for getting table row type
 */
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

/**
 * Type helper for getting table insert type
 */
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];

/**
 * Type helper for getting table update type
 */
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

/**
 * Type helper for RPC function names
 */
export type RPCFunctionName = keyof Database['public']['Functions'];

/**
 * Type helper for getting RPC function arguments
 */
export type RPCArgs<T extends RPCFunctionName> = Database['public']['Functions'][T]['Args'];

/**
 * Type helper for getting RPC function returns
 */
export type RPCReturns<T extends RPCFunctionName> = Database['public']['Functions'][T]['Returns'];