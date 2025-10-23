import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware/withAuth"

interface InstallmentWithStatus {
  id: string
  loan_id: string
  installment_no: number
  due_date: string
  amount_due: number
  amount_paid: number
  paid_at: string | null
  status: string
}

export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  try {
    const body = await request.json()
    const { loan_id, client_id, receipt_date, total_amount, cash_amount, transfer_amount, note } = body

    // Validaciones
    if (!loan_id || !client_id || !total_amount || total_amount <= 0) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    // Crear recibo
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        client_id,
        receipt_date: receipt_date || new Date().toISOString().split("T")[0],
        total_amount,
        cash_amount: cash_amount || 0,
        transfer_amount: transfer_amount || 0,
        observations: note,
        selected_loans: [loan_id],
      })
      .select()
      .single()

    if (receiptError) {
      console.error("Error creating receipt:", receiptError)
      return NextResponse.json({ error: "Error al crear recibo" }, { status: 500 })
    }

    // Obtener cuotas pendientes ordenadas por prioridad
    const { data: installments, error: installmentsError } = await supabase
      .from("installments_with_status")
      .select("*")
      .eq("loan_id", loan_id)
      .in("status", ["VENCIDA", "A_PAGAR_HOY", "A_PAGAR"])
      .order("due_date", { ascending: true })

    if (installmentsError) {
      console.error("Error fetching installments:", installmentsError)
      return NextResponse.json({ error: "Error al obtener cuotas" }, { status: 500 })
    }

    const sortedInstallments = (installments as InstallmentWithStatus[]).sort((a, b) => {
      const priority: Record<string, number> = { VENCIDA: 1, A_PAGAR_HOY: 2, A_PAGAR: 3 }
      const priorityDiff = priority[a.status] - priority[b.status]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    })

    let remaining = total_amount
    const imputations = []

    for (const inst of sortedInstallments) {
      if (remaining <= 0) break

      const needed = Number(inst.amount_due) - Number(inst.amount_paid || 0)
      const toImpute = Math.min(remaining, Math.max(needed, 0))

      if (toImpute > 0) {
        // Insertar imputación
        const { error: imputationError } = await supabase.from("payment_imputations").insert({
          receipt_id: receipt.id,
          installment_id: inst.id,
          imputed_amount: toImpute,
        })

        if (imputationError) {
          console.error("Error creating imputation:", imputationError)
          continue
        }

        // Actualizar cuota
        const newAmountPaid = Number(inst.amount_paid || 0) + toImpute
        const updateData: Record<string, unknown> = {
          amount_paid: newAmountPaid,
        }

        if (newAmountPaid >= Number(inst.amount_due) && !inst.paid_at) {
          updateData.paid_at = receipt.receipt_date
        }

        const { error: updateError } = await supabase.from("installments").update(updateData).eq("id", inst.id)

        if (updateError) {
          console.error("Error updating installment:", updateError)
        }

        imputations.push({
          installment_id: inst.id,
          installment_no: inst.installment_no,
          imputed_amount: toImpute,
        })

        remaining -= toImpute
      }
    }

    return NextResponse.json({
      receipt_id: receipt.id,
      receipt_number: receipt.receipt_number,
      imputations,
      remaining_amount: remaining,
      message: remaining > 0 ? `Pago registrado. Sobran $${remaining.toFixed(2)}` : "Pago registrado exitosamente",
    })
  } catch (error) {
    console.error("Error in payments:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
})
