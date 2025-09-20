import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

const installmentSelect = `
  id,
  code,
  loan_id,
  installment_no,
  installments_total,
  amount_due,
  amount_paid,
  due_date,
  paid_at,
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
`

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams

    // Parámetros de filtro
    const loanId = searchParams.get("loan_id")
    const clientId = searchParams.get("client_id")
    const status = searchParams.get("status")
    const dueDateFrom = searchParams.get("due_date_from")
    const dueDateTo = searchParams.get("due_date_to")
    const term = searchParams.get("search")?.trim()

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

    // Aplicar filtros
    if (loanId) {
      query = query.eq("loan_id", loanId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (dueDateFrom) {
      query = query.gte("due_date", dueDateFrom)
    }

    if (dueDateTo) {
      query = query.lte("due_date", dueDateTo)
    }

    // Filtro por cliente si se especifica
    if (clientId) {
      const { data: loanIds } = await supabase.from("loans").select("id").eq("client_id", clientId)

      if (loanIds && loanIds.length > 0) {
        query = query.in(
          "loan_id",
          loanIds.map((l) => l.id),
        )
      } else {
        // Si no hay préstamos para este cliente, retornar array vacío
        return NextResponse.json([], { status: 200 })
      }
    }

    // Búsqueda por término
    if (term && term.length > 0) {
      // Buscar por código de cuota o código de préstamo
      query = query.or(`code.ilike.%${term}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching installments:", error)
      return NextResponse.json({ detail: `Error obteniendo cuotas: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data || [], { status: 200 })
  } catch (e: any) {
    console.error("Unexpected error in GET /api/installments:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const { loan_id } = body

    if (!loan_id) {
      return NextResponse.json({ detail: "loan_id es requerido" }, { status: 400 })
    }

    // Verificar que el préstamo existe
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("id, loan_code, installments, amount_to_repay, start_date, loan_type")
      .eq("id", loan_id)
      .single()

    if (loanError || !loan) {
      return NextResponse.json({ detail: "Préstamo no encontrado" }, { status: 404 })
    }

    // Verificar si ya existen cuotas para este préstamo
    const { data: existingInstallments } = await supabase
      .from("installments")
      .select("id")
      .eq("loan_id", loan_id)
      .limit(1)

    if (existingInstallments && existingInstallments.length > 0) {
      return NextResponse.json({ detail: "Ya existen cuotas para este préstamo" }, { status: 400 })
    }

    // Generar cuotas usando la función SQL
    const { error: generateError } = await supabase.rpc("generate_loan_installments", { loan_id })

    if (generateError) {
      console.error("Error generating installments:", generateError)
      return NextResponse.json({ detail: `Error generando cuotas: ${generateError.message}` }, { status: 500 })
    }

    // Obtener las cuotas generadas
    const { data: newInstallments, error: fetchError } = await supabase
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
        status,
        created_at
      `)
      .eq("loan_id", loan_id)
      .order("installment_no", { ascending: true })

    if (fetchError) {
      console.error("Error fetching generated installments:", fetchError)
      return NextResponse.json({ detail: `Error obteniendo cuotas generadas: ${fetchError.message}` }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: `Generadas ${newInstallments?.length || 0} cuotas para el préstamo ${loan.loan_code}`,
        installments: newInstallments,
      },
      { status: 201 },
    )
  } catch (e: any) {
    console.error("Unexpected error in POST /api/installments:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
