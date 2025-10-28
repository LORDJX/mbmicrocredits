import { createClient } from "path-to-createClient" // Declare the createClient variable
import { NextResponse } from "next/server" // Declare the NextResponse variable

export async function GET() {
  try {
    const supabase = await createClient() // ✅ AGREGADO await

    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching clients:", error)
      return NextResponse.json({ error: "Error al cargar los clientes" }, { status: 500 })
    }

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Error inesperado al cargar los clientes" }, { status: 500 })
  }
}
