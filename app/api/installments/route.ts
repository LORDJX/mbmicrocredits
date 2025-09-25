// En api/installments/route.ts

import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    const loanId = searchParams.get("loan_id")
    const clientId = searchParams.get("client_id")
    const status = searchParams.get("status")
    const dueDateFrom = searchParams.get("due_date_from")
    const dueDateTo = searchParams.get("due_date_to")
    const term = searchParams.get("search")?.trim()
    const unpaidOnly = searchParams.get("unpaid_only") === "true"

    let query = supabase
      .from("installments_with_status")
      .select(`
        id,
        code,
        loan_id,
        installment_no,
        installments_total,
        amount_due,
        amount_paid,
        balance_due,
        due_date,
        paid_at,
        status,
        created_at,
        loans:loan_id (
          loan_code,
          client_id,
          loan_type,
          status,
          clients:client_id (
            client_code,
            first_name,
            last_name,
            phone
          )
        )
      `)
      .order("due_date", { ascending: true })

    if (loanId) {
      query = query.eq("loan_id", loanId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (unpaidOnly) {
      query = query.gt("balance_due", 0)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching installments from DB:", error)
      return NextResponse.json({ detail: `Error al obtener las cuotas: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data || [], { status: 200 })
  } catch (e: any) {
    console.error("[v0] Unexpected error in GET /api/installments:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
