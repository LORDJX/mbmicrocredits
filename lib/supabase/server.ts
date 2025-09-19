export function createAdminClient() {
  // Mock implementation since Supabase client library isn't available in v0 runtime
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        in: (column: string, values: string[]) => ({
          data: null,
          error: new Error("Supabase client not available in v0 runtime"),
        }),
      }),
    }),
  }
}

export function createClient() {
  // Mock implementation for regular client
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        data: null,
        error: new Error("Supabase client not available in v0 runtime"),
      }),
    }),
  }
}
