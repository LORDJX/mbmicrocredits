// Mock Supabase server client for v0 runtime compatibility
export function createAdminClient() {
  console.log("[v0] Using mock Supabase admin client - real Supabase client not available in v0 runtime")

  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        in: (column: string, values: string[]) =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase client not available in v0 runtime" },
          }),
        order: (column: string, options: any) =>
          Promise.resolve({
            data: null,
            error: { message: "Supabase client not available in v0 runtime" },
          }),
      }),
      order: (column: string, options: any) =>
        Promise.resolve({
          data: null,
          error: { message: "Supabase client not available in v0 runtime" },
        }),
    }),
  }
}

export function createSupabaseClient() {
  console.log("[v0] Using mock Supabase client - real Supabase client not available in v0 runtime")

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Mock client" } }),
      signOut: () => Promise.resolve({ error: null }),
      exchangeCodeForSession: () => Promise.resolve({ error: { message: "Mock client" } }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }
}

// Export createClient as alias for createSupabaseClient
export const createClient = createSupabaseClient
