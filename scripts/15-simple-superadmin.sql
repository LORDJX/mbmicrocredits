-- Crear superadministrador de forma simple
-- Este script crea el usuario jcadmin usando el método estándar de Supabase

-- Primero, eliminar cualquier usuario existente con este email
DELETE FROM auth.users WHERE email = 'jcadmin@microcreditos.com';
DELETE FROM public.profiles WHERE email = 'jcadmin@microcreditos.com';

-- Crear el usuario en auth.users con los campos mínimos necesarios
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'jcadmin@microcreditos.com',
    crypt('30473781', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"username": "jcadmin"}',
    false,
    '',
    '',
    '',
    ''
);

-- Crear el perfil correspondiente
INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    is_admin,
    is_superadmin,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'jcadmin@microcreditos.com'),
    'jcadmin@microcreditos.com',
    'jcadmin',
    'Super Administrador',
    true,
    true,
    NOW(),
    NOW()
);

-- Verificar que se creó correctamente
SELECT 
    u.email,
    u.created_at as user_created,
    p.username,
    p.is_admin,
    p.is_superadmin,
    p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'jcadmin@microcreditos.com';
