// Implementación completamente independiente para v0 runtime
// No usa ningún paquete de Supabase para evitar errores de importación

export function createClient() {
  console.log("[v0] Using completely independent mock client - no Supabase dependencies")

  return {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: null },
          error: null,
        }),
      signInWithPassword: (credentials: any) =>
        Promise.resolve({
          data: null,
          error: { message: "Mock client - authentication not available in v0 runtime" },
        }),
      signOut: () =>
        Promise.resolve({
          error: null,
        }),
      exchangeCodeForSession: (code: string) =>
        Promise.resolve({
          error: { message: "Mock client - code exchange not available in v0 runtime" },
        }),
      onAuthStateChange: (callback: any) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) =>
          Promise.resolve({
            data: null,
            error: { message: "Mock database client not available in v0 runtime" },
          }),
        in: (column: string, values: string[]) =>
          Promise.resolve({
            data: null,
            error: { message: "Mock database client not available in v0 runtime" },
          }),
        order: (column: string, options: any) =>
          Promise.resolve({
            data: null,
            error: { message: "Mock database client not available in v0 runtime" },
          }),
      }),
      insert: (data: any) =>
        Promise.resolve({
          data: null,
          error: { message: "Mock client - insert not available in v0 runtime" },
        }),
      update: (data: any) =>
        Promise.resolve({
          data: null,
          error: { message: "Mock client - update not available in v0 runtime" },
        }),
      delete: () =>
        Promise.resolve({
          data: null,
          error: { message: "Mock client - delete not available in v0 runtime" },
        }),
    }),
  }
}

export function createAdminClient() {
  console.log("[v0] Using mock admin client - no Supabase dependencies")
  return createClient()
}

// Alias for compatibility
export const createSupabaseClient = createClient
