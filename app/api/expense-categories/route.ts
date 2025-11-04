import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/utils/auth-helpers"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data, error } = await supabase.from("expense_categories").select("*").eq("is_active", true).order("name")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/expense-categories:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Verify admin permissions
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) {
    return NextResponse.json({ error: adminCheck.message }, { status: adminCheck.status })
  }

  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("expense_categories").insert(body).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/expense-categories:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
