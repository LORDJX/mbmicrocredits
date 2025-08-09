-- Eliminar políticas y funciones antiguas para una limpieza completa
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
DROP FUNCTION IF EXISTS is_admin_user();

-- Crear una única función de ayuda para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_admin
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla 'partners'
CREATE POLICY "Allow admin full access" ON public.partners FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY "Allow all users to read active partners" ON public.partners FOR SELECT USING (deleted_at IS NULL);

-- Políticas para la tabla 'clients'
CREATE POLICY "Allow admin full access" ON public.clients FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY "Allow all users to read active clients" ON public.clients FOR SELECT USING (deleted_at IS NULL);

-- Políticas para la tabla 'loans'
CREATE POLICY "Allow admin full access" ON public.loans FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY "Allow all users to read active loans" ON public.loans FOR SELECT USING (deleted_at IS NULL);

-- Políticas para la tabla 'transactions'
CREATE POLICY "Allow admin full access" ON public.transactions FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY "Allow all users to read transactions" ON public.transactions FOR SELECT USING (true);

-- Políticas para la tabla 'follow_ups'
CREATE POLICY "Allow admin full access" ON public.follow_ups FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY "Allow all users to read follow_ups" ON public.follow_ups FOR SELECT USING (true);

-- Políticas para la tabla 'profiles'
CREATE POLICY "Allow admin full access" ON public.profiles FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY "Allow users to view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
