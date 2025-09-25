import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams

    // Parámetros de filtro
    const term = searchParams.get("search")?.trim()
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = supabase
      .from("clients")
      .select(`
        id,
        client_code,
        first_name,
        last_name,
        phone,
        email,
        address,
        status,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    // Filtro por estado
    if (status) {
      query = query.eq("status", status)
    }

    // Búsqueda por término
    if (term && term.length > 0) {
      query = query.or(
        `first_name.ilike.%${term}%,last_name.ilike.%${term}%,client_code.ilike.%${term}%,phone.ilike.%${term}%`,
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching clients:", error)
      return NextResponse.json({ detail: `Error obteniendo clientes: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data || [], { status: 200 })
  } catch (e: any) {
    console.error("Unexpected error in GET /api/clients:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
