"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: any = null

if (supabaseUrl && supabaseAnonKey) {
  if (typeof window !== "undefined") {
    try {
      // Limpiar cualquier token corrupto de localStorage
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              JSON.parse(value) // Verificar si es JSON válido
            }
          } catch (e) {
            console.warn(`Limpiando token corrupto: ${key}`)
            localStorage.removeItem(key)
          }
        }
      })
    } catch (e) {
      console.warn("Error limpiando tokens:", e)
    }
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      onRefreshTokenError: (error) => {
        console.warn("Error refrescando token:", error)
        // Limpiar sesión corrupta
        if (typeof window !== "undefined") {
          localStorage.removeItem(`sb-${supabaseUrl.split("//")[1]?.split(".")[0]}-auth-token`)
        }
      },
    },
  })

  const originalRefreshSession = supabase.auth.refreshSession
  supabase.auth.refreshSession = async (...args: any[]) => {
    try {
      return await originalRefreshSession.apply(supabase.auth, args)
    } catch (error: any) {
      if (error?.message?.includes("Invalid Refresh Token") || error?.message?.includes("Refresh Token Not Found")) {
        console.warn("Token de refresh inválido, limpiando sesión...")
        await supabase.auth.signOut()
        if (typeof window !== "undefined") {
          window.location.reload()
        }
      }
      throw error
    }
  }
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
