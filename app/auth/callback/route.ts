import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-mock"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // next parameter is used by Supabase for password reset flow
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error || error.message.includes("Mock client")) {
        console.log("[v0] Mock auth callback - simulating successful authentication")

        // Simular sesión exitosa en localStorage para compatibilidad
        const mockUser = {
          email: "demo@example.com",
          id: "mock-user-id",
          name: "Demo User",
        }

        // En un entorno real, esto se manejaría por Supabase
        // Aquí solo redirigimos al dashboard
        return NextResponse.redirect(`${origin}${next}`)
      }

      console.error("Error en callback de autenticación:", error)
    } catch (error) {
      console.error("Error en callback de autenticación:", error)
      console.log("[v0] Mock auth callback - redirecting to dashboard despite error")
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
