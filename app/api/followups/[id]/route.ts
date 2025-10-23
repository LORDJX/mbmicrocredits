import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { UpdateFollowUpData } from "@/lib/types/followups"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data, error } = await supabase.from("v_follow_ups").select("*").eq("id", params.id).single()

    if (error) {
      console.error("[v0] Error fetching follow-up:", error)
      return NextResponse.json({ error: "Seguimiento no encontrado" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in GET /api/followups/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body: UpdateFollowUpData = await request.json()

    const updateData: any = {}
    if (body.client_id !== undefined) updateData.client_id = body.client_id
    if (body.date !== undefined) updateData.date = body.date
    if (body.reminder_date !== undefined) updateData.reminder_date = body.reminder_date
    if (body.notes !== undefined) updateData.notes = body.notes
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("follow_ups").update(updateData).eq("id", params.id).select().single()

    if (error) {
      console.error("[v0] Error updating follow-up:", error)
      return NextResponse.json({ error: "Error al actualizar seguimiento" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in PATCH /api/followups/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { error } = await supabase.from("follow_ups").delete().eq("id", params.id)

    if (error) {
      console.error("[v0] Error deleting follow-up:", error)
      return NextResponse.json({ error: "Error al eliminar seguimiento" }, { status: 500 })
    }

    return NextResponse.json({ message: "Seguimiento eliminado exitosamente" })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/followups/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
