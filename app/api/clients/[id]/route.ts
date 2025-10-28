import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching client:", error)
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // También obtener los préstamos del cliente
    const { data: loans, error: loansError } = await supabase
      .from("loans")
      .select("*")
      .eq("client_id", params.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (loansError) {
      console.error("Error fetching client loans:", loansError)
    }

    return NextResponse.json({
      client,
      loans: loans || [],
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Error inesperado al cargar el cliente" }, { status: 500 })
  }
}
