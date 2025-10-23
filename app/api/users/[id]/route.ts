import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: v, error } = await supabase.from("v_users").select("*").eq("id", params.id).maybeSingle()
  if (error || !v) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  return NextResponse.json({
    user: {
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
    },
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user: admin } } = await supabase.auth.getUser()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", admin.id).maybeSingle()
  if (!me?.is_admin) return NextResponse.json({ error: "Prohibido" }, { status: 403 })

  const body = await request.json()
  const { first_name, last_name, dni, phone, address, role_id, is_active } = body

  const { data: up, error } = await supabase
    .from("profiles")
    .update({
      first_name, last_name, dni, phone, address,
      role_id: role_id ?? null,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select("*")
    .maybeSingle()

  if (error) return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })

  const { data: v } = await supabase.from("v_users").select("*").eq("id", params.id).maybeSingle()
  return NextResponse.json({
    user: v ? {
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
    } : up,
  })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user: admin } } = await supabase.auth.getUser()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", admin.id).maybeSingle()
  if (!me?.is_admin) return NextResponse.json({ error: "Prohibido" }, { status: 403 })

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", params.id)

  if (error) return NextResponse.json({ error: "Error al desactivar" }, { status: 500 })
  return NextResponse.json({ message: "Usuario desactivado" })
}
