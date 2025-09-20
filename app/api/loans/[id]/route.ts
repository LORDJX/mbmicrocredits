import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

const loanSelect = `
  id,
  loan_code,
  client_id,
  amount,
  installments,
  loan_type,
  interest_rate,
  start_date,
  end_date,
  status,
  created_at,
  updated_at,
  deleted_at,
  clients:client_id (
    client_code,
    first_name,
    last_name
  )
`

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("loans").select(loanSelect).eq("id", params.id).single()

    if (error) {
      return NextResponse.json({ detail: `Error obteniendo préstamo: ${error.message}` }, { status: 404 })
    }
    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    return NextResponse.json(
      { detail: `Fallo inesperado en GET /api/loans/${params.id}: ${e.message}` },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()
    const payload = await request.json()

    const { data, error } = await supabase.from("loans").update(payload).eq("id", params.id).select(loanSelect).single()

    if (error) {
      return NextResponse.json({ detail: `Error actualizando préstamo: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    return NextResponse.json(
      { detail: `Fallo inesperado en PATCH /api/loans/${params.id}: ${e.message}` },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()
    const deletedAt = new Date().toISOString()

    const { data, error } = await supabase
      .from("loans")
      .update({ deleted_at: deletedAt })
      .eq("id", params.id)
      .select(loanSelect)
      .single()

    if (error) {
      return NextResponse.json({ detail: `Error eliminando (soft delete) préstamo: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    return NextResponse.json(
      { detail: `Fallo inesperado en DELETE /api/loans/${params.id}: ${e.message}` },
      { status: 500 },
    )
  }
}
