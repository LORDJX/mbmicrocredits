"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: any = null

if (supabaseUrl && supabaseAnonKey) {
  if (typeof window !== "undefined") {
    try {
      // Limpiar tokens específicos de Supabase que pueden estar corruptos
      const supabaseKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith("sb-") || key.includes("supabase") || key.includes("auth-token"),
      )

      supabaseKeys.forEach((key) => {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            const parsed = JSON.parse(value)
            // Verificar si el token tiene estructura válida
            if (parsed && typeof parsed === "object" && parsed.refresh_token) {
              // Verificar si el refresh_token no está expirado
              if (parsed.expires_at && new Date(parsed.expires_at * 1000) < new Date()) {
                console.warn(`Token expirado removido: ${key}`)
                localStorage.removeItem(key)
              }
            }
          }
        } catch (e) {
          console.warn(`Token corrupto removido: ${key}`)
          localStorage.removeItem(key)
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
      onRefreshTokenError: async (error) => {
        console.warn("Error refrescando token:", error)
        // Limpiar toda la sesión cuando hay error de refresh
        try {
          await supabase.auth.signOut({ scope: "local" })
          if (typeof window !== "undefined") {
            // Limpiar todos los tokens de Supabase
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith("sb-") || key.includes("supabase")) {
                localStorage.removeItem(key)
              }
            })
          }
        } catch (cleanupError) {
          console.warn("Error limpiando sesión:", cleanupError)
        }
      },
    },
  })

  const originalGetSession = supabase.auth.getSession
  supabase.auth.getSession = async (...args: any[]) => {
    try {
      return await originalGetSession.apply(supabase.auth, args)
    } catch (error: any) {
      if (error?.message?.includes("Invalid Refresh Token") || error?.message?.includes("Refresh Token Not Found")) {
        console.warn("Sesión inválida detectada, limpiando...")
        await supabase.auth.signOut({ scope: "local" })
        return { data: { session: null }, error: null }
      }
      throw error
    }
  }

  const originalRefreshSession = supabase.auth.refreshSession
  supabase.auth.refreshSession = async (...args: any[]) => {
    try {
      return await originalRefreshSession.apply(supabase.auth, args)
    } catch (error: any) {
      if (error?.message?.includes("Invalid Refresh Token") || error?.message?.includes("Refresh Token Not Found")) {
        console.warn("Token de refresh inválido, limpiando sesión...")
        await supabase.auth.signOut({ scope: "local" })
        return { data: { session: null, user: null }, error: null }
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
