import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams

    const loanId = searchParams.get("loan_id")
    const clientId = searchParams.get("client_id")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")

    // Obtener resumen general o por filtros
    const baseQuery = supabase.from("installments_with_status")

    if (loanId) {
      // Resumen específico de un préstamo usando la función SQL
      const { data, error } = await supabase.rpc("get_loan_summary", { p_loan_id: loanId })

      if (error) {
        return NextResponse.json({ detail: `Error obteniendo resumen del préstamo: ${error.message}` }, { status: 500 })
      }

      return NextResponse.json(data?.[0] || {}, { status: 200 })
    }

    // Construir query base para resumen general
    let query = baseQuery.select(`
      id,
      loan_id,
      amount_due,
      amount_paid,
      balance_due,
      due_date,
      status,
      loans:loan_id (
        client_id,
        loan_code
      )
    `)

    // Aplicar filtros
    if (clientId) {
      const { data: loanIds } = await supabase.from("loans").select("id").eq("client_id", clientId)

      if (loanIds && loanIds.length > 0) {
        query = query.in(
          "loan_id",
          loanIds.map((l) => l.id),
        )
      } else {
        return NextResponse.json(
          {
            total_installments: 0,
            paid_installments: 0,
            pending_installments: 0,
            overdue_installments: 0,
            total_amount_due: 0,
            total_amount_paid: 0,
            total_balance_due: 0,
          },
          { status: 200 },
        )
      }
    }

    if (dateFrom) {
      query = query.gte("due_date", dateFrom)
    }

    if (dateTo) {
      query = query.lte("due_date", dateTo)
    }

    const { data: installments, error } = await query

    if (error) {
      return NextResponse.json({ detail: `Error obteniendo cuotas: ${error.message}` }, { status: 500 })
    }

    // Calcular resumen
    const summary = {
      total_installments: installments?.length || 0,
      paid_installments:
        installments?.filter((i) => i.status.includes("pagada") || i.status === "pago_anticipado").length || 0,
      pending_installments:
        installments?.filter((i) => i.status === "a_pagar" || i.status === "a_pagar_hoy").length || 0,
      overdue_installments: installments?.filter((i) => i.status === "vencida").length || 0,
      total_amount_due: installments?.reduce((sum, i) => sum + (i.amount_due || 0), 0) || 0,
      total_amount_paid: installments?.reduce((sum, i) => sum + (i.amount_paid || 0), 0) || 0,
      total_balance_due: installments?.reduce((sum, i) => sum + (i.balance_due || 0), 0) || 0,
      by_status: {
        a_pagar: installments?.filter((i) => i.status === "a_pagar").length || 0,
        a_pagar_hoy: installments?.filter((i) => i.status === "a_pagar_hoy").length || 0,
        vencida: installments?.filter((i) => i.status === "vencida").length || 0,
        pagada: installments?.filter((i) => i.status === "pagada").length || 0,
        pago_anticipado: installments?.filter((i) => i.status === "pago_anticipado").length || 0,
        pagada_con_mora: installments?.filter((i) => i.status === "pagada_con_mora").length || 0,
      },
    }

    return NextResponse.json(summary, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
