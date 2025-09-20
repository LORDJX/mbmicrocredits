"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
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
          localStorage.removeItem("mb_session")
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        setUser(null)
        localStorage.removeItem("mb_session")
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
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
        localStorage.removeItem("mb_session")
        if (event === "SIGNED_OUT") {
          router.push("/login")
        }
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem("mb_session")
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      localStorage.removeItem("mb_session")
      router.push("/login")
    }
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
