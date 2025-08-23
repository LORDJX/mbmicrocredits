-- Script para probar la autenticación del superadministrador
-- Este script verifica que el usuario puede autenticarse correctamente

-- Verificar que el usuario existe en auth.users
SELECT 
  'Usuario en auth.users' as check_type,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  encrypted_password IS NOT NULL as has_password,
  created_at
FROM auth.users 
WHERE email = 'jcadmin@microcreditos.com';

-- Verificar que el perfil existe
SELECT 
  'Perfil en public.profiles' as check_type,
  email,
  username,
  full_name,
  is_admin,
  is_superadmin,
  created_at
FROM public.profiles 
WHERE email = 'jcadmin@microcreditos.com';

-- Verificar que la contraseña es correcta (esto no mostrará la contraseña real)
SELECT 
  'Verificación de contraseña' as check_type,
  email,
  CASE 
    WHEN encrypted_password = crypt('30473781', encrypted_password) 
    THEN 'Contraseña correcta' 
    ELSE 'Contraseña incorrecta' 
  END as password_check
FROM auth.users 
WHERE email = 'jcadmin@microcreditos.com';
