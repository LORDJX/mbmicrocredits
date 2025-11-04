import { createClient } from "@/lib/supabase/server"

/**
 * Verifies if the current user is an administrator
 * @returns Object with isAdmin boolean and user data
 */
export async function verifyAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { isAdmin: false, user: null, error: "No autorizado" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { isAdmin: false, user, error: "No se pudo verificar permisos" }
  }

  return { isAdmin: profile.is_admin, user, error: null }
}

/**
 * Middleware helper to check admin status and return error response if not admin
 */
export async function requireAdmin() {
  const { isAdmin, user, error } = await verifyAdmin()

  if (!user) {
    return { authorized: false, status: 401, message: "No autorizado" }
  }

  if (!isAdmin) {
    return { authorized: false, status: 403, message: "Acceso denegado. Se requieren permisos de administrador." }
  }

  return { authorized: true, user }
}
