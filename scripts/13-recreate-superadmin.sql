-- Recrear superadministrador jcadmin de forma más robusta
-- Primero eliminar si existe
DELETE FROM auth.users WHERE email = 'jcadmin@microcreditos.com';
DELETE FROM public.profiles WHERE email = 'jcadmin@microcreditos.com';

-- Crear usuario en auth.users con contraseña hasheada correctamente
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'jcadmin@microcreditos.com',
  crypt('30473781', gen_salt('bf')), -- Usar bcrypt para hashear la contraseña
  NOW(),
  NOW(),
  '',
  NOW(),
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "jcadmin", "full_name": "Super Administrador"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL
);

-- Obtener el ID del usuario recién creado
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'jcadmin@microcreditos.com';
  
  -- Crear perfil en public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    phone,
    address,
    city,
    country,
    postal_code,
    date_of_birth,
    gender,
    occupation,
    monthly_income,
    employment_status,
    credit_score,
    is_admin,
    is_superadmin,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'jcadmin@microcreditos.com',
    'jcadmin',
    'Super Administrador',
    '+54911234567',
    'Oficina Central',
    'Buenos Aires',
    'Argentina',
    '1000',
    '1980-01-01',
    'other',
    'Administrador de Sistema',
    999999.99,
    'employed',
    850,
    true,
    true,
    NOW(),
    NOW()
  );
END $$;

-- Verificar que se creó correctamente
SELECT 
  u.email,
  u.email_confirmed_at,
  p.username,
  p.full_name,
  p.is_admin,
  p.is_superadmin
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'jcadmin@microcreditos.com';
