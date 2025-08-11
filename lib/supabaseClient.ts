"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: any = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Cliente mock para desarrollo sin configuración
  supabase = {
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: "Supabase no configurado" } }),
      signUp: async () => ({ data: null, error: { message: "Supabase no configurado" } }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: "Supabase no configurado" } }),
      update: () => ({ data: null, error: { message: "Supabase no configurado" } }),
      delete: () => ({ data: null, error: { message: "Supabase no configurado" } }),
    }),
  }

  console.warn("⚠️ Supabase no configurado. Usando cliente mock para desarrollo.")
}

export { supabase }
