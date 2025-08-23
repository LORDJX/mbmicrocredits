-- Actualizar políticas para dar acceso completo a administradores
-- Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;

-- Crear políticas que permiten a administradores acceso completo
CREATE POLICY "Allow admin full access to profiles" ON public.profiles 
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Allow users to view and update own profile" ON public.profiles 
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Asegurar que administradores puedan gestionar permisos de usuario
DROP POLICY IF EXISTS "Admins can manage all permissions" ON user_permissions;
CREATE POLICY "Admins can manage all permissions" ON user_permissions
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- Función para verificar si un usuario es superadministrador
CREATE OR REPLACE FUNCTION is_superadmin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_superadmin
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solo superadministradores pueden cambiar roles de administrador
CREATE POLICY "Only superadmin can change admin roles" ON public.profiles 
  FOR UPDATE USING (
    CASE 
      WHEN OLD.is_admin != NEW.is_admin THEN is_superadmin_user()
      ELSE is_admin_user() OR auth.uid() = id
    END
  ) WITH CHECK (
    CASE 
      WHEN OLD.is_admin != NEW.is_admin THEN is_superadmin_user()
      ELSE is_admin_user() OR auth.uid() = id
    END
  );
