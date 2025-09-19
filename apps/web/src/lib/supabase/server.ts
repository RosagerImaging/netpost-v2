/**
 * Supabase server configuration for server-side operations
 * Provides a configured Supabase client instance for API routes and server components
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // For server-side operations, use the same client as client-side for now
  // In production, you might want to use service role key for server operations
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}