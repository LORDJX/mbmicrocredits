import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
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

    // Actualizar todos los clientes a estado activo
    const { error: updateError } = await supabase.from("clients").update({ status: "active" }).neq("status", "active")

    if (updateError) {
      console.error("[v0] Error activating clients:", updateError)
      return NextResponse.json({ error: "Error al activar clientes", details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Todos los clientes han sido activados correctamente",
    })
  } catch (error) {
    console.error("[v0] Error in bulk activate:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
