-- Crear el superadministrador jcadmin usando el método correcto
-- Este script debe ejecutarse desde la consola de Supabase o mediante la API

-- Primero, verificar si el usuario ya existe y eliminarlo si es necesario
DELETE FROM auth.users WHERE email = 'jcadmin@microcreditos.com';
DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'jcadmin@microcreditos.com'
);

-- Crear el usuario usando la función de registro de Supabase
-- Nota: Este script debe ejecutarse con privilegios de servicio
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
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
  '{"full_name": "Super Administrador"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Crear el perfil del superadministrador
INSERT INTO public.profiles (
  id,
  full_name,
  username,
  is_admin,
  updated_at
) 
SELECT 
  id,
  'Super Administrador',
  'jcadmin',
  true,
  NOW()
FROM auth.users 
WHERE email = 'jcadmin@microcreditos.com';

-- Verificar que se creó correctamente
SELECT 
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.username,
  p.is_admin
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'jcadmin@microcreditos.com';
