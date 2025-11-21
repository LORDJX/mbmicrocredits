import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Singleton Supabase client for browser-side operations.
 * This ensures only one instance is created and reused across the application,
 * preventing multiple GoTrueClient instances and improving performance.
 */
let supabaseClient: SupabaseClient | null = null

/**
 * Get or create the singleton Supabase client instance.
 * Use this in client components instead of createClient() to avoid multiple instances.
 */
export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}

/**
 * Reset the singleton instance.
 * Useful for testing or when you need to force a new client instance.
 */
export function resetSupabaseClient() {
  supabaseClient = null
}
