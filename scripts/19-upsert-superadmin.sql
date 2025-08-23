-- Script para crear o actualizar el superadministrador jcadmin
-- Maneja duplicados usando UPSERT

-- Primero verificamos si el usuario ya existe en auth.users
DO $$
DECLARE
    user_exists boolean;
    user_uuid uuid;
BEGIN
    -- Verificar si el usuario ya existe
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'jcadmin@microcreditos.com') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Generar un UUID para el nuevo usuario
        user_uuid := gen_random_uuid();
        
        -- Insertar el usuario en auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            role,
            aud,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        ) VALUES (
            user_uuid,
            '00000000-0000-0000-0000-000000000000',
            'jcadmin@microcreditos.com',
            crypt('30473781', gen_salt('bf')),
            now(),
            now(),
            now(),
            'authenticated',
            'authenticated',
            '',
            '',
            '',
            ''
        );
        
        RAISE NOTICE 'Usuario jcadmin creado con ID: %', user_uuid;
    ELSE
        -- Obtener el UUID del usuario existente
        SELECT id INTO user_uuid FROM auth.users WHERE email = 'jcadmin@microcreditos.com';
        
        -- Actualizar la contraseña del usuario existente
        UPDATE auth.users 
        SET 
            encrypted_password = crypt('30473781', gen_salt('bf')),
            updated_at = now()
        WHERE email = 'jcadmin@microcreditos.com';
        
        RAISE NOTICE 'Usuario jcadmin actualizado con ID: %', user_uuid;
    END IF;
    
    -- Usar UPSERT para el perfil (INSERT ... ON CONFLICT)
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        username,
        is_admin,
        is_superadmin,
        created_at,
        updated_at
    ) VALUES (
        user_uuid,
        'jcadmin@microcreditos.com',
        'Super Administrador',
        'jcadmin',
        true,
        true,
        now(),
        now()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        username = EXCLUDED.username,
        is_admin = EXCLUDED.is_admin,
        is_superadmin = EXCLUDED.is_superadmin,
        updated_at = now();
    
    RAISE NOTICE 'Perfil de jcadmin creado/actualizado correctamente';
    
END $$;

-- Verificar que el usuario fue creado correctamente
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    p.full_name,
    p.username,
    p.is_admin,
    p.is_superadmin,
    p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'jcadmin@microcreditos.com';
