-- Eliminando completamente la recursión RLS usando aproximación sin consultas a profiles
-- Eliminar todas las políticas y funciones existentes
DROP POLICY IF EXISTS "Allow admin full access" ON public.partners;
DROP POLICY IF EXISTS "Allow all users to read active partners" ON public.partners;
DROP POLICY IF EXISTS "Allow admin full access" ON public.clients;
DROP POLICY IF EXISTS "Allow all users to read active clients" ON public.clients;
DROP POLICY IF EXISTS "Allow admin full access" ON public.loans;
DROP POLICY IF EXISTS "Allow all users to read active loans" ON public.loans;
DROP POLICY IF EXISTS "Allow admin full access" ON public.transactions;
DROP POLICY IF EXISTS "Allow all users to read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow admin full access" ON public.follow_ups;
DROP POLICY IF EXISTS "Allow all users to read follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Allow admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role full access" ON public.profiles;
DROP FUNCTION IF EXISTS is_admin_user();

-- Habilitar RLS en todas las tablas
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas que NO usan funciones que consulten otras tablas
-- Políticas para la tabla 'profiles' - Acceso básico sin recursión
CREATE POLICY "Allow users to view their own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Políticas permisivas para todas las demás tablas - sin verificación de admin
-- Esto permite que las APIs funcionen sin recursión
CREATE POLICY "Allow all authenticated users full access" ON public.partners 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users full access" ON public.clients 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users full access" ON public.loans 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users full access" ON public.transactions 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users full access" ON public.follow_ups 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Política especial para service role que bypasea todo
CREATE POLICY "Allow service role full access" ON public.profiles 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role full access" ON public.partners 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role full access" ON public.clients 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role full access" ON public.loans 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role full access" ON public.transactions 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role full access" ON public.follow_ups 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
