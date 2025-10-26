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
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!currentProfile?.is_admin && session.user.id !== id) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar este usuario' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      first_name, 
      last_name, 
      username, 
      email,
      is_admin,
      is_active,
      role_id,
      phone,
      dni,
      password 
    } = body

    // Actualizar en la tabla profiles
    const updateData: any = {}
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (username !== undefined) updateData.username = username
    if (phone !== undefined) updateData.phone = phone
    if (dni !== undefined) updateData.dni = dni
    
    // Solo admins pueden cambiar estos campos
    if (currentProfile?.is_admin) {
      if (is_admin !== undefined) updateData.is_admin = is_admin
      if (is_active !== undefined) updateData.is_active = is_active
      if (role_id !== undefined) updateData.role_id = role_id
    }

    // Calcular full_name si hay cambios en nombre
    if (first_name !== undefined || last_name !== undefined) {
      const finalFirstName = first_name !== undefined ? first_name : ''
      const finalLastName = last_name !== undefined ? last_name : ''
      updateData.full_name = finalFirstName && finalLastName 
        ? `${finalFirstName} ${finalLastName}` 
        : finalFirstName || finalLastName || username || email
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (profileError) {
      console.error('Error al actualizar profile:', profileError)
      return NextResponse.json(
        { error: 'Error al actualizar usuario', details: profileError.message },
        { status: 500 }
      )
    }

    // Si se proporcionó email o contraseña, actualizar en Auth (solo admins)
    if (currentProfile?.is_admin && (email || password)) {
      const authUpdateData: any = {}
      if (email) authUpdateData.email = email
      if (password) authUpdateData.password = password

      const { error: authError } = await supabase.auth.admin.updateUserById(
        id,
        authUpdateData
      )

      if (authError) {
        console.error('Error al actualizar Auth:', authError)
        return NextResponse.json(
          { 
            error: 'Usuario actualizado parcialmente', 
            details: `Profile actualizado pero error en Auth: ${authError.message}`,
            profile: profileData
          },
          { status: 500 }
        )
      }
    }

    // Obtener email actualizado
    const { data: authUser } = await supabase.auth.admin.getUserById(id)

    return NextResponse.json({
      ...profileData,
      email: authUser.user?.email || email
    })
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
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!currentProfile?.is_admin) {
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

    // Eliminar de Supabase Auth (esto también eliminará el profile por CASCADE)
    const { error: authError } = await supabase.auth.admin.deleteUser(id)

    if (authError) {
      console.error('Error al eliminar usuario de Auth:', authError)
      return NextResponse.json(
        { error: 'Error al eliminar usuario', details: authError.message },
        { status: 500 }
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

    // Obtener profile con rol
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .single()

    if (profileError) {
      console.error('Error al obtener profile:', profileError)
      return NextResponse.json(
        { error: 'Usuario no encontrado', details: profileError.message },
        { status: 404 }
      )
    }

    // Obtener email de auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(id)

    return NextResponse.json({
      ...profile,
      email: authUser.user?.email || '',
      created_at: authUser.user?.created_at,
      role: profile.user_roles
    })
  } catch (error) {
    console.error('Error en GET /api/users/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
