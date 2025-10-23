import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient, User } from "@supabase/supabase-js"

export interface AuthenticatedRequest {
  user: User
  supabase: SupabaseClient
}

type AuthenticatedHandler = (request: NextRequest, auth: AuthenticatedRequest) => Promise<NextResponse> | NextResponse

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const supabase = await createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
      }

      return await handler(request, { user, supabase })
    } catch (error) {
      console.error("Error in withAuth middleware:", error)
      return NextResponse.json(
        {
          error: "Error de autenticación",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  }
}
