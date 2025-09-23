import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")

    let query = supabase
      .from("clients")
      .select("id, client_code, first_name, last_name, phone, email, status")
      .order("created_at", { ascending: false })

    if (status === "active") {
      query = query.eq("status", "active")
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
