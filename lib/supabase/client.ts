// Implementación completamente independiente para v0 runtime
// No usa ningún paquete de Supabase para evitar errores de importación

export function createClient() {
  console.log("[v0] Using completely independent mock browser client - no Supabase dependencies")

  return {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: null },
          error: null,
        }),
      getSession: () =>
        Promise.resolve({
          data: { session: null },
          error: null,
        }),
      signInWithPassword: (credentials: any) => {
        console.log("[v0] Mock login attempt:", credentials.email)
        // Simular login exitoso para demo
        const mockUser = {
          id: "mock-user-id",
          email: credentials.email,
          user_metadata: { full_name: credentials.email.split("@")[0] },
        }

        return Promise.resolve({
          data: {
            user: mockUser,
            session: {
              user: mockUser,
              access_token: "mock-token",
              expires_at: Date.now() + 24 * 60 * 60 * 1000,
            },
          },
          error: null,
        })
      },
      signOut: () => {
        console.log("[v0] Mock sign out")
        return Promise.resolve({ error: null })
      },
      onAuthStateChange: (callback: any) => {
        console.log("[v0] Mock auth state change listener registered")
        return {
          data: { subscription: { unsubscribe: () => console.log("[v0] Mock auth listener unsubscribed") } },
        }
      },
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) =>
          Promise.resolve({
            data: null,
            error: { message: "Mock database client not available in v0 runtime" },
          }),
      }),
    }),
  }
}
