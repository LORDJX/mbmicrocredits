-- Agregar columnas CBU/CVU y alias a la tabla clients
-- Estas columnas son necesarias para almacenar información bancaria de los clientes

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS cbu_cvu TEXT,
ADD COLUMN IF NOT EXISTS alias TEXT;

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN clients.cbu_cvu IS 'CBU o CVU del cliente para transferencias bancarias';
COMMENT ON COLUMN clients.alias IS 'Alias bancario del cliente para transferencias';
