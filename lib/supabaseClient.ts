"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: any = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
} else {
  // Cliente mock simple para desarrollo
  supabase = {
    auth: {
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: "Supabase no configurado" },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: "Supabase no configurado" },
      }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: { message: "Supabase no configurado" } }),
      update: () => Promise.resolve({ data: null, error: { message: "Supabase no configurado" } }),
      delete: () => Promise.resolve({ data: null, error: { message: "Supabase no configurado" } }),
    }),
  }
}

export { supabase }
