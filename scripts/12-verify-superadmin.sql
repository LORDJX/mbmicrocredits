-- Script para verificar que el superadministrador fue creado correctamente
-- y mostrar información de debug

-- Verificar si el usuario existe en auth.users
SELECT 
    'Usuario en auth.users' as tabla,
    id,
    email,
    created_at,
    email_confirmed_at,
    is_super_admin,
    raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE email = 'jcadmin@microcreditos.com';

-- Verificar si el perfil existe
SELECT 
    'Perfil en profiles' as tabla,
    id,
    username,
    full_name,
    is_admin,
    created_at,
    updated_at
FROM profiles 
WHERE username = 'jcadmin';

-- Verificar que las políticas RLS permiten acceso
SELECT 
    'Políticas RLS activas' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'loan_applications', 'payments')
ORDER BY tablename, policyname;

-- Mostrar información de debug
DO $$
DECLARE
    user_exists boolean;
    profile_exists boolean;
BEGIN
    -- Verificar usuario
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'jcadmin@microcreditos.com') INTO user_exists;
    
    -- Verificar perfil
    SELECT EXISTS(SELECT 1 FROM profiles WHERE username = 'jcadmin') INTO profile_exists;
    
    RAISE NOTICE 'Usuario jcadmin existe en auth.users: %', user_exists;
    RAISE NOTICE 'Perfil jcadmin existe en profiles: %', profile_exists;
    
    IF user_exists AND profile_exists THEN
        RAISE NOTICE 'Superadministrador configurado correctamente';
        RAISE NOTICE 'Usar: Usuario: jcadmin, Contraseña: 30473781';
    ELSE
        RAISE WARNING 'Problema con la configuración del superadministrador';
    END IF;
END $$;
