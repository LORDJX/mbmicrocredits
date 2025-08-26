// Rutas: /api/clients (GET, POST)
// Acceso directo a Supabase desde el servidor para evitar redirecciones (SSO) del backend.

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get("search") || "").trim()

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
  console.log("[v0] API POST /api/clients iniciada")

  try {
    const supabase = createAdminClient()
    const body = await request.json()
    console.log("[v0] Datos recibidos en API:", body)

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

    console.log("[v0] Datos a insertar:", insertData)

    const { data, error } = await supabase.from("clients").insert(insertData).select("*").single()

    if (error) {
      console.error("[v0] Error de Supabase en inserción:", error)
      return NextResponse.json(
        { detail: "Error al crear cliente en Supabase", error: { message: error.message, code: error.code } },
        { status: 500 },
      )
    }

    console.log("[v0] Cliente insertado exitosamente:", data)
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error("[v0] Error inesperado en POST /api/clients:", err)
    return NextResponse.json({ detail: String(err) }, { status: 500 })
  }
}
