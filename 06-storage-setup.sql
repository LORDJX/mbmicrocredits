-- Crear un bucket en Supabase Storage para fotos de DNI
INSERT INTO storage.buckets (id, name, public)
VALUES ('dni_photos', 'dni_photos', FALSE);

-- Políticas de RLS para el bucket dni_photos
-- Permitir a los administradores cargar y ver fotos
CREATE POLICY "Admins can upload DNI photos." ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dni_photos' AND is_admin_user());

CREATE POLICY "Admins can view DNI photos." ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'dni_photos' AND is_admin_user());

-- Opcional: Permitir a los usuarios ver sus propias fotos de DNI si es necesario
-- CREATE POLICY "Users can view their own DNI photos." ON storage.objects
--   FOR SELECT TO authenticated
--   USING (bucket_id = 'dni_photos' AND owner = auth.uid());
