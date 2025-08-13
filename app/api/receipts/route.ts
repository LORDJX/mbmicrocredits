import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET(request: NextRequest) {
  try {
    const { data: receipts, error } = await supabase
      .from("receipts")
      .select(`
        *,
        clients!inner(first_name, last_name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching receipts:", error)
      return NextResponse.json({ error: "Error fetching receipts" }, { status: 500 })
    }

    const formattedReceipts =
      receipts?.map((receipt) => ({
        ...receipt,
        client_name: `${receipt.clients.first_name} ${receipt.clients.last_name}`,
      })) || []

    return NextResponse.json(formattedReceipts)
  } catch (error) {
    console.error("Error in receipts GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Received body:", body) // Agregando log para debugging

    const {
      receipt_date, // Cambiado de 'date' a 'receipt_date' para consistencia
      client_id,
      selected_loans,
      selected_installments, // Agregando selected_installments
      payment_type,
      cash_amount,
      transfer_amount,
      total_amount,
      observations,
      attachment_url, // Cambiado de 'receipt_file_url' a 'attachment_url'
    } = body

    if (!receipt_date) {
      return NextResponse.json({ error: "La fecha es requerida" }, { status: 400 })
    }

    const { data: tableExists, error: tableCheckError } = await supabase.from("receipts").select("id").limit(1)

    if (tableCheckError && tableCheckError.code === "42P01") {
      console.error("Receipts table does not exist:", tableCheckError)
      return NextResponse.json(
        {
          error:
            "La tabla de recibos no existe. Por favor ejecute el script SQL 12-create-receipts-table.sql en su base de datos Supabase.",
        },
        { status: 500 },
      )
    }

    const { data: lastReceipt } = await supabase
      .from("receipts")
      .select("receipt_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (lastReceipt?.receipt_number) {
      const lastNumber = Number.parseInt(lastReceipt.receipt_number.split(" - ")[1]) || 0
      nextNumber = lastNumber + 1
    }
    const receiptNumber = `Rbo - ${nextNumber.toString().padStart(6, "0")}`

    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        receipt_number: receiptNumber, // Agregando receipt_number
        receipt_date,
        client_id,
        payment_type,
        cash_amount,
        transfer_amount,
        total_amount,
        observations,
        attachment_url,
        selected_loans: selected_loans,
        selected_installments: selected_installments, // Agregando selected_installments
      })
      .select()
      .single()

    if (receiptError) {
      console.error("Error creating receipt:", receiptError)
      return NextResponse.json(
        {
          error: `Error creating receipt: ${receiptError.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(receipt, { status: 201 })
  } catch (error) {
    console.error("Error in receipts POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
