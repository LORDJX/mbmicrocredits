import { supabase } from "@/lib/supabaseClient"

export interface User {
  id: string
  email: string
  name: string
}

export interface AuthSession {
  user: User
  expires: number
  type: "mock" | "supabase"
}

class AuthService {
  private readonly MOCK_CREDENTIALS = {
    email: "admin@mb.com",
    password: "admin123",
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    try {
      // Try mock authentication first
      if (email === this.MOCK_CREDENTIALS.email && password === this.MOCK_CREDENTIALS.password) {
        const session: AuthSession = {
          user: { email, id: "1", name: "Admin User" },
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          type: "mock",
        }
        localStorage.setItem("mb_session", JSON.stringify(session))
        return { success: true, session }
      }

      // Try Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        const session: AuthSession = {
          user: {
            email: data.user.email || email,
            id: data.user.id,
            name: data.user.user_metadata?.name || "User",
          },
          expires: Date.now() + 24 * 60 * 60 * 1000,
          type: "supabase",
        }
        localStorage.setItem("mb_session", JSON.stringify(session))
        return { success: true, session }
      }

      return { success: false, error: "Invalid credentials" }
    } catch (error) {
      return { success: false, error: "Authentication failed" }
    }
  }

  async logout(): Promise<void> {
    try {
      const session = this.getSession()

      // Clear local session first
      localStorage.removeItem("mb_session")

      // If it was a Supabase session, also sign out from Supabase
      if (session?.type === "supabase") {
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Always clear local session even if Supabase logout fails
      localStorage.removeItem("mb_session")
    }
  }

  getSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem("mb_session")
      if (!sessionData) return null

      const session: AuthSession = JSON.parse(sessionData)

      // Check if session is expired
      if (Date.now() > session.expires) {
        localStorage.removeItem("mb_session")
        return null
      }

      return session
    } catch (error) {
      localStorage.removeItem("mb_session")
      return null
    }
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null
  }

  getCurrentUser(): User | null {
    const session = this.getSession()
    return session?.user || null
  }
}

export const authService = new AuthService()
