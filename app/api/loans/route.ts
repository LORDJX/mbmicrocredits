import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

type CreateLoanBody = {
  client_id: string
  amount: number
  installments: number
  loan_type?: string | null
  interest_rate?: number | null
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

    // Búsqueda por cliente (código o nombre)
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

    let query = supabase.from("loans").select(loanSelect).order("created_at", { ascending: false })

    if (term && term.length > 0) {
      const orParts = [`loan_code.ilike.%${term}%`]
      if (clientIds.length > 0) {
        // or=(loan_code.ilike.*term*,client_id.in.(uuid1,uuid2))
        orParts.push(`client_id.in.(${clientIds.join(",")})`)
      }
      query = query.or(orParts.join(","))
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ detail: `Error listando préstamos: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json(data ?? [], { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ detail: `Fallo inesperado en GET /api/loans: ${e.message}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = (await request.json()) as CreateLoanBody

    const insertPayload = {
      client_id: body.client_id,
      amount: body.amount,
      installments: body.installments,
      loan_type: body.loan_type ?? null,
      interest_rate: body.interest_rate ?? null,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      status: body.status ?? "activo",
      // loan_code: se asume que lo genera la BD mediante trigger/función
    }

    const { data, error } = await supabase.from("loans").insert([insertPayload]).select(loanSelect).single()

    if (error) {
      return NextResponse.json({ detail: `Error creando préstamo: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ detail: `Fallo inesperado en POST /api/loans: ${e.message}` }, { status: 500 })
  }
}
