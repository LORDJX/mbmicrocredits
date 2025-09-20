-- Agregar columna para imagen trasera del DNI
-- Agregando columna dni_back_url para almacenar la imagen del reverso del DNI

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS dni_back_url text;

-- Comentario para documentar el propósito de la columna
COMMENT ON COLUMN clients.dni_back_url IS 'URL de la imagen del reverso del DNI del cliente';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('dni_photo_url', 'dni_back_url');
