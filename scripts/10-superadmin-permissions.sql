-- Otorgar permisos completos al superadministrador
-- Actualizar políticas RLS para incluir acceso de superadmin

-- Política para partners - permitir todo al superadmin
DROP POLICY IF EXISTS "Partners policy" ON partners;
CREATE POLICY "Partners policy" ON partners
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE is_admin = true
        )
    );

-- Política para clients - permitir todo al superadmin
DROP POLICY IF EXISTS "Clients policy" ON clients;
CREATE POLICY "Clients policy" ON clients
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE is_admin = true
        )
    );

-- Política para loans - permitir todo al superadmin
DROP POLICY IF EXISTS "Loans policy" ON loans;
CREATE POLICY "Loans policy" ON loans
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE is_admin = true
        )
    );

-- Política para transactions - permitir todo al superadmin
DROP POLICY IF EXISTS "Transactions policy" ON transactions;
CREATE POLICY "Transactions policy" ON transactions
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE is_admin = true
        )
    );

-- Política para follow_ups - permitir todo al superadmin
DROP POLICY IF EXISTS "Follow ups policy" ON follow_ups;
CREATE POLICY "Follow ups policy" ON follow_ups
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE is_admin = true
        )
    );

-- Política para profiles - permitir que admins vean y editen todos los perfiles
DROP POLICY IF EXISTS "Profiles policy" ON profiles;
CREATE POLICY "Profiles policy" ON profiles
    FOR ALL USING (
        auth.uid() = id OR 
        auth.uid() IN (
            SELECT id FROM profiles WHERE is_admin = true
        )
    );

-- Crear función para verificar si un usuario es superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución a la función
GRANT EXECUTE ON FUNCTION is_superadmin() TO authenticated;

COMMENT ON FUNCTION is_superadmin() IS 'Verifica si el usuario actual es superadministrador';
