"use client"

import { createClient } from "@supabase/supabase-js"

console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Definida" : "✗ No definida")
console.log("[v0] Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Definida" : "✗ No definida")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error("[v0] NEXT_PUBLIC_SUPABASE_URL no está definida")
}
if (!supabaseAnonKey) {
  console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida")
}

let supabase: any = null

if (supabaseUrl && supabaseAnonKey) {
  console.log("[v0] Creando cliente de Supabase con configuración válida")
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
} else {
  console.warn("[v0] Variables de entorno faltantes, usando cliente mock")
  supabase = {
    auth: {
      signInWithPassword: async () => {
        console.error("[v0] Intento de login con cliente mock - Supabase no configurado")
        return {
          data: { user: null, session: null },
          error: {
            message:
              "Sistema en modo desarrollo. Contacta al administrador.\n\n⚠️ Supabase no configurado. Usando cliente mock para desarrollo",
          },
        }
      },
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: "Sistema en modo desarrollo. Contacta al administrador." },
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
      insert: () => Promise.resolve({ data: null, error: { message: "Sistema en modo desarrollo" } }),
      update: () => Promise.resolve({ data: null, error: { message: "Sistema en modo desarrollo" } }),
      delete: () => Promise.resolve({ data: null, error: { message: "Sistema en modo desarrollo" } }),
    }),
  }
}

export { supabase }
