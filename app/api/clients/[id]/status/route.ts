import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { status } = await request.json()

    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido. Debe ser 'active' o 'inactive'" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("clients")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating client status:", error)
      return NextResponse.json({ error: "Error al actualizar estado del cliente" }, { status: 500 })
    }

    return NextResponse.json({ success: true, client: data })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/clients/[id]/status:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
