/**
 * Supabase client configuration for client-side operations
 * Provides a configured Supabase client instance for React components
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Create Supabase client for client-side operations
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Create a singleton client instance
export const supabase = createClient()