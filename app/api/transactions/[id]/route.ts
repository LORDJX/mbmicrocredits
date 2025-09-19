import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

// GET /api/transactions/:id
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin()
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("id,type,amount,description,partner_id,created_at,updated_at")
      .eq("id", params.id)
      .single()

    if (error) {
      return NextResponse.json({ message: "Error al obtener transacción", detail: error.message }, { status: 404 })
    }
    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      {
        message: "Error inesperado al obtener transacción",
        detail: err?.message ?? String(err),
      },
      { status: 500 },
    )
  }
}

// PATCH /api/transactions/:id
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin()
  try {
    const body = await request.json()
    const updateData: Record<string, any> = {}

    if (body?.type && ["income", "expense"].includes(body.type)) {
      updateData.type = body.type
    }
    if (typeof body?.amount !== "undefined") {
      const amount = Number(body.amount)
      if (!Number.isFinite(amount)) {
        return NextResponse.json({ message: "El monto debe ser numérico." }, { status: 400 })
      }
      updateData.amount = amount
    }
    if (typeof body?.description !== "undefined") {
      updateData.description = body.description ?? null
    }
    if (typeof body?.partner_id !== "undefined") {
      updateData.partner_id = body.partner_id ?? null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No hay campos válidos para actualizar." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", params.id)
      .select("id,type,amount,description,partner_id,created_at,updated_at")
      .single()

    if (error) {
      return NextResponse.json({ message: "Error al actualizar transacción", detail: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      {
        message: "Error inesperado al actualizar transacción",
        detail: err?.message ?? String(err),
      },
      { status: 500 },
    )
  }
}

// DELETE /api/transactions/:id
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin()
  try {
    const { error } = await supabase.from("transactions").delete().eq("id", params.id)

    if (error) {
      return NextResponse.json({ message: "Error al eliminar transacción", detail: error.message }, { status: 500 })
    }
    return NextResponse.json({ message: "Transacción eliminada correctamente" }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      {
        message: "Error inesperado al eliminar transacción",
        detail: err?.message ?? String(err),
      },
      { status: 500 },
    )
  }
}
