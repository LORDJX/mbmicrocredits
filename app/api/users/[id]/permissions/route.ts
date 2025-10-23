import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function isAdmin(supabase: ReturnType<typeof createClient>, uid: string) {
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", uid).maybeSingle()
  return !!data?.is_admin
}

// (opcional) allowlist de rutas válidas; mantenela sincronizada con tu router
const ALLOWED_ROUTE_PREFIXES = ["/dashboard"]
// Si preferís una allowlist estricta, reemplazá por un array de rutas exactas:
// const ALLOWED_ROUTES = ["/dashboard", "/dashboard/clients", "/dashboard/loans", ...];

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const admin = await isAdmin(supabase, user.id)
    // Solo el propio usuario o un admin pueden ver permisos
    if (!admin && user.id !== params.id) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 })
    }

    const { data: permissions, error } = await supabase
      .from("user_permissions")
      .select("id, route_path")
      .eq("user_id", params.id)

    if (error) {
      console.error("Error fetching permissions:", error)
      return NextResponse.json({ error: "Error al obtener permisos" }, { status: 500 })
    }

    return NextResponse.json({ permissions: permissions ?? [] })
  } catch (error) {
    console.error("Error in GET /api/users/[id]/permissions:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    // Solo admin puede modificar permisos de otros (o de sí mismo)
    const admin = await isAdmin(supabase, user.id)
    if (!admin) return NextResponse.json({ error: "Prohibido" }, { status: 403 })

    const body = await request.json()
    const { route_paths } = body as { route_paths: string[] }

    if (!Array.isArray(route_paths)) {
      return NextResponse.json({ error: "route_paths debe ser un array" }, { status: 400 })
    }

    // Validación básica: deben ser strings y coincidir con prefijos permitidos
    const sanitized = route_paths
      .filter((p) => typeof p === "string")
      .map((p) => p.trim())
      .filter((p) => p.startsWith("/")) // formato básico
      .filter((p) => ALLOWED_ROUTE_PREFIXES.some((pref) => p === pref || p.startsWith(pref + "/")))

    // Eliminar permisos existentes del usuario
    const { error: delErr } = await supabase.from("user_permissions").delete().eq("user_id", params.id)
    if (delErr) {
      console.error("Error deleting permissions:", delErr)
      return NextResponse.json({ error: "No se pudieron limpiar los permisos" }, { status: 500 })
    }

    // Insertar nuevos (si hay)
    let inserted = []
    if (sanitized.length > 0) {
      const rows = sanitized.map((route_path) => ({ user_id: params.id, route_path }))
      const { data: newPermissions, error } = await supabase.from("user_permissions").insert(rows).select("id, route_path")
      if (error) {
        console.error("Error updating permissions:", error)
        return NextResponse.json({ error: "Error al actualizar permisos" }, { status: 500 })
      }
      inserted = newPermissions ?? []
    }

    return NextResponse.json({ permissions: inserted })
  } catch (error) {
    console.error("Error in POST /api/users/[id]/permissions:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
