import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET - Obtener todos los usuarios
export async function GET() {
  try {
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

    // Obtener usuarios con sus roles
    // Nota: email viene de auth.users, el resto de profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        full_name,
        username,
        is_admin,
        is_active,
        role_id,
        phone,
        dni,
        updated_at,
        user_roles (
          id,
          name,
          description
        )
      `)
      .order('updated_at', { ascending: false })

    if (profilesError) {
      console.error('Error al obtener profiles:', profilesError)
      return NextResponse.json(
        { error: 'Error al obtener usuarios', details: profilesError.message },
        { status: 500 }
      )
    }

    // Obtener emails de auth.users para cada perfil
    const usersWithEmails = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
        
        return {
          ...profile,
          email: authUser.user?.email || '',
          created_at: authUser.user?.created_at || profile.updated_at,
          role: profile.user_roles ? {
            id: profile.user_roles.id,
            name: profile.user_roles.name,
            description: profile.user_roles.description
          } : null
        }
      })
    )

    return NextResponse.json(usersWithEmails)
  } catch (error) {
    console.error('Error en GET /api/users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo usuario
export async function POST(request: Request) {
  try {
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
        { error: 'No tienes permisos para crear usuarios' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      username,
      is_admin,
      role_id,
      phone,
      dni
    } = body

    // Validar campos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        username
      }
    })

    if (authError) {
      console.error('Error al crear usuario en Auth:', authError)
      return NextResponse.json(
        { error: 'Error al crear usuario', details: authError.message },
        { status: 400 }
      )
    }

    // Calcular full_name
    const full_name = first_name && last_name 
      ? `${first_name} ${last_name}` 
      : first_name || last_name || username || email

    // Insertar en la tabla profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          first_name: first_name || null,
          last_name: last_name || null,
          full_name,
          username: username || null,
          is_admin: is_admin || false,
          is_active: true,
          role_id: role_id || null,
          phone: phone || null,
          dni: dni || null
        }
      ])
      .select()
      .single()

    if (profileError) {
      console.error('Error al insertar profile:', profileError)
      // Intentar eliminar el usuario de Auth si falla la inserción
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Error al crear perfil de usuario', details: profileError.message },
        { status: 500 }
      )
    }

    // Retornar el usuario creado con email
    return NextResponse.json({
      ...profileData,
      email: authData.user.email
    }, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
