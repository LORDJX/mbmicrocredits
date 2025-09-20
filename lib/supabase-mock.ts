// Mock Supabase implementation for v0 runtime compatibility
// Provides all necessary exports without external dependencies

export function createClient() {
  console.log("[v0] Using mock Supabase client - real Supabase not available in v0 runtime")

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Mock client" } }),
      signOut: () => Promise.resolve({ error: null }),
      exchangeCodeForSession: (code: string) =>
        Promise.resolve({
          data: { user: { id: "mock-user", email: "test@example.com" }, session: { access_token: "mock-token" } },
          error: null,
        }),
      onAuthStateChange: (callback: any) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
        in: (column: string, values: string[]) =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase client not available in v0 runtime" },
          }),
      }),
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: (columns?: string) => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      delete: () =>
        Promise.resolve({
          data: null,
          error: { message: "Mock client - delete not available in v0 runtime" },
        }),
      order: (column: string, options: any) =>
        Promise.resolve({
          data: null,
          error: { message: "Supabase client not available in v0 runtime" },
        }),
    }),
  }
}

export function createAdminClient() {
  console.log("[v0] Using mock admin client")
  return createClient()
}

export function createSupabaseClient() {
  console.log("[v0] Using mock Supabase client alias")
  return createClient()
}

// Default export for compatibility
export default createClient
