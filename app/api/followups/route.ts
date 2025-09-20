import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

function jsonError(message: string, status = 500, error?: unknown) {
  return NextResponse.json({ message, error }, { status })
}

/**
 * GET /api/followups
 * Query opcional: ?client_id=...
 * Devuelve los seguimientos con el cliente embebido como { client: {...} }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get("client_id") || undefined

    // Relación basada en FK follow_ups.client_id -> clients.id
    let query = supabase
      .from("follow_ups")
      .select("id, client_id, date, notes, reminder_date, created_at, updated_at, client:clients(*)")
      .order("created_at", { ascending: false })

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    const { data, error } = await query

    if (error) {
      return jsonError("Error al obtener seguimientos desde Supabase", 500, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      })
    }

    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return jsonError("Excepción en GET /api/followups", 500, err?.message ?? String(err))
  }
}

/**
 * POST /api/followups
 * Body: { client_id: uuid, date: string(YYYY-MM-DD), notes?: string, reminder_date?: string | null }
 * En el esquema, date y client_id son NOT NULL
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const client_id = String(body?.client_id ?? "").trim()
    const date = String(body?.date ?? "").trim()
    const notes = body?.notes ?? null
    const reminder_date =
      body?.reminder_date === "" || body?.reminder_date === undefined ? null : String(body?.reminder_date)

    if (!client_id) {
      return jsonError("El campo client_id es obligatorio.", 400)
    }
    if (!date) {
      return jsonError("El campo date es obligatorio (YYYY-MM-DD).", 400)
    }

    const insertPayload = { client_id, date, notes, reminder_date }

    const { data, error } = await supabase
      .from("follow_ups")
      .insert([insertPayload])
      .select("id, client_id, date, notes, reminder_date, created_at, updated_at")
      .single()

    if (error) {
      return jsonError("Error al crear seguimiento en Supabase", 500, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return jsonError("Excepción en POST /api/followups", 500, err?.message ?? String(err))
  }
}
