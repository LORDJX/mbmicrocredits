"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Interfaces
interface InstallmentWithBalance {
  id: string
  installment_number: number
  amount: number
  due_date: string
  balance: number
}

interface ImputationResult {
  installment_id: string
  installment_number: number
  due_date: string
  original_amount: number
  previous_balance: number
  imputed_amount: number
}

interface PaymentDistribution {
  imputations: ImputationResult[]
  remaining: number
}

// Función principal de distribución de pagos
export async function distributePayment(
  installments: InstallmentWithBalance[],
  totalAmount: number
): Promise<PaymentDistribution> {
  if (!installments.length || totalAmount <= 0) {
    return { imputations: [] as ImputationResult[], remaining: totalAmount }
  }

  // Ordenar cuotas por fecha de vencimiento (más antiguas primero)
  const sortedInstallments = [...installments].sort((a, b) => {
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  const imputations: ImputationResult[] = []
  let remaining = totalAmount

  for (const installment of sortedInstallments) {
    if (remaining <= 0) break

    const balance = installment.balance || 0
    if (balance <= 0) continue // Ya está pagada

    const imputedAmount = Math.min(remaining, balance)

    imputations.push({
      installment_id: installment.id,
      installment_number: installment.installment_number,
      due_date: installment.due_date,
      original_amount: installment.amount,
      previous_balance: balance,
      imputed_amount: imputedAmount,
    })

    remaining -= imputedAmount
  }

  return { imputations, remaining }
}

// Acción para crear un recibo
export async function createReceipt(data: {
  loan_id: string
  amount: number
  payment_date: string
  payment_method: string
  notes?: string
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return { error: "No autorizado" }
    }

    // Obtener cuotas pendientes del préstamo
    const { data: installments, error: installmentsError } = await supabase
      .from("loan_installments")
      .select("*")
      .eq("loan_id", data.loan_id)
      .gt("balance", 0)
      .order("due_date", { ascending: true })

    if (installmentsError) throw installmentsError

    // Distribuir el pago
    const distribution = await distributePayment(
      installments as InstallmentWithBalance[],
      data.amount
    )

    // Crear el recibo
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert([
        {
          loan_id: data.loan_id,
          amount: data.amount,
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          notes: data.notes,
          created_by: session.user.id,
        },
      ])
      .select()
      .single()

    if (receiptError) throw receiptError

    // Crear las imputaciones
    if (distribution.imputations.length > 0) {
      const imputations = distribution.imputations.map((imp) => ({
        receipt_id: receipt.id,
        installment_id: imp.installment_id,
        amount: imp.imputed_amount,
      }))

      const { error: imputationsError } = await supabase
        .from("receipt_imputations")
        .insert(imputations)

      if (imputationsError) throw imputationsError

      // Actualizar balance de cuotas
      for (const imputation of distribution.imputations) {
        const newBalance = imputation.previous_balance - imputation.imputed_amount
        
        await supabase
          .from("loan_installments")
          .update({ 
            balance: newBalance,
            status: newBalance === 0 ? "paid" : "pending"
          })
          .eq("id", imputation.installment_id)
      }
    }

    return { success: true, receipt, distribution }
  } catch (error: any) {
    console.error("Error creating receipt:", error)
    return { error: error.message || "Error al crear el recibo" }
  }
}

// Acción para obtener recibos de un préstamo
export async function getReceiptsByLoan(loanId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data, error } = await supabase
      .from("receipts")
      .select(
        `
        *,
        receipt_imputations (
          *,
          loan_installments (
            installment_number,
            due_date,
            amount
          )
        )
      `
      )
      .eq("loan_id", loanId)
      .order("payment_date", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting receipts:", error)
    return { error: error.message || "Error al obtener los recibos" }
  }
}

// Acción para anular un recibo
export async function cancelReceipt(receiptId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return { error: "No autorizado" }
    }

    // Obtener las imputaciones del recibo
    const { data: imputations, error: imputationsError } = await supabase
      .from("receipt_imputations")
      .select("*")
      .eq("receipt_id", receiptId)

    if (imputationsError) throw imputationsError

    // Revertir los balances de las cuotas
    if (imputations && imputations.length > 0) {
      for (const imputation of imputations) {
        const { data: installment, error: installmentError } = await supabase
          .from("loan_installments")
          .select("balance, amount")
          .eq("id", imputation.installment_id)
          .single()

        if (installmentError) throw installmentError

        const newBalance = (installment.balance || 0) + imputation.amount

        await supabase
          .from("loan_installments")
          .update({ 
            balance: newBalance,
            status: newBalance >= installment.amount ? "pending" : "partial"
          })
          .eq("id", imputation.installment_id)
      }
    }

    // Eliminar las imputaciones
    await supabase.from("receipt_imputations").delete().eq("receipt_id", receiptId)

    // Marcar el recibo como cancelado
    const { error: updateError } = await supabase
      .from("receipts")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", receiptId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error: any) {
    console.error("Error cancelling receipt:", error)
    return { error: error.message || "Error al anular el recibo" }
  }
}
