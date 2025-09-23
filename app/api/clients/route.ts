import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("clients")
      .select(`
        id,
        client_code,
        first_name,
        last_name,
        phone,
        email,
        status
      `)
      .is("deleted_at", null)
      .eq("status", "active")
      .order("first_name", { ascending: true })

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
