import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/utils/auth-helpers"

export async function POST() {
  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) {
    return NextResponse.json({ error: adminCheck.message }, { status: adminCheck.status })
  }

  try {
    const supabase = await createClient()

    // Actualizar todos los clientes a estado activo
    const { error: updateError } = await supabase.from("clients").update({ status: "active" }).neq("status", "active")

    if (updateError) {
      console.error("Error activating clients:", updateError)
      return NextResponse.json({ error: "Error al activar clientes", details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Todos los clientes han sido activados correctamente",
    })
  } catch (error) {
    console.error("Error in bulk activate:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
