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
      flowType: "pkce",
    },
  })
} else {
  // Cliente mock mejorado para desarrollo sin configuración
  supabase = {
    auth: {
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: "Supabase no configurado - usando modo desarrollo" },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: "Supabase no configurado - usando modo desarrollo" },
      }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      refreshSession: async () => ({
        data: { session: null, user: null },
        error: { message: "No hay sesión activa en modo desarrollo" },
      }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {},
            id: "mock-subscription",
          },
        },
      }),
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: { message: "Supabase no configurado" } }),
      update: () => Promise.resolve({ data: null, error: { message: "Supabase no configurado" } }),
      delete: () => Promise.resolve({ data: null, error: { message: "Supabase no configurado" } }),
    }),
  }

  console.warn("⚠️ Supabase no configurado. Usando cliente mock para desarrollo.")
}

export { supabase }
