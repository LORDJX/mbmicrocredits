import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

type CreateLoanBody = {
  client_id: string
  amount: number
  installments: number
  installment_amount: number
  loan_type?: string | null
  delivery_mode?: string | null
  interest_rate?: number | null
  amount_to_repay?: number | null
  start_date?: string | null
  end_date?: string | null
  status?: string | null
}

const loanSelect = `
  id,
  loan_code,
  client_id,
  amount,
  installments,
  installment_amount,
  delivery_mode,
  amount_to_repay,
  loan_type,
  interest_rate,
  start_date,
  end_date,
  status,
  created_at,
  updated_at,
  deleted_at,
  clients:client_id (
    client_code,
    first_name,
    last_name
  )
`

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const term = request.nextUrl.searchParams.get("search")?.trim()
    const clientId = request.nextUrl.searchParams.get("client_id")
    const statusFilter = request.nextUrl.searchParams.get("status")

    let clientIds: string[] = []
    if (term && term.length > 0) {
      const { data: clientMatches, error: clientErr } = await supabase
        .from("clients")
        .select("id, client_code, first_name, last_name")
        .or(`client_code.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`)

      if (clientErr) {
        return NextResponse.json({ detail: `Error buscando clientes: ${clientErr.message}` }, { status: 500 })
      }
      clientIds = (clientMatches ?? []).map((c) => c.id)
    }

    let query = supabase.from("loans").select(loanSelect).order("loan_code", { ascending: false })

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    if (term && term.length > 0) {
      const orParts = [`loan_code.ilike.%${term}%`]
      if (clientIds.length > 0) {
        orParts.push(`client_id.in.(${clientIds.join(",")})`)
      }
      query = query.or(orParts.join(","))
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ detail: `Error listando préstamos: ${error.message}` }, { status: 500 })
    }

    let loansWithDefaults = (data ?? []).map((loan) => ({
      ...loan,
      installment_amount: loan.installment_amount ?? (loan.installments > 0 ? loan.amount / loan.installments : 0),
      amount_to_repay: loan.amount_to_repay ?? loan.amount * (1 + (loan.interest_rate || 0) / 100),
      delivery_mode: loan.delivery_mode ?? "Efectivo",
    }))

    if (statusFilter === "active") {
      loansWithDefaults = loansWithDefaults.filter(
        (loan) => loan.status === "Activo" || loan.status === "En Mora" || loan.status === "activo",
      )
    }

    return NextResponse.json(loansWithDefaults, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ detail: `Fallo inesperado en GET /api/loans: ${e.message}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = (await request.json()) as CreateLoanBody

    if (!body.client_id || !body.amount || !body.installments || !body.installment_amount) {
      return NextResponse.json({ detail: "Faltan campos requeridos" }, { status: 400 })
    }

    const insertPayload = {
      client_id: body.client_id,
      amount: body.amount,
      installments: body.installments,
      installment_amount: body.installment_amount,
      delivery_mode: body.delivery_mode ?? "Efectivo",
      amount_to_repay: body.amount_to_repay ?? null,
      loan_type: body.loan_type ?? "Semanal",
      interest_rate: body.interest_rate ?? null,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      status: body.status ?? "activo",
    }

    console.log("Insertando préstamo con datos:", insertPayload)

    const { data, error } = await supabase.from("loans").insert([insertPayload]).select(loanSelect).single()

    if (error) {
      console.error("Error de Supabase:", error)
      return NextResponse.json({ detail: `Error creando préstamo: ${error.message}` }, { status: 500 })
    }

    console.log("Préstamo creado exitosamente:", data)
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    console.error("Error inesperado:", e)
    return NextResponse.json({ detail: `Fallo inesperado en POST /api/loans: ${e.message}` }, { status: 500 })
  }
}
