-- Script corregido para generar números de recibo
-- Soluciona el error: "window functions are not allowed in UPDATE"

-- Agregar columna receipt_number si no existe
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- Crear función para generar el siguiente número de recibo
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    receipt_number TEXT;
BEGIN
    -- Obtener el número más alto existente
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(receipt_number FROM 'Rbo - (\d+)') AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM receipts 
    WHERE receipt_number IS NOT NULL 
    AND receipt_number ~ '^Rbo - \d+$';
    
    -- Formatear el número de recibo
    receipt_number := 'Rbo - ' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Usar CTE en lugar de ROW_NUMBER() directo en UPDATE
-- Actualizar recibos existentes que no tienen número
WITH numbered_receipts AS (
    SELECT 
        id, 
        ROW_NUMBER() OVER (ORDER BY created_at) as row_num
    FROM receipts 
    WHERE receipt_number IS NULL
)
UPDATE receipts 
SET receipt_number = 'Rbo - ' || LPAD(numbered_receipts.row_num::TEXT, 6, '0')
FROM numbered_receipts
WHERE receipts.id = numbered_receipts.id;

-- Crear trigger para auto-generar números de recibo en nuevos registros
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_set_receipt_number ON receipts;
CREATE TRIGGER trigger_set_receipt_number
    BEFORE INSERT ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION set_receipt_number();

-- Verificar que los números se generaron correctamente
SELECT 
    id, 
    receipt_number, 
    created_at 
FROM receipts 
ORDER BY created_at 
LIMIT 10;
