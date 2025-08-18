import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

type UpdateUserBody = {
  email?: string // actualizar email en Auth (opcional)
  username?: string
  full_name?: string
  is_admin?: boolean
  new_password?: string // Agregando campo para reseteo de contraseña
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Faltan variables de entorno de Supabase (SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY).")
    return NextResponse.json({ detail: "Configuración de Supabase incompleta en el servidor." }, { status: 500 })
  }

  const userId = context.params?.id
  if (!userId) {
    return NextResponse.json({ detail: "Falta el parámetro 'id'." }, { status: 400 })
  }

  let body: UpdateUserBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: "Cuerpo JSON inválido." }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const username = body.username?.trim().toLowerCase()
  const full_name = body.full_name?.trim()
  const is_admin = body.is_admin
  const new_password = body.new_password?.trim() // Extrayendo nueva contraseña del body

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    console.log("[v0] API: Actualizando usuario", userId, {
      email,
      username,
      full_name,
      is_admin,
      has_password: !!new_password,
    }) // Agregando logs de debug para rastrear actualizaciones

    // Si se provee email, actualizar también en Auth
    if (email) {
      const { error: authUpdateError, status: authStatus } = await supabase.auth.admin.updateUserById(userId, {
        email,
      })
      if (authUpdateError) {
        console.error("Error updateUserById (email):", authUpdateError)
        return NextResponse.json(
          { detail: authUpdateError.message || "No se pudo actualizar el email del usuario." },
          { status: authStatus || 400 },
        )
      }
    }

    if (new_password) {
      console.log("[v0] API: Actualizando contraseña del usuario")
      const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
        password: new_password,
      })
      if (passwordError) {
        console.error("Error updateUserById (password):", passwordError)
        return NextResponse.json(
          { detail: passwordError.message || "No se pudo actualizar la contraseña del usuario." },
          { status: 400 },
        )
      }
    }

    const updatePayload: Record<string, any> = {}
    if (typeof username !== "undefined") updatePayload.username = username || null
    if (typeof full_name !== "undefined") updatePayload.full_name = full_name || null
    if (typeof is_admin !== "undefined") updatePayload.is_admin = !!is_admin

    console.log("[v0] API: Actualizando perfil con payload:", updatePayload)

    if (Object.keys(updatePayload).length === 0) {
      // Si no hay cambios en el perfil, retornar el perfil actual
      const {
        data: current,
        error: currentErr,
        status: currentStatus,
      } = await supabase
        .from("profiles")
        .select("id, username, full_name, is_admin, updated_at")
        .eq("id", userId)
        .single()
      if (currentErr) {
        console.error("[v0] API: Error al obtener perfil actual:", currentErr)
        return NextResponse.json(
          { detail: currentErr.message || "No se pudo recuperar el perfil." },
          { status: currentStatus || 500 },
        )
      }
      console.log("[v0] API: Retornando perfil actual sin cambios:", current)
      return NextResponse.json(current, { status: 200 })
    }

    const { data, error, status } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .select("id, username, full_name, is_admin, updated_at")
      .single()

    if (error) {
      console.error("Error Supabase (PATCH /api/users/[id]):", error)
      return NextResponse.json(
        { detail: error.message || "Error al actualizar el perfil del usuario." },
        { status: status || 500 },
      )
    }

    console.log("[v0] API: Usuario actualizado exitosamente:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error("Error interno (PATCH /api/users/[id]):", err)
    return NextResponse.json({ detail: "Error interno del servidor al actualizar el usuario." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Faltan variables de entorno de Supabase (SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY).")
    return NextResponse.json({ detail: "Configuración de Supabase incompleta en el servidor." }, { status: 500 })
  }

  const userId = context.params?.id
  if (!userId) {
    return NextResponse.json({ detail: "Falta el parámetro 'id'." }, { status: 400 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // Eliminar usuario de Auth (esto también eliminará el perfil por CASCADE)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
    if (authDeleteError) {
      console.error("Error deleteUser:", authDeleteError)
      return NextResponse.json(
        { detail: authDeleteError.message || "No se pudo eliminar el usuario." },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Usuario eliminado correctamente." }, { status: 200 })
  } catch (err: any) {
    console.error("Error interno (DELETE /api/users/[id]):", err)
    return NextResponse.json({ detail: "Error interno del servidor al eliminar el usuario." }, { status: 500 })
  }
}
