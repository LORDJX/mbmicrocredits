import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

// GET /api/transactions
// Lista transacciones con filtros opcionales: ?type=income|expense&partner_id=...&q=texto
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { searchParams } = request.nextUrl
  const type = searchParams.get("type")
  const partnerId = searchParams.get("partner_id")
  const q = searchParams.get("q")

  try {
    let query = supabase
      .from("transactions")
      .select("id,type,amount,description,partner_id,created_at,updated_at", { head: false })
      .order("created_at", { ascending: false })

    if (type === "income" || type === "expense") {
      query = query.eq("type", type)
    }
    if (partnerId) {
      query = query.eq("partner_id", partnerId)
    }
    if (q && q.trim().length > 0) {
      // Búsqueda en descripción
      query = query.ilike("description", `%${q}%`)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ message: "Error al listar transacciones", detail: error.message }, { status: 500 })
    }
    return NextResponse.json(data ?? [], { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      {
        message: "Error inesperado al listar transacciones",
        detail: err?.message ?? String(err),
      },
      { status: 500 },
    )
  }
}

// POST /api/transactions
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  try {
    const body = await request.json()

    // Saneado/validación mínima en el servidor
    const type = body?.type
    const amount = Number(body?.amount)
    if (!["income", "expense"].includes(type)) {
      return NextResponse.json({ message: "Tipo inválido. Debe ser 'income' o 'expense'." }, { status: 400 })
    }
    if (!Number.isFinite(amount)) {
      return NextResponse.json({ message: "El monto es obligatorio y debe ser numérico." }, { status: 400 })
    }

    const insertData = {
      type,
      amount,
      description: body?.description ?? null,
      partner_id: body?.partner_id ?? null,
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert(insertData)
      .select("id,type,amount,description,partner_id,created_at,updated_at")
      .single()

    if (error) {
      return NextResponse.json({ message: "Error al crear transacción", detail: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      {
        message: "Error inesperado al crear transacción",
        detail: err?.message ?? String(err),
      },
      { status: 500 },
    )
  }
}
