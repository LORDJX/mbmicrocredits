import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get("search")
    const status = searchParams.get("status")

    let query = supabase
      .from("clients")
      .select(`
        id,
        client_code,
        first_name,
        last_name,
        phone,
        email,
        status,
        created_at
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,client_code.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching clients:", error)
      return NextResponse.json({ detail: `Error obteniendo clientes: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data || [], { status: 200 })
  } catch (e: any) {
    console.error("[v0] Clients API - Unexpected error in GET:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
