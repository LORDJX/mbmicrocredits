import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const { data: clients, error } = await supabase
      .from("active_clients")
      .select("id, client_code, first_name, last_name, phone, email")
      .order("first_name", { ascending: true })

    if (error) {
      console.error("Error fetching clients:", error)
      return NextResponse.json({ detail: "Error al obtener los clientes: " + error.message }, { status: 500 })
    }

    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error in clients API:", error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}
