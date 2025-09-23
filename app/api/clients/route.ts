import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching clients...")
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
        address,
        status,
        created_at
      `)
      .order("client_code", { ascending: true })

    if (search) {
      query = query.or(`client_code.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    if (status === "active") {
      query = query.eq("status", "activo")
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching clients:", error)
      return NextResponse.json({ detail: `Error obteniendo clientes: ${error.message}` }, { status: 500 })
    }

    console.log("[v0] Clients fetched successfully:", (data || []).length)
    return NextResponse.json(data || [], { status: 200 })
  } catch (e: any) {
    console.error("[v0] Unexpected error in clients API:", e)
    return NextResponse.json({ detail: `Error inesperado: ${e.message}` }, { status: 500 })
  }
}
