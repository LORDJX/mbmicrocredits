// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar que el usuario actual sea admin
    const { data: { user: admin } } = await supabase.auth.getUser()
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", admin.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Solo administradores pueden crear usuarios" }, { status: 403 })
    }

    // Obtener datos del request
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automáticamente
    })

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json(
        { error: error.message || "Error al crear usuario" },
        { status: 400 }
      )
    }

    return NextResponse.json({ user: data.user }, { status: 201 })
  } catch (error) {
    console.error("Error in signup:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
