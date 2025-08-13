-- Agregar columnas faltantes a la tabla loans
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS installment_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS delivery_mode TEXT,
ADD COLUMN IF NOT EXISTS amount_to_repay NUMERIC(10, 2);

-- Actualizar registros existentes con valores por defecto
UPDATE loans 
SET 
    installment_amount = CASE 
        WHEN installments > 0 THEN amount / installments 
        ELSE 0 
    END,
    delivery_mode = 'Efectivo',
    amount_to_repay = amount * (1 + COALESCE(interest_rate, 0) / 100)
WHERE installment_amount IS NULL;
