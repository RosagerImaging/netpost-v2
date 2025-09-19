/**
 * Supabase module index
 * Re-exports client and server Supabase configurations
 */

export { createClient as createClientClient, supabase } from './client'
export { createClient as createServerClient } from './server'