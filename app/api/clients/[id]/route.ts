// Rutas: /api/clients/[id] (GET, PATCH, DELETE)
// DELETE aplica soft delete actualizando deleted_at.

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.")
  }
  return createClient(url, serviceKey)
}

const baseSelect = `
  id,
  client_code,
  first_name,
  last_name,
  dni,
  address,
  phone,
  email,
  referred_by,
  status,
  observations,
  dni_photo_url,
  dni_front_url,
  dni_back_url,
  created_at,
  updated_at,
  deleted_at
`

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getAdminClient()
    const { id } = params
    const { data, error, status } = await supabase.from("clients").select(baseSelect).eq("id", id).single()

    if (error) {
      return NextResponse.json(
        { detail: "Error al obtener cliente", error: { message: error.message, code: error.code } },
        { status: status || 500 },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error("❌ Error en GET /api/clients/[id]:", err)
    return NextResponse.json({ detail: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getAdminClient()
    const { id } = params
    const body = await request.json()

    // Campos permitidos al actualizar
    const updateData: Record<string, any> = {}
    const allowed = [
      "first_name",
      "last_name",
      "dni",
      "address",
      "phone",
      "email",
      "referred_by",
      "status",
      "observations",
      "dni_photo_url", // legacy (opcional)
      "dni_front_url",
      "dni_back_url",
    ]
    for (const key of allowed) {
      if (key in body) updateData[key] = body[key]
    }

    const { data, error, status } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", id)
      .select(baseSelect)
      .single()

    if (error) {
      return NextResponse.json(
        { detail: "Error al actualizar cliente", error: { message: error.message, code: error.code } },
        { status: status || 500 },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error("❌ Error en PATCH /api/clients/[id]:", err)
    return NextResponse.json({ detail: String(err) }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getAdminClient()
    const { id } = params
    const deletedAt = new Date().toISOString()

    const { data, error, status } = await supabase
      .from("clients")
      .update({ deleted_at: deletedAt })
      .eq("id", id)
      .select(
        `
        id,
        client_code,
        first_name,
        last_name,
        deleted_at
      `,
      )
      .single()

    if (error) {
      return NextResponse.json(
        { detail: "Error al eliminar (soft) cliente", error: { message: error.message, code: error.code } },
        { status: status || 500 },
      )
    }

    return NextResponse.json({ message: "Cliente eliminado (soft delete) correctamente.", data }, { status: 200 })
  } catch (err: any) {
    console.error("❌ Error en DELETE /api/clients/[id]:", err)
    return NextResponse.json({ detail: String(err) }, { status: 500 })
  }
}
