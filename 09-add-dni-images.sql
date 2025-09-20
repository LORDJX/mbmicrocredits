-- Añade columnas para almacenar fotos del DNI frente y reverso.
ALTER TABLE IF EXISTS clients
ADD COLUMN IF NOT EXISTS dni_front_url TEXT,
ADD COLUMN IF NOT EXISTS dni_back_url TEXT;

-- Nota: se mantiene la columna legacy 'dni_photo_url' para compatibilidad.
