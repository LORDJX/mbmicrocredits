import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("installments_with_status")
      .select(`
        id,
        code,
        loan_id,
        installment_no,
        installments_total,
        amount_due,
        amount_paid,
        balance_due,
        due_date,
        paid_at,
        status,
        created_at,
        loans:loan_id (
          loan_code,
          client_id,
          loan_type,
          status,
          clients:client_id (
            client_code,
            first_name,
            last_name,
            phone
          )
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      return NextResponse.json({ detail: `Cuota no encontrada: ${error.message}` }, { status: 404 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    // Solo permitir actualizar amount_paid y paid_at
    const allowedFields = ["amount_paid", "paid_at"]
    const updateData: any = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ detail: "No hay campos válidos para actualizar" }, { status: 400 })
    }

    // Si se está marcando como pagada, establecer paid_at si no se proporcionó
    if (updateData.amount_paid && !updateData.paid_at) {
      updateData.paid_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("installments")
      .update(updateData)
      .eq("id", params.id)
      .select(`
        id,
        code,
        loan_id,
        installment_no,
        installments_total,
        amount_due,
        amount_paid,
        due_date,
        paid_at,
        created_at
      `)
      .single()

    if (error) {
      return NextResponse.json({ detail: `Error actualizando cuota: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()

    // Verificar que la cuota no esté pagada
    const { data: installment, error: fetchError } = await supabase
      .from("installments")
      .select("amount_paid, amount_due, code")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ detail: `Cuota no encontrada: ${fetchError.message}` }, { status: 404 })
    }

    if (installment.amount_paid > 0) {
      return NextResponse.json(
        { detail: "No se puede eliminar una cuota que tiene pagos registrados" },
        { status: 400 },
      )
    }

    const { error } = await supabase.from("installments").delete().eq("id", params.id)

    if (error) {
      return NextResponse.json({ detail: `Error eliminando cuota: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: `Cuota ${installment.code} eliminada exitosamente` }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
