import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams

    // Parámetros de filtro
    const clientId = searchParams.get("client_id")
    const loanId = searchParams.get("loan_id")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const term = searchParams.get("search")?.trim()

    let query = supabase
      .from("payments")
      .select(`
        id,
        receipt_number,
        amount,
        payment_date,
        notes,
        created_at,
        loans:loan_id (
          loan_code,
          client_id,
          clients:client_id (
            client_code,
            first_name,
            last_name
          )
        )
      `)
      .order("created_at", { ascending: false })

    // Aplicar filtros
    if (loanId) {
      query = query.eq("loan_id", loanId)
    }

    if (dateFrom) {
      query = query.gte("payment_date", dateFrom)
    }

    if (dateTo) {
      query = query.lte("payment_date", dateTo)
    }

    // Filtro por cliente
    if (clientId) {
      const { data: loanIds } = await supabase.from("loans").select("id").eq("client_id", clientId)

      if (loanIds && loanIds.length > 0) {
        query = query.in(
          "loan_id",
          loanIds.map((l) => l.id),
        )
      } else {
        return NextResponse.json([], { status: 200 })
      }
    }

    // Búsqueda por término
    if (term && term.length > 0) {
      query = query.ilike("receipt_number", `%${term}%`)
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
    const body = await request.json()

    const { loan_id, amount, payment_date, notes } = body

    if (!loan_id || !amount) {
      return NextResponse.json({ detail: "loan_id y amount son requeridos" }, { status: 400 })
    }

    // Verificar que el préstamo existe
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("id, loan_code, client_id")
      .eq("id", loan_id)
      .single()

    if (loanError || !loan) {
      return NextResponse.json({ detail: "Préstamo no encontrado" }, { status: 404 })
    }

    // Llamar al stored procedure para procesar el pago
    const { data, error } = await supabase.rpc("process_receipt_payment", {
      p_loan_id: loan_id,
      p_amount: Number.parseFloat(amount),
      p_payment_date: payment_date || new Date().toISOString().split("T")[0],
      p_notes: notes || null,
    })

    if (error) {
      console.error("Error processing payment:", error)
      return NextResponse.json({ detail: `Error procesando pago: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    console.error("Unexpected error in POST /api/receipts:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
