import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const body = await request.json()
    const { client_id, payment_type, cash_amount, transfer_amount, total_amount, observations, selected_installments } =
      body

    const receiptNumber = `REC-${Date.now()}`

    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        client_id,
        receipt_number: receiptNumber,
        payment_type,
        cash_amount: cash_amount || 0,
        transfer_amount: transfer_amount || 0,
        total_amount,
        observations,
        selected_installments: selected_installments,
        receipt_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single()

    if (receiptError) {
      console.error("Error creating receipt:", receiptError)
      return NextResponse.json({ detail: "Error al crear el recibo: " + receiptError.message }, { status: 500 })
    }

    let loanId = null
    if (selected_installments.length > 0) {
      const { data: installmentData } = await supabase
        .from("installments")
        .select("loan_id")
        .eq("id", selected_installments[0].installment_id)
        .single()

      loanId = installmentData?.loan_id
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        loan_id: loanId,
        paid_amount: total_amount,
        note: `Recibo ${receiptNumber} - ${observations || "Pago de cuotas"}`,
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Error creating payment:", paymentError)
      return NextResponse.json({ detail: "Error al crear el pago: " + paymentError.message }, { status: 500 })
    }

    for (const installmentData of selected_installments) {
      const { installment_id, amount_to_pay, is_partial } = installmentData

      // Obtener la cuota actual
      const { data: currentInstallment, error: installmentError } = await supabase
        .from("installments")
        .select("amount_paid, amount_due")
        .eq("id", installment_id)
        .single()

      if (installmentError) {
        console.error("Error fetching installment:", installmentError)
        continue
      }

      const newAmountPaid = (currentInstallment.amount_paid || 0) + amount_to_pay

      const { error: updateError } = await supabase
        .from("installments")
        .update({
          amount_paid: newAmountPaid,
          paid_at: newAmountPaid >= currentInstallment.amount_due ? new Date().toISOString() : null,
        })
        .eq("id", installment_id)

      if (updateError) {
        console.error("Error updating installment:", updateError)
      }

      const { error: imputationError } = await supabase.from("payment_imputations").insert({
        payment_id: payment.id,
        installment_id: installment_id,
        imputed_amount: amount_to_pay,
      })

      if (imputationError) {
        console.error("Error creating payment imputation:", imputationError)
      }
    }

    await supabase.from("receipts").update({ payment_id: payment.id }).eq("id", receipt.id)

    return NextResponse.json({
      message: "Recibo creado exitosamente",
      receipt_number: receiptNumber,
      receipt_id: receipt.id,
      payment_id: payment.id,
    })
  } catch (error) {
    console.error("Error in receipts API:", error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("client_id")

    let query = supabase.from("receipts_with_client").select("*").order("created_at", { ascending: false })

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    const { data: receipts, error } = await query

    if (error) {
      console.error("Error fetching receipts:", error)
      return NextResponse.json({ detail: "Error al obtener los recibos: " + error.message }, { status: 500 })
    }

    return NextResponse.json(receipts)
  } catch (error) {
    console.error("Error in receipts GET API:", error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}
