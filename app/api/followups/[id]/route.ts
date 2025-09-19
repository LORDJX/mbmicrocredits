import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

function jsonError(message: string, status = 500, error?: unknown) {
  return NextResponse.json({ message, error }, { status })
}

// GET /api/followups/:id
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("follow_ups")
      .select("id, client_id, date, notes, reminder_date, created_at, updated_at, client:clients(*)")
      .eq("id", params.id)
      .single()

    if (error) {
      return jsonError("Error al obtener el seguimiento", 500, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return jsonError("Excepción en GET /api/followups/:id", 500, err?.message ?? String(err))
  }
}

// PATCH /api/followups/:id
// Campos permitidos: client_id (uuid), date (YYYY-MM-DD), notes (string|null), reminder_date (string|null)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const updates: Record<string, unknown> = {}

    if (Object.prototype.hasOwnProperty.call(body, "client_id")) {
      const v = String(body.client_id ?? "").trim()
      if (!v) return jsonError("client_id no puede ser vacío.", 400)
      updates.client_id = v
    }
    if (Object.prototype.hasOwnProperty.call(body, "date")) {
      if (body.date === null || String(body.date).trim() === "") {
        return jsonError("date no puede ser nulo ni vacío.", 400)
      }
      updates.date = String(body.date).trim()
    }
    if (Object.prototype.hasOwnProperty.call(body, "notes")) {
      updates.notes = body.notes ?? null
    }
    if (Object.prototype.hasOwnProperty.call(body, "reminder_date")) {
      updates.reminder_date =
        body.reminder_date === "" || body.reminder_date === undefined ? null : String(body.reminder_date)
    }

    updates.updated_at = new Date().toISOString()

    if (Object.keys(updates).length === 1 && "updated_at" in updates) {
      return jsonError("No hay campos para actualizar.", 400)
    }

    const { data, error } = await supabase
      .from("follow_ups")
      .update(updates)
      .eq("id", params.id)
      .select("id, client_id, date, notes, reminder_date, created_at, updated_at")
      .single()

    if (error) {
      return jsonError("Error al actualizar el seguimiento", 500, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return jsonError("Excepción en PATCH /api/followups/:id", 500, err?.message ?? String(err))
  }
}

// DELETE /api/followups/:id
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("follow_ups").delete().eq("id", params.id)

    if (error) {
      return jsonError("Error al eliminar el seguimiento", 500, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      })
    }

    return NextResponse.json({ message: "Seguimiento eliminado correctamente" })
  } catch (err: any) {
    return jsonError("Excepción en DELETE /api/followups/:id", 500, err?.message ?? String(err))
  }
}
