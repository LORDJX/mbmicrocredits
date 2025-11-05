import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

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
