import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: receipt, error } = await supabase
      .from("receipts")
      .select(`
        *,
        clients!inner(first_name, last_name, client_code, phone, email)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching receipt:", error)
      return NextResponse.json({ error: "Recibo no encontrado" }, { status: 404 })
    }

    const { data: imputations } = await supabase
      .from("payment_imputations")
      .select(`
        *,
        installments!inner(
          installment_no,
          due_date,
          amount_due,
          loans!inner(loan_code)
        )
      `)
      .eq("receipt_id", params.id)

    return NextResponse.json({
      receipt: {
        ...receipt,
        imputations: imputations || [],
      },
    })
  } catch (error) {
    console.error("Error in GET /api/receipts/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

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

    const body = await request.json()
    const { observations, receipt_date } = body

    const { data: updatedReceipt, error } = await supabase
      .from("receipts")
      .update({
        observations,
        receipt_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(`
        *,
        clients!inner(first_name, last_name, client_code)
      `)
      .single()

    if (error) {
      console.error("Error updating receipt:", error)
      return NextResponse.json({ error: "Error al actualizar recibo" }, { status: 500 })
    }

    return NextResponse.json({ receipt: updatedReceipt })
  } catch (error) {
    console.error("Error in PATCH /api/receipts/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: imputations } = await supabase
      .from("payment_imputations")
      .select("installment_id, imputed_amount")
      .eq("receipt_id", params.id)

    if (imputations && imputations.length > 0) {
      for (const imputation of imputations) {
        await supabase.rpc("revert_installment_payment", {
          p_installment_id: imputation.installment_id,
          p_amount: imputation.imputed_amount,
        })
      }

      await supabase.from("payment_imputations").delete().eq("receipt_id", params.id)
    }

    const { error } = await supabase.from("receipts").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting receipt:", error)
      return NextResponse.json({ error: "Error al eliminar recibo" }, { status: 500 })
    }

    return NextResponse.json({ message: "Recibo eliminado correctamente" })
  } catch (error) {
    console.error("Error in DELETE /api/receipts/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
