import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("[SERVER] Missing Supabase environment variables")
    console.error("[SERVER] SUPABASE_URL:", !!process.env.SUPABASE_URL)
    console.error("[SERVER] NEXT_PUBLIC_SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.error("[SERVER] SUPABASE_ANON_KEY:", !!process.env.SUPABASE_ANON_KEY)
    console.error("[SERVER] NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    throw new Error("Supabase environment variables are not configured")
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
