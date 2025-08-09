import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServerClient"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // next parameter is used by Supabase for password reset flow
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If 'next' is provided (e.g., from password reset), redirect there.
      // Otherwise, redirect to dashboard.
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
