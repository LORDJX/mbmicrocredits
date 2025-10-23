import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { data: client, error } = await supabase
      .from("active_clients")
      .select("*")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching client:", error)
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error("Error in GET /api/clients/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { first_name, last_name, dni, phone, email, address, referred_by, observations, status } = body

    // Verificar si el DNI ya existe en otro cliente
    if (dni) {
      const { data: existingClient } = await supabase
        .from("active_clients")
        .select("id")
        .eq("dni", dni)
        .neq("id", params.id)
        .is("deleted_at", null)
        .single()

      if (existingClient) {
        return NextResponse.json(
          {
            error: "Ya existe otro cliente con este DNI",
          },
          { status: 409 },
        )
      }
    }

    // Actualizar cliente
    const { data: updatedClient, error } = await supabase
      .from("active_clients")
      .update({
        first_name,
        last_name,
        dni,
        phone,
        email,
        address,
        referred_by,
        observations,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating client:", error)
      return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 })
    }

    return NextResponse.json({ client: updatedClient })
  } catch (error) {
    console.error("Error in PATCH /api/clients/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verificar si el cliente tiene préstamos activos
    const { data: activeLoans } = await supabase
      .from("active_loans")
      .select("id")
      .eq("client_id", params.id)
      .in("status", ["active", "pending"])
      .is("deleted_at", null)

    if (activeLoans && activeLoans.length > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar un cliente con préstamos activos",
        },
        { status: 409 },
      )
    }

    // Soft delete - marcar como eliminado
    const { error } = await supabase
      .from("active_clients")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (error) {
      console.error("Error deleting client:", error)
      return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 })
    }

    return NextResponse.json({ message: "Cliente eliminado correctamente" })
  } catch (error) {
    console.error("Error in DELETE /api/clients/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
