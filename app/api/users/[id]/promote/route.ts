import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: requestingUser } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (!requestingUser.user) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 401 })
    }

    // Verificar si el usuario solicitante es administrador
    const { data: requestingProfile } = await supabase
      .from("profiles")
      .select("is_admin, is_superadmin")
      .eq("id", requestingUser.user.id)
      .single()

    if (!requestingProfile?.is_admin) {
      return NextResponse.json({ error: "Solo administradores pueden cambiar roles" }, { status: 403 })
    }

    const { action } = await request.json()

    if (action === "promote" && !requestingProfile.is_superadmin) {
      return NextResponse.json({ error: "Solo superadministradores pueden promover a administrador" }, { status: 403 })
    }

    const updateData = action === "promote" ? { is_admin: true } : { is_admin: false }

    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", params.id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Usuario ${action === "promote" ? "promovido a" : "degradado de"} administrador exitosamente`,
      user: data,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
