import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect("/dashboard")
    } else {
      redirect("/auth/login")
    }
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    // Fallback: redirect to login if client can't be created
    redirect("/auth/login")
  }
}
