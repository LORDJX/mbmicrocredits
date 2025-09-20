-- Crear sistema de estados de cuotas con clasificación específica
-- Agregar columna de estado a la tabla installments si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'installments' AND column_name = 'status') THEN
        ALTER TABLE installments ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- Agregar columna de fecha de pago real si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'installments' AND column_name = 'payment_date') THEN
        ALTER TABLE installments ADD COLUMN payment_date DATE;
    END IF;
END $$;

-- Crear función para calcular estado de cuota basado en fechas (UTC-3 Argentina)
CREATE OR REPLACE FUNCTION calculate_installment_status(
    due_date DATE,
    payment_date DATE DEFAULT NULL,
    paid_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VARCHAR(20) AS $$
DECLARE
    today_arg DATE;
    actual_payment_date DATE;
BEGIN
    -- Obtener fecha actual en UTC-3 (Argentina)
    today_arg := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE;
    
    -- Determinar fecha de pago real
    IF payment_date IS NOT NULL THEN
        actual_payment_date := payment_date;
    ELSIF paid_at IS NOT NULL THEN
        actual_payment_date := (paid_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE;
    END IF;
    
    -- Si no hay pago registrado
    IF actual_payment_date IS NULL THEN
        IF due_date > today_arg THEN
            RETURN 'a_vencer';        -- Fecha de pago posterior a hoy
        ELSIF due_date = today_arg THEN
            RETURN 'a_pagar_hoy';     -- Fecha de vencimiento igual a hoy
        ELSE
            RETURN 'con_mora';        -- Cuotas no pagadas con fecha anterior a hoy
        END IF;
    END IF;
    
    -- Si hay pago registrado
    IF actual_payment_date < due_date THEN
        RETURN 'pagadas_anticipadas'; -- Fecha de pago anterior a fecha de vencimiento
    ELSIF actual_payment_date = due_date THEN
        RETURN 'pagadas';            -- Fecha de pago igual a fecha de vencimiento
    ELSE
        RETURN 'pagadas_con_mora';   -- Fecha de pago posterior a fecha de vencimiento
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Crear vista para cuotas con estado calculado automáticamente
CREATE OR REPLACE VIEW installments_with_calculated_status AS
SELECT 
    i.*,
    l.loan_code,
    l.client_id,
    c.first_name,
    c.last_name,
    c.first_name || ' ' || c.last_name as client_name,
    calculate_installment_status(i.due_date, i.payment_date, i.paid_at) as calculated_status
FROM installments i
JOIN loans l ON i.loan_id = l.id
JOIN clients c ON l.client_id = c.id
WHERE l.deleted_at IS NULL AND c.deleted_at IS NULL;

-- Crear función para actualizar estado de cuota cuando se registra un pago
CREATE OR REPLACE FUNCTION update_installment_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el estado basado en las fechas
    NEW.status := calculate_installment_status(NEW.due_date, NEW.payment_date, NEW.paid_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar automáticamente el estado
DROP TRIGGER IF EXISTS trigger_update_installment_status ON installments;
CREATE TRIGGER trigger_update_installment_status
    BEFORE INSERT OR UPDATE ON installments
    FOR EACH ROW
    EXECUTE FUNCTION update_installment_status_on_payment();

-- Actualizar estados existentes
UPDATE installments 
SET status = calculate_installment_status(due_date, payment_date, paid_at);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_payment_date ON installments(payment_date);
