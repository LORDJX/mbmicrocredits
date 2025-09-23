// Cliente Supabase simplificado para v0
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export class SimpleSupabaseClient {
  private url: string
  private key: string

  constructor(url: string, key: string) {
    this.url = url
    this.key = key
  }

  async signInWithPassword(email: string, password: string) {
    try {
      const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.key,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { data: null, error: { message: data.error_description || "Login failed" } }
      }

      return { data: { user: data.user, session: data }, error: null }
    } catch (error) {
      return { data: null, error: { message: "Network error" } }
    }
  }

  async signOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("supabase_session")
    }
    return { error: null }
  }

  async getUser() {
    if (typeof window === "undefined") {
      return { data: { user: null }, error: null }
    }

    const session = localStorage.getItem("supabase_session")
    if (!session) {
      return { data: { user: null }, error: null }
    }

    try {
      const sessionData = JSON.parse(session)
      return { data: { user: sessionData.user }, error: null }
    } catch {
      return { data: { user: null }, error: null }
    }
  }
}

export const supabase = new SimpleSupabaseClient(supabaseUrl, supabaseAnonKey)
