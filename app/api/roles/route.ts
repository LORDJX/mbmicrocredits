import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: roles, error } = await supabase.from("user_roles").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching roles:", error)
      return NextResponse.json({ error: "Error al obtener roles" }, { status: 500 })
    }

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error in GET /api/roles:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "El nombre del rol es requerido" }, { status: 400 })
    }

    const { data: newRole, error } = await supabase.from("user_roles").insert({ name, description }).select().single()

    if (error) {
      console.error("Error creating role:", error)
      return NextResponse.json({ error: "Error al crear rol" }, { status: 500 })
    }

    return NextResponse.json({ role: newRole }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/roles:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
