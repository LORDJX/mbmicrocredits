import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

type CreateReceiptBody = {
  client_id: string
  loan_id: string
  installment_ids: string[]
  payment_type: "total" | "partial"
  cash_amount: number
  transfer_amount: number
  total_amount: number
  notes?: string
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Receipts API - Starting GET request...")
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams

    const clientId = searchParams.get("client_id")
    const loanId = searchParams.get("loan_id")

    let query = supabase
      .from("receipts")
      .select(`
        id,
        receipt_number,
        client_id,
        loan_id,
        total_amount,
        cash_amount,
        transfer_amount,
        payment_type,
        notes,
        created_at,
        clients:client_id (
          client_code,
          first_name,
          last_name
        ),
        loans:loan_id (
          loan_code
        )
      `)
      .order("created_at", { ascending: false })

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    if (loanId) {
      query = query.eq("loan_id", loanId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Receipts API - Error:", error)
      return NextResponse.json({ detail: `Error obteniendo recibos: ${error.message}` }, { status: 500 })
    }

    // Transform data to include client_name and loan_code
    const receipts = (data || []).map((receipt) => ({
      id: receipt.id,
      receipt_number: receipt.receipt_number,
      client_name: receipt.clients
        ? `${receipt.clients.first_name} ${receipt.clients.last_name}`
        : "Cliente desconocido",
      loan_code: receipt.loans?.loan_code || "Préstamo desconocido",
      total_amount: receipt.total_amount,
      cash_amount: receipt.cash_amount,
      transfer_amount: receipt.transfer_amount,
      payment_type: receipt.payment_type,
      notes: receipt.notes,
      created_at: receipt.created_at,
    }))

    console.log("[v0] Receipts API - Success, returning", receipts.length, "receipts")
    return NextResponse.json(receipts, { status: 200 })
  } catch (e: any) {
    console.error("[v0] Receipts API - Unexpected error:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Receipts API - Starting POST request...")
    const supabase = getSupabaseAdmin()
    const body = (await request.json()) as CreateReceiptBody

    // Validate required fields
    if (!body.client_id || !body.loan_id || !body.installment_ids || body.installment_ids.length === 0) {
      return NextResponse.json({ detail: "client_id, loan_id y installment_ids son requeridos" }, { status: 400 })
    }

    if (body.total_amount <= 0) {
      return NextResponse.json({ detail: "El monto total debe ser mayor a 0" }, { status: 400 })
    }

    // Get next receipt number
    const { data: nextNumberData, error: nextNumberError } = await supabase.rpc("get_next_receipt_number")

    if (nextNumberError) {
      console.error("[v0] Error getting next receipt number:", nextNumberError)
      return NextResponse.json(
        { detail: `Error obteniendo número de recibo: ${nextNumberError.message}` },
        { status: 500 },
      )
    }

    const receiptNumber = nextNumberData

    // Create receipt
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert([
        {
          receipt_number: receiptNumber,
          client_id: body.client_id,
          loan_id: body.loan_id,
          total_amount: body.total_amount,
          cash_amount: body.cash_amount,
          transfer_amount: body.transfer_amount,
          payment_type: body.payment_type,
          notes: body.notes || null,
        },
      ])
      .select()
      .single()

    if (receiptError) {
      console.error("[v0] Error creating receipt:", receiptError)
      return NextResponse.json({ detail: `Error creando recibo: ${receiptError.message}` }, { status: 500 })
    }

    // Create payment using existing payment processing logic
    const { data: paymentId, error: paymentError } = await supabase.rpc("process_payment", {
      p_loan_id: body.loan_id,
      p_amount: body.total_amount,
      p_note: `Recibo ${receiptNumber}${body.notes ? ` - ${body.notes}` : ""}`,
    })

    if (paymentError) {
      console.error("[v0] Error processing payment:", paymentError)
      // Don't fail the receipt creation, but log the error
      console.log("[v0] Receipt created but payment processing failed")
    }

    // Update receipt with payment_id if payment was created successfully
    if (paymentId) {
      await supabase.from("receipts").update({ payment_id: paymentId }).eq("id", receipt.id)
    }

    console.log("[v0] Receipt created successfully:", receiptNumber)
    return NextResponse.json(
      {
        message: `Recibo ${receiptNumber} creado exitosamente`,
        receipt: {
          ...receipt,
          receipt_number: receiptNumber,
        },
      },
      { status: 201 },
    )
  } catch (e: any) {
    console.error("[v0] Receipts API - Unexpected error in POST:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
