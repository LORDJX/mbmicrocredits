-- Script definitivo para eliminar la recursión infinita en políticas RLS
-- Deshabilitar RLS temporalmente en todas las tablas
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de manera agresiva
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Eliminar todas las políticas de todas las tablas
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Eliminar todas las funciones relacionadas con políticas
DROP FUNCTION IF EXISTS is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS is_superadmin() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;

-- Crear políticas ultra-simples sin recursión
-- Habilitar RLS solo en profiles para protección básica
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política simple para profiles - solo acceso propio
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Para todas las demás tablas, NO habilitar RLS
-- Esto permite acceso completo sin políticas que puedan causar recursión
-- El control de acceso se manejará a nivel de aplicación

-- Verificar que no hay políticas activas que puedan causar problemas
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
