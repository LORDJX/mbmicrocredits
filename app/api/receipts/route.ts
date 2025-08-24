import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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
      receipts?.map((receipt, index) => {
        let receiptNumber = receipt.receipt_number

        // If no receipt_number exists, generate sequential number based on position
        if (!receiptNumber) {
          const sequentialNumber = receipts.length - index
          receiptNumber = `Rbo - ${sequentialNumber.toString().padStart(6, "0")}`
        }

        return {
          ...receipt,
          client_name: `${receipt.clients.first_name} ${receipt.clients.last_name}`,
          receipt_number: receiptNumber,
        }
      }) || []

    return NextResponse.json(formattedReceipts)
  } catch (error) {
    console.error("Error in receipts GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    let receiptNumber = "Rbo - 000001" // Default for first receipt

    try {
      // Try to get the last receipt to generate next sequential number
      const { data: lastReceipt } = await supabase
        .from("receipts")
        .select("id, receipt_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (lastReceipt) {
        // If receipt_number column exists and has value, use it
        if (lastReceipt.receipt_number && lastReceipt.receipt_number.startsWith("Rbo - ")) {
          const lastNumber = Number.parseInt(lastReceipt.receipt_number.split(" - ")[1]) || 0
          const nextNumber = lastNumber + 1
          receiptNumber = `Rbo - ${nextNumber.toString().padStart(6, "0")}`
        } else {
          // If no receipt_number or invalid format, count total receipts + 1
          const { count } = await supabase.from("receipts").select("*", { count: "exact", head: true })

          const nextNumber = (count || 0) + 1
          receiptNumber = `Rbo - ${nextNumber.toString().padStart(6, "0")}`
        }
      }
    } catch (error) {
      console.log("Could not get last receipt, using default number")
    }

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
