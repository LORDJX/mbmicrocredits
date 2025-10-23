import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { status } = await request.json()

    if (!status || !["active", "cancelled", "completed"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("loans")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating loan status:", error)
      return NextResponse.json({ error: "Error al actualizar estado del préstamo" }, { status: 500 })
    }

    return NextResponse.json({ success: true, loan: data })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/loans/[id]/status:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
