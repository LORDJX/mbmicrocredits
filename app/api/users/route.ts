import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

type CreateUserBody = {
  email: string
  password?: string
  full_name?: string
  username?: string
  is_admin?: boolean
}

export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Faltan variables de entorno de Supabase")
    return NextResponse.json({ detail: "Configuración de Supabase incompleta" }, { status: 500 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const search = request.nextUrl.searchParams.get("search")?.trim() ?? ""

    let query = supabase
      .from("v_users")
      .select("*")
      .order("last_updated", { ascending: false })

    if (search) {
      query = query.or(\`username.ilike.%\${search}%,full_name.ilike.%\${search}%\`)
    }

    const { data, error, status } = await query
    
    if (error) {
      console.error("Error Supabase (GET /api/users):", error)
      return NextResponse.json({ detail: error.message || "Error al consultar usuarios" }, { status: status || 500 })
    }

    const users = data?.map(user => ({
      ...user,
      email: user.username,
    })) || []

    return NextResponse.json(users, { status: 200 })
  } catch (err: any) {
    console.error("Error interno (GET /api/users):", err)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ detail: "Configuración de Supabase incompleta" }, { status: 500 })
  }

  let body: CreateUserBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: "Cuerpo JSON inválido" }, { status: 400 })
  }

  const email = (body.email || "").trim().toLowerCase()
  const password = body.password?.trim()
  const full_name = body.full_name?.trim()
  const username = (body.username || email).trim().toLowerCase()
  const is_admin = !!body.is_admin

  if (!email) {
    return NextResponse.json({ detail: "El campo 'email' es requerido" }, { status: 400 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    let userId: string | undefined

    if (password && password.length >= 6) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: full_name ? { full_name } : undefined,
      })
      if (error) {
        console.error("Error createUser:", error)
        return NextResponse.json({ detail: error.message }, { status: 400 })
      }
      userId = data.user?.id
    } else {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: full_name ? { full_name } : undefined,
      })
      if (error) {
        console.error("Error inviteUserByEmail:", error)
        return NextResponse.json({ detail: error.message }, { status: 400 })
      }
      userId = data.user?.id
    }

    if (!userId) {
      return NextResponse.json({ detail: "No se obtuvo el ID del nuevo usuario" }, { status: 500 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, username, full_name: full_name || null, is_admin }, { onConflict: "id" })
      .select("*")
      .single()

    if (profileError) {
      console.error("Error upsert profile:", profileError)
      return NextResponse.json({ detail: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ ...profile, email: profile.username }, { status: 201 })
  } catch (err: any) {
    console.error("Error interno (POST /api/users):", err)
    return NextResponse.json({ detail: "Error interno del servidor" }, { status: 500 })
  }
}
