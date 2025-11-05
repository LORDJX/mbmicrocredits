import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function validateAdmin(userId: string): Promise<boolean> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()
  
  return profile?.is_admin === true
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Acceso denegado. Se requieren permisos de administrador.' },
    { status: 403 }
  )
}

// Función que usan los archivos actuales
export async function requireAdmin() {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      authorized: false,
      message: "No autorizado",
      status: 401
    }
  }
  
  const isAdmin = await validateAdmin(user.id)
  
  if (!isAdmin) {
    return {
      authorized: false,
      message: "Acceso denegado. Se requieren permisos de administrador.",
      status: 403
    }
  }
  
  return {
    authorized: true,
    userId: user.id
  }
}
