-- Crear el superadministrador jcadmin de forma simple
-- Este script funciona con el esquema real de Supabase

-- Primero, limpiar cualquier usuario existente
DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'jcadmin@microcreditos.com'
);
DELETE FROM auth.users WHERE email = 'jcadmin@microcreditos.com';

-- Crear el usuario usando solo las columnas que existen
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'jcadmin@microcreditos.com',
  crypt('30473781', gen_salt('bf')),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Super Administrador"}',
  NOW(),
  NOW()
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
