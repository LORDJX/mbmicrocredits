import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 *
 * Logs out the current user by:
 * 1. Calling Supabase signOut to invalidate the session
 * 2. Clearing authentication cookies
 * 3. Returning a success response
 */
export async function POST() {
  try {
    const supabase = await createClient()

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error signing out:', error)
      return NextResponse.json(
        { error: 'Error al cerrar sesión', details: error.message },
        { status: 500 }
      )
    }

    // Create success response
    const response = NextResponse.json(
      { message: 'Sesión cerrada exitosamente' },
      { status: 200 }
    )

    // Clear authentication cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    return response
  } catch (error) {
    console.error('Unexpected error during logout:', error)
    return NextResponse.json(
      { error: 'Error inesperado al cerrar sesión' },
      { status: 500 }
    )
  }
}
