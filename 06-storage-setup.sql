-- Crear un bucket para las fotos de DNI si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('dni_photos', 'dni_photos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket 'dni_photos'
-- Permitir a los administradores realizar todas las acciones
CREATE POLICY "Allow admin full access on DNI photos"
ON storage.objects FOR ALL
USING (bucket_id = 'dni_photos' AND is_admin_user())
WITH CHECK (bucket_id = 'dni_photos' AND is_admin_user());

-- Permitir a los usuarios autenticados ver las fotos (si es necesario)
-- Esta política es opcional y depende de si los usuarios no administradores necesitan ver las fotos.
-- Por seguridad, la dejaremos comentada. Si la necesitas, descoméntala.
-- CREATE POLICY "Allow authenticated users to view DNI photos"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'dni_photos' AND auth.role() = 'authenticated');
