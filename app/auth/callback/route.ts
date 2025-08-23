import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // next parameter is used by Supabase for password reset flow
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If 'next' is provided (e.g., from password reset), redirect there.
      // Otherwise, redirect to dashboard.
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error("Error en callback de autenticación:", error)
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
