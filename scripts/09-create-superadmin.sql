-- Crear usuario superadministrador jcadmin
-- Insertar usuario en auth.users con contraseña encriptada
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
    email_change_token_new,
    recovery_token,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    last_sign_in_at,
    phone,
    phone_confirmed_at,
    phone_change_token,
    phone_change,
    phone_change_sent_at,
    confirmed_at,
    email_change_sent_at,
    recovery_sent_at,
    invited_at,
    action_link,
    email_change,
    is_sso_user,
    deleted_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'jcadmin@microcreditos.com',
    crypt('30473781', gen_salt('bf')), -- Encriptar contraseña usando bcrypt
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '',
    0,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"username": "jcadmin", "full_name": "Super Administrador"}',
    true, -- Marcar como super admin
    now(),
    null,
    null,
    '',
    '',
    null,
    now(),
    null,
    null,
    null,
    '',
    '',
    false,
    null
) ON CONFLICT (email) DO NOTHING;

-- Crear perfil para el superadministrador
INSERT INTO profiles (
    id,
    username,
    full_name,
    is_admin,
    updated_at
) 
SELECT 
    id,
    'jcadmin',
    'Super Administrador',
    true,
    now()
FROM auth.users 
WHERE email = 'jcadmin@microcreditos.com'
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    is_admin = EXCLUDED.is_admin,
    updated_at = EXCLUDED.updated_at;

-- Asegurar que el superadmin tenga acceso a todas las políticas RLS
-- Actualizar políticas existentes para incluir superadmin
DO $$
BEGIN
    -- Verificar si el usuario fue creado correctamente
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'jcadmin@microcreditos.com') THEN
        RAISE NOTICE 'Superadministrador jcadmin creado exitosamente';
    ELSE
        RAISE EXCEPTION 'Error al crear el superadministrador jcadmin';
    END IF;
END $$;
