// Rutas: /api/clients (GET, POST)
// Acceso directo a Supabase desde el servidor para evitar redirecciones (SSO) del backend.

import { NextResponse } from "next/server"
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

export async function GET(request: Request) {
  try {
    const supabase = getAdminClient()
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get("search") || "").trim()

    let query = supabase.from("clients").select(baseSelect).order("created_at", { ascending: false })

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,dni.ilike.%${search}%`)
    }

    const { data, error, status } = await query
    if (error) {
      return NextResponse.json(
        { detail: "Error al obtener clientes desde Supabase", error: { message: error.message, code: error.code } },
        { status: status || 500 },
      )
    }

    return NextResponse.json(data ?? [], { status: 200 })
  } catch (err: any) {
    console.error("❌ Error en GET /api/clients:", err)
    return NextResponse.json({ detail: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getAdminClient()
    const body = await request.json()

    const insertData = {
      first_name: body.first_name ?? "",
      last_name: body.last_name ?? "",
      dni: body.dni ?? null,
      address: body.address ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      referred_by: body.referred_by ?? null,
      status: body.status ?? "activo",
      observations: body.observations ?? null,
      dni_photo_url: body.dni_photo_url ?? null, // legacy opcional
      dni_front_url: body.dni_front_url ?? null,
      dni_back_url: body.dni_back_url ?? null,
    }

    const { data, error, status } = await supabase.from("clients").insert(insertData).select(baseSelect).single()

    if (error) {
      return NextResponse.json(
        { detail: "Error al crear cliente en Supabase", error: { message: error.message, code: error.code } },
        { status: status || 500 },
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error("❌ Error en POST /api/clients:", err)
    return NextResponse.json({ detail: String(err) }, { status: 500 })
  }
}
