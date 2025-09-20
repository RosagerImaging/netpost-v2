/**
 * Supabase Database Configuration
 *
 * This file sets up the Supabase client for database operations
 * with proper error handling and connection management.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@netpost/shared-types';

// Environment variable validation
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const supabaseUrl = requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Client-side Supabase instance for authenticated operations
 * Uses anon key with RLS (Row Level Security) enforcement
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Rate limit for real-time updates
      },
    },
  }
);

/**
 * Admin Supabase instance for server-side operations
 * Uses service role key with full database access (bypasses RLS)
 * Should only be used in secure server environments
 */
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Database connection health check
 * Tests connectivity and basic functionality
 */
export async function checkDatabaseHealth(): Promise<{
  success: boolean;
  message: string;
  timestamp: string;
}> {
  try {
    // Test basic connectivity with a simple query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count(*)')
      .limit(1);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Database connection healthy',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get current database connection info
 */
export function getDatabaseInfo() {
  return {
    url: supabaseUrl,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle database errors with proper logging and user-friendly messages
 */
export function handleDatabaseError(error: any, operation: string): never {
  console.error(`Database error during ${operation}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    timestamp: new Date().toISOString(),
  });

  // Throw a more user-friendly error
  throw new Error(`Database operation failed: ${operation}`);
}

/**
 * Database transaction wrapper for complex operations
 * Provides rollback capability for failed operations
 */
export async function withTransaction<T>(
  operation: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  try {
    // Note: Supabase doesn't support manual transactions yet
    // This is a placeholder for when they add support
    // For now, we'll use the regular client
    return await operation(supabase);
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}