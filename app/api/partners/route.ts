import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

// Helper: Supabase Admin (solo servidor)
function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("Faltan variables de entorno de Supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const search = request.nextUrl.searchParams.get("search")?.trim()

    let query = supabase
      .from("partners")
      .select("id,name,capital,withdrawals,generated_interest,created_at,updated_at,deleted_at")
      .order("created_at", { ascending: false })

    if (search && search.length > 0) {
      query = query.ilike("name", `%${search}%`)
    }

    const { data, error, status } = await query
    if (error) {
      return NextResponse.json({ error: "Error al obtener socios", detail: error.message }, { status: status || 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error al conectar con Supabase", detail: String(err?.message || err) },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const body = await request.json().catch(() => ({}) as any)
    const name = String(body?.name || "").trim()
    const capital = Number(body?.capital)

    if (!name) {
      return NextResponse.json({ error: "Validación", detail: "El nombre es obligatorio." }, { status: 400 })
    }
    if (!Number.isFinite(capital) || capital <= 0) {
      return NextResponse.json(
        { error: "Validación", detail: "El capital debe ser un número mayor que cero." },
        { status: 400 },
      )
    }

    const insertPayload = {
      name,
      capital,
      withdrawals: 0,
      generated_interest: 0,
      // created_at/updated_at se pueden manejar con triggers en DB
    }

    const { data, error, status } = await supabase
      .from("partners")
      .insert(insertPayload)
      .select("id,name,capital,withdrawals,generated_interest,created_at,updated_at,deleted_at")
      .single()

    if (error) {
      return NextResponse.json({ error: "Error al crear socio", detail: error.message }, { status: status || 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error al conectar con Supabase", detail: String(err?.message || err) },
      { status: 500 },
    )
  }
}
