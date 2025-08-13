import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("client_id")

    let query = supabase
      .from("receipts")
      .select(`
        *,
        clients!inner(first_name, last_name)
      `)
      .order("receipt_date", { ascending: false })

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener recibos:", error)
      return NextResponse.json({ error: "Error al obtener recibos" }, { status: 500 })
    }

    const receiptsWithClientNames = data.map((receipt) => ({
      ...receipt,
      client_name: `${receipt.clients.first_name} ${receipt.clients.last_name}`,
    }))

    return NextResponse.json(receiptsWithClientNames)
  } catch (error) {
    console.error("Error en GET /api/receipts:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      receipt_date,
      client_id,
      payment_type,
      cash_amount,
      transfer_amount,
      total_amount,
      observations,
      attachment_url,
      selected_loans,
    } = body

    // Validaciones básicas
    if (!client_id || !payment_type || !selected_loans || selected_loans.length === 0) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    if ((cash_amount || 0) === 0 && (transfer_amount || 0) === 0) {
      return NextResponse.json({ error: "Debe ingresar al menos un importe" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("receipts")
      .insert([
        {
          receipt_date,
          client_id,
          payment_type,
          cash_amount: cash_amount || 0,
          transfer_amount: transfer_amount || 0,
          total_amount: total_amount || 0,
          observations: observations || "",
          attachment_url,
          selected_loans,
        },
      ])
      .select()

    if (error) {
      console.error("Error al crear recibo:", error)
      return NextResponse.json({ error: "Error al crear recibo" }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error("Error en POST /api/receipts:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
