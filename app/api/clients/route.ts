// Rutas: /api/clients (GET, POST)
// Acceso directo a Supabase desde el servidor para evitar redirecciones (SSO) del backend.

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function tryGetAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  try {
    return createClient(url, serviceKey)
  } catch (e) {
    console.error("Error creando cliente de Supabase:", e)
    return null
  }
}

export async function GET(request: Request) {
  try {
    const supabase = tryGetAdminClient()
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get("search") || "").trim()

    // Si no hay configuración de Supabase, devolvemos lista vacía para no romper la UI
    if (!supabase) {
      return NextResponse.json([], { status: 200, headers: { "x-debug": "supabase-not-configured" } })
    }

    // Selección amplia para evitar errores por columnas inexistentes en distintas migraciones
    let query = supabase.from("clients").select("*").order("created_at", { ascending: false })

    if (search) {
      // Busca por nombre, apellido o DNI
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,dni.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      // Modo seguro: no bloqueamos la UI, devolvemos [] con detalle en cabecera para depurar
      console.error("Supabase error en GET /api/clients:", error)
      return NextResponse.json([], {
        status: 200,
        headers: { "x-debug": `supabase-error: ${error.message}` },
      })
    }

    return NextResponse.json(data ?? [], { status: 200 })
  } catch (err: any) {
    console.error("❌ Error inesperado en GET /api/clients:", err)
    // También modo seguro
    return NextResponse.json([], { status: 200, headers: { "x-debug": `unexpected-error: ${String(err)}` } })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = tryGetAdminClient()
    if (!supabase) {
      // Sin Supabase, no podemos insertar. Devolvemos error claro para el formulario.
      return NextResponse.json(
        { detail: "Supabase no está configurado en el servidor (variables de entorno faltantes)." },
        { status: 500 },
      )
    }

    const body = await request.json()

    // Campos permitidos (usa solo lo que exista en tu esquema actual)
    const insertData: Record<string, any> = {
      first_name: body.first_name ?? "",
      last_name: body.last_name ?? "",
      dni: body.dni ?? null,
      address: body.address ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      referred_by: body.referred_by ?? null,
      status: body.status ?? "activo",
      observations: body.observations ?? null,
      // Campos opcionales; se insertarán solo si existen en tu esquema:
      dni_photo_url: body.dni_photo_url ?? null,
      dni_front_url: body.dni_front_url ?? null,
      dni_back_url: body.dni_back_url ?? null,
    }

    const { data, error } = await supabase.from("clients").insert(insertData).select("*").single()

    if (error) {
      console.error("Supabase error en POST /api/clients:", error)
      return NextResponse.json(
        { detail: "Error al crear cliente en Supabase", error: { message: error.message, code: error.code } },
        { status: 500 },
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error("❌ Error inesperado en POST /api/clients:", err)
    return NextResponse.json({ detail: String(err) }, { status: 500 })
  }
}
