import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

type CreateReceiptBody = {
  client_id: string
  loan_id: string // Cambio: de `string[]` a `string`
  installment_ids: string[]
  payment_type: "total" | "partial"
  cash_amount: number
  transfer_amount: number
  total_amount: number
  notes?: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams

    const clientId = searchParams.get("client_id")
    const loanId = searchParams.get("loan_id")

    let query = supabase.from("receipts_with_client").select("*").order("created_at", { ascending: false })

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    if (loanId) {
      query = query.contains("selected_loans", [loanId])
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching receipts:", error)
      return NextResponse.json({ detail: `Error obteniendo recibos: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data || [], { status: 200 })
  } catch (e: any) {
    console.error("[v0] Receipts API - Unexpected error in GET:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Receipts API - Starting POST request...")
    const supabase = getSupabaseAdmin()
    const body = (await request.json()) as CreateReceiptBody

    // Validaciones existentes
    if (!body.client_id || !body.loan_id || !body.installment_ids || body.installment_ids.length === 0) {
      return NextResponse.json({ detail: "client_id, loan_id y installment_ids son requeridos" }, { status: 400 })
    }

    if (body.total_amount <= 0) {
      return NextResponse.json({ detail: "El monto total debe ser mayor a 0" }, { status: 400 })
    }

    // Obtener el siguiente número de recibo
    const { data: nextNumberData, error: nextNumberError } = await supabase.rpc("get_next_receipt_number")
    if (nextNumberError) {
      console.error("[v0] Error getting next receipt number:", nextNumberError)
      return NextResponse.json(
        { detail: `Error obteniendo número de recibo: ${nextNumberError.message}` },
        { status: 500 },
      )
    }
    const receiptNumber = nextNumberData

    // Crear recibo con los datos del body
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert([
        {
          receipt_number: receiptNumber,
          receipt_date: new Date().toISOString().split("T")[0],
          client_id: body.client_id,
          selected_loans: [body.loan_id], // Cambiamos para que sea un array de strings
          selected_installments: body.installment_ids,
          total_amount: body.total_amount,
          cash_amount: body.cash_amount,
          transfer_amount: body.transfer_amount,
          payment_type: body.payment_type,
          observations: body.notes || null,
        },
      ])
      .select()
      .single()

    if (receiptError) {
      console.error("[v0] Error creating receipt:", receiptError)
      return NextResponse.json({ detail: `Error creando recibo: ${receiptError.message}` }, { status: 500 })
    }

    // Llamar al nuevo procedimiento almacenado para procesar el pago y las imputaciones
    const { error: processingError } = await supabase.rpc("process_receipt_payment", {
      p_receipt_id: receipt.id,
    })

    if (processingError) {
      console.error("[v0] Recibo creado, pero el procesamiento de pago falló:", processingError)
      return NextResponse.json(
        { detail: `Recibo creado, pero el procesamiento de pago falló: ${processingError.message}` },
        { status: 500 },
      )
    }

    console.log("[v0] Recibo y pago procesados exitosamente:", receipt.receipt_number)
    return NextResponse.json(
      {
        message: `Recibo ${receipt.receipt_number} creado y pago procesado exitosamente`,
        receipt,
      },
      { status: 201 },
    )
  } catch (e: any) {
    console.error("[v0] Receipts API - Unexpected error in POST:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
