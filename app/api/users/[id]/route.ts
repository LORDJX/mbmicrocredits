import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// PUT - Actualizar usuario
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar permisos (admin o el mismo usuario)
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (currentUser?.role !== 'admin' && session.user.id !== id) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar este usuario' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, role, password } = body

    // Actualizar en la tabla users
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role && currentUser?.role === 'admin') updateData.role = role

    const { data: userData, error: userError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (userError) {
      console.error('Error al actualizar usuario:', userError)
      return NextResponse.json(
        { error: 'Error al actualizar usuario', details: userError.message },
        { status: 500 }
      )
    }

    // Si se proporcionó una nueva contraseña, actualizarla en Auth
    if (password && currentUser?.role === 'admin') {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        id,
        { password }
      )

      if (passwordError) {
        console.error('Error al actualizar contraseña:', passwordError)
        return NextResponse.json(
          { error: 'Usuario actualizado pero error al cambiar contraseña', details: passwordError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error en PUT /api/users/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario sea admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (currentUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar usuarios' },
        { status: 403 }
      )
    }

    // No permitir que un admin se elimine a sí mismo
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio usuario' },
        { status: 400 }
      )
    }

    // Eliminar de la tabla users
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (userError) {
      console.error('Error al eliminar usuario de tabla:', userError)
      return NextResponse.json(
        { error: 'Error al eliminar usuario', details: userError.message },
        { status: 500 }
      )
    }

    // Eliminar de Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id)

    if (authError) {
      console.error('Error al eliminar usuario de Auth:', authError)
      // El usuario ya fue eliminado de la tabla, reportar pero continuar
      return NextResponse.json(
        { 
          success: true, 
          warning: 'Usuario eliminado de la tabla pero error al eliminar de Auth',
          details: authError.message 
        }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en DELETE /api/users/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Obtener un usuario específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener usuario
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error al obtener usuario:', error)
      return NextResponse.json(
        { error: 'Usuario no encontrado', details: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error en GET /api/users/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
