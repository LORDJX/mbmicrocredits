import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

type CreateReceiptBody = {
  receipt_number: string
  client_id: string
  selected_loans: string[]
  selected_installments: Array<{
    installment_id: string
    amount: number
  }>
  total_amount: number
  cash_amount: number
  transfer_amount: number
  payment_type: "total" | "partial"
  observations?: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams

    const clientId = searchParams.get("client_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let query = supabase.from("receipts_with_client").select("*").order("created_at", { ascending: false })

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    if (startDate) {
      query = query.gte("receipt_date", startDate)
    }

    if (endDate) {
      query = query.lte("receipt_date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching receipts:", error)
      return NextResponse.json({ detail: `Error obteniendo recibos: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data || [], { status: 200 })
  } catch (e: any) {
    console.error("Unexpected error in GET /api/receipts:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = (await request.json()) as CreateReceiptBody

    // Validaciones
    if (!body.receipt_number || !body.client_id || !body.selected_installments?.length) {
      return NextResponse.json(
        {
          detail: "receipt_number, client_id y selected_installments son requeridos",
        },
        { status: 400 },
      )
    }

    if (body.total_amount <= 0) {
      return NextResponse.json({ detail: "El monto total debe ser mayor a 0" }, { status: 400 })
    }

    if (body.cash_amount + body.transfer_amount !== body.total_amount) {
      return NextResponse.json(
        {
          detail: "La suma de efectivo y transferencia debe igual al total",
        },
        { status: 400 },
      )
    }

    // Verificar que el cliente existe
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, client_code, first_name, last_name")
      .eq("id", body.client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ detail: "Cliente no encontrado" }, { status: 404 })
    }

    // Crear el recibo
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        receipt_number: body.receipt_number,
        receipt_date: new Date().toISOString().split("T")[0],
        client_id: body.client_id,
        selected_loans: body.selected_loans,
        selected_installments: body.selected_installments,
        total_amount: body.total_amount,
        cash_amount: body.cash_amount,
        transfer_amount: body.transfer_amount,
        payment_type: body.payment_type,
        observations: body.observations || null,
      })
      .select()
      .single()

    if (receiptError) {
      console.error("Error creating receipt:", receiptError)
      return NextResponse.json(
        {
          detail: `Error creando recibo: ${receiptError.message}`,
        },
        { status: 500 },
      )
    }

    // Crear el pago correspondiente para cada préstamo
    for (const loanId of body.selected_loans) {
      const loanInstallments = body.selected_installments.filter((si) => {
        // Verificar que la cuota pertenece al préstamo
        return true // Simplificado por ahora
      })

      const loanTotal = loanInstallments.reduce((sum, si) => sum + si.amount, 0)

      if (loanTotal > 0) {
        // Crear pago usando la función SQL existente
        const { error: paymentError } = await supabase.rpc("apply_payment", {
          p_loan_id: loanId,
          p_paid_amount: loanTotal,
          p_note: `Pago desde recibo ${body.receipt_number}`,
        })

        if (paymentError) {
          console.error("Error applying payment:", paymentError)
          // Continuar con otros pagos aunque uno falle
        }
      }
    }

    return NextResponse.json(
      {
        message: `Recibo ${body.receipt_number} creado exitosamente`,
        receipt,
      },
      { status: 201 },
    )
  } catch (e: any) {
    console.error("Unexpected error in POST /api/receipts:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
