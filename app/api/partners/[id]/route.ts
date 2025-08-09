import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("Faltan variables de entorno de Supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getAdminClient()
    const id = params.id
    const body = await request.json().catch(() => ({}) as any)

    // Solo actualizamos campos permitidos
    const payload: Record<string, any> = {}
    if (typeof body.name === "string") payload.name = body.name.trim()
    if (Number.isFinite(body.capital)) payload.capital = Number(body.capital)
    if (Number.isFinite(body.withdrawals)) payload.withdrawals = Number(body.withdrawals)
    if (Number.isFinite(body.generated_interest)) payload.generated_interest = Number(body.generated_interest)

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "Validación", detail: "No se enviaron campos válidos para actualizar." },
        { status: 400 },
      )
    }

    const { data, error, status } = await supabase
      .from("partners")
      .update(payload)
      .eq("id", id)
      .select("id,name,capital,withdrawals,generated_interest,created_at,updated_at,deleted_at")
      .single()

    if (error) {
      return NextResponse.json({ error: "Error al actualizar socio", detail: error.message }, { status: status || 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error al conectar con Supabase", detail: String(err?.message || err) },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getAdminClient()
    const id = params.id

    // Soft delete: establecer deleted_at
    const { data, error, status } = await supabase
      .from("partners")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select("id,name,capital,withdrawals,generated_interest,created_at,updated_at,deleted_at")
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Error al eliminar (soft) socio", detail: error.message },
        { status: status || 500 },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error al conectar con Supabase", detail: String(err?.message || err) },
      { status: 500 },
    )
  }
}
