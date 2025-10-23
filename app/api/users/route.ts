import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data, error } = await supabase
    .from("v_users")
    .select("*")
    .order("last_updated", { ascending: false })

  if (error) return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })

  const users = (data || []).map((r: any) => ({
    id: r.id,
    first_name: r.first_name,
    last_name: r.last_name,
    dni: r.dni,
    phone: r.phone,
    address: r.address,
    is_active: r.is_active,
    updated_at: r.last_updated,
    role_id: r.role_id,
    user_roles: r.role_id ? { id: r.role_id, name: r.role_name, description: r.role_description } : null,
  }))

  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user: admin } } = await supabase.auth.getUser()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  // sólo admin puede crear/editar perfiles
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", admin.id).maybeSingle()
  if (!me?.is_admin) return NextResponse.json({ error: "Prohibido" }, { status: 403 })

  const body = await request.json()
  const { id, first_name, last_name, dni, phone, address, role_id, is_active = true } = body

  if (!id) return NextResponse.json({ error: "Debes enviar 'id' (auth.users.id / profiles.id)" }, { status: 400 })
  if (!first_name || !last_name || !dni) {
    return NextResponse.json({ error: "Campos requeridos: first_name, last_name, dni" }, { status: 400 })
  }

  const { data: up, error } = await supabase
    .from("profiles")
    .upsert({
      id,
      first_name, last_name, dni, phone, address,
      role_id: role_id ?? null,
      is_active,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" })
    .select("*")
    .maybeSingle()

  if (error) return NextResponse.json({ error: "Error al guardar perfil" }, { status: 500 })

  const { data: v } = await supabase.from("v_users").select("*").eq("id", id).maybeSingle()
  const userDto = v ? {
    id: v.id,
    first_name: v.first_name,
    last_name: v.last_name,
    dni: v.dni,
    phone: v.phone,
    address: v.address,
    is_active: v.is_active,
    updated_at: v.last_updated,
    role_id: v.role_id,
    user_roles: v.role_id ? { id: v.role_id, name: v.role_name, description: v.role_description } : null,
  } : up

  return NextResponse.json({ user: userDto }, { status: 201 })
}
