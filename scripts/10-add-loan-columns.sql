-- Agregando columnas faltantes a la tabla loans
-- Agregar columnas para monto de cuota, modo de entrega y monto total a devolver
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS installment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS delivery_mode TEXT,
ADD COLUMN IF NOT EXISTS amount_to_repay DECIMAL(10,2);

-- Actualizar registros existentes con valores calculados
UPDATE loans 
SET installment_amount = CASE 
    WHEN installments > 0 AND interest_rate IS NOT NULL 
    THEN ROUND((amount * (1 + interest_rate/100)) / installments, 2)
    ELSE NULL
END,
amount_to_repay = CASE 
    WHEN interest_rate IS NOT NULL 
    THEN ROUND(amount * (1 + interest_rate/100), 2)
    ELSE NULL
END,
delivery_mode = 'Efectivo'
WHERE installment_amount IS NULL;
