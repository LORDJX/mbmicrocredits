import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Rutas disponibles en el sistema
const AVAILABLE_ROUTES = [
  { path: "/dashboard", name: "Dashboard Principal" },
  { path: "/dashboard/clients", name: "Gestión de Clientes" },
  { path: "/dashboard/loans", name: "Gestión de Préstamos" },
  { path: "/dashboard/partners", name: "Gestión de Socios" },
  { path: "/dashboard/transactions", name: "Transacciones" },
  { path: "/dashboard/followups", name: "Seguimientos" },
  { path: "/dashboard/receipts", name: "Recibos" },
  { path: "/dashboard/reports", name: "Informe de situación Financiera" },
  { path: "/dashboard/resumen", name: "Resumen para Socios" },
  { path: "/dashboard/users", name: "Gestión de Usuarios" },
]

export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ detail: "Configuración de Supabase incompleta." }, { status: 500 })
  }

  const userId = request.nextUrl.searchParams.get("user_id")
  if (!userId) {
    return NextResponse.json({ detail: "Falta el parámetro user_id." }, { status: 400 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase.from("user_permissions").select("route_path").eq("user_id", userId)

    if (error) {
      console.error("Error al obtener permisos:", error)
      return NextResponse.json({ detail: error.message }, { status: 500 })
    }

    const userRoutes = data?.map((p) => p.route_path) || []

    return NextResponse.json({
      available_routes: AVAILABLE_ROUTES,
      user_routes: userRoutes,
    })
  } catch (err: any) {
    console.error("Error interno:", err)
    return NextResponse.json({ detail: "Error interno del servidor." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ detail: "Configuración de Supabase incompleta." }, { status: 500 })
  }

  let body: { user_id: string; routes: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: "Cuerpo JSON inválido." }, { status: 400 })
  }

  const { user_id, routes } = body
  if (!user_id || !Array.isArray(routes)) {
    return NextResponse.json({ detail: "user_id y routes son requeridos." }, { status: 400 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // Eliminar permisos existentes
    await supabase.from("user_permissions").delete().eq("user_id", user_id)

    // Insertar nuevos permisos
    if (routes.length > 0) {
      const permissions = routes.map((route) => ({
        user_id,
        route_path: route,
      }))

      const { error } = await supabase.from("user_permissions").insert(permissions)
      if (error) {
        console.error("Error al guardar permisos:", error)
        return NextResponse.json({ detail: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ message: "Permisos actualizados correctamente." })
  } catch (err: any) {
    console.error("Error interno:", err)
    return NextResponse.json({ detail: "Error interno del servidor." }, { status: 500 })
  }
}
