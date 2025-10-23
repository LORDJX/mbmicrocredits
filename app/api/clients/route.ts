import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    let query = supabase
      .from("active_clients")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    // Aplicar filtros
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,dni.ilike.%${search}%,client_code.ilike.%${search}%`,
      )
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: clients, error } = await query

    if (error) {
      console.error("Error fetching clients:", error)
      return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
    }

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error in GET /api/clients:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, dni, phone, email, address, referred_by, observations, status = "active" } = body

    // Validar campos requeridos
    if (!first_name || !last_name || !dni) {
      return NextResponse.json(
        {
          error: "Campos requeridos: first_name, last_name, dni",
        },
        { status: 400 },
      )
    }

    // Verificar si el DNI ya existe
    const { data: existingClient } = await supabase
      .from("active_clients")
      .select("id")
      .eq("dni", dni)
      .is("deleted_at", null)
      .single()

    if (existingClient) {
      return NextResponse.json(
        {
          error: "Ya existe un cliente con este DNI",
        },
        { status: 409 },
      )
    }

    // Generar código de cliente único
    const { data: lastClient } = await supabase
      .from("active_clients")
      .select("client_code")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (lastClient?.client_code) {
      const match = lastClient.client_code.match(/CL(\d+)/)
      if (match) {
        nextNumber = Number.parseInt(match[1]) + 1
      }
    }
    const client_code = `CL${nextNumber.toString().padStart(4, "0")}`

    // Crear cliente
    const { data: newClient, error } = await supabase
      .from("active_clients")
      .insert({
        first_name,
        last_name,
        dni,
        phone,
        email,
        address,
        referred_by,
        observations,
        status,
        client_code,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating client:", error)
      return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 })
    }

    return NextResponse.json({ client: newClient }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/clients:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
