-- Script para arreglar perfiles de usuario faltantes
-- Este script crea perfiles para usuarios que existen en auth.users pero no en profiles

-- Primero, verificar usuarios sin perfil
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Crear perfiles para usuarios que no los tienen
    FOR user_record IN 
        SELECT au.id, au.email, au.created_at
        FROM auth.users au
        LEFT JOIN profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        -- Insertar perfil para el usuario
        INSERT INTO profiles (
            id,
            email,
            full_name,
            is_admin,
            is_superadmin,
            created_at,
            updated_at
        ) VALUES (
            user_record.id,
            user_record.email,
            COALESCE(split_part(user_record.email, '@', 1), 'Usuario'),
            false, -- Por defecto no es admin
            false, -- Por defecto no es superadmin
            user_record.created_at,
            NOW()
        );
        
        RAISE NOTICE 'Perfil creado para usuario: %', user_record.email;
    END LOOP;
END $$;

-- Verificar que todos los usuarios tengan perfiles
SELECT 
    'Usuarios sin perfil:' as status,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Mostrar todos los perfiles existentes
SELECT 
    p.email,
    p.full_name,
    p.is_admin,
    p.is_superadmin,
    p.created_at
FROM profiles p
ORDER BY p.created_at;
