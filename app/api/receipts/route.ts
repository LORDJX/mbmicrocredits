import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabaseAdminClient"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const receiptNumber = uuidv4()

    const body = await request.json()
    console.log("Received body:", body)

    const {
      receipt_date,
      client_id,
      selected_loans,
      selected_installments,
      payment_type,
      cash_amount,
      transfer_amount,
      total_amount,
      observations,
      attachment_url,
    } = body

    if (!receipt_date) {
      return NextResponse.json({ error: "La fecha es requerida" }, { status: 400 })
    }

    // ... existing code for receipt creation ...

    const receiptData: any = {
      receipt_date,
      client_id,
      payment_type,
      cash_amount,
      transfer_amount,
      total_amount,
      observations,
      attachment_url,
      selected_loans: selected_loans,
      selected_installments: selected_installments,
    }

    const { data: columnCheck } = await supabase.from("receipts").select("receipt_number").limit(1)
    if (columnCheck !== null) {
      receiptData.receipt_number = receiptNumber
    }

    const { data: receipt, error: receiptError } = await supabase.from("receipts").insert(receiptData).select().single()

    if (receiptError) {
      console.error("Error creating receipt:", receiptError)
      return NextResponse.json(
        {
          error: `Error creating receipt: ${receiptError.message}`,
        },
        { status: 500 },
      )
    }

    if (selected_loans && selected_loans.length > 0) {
      for (const loan of selected_loans) {
        if (loan.loan_code && loan.installment_number) {
          // Buscar la cuota correspondiente
          const { data: installment, error: installmentError } = await supabase
            .from("installments")
            .select("id")
            .eq("code", loan.loan_code)
            .eq("installment_no", loan.installment_number)
            .single()

          if (installment && !installmentError) {
            const { error: updateError } = await supabase
              .from("installments")
              .update({
                payment_date: receipt_date,
                paid_at: new Date().toISOString(),
                amount_paid: loan.amount || total_amount,
              })
              .eq("id", installment.id)

            if (updateError) {
              console.error("Error updating installment:", updateError)
            } else {
              console.log(`[v0] Updated installment ${loan.loan_code}-${loan.installment_number} as paid`)
            }
          }
        }
      }
    }

    const finalReceipt = {
      ...receipt,
      receipt_number: receipt.receipt_number || receiptNumber,
    }

    return NextResponse.json(finalReceipt, { status: 201 })
  } catch (error) {
    console.error("Error in receipts POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
