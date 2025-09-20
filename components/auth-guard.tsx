"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        // Verificar sesión de Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setIsAuthenticated(true)
          // Sincronizar con localStorage para compatibilidad
          const localSession = {
            user: {
              email: session.user.email,
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email,
            },
            expires: Date.now() + 24 * 60 * 60 * 1000,
          }
          localStorage.setItem("mb_session", JSON.stringify(localSession))
        } else {
          // Verificar sesión local como fallback
          const localSession = localStorage.getItem("mb_session")
          if (localSession) {
            try {
              const session = JSON.parse(localSession)
              if (session.expires > Date.now()) {
                setIsAuthenticated(true)
                return
              }
            } catch (e) {
              console.error("Error parsing local session:", e)
            }
          }

          setIsAuthenticated(false)
          router.push("/login")
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsAuthenticated(false)
        router.push("/login")
      }
    }

    checkAuth()

    // Escuchar cambios de autenticación
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setIsAuthenticated(false)
        localStorage.removeItem("mb_session")
        router.push("/login")
      } else if (session) {
        setIsAuthenticated(true)
        const localSession = {
          user: {
            email: session.user.email,
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email,
          },
          expires: Date.now() + 24 * 60 * 60 * 1000,
        }
        localStorage.setItem("mb_session", JSON.stringify(localSession))
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // El router redirigirá al login
  }

  return <>{children}</>
}
