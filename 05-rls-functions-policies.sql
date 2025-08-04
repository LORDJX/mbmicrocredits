-- Función SECURITY DEFINER para verificar el estado is_admin del usuario
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT is_admin FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas de RLS para partners
CREATE POLICY "Admins can manage all partners." ON partners
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Viewers can read active partners." ON partners
  FOR SELECT USING (deleted_at IS NULL);

-- Políticas de RLS para transactions
CREATE POLICY "Admins can manage all transactions." ON transactions
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Viewers can read all transactions." ON transactions
  FOR SELECT USING (TRUE);

-- Políticas de RLS para clients
CREATE POLICY "Admins can manage all clients." ON clients
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Viewers can read active clients." ON clients
  FOR SELECT USING (deleted_at IS NULL);

-- Políticas de RLS para loans
CREATE POLICY "Admins can manage all loans." ON loans
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Viewers can read active loans." ON loans
  FOR SELECT USING (deleted_at IS NULL);

-- Políticas de RLS para follow_ups
CREATE POLICY "Admins can manage all follow_ups." ON follow_ups
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Viewers can read all follow_ups." ON follow_ups
  FOR SELECT USING (TRUE);
