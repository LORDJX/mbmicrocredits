import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  try {
    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ detail: "Usuario no autenticado" }, { status: 401 })
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, website, is_admin, updated_at")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error al obtener perfil:", profileError)
      return NextResponse.json({ detail: "Error al obtener el perfil del usuario" }, { status: 500 })
    }

    // Combinar datos del usuario de Auth con el perfil
    const userProfile = {
      ...profile,
      email: user.email,
    }

    return NextResponse.json(userProfile)
  } catch (error: any) {
    console.error("Error interno en GET /api/profile:", error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  try {
    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ detail: "Usuario no autenticado" }, { status: 401 })
    }

    // Obtener datos del cuerpo de la petición
    const body = await request.json()
    const { username, full_name, avatar_url, website } = body

    // Actualizar perfil
    const updateData: any = {}
    if (username !== undefined) updateData.username = username || null
    if (full_name !== undefined) updateData.full_name = full_name || null
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url || null
    if (website !== undefined) updateData.website = website || null

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select("id, username, full_name, avatar_url, website, is_admin, updated_at")
      .single()

    if (updateError) {
      console.error("Error al actualizar perfil:", updateError)
      return NextResponse.json({ detail: "Error al actualizar el perfil" }, { status: 500 })
    }

    // Combinar con email del usuario
    const userProfile = {
      ...updatedProfile,
      email: user.email,
    }

    return NextResponse.json(userProfile)
  } catch (error: any) {
    console.error("Error interno en PATCH /api/profile:", error)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}
