-- Sistema completo de recibos con integración a pagos
-- Crea las tablas y funciones necesarias para el manejo de recibos

-- Crear tabla de recibos si no existe
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(20) UNIQUE NOT NULL,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    selected_loans JSONB,
    selected_installments JSONB,
    total_amount NUMERIC(12,2) NOT NULL,
    cash_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    transfer_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_type VARCHAR(10) CHECK (payment_type IN ('total', 'partial')),
    observations TEXT,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT receipts_total_amount_positive CHECK (total_amount > 0),
    CONSTRAINT receipts_cash_amount_non_negative CHECK (cash_amount >= 0),
    CONSTRAINT receipts_transfer_amount_non_negative CHECK (transfer_amount >= 0),
    CONSTRAINT receipts_amounts_match CHECK (cash_amount + transfer_amount = total_amount)
);

-- Crear vista de recibos con información del cliente
CREATE OR REPLACE VIEW receipts_with_client AS
SELECT 
    r.*,
    c.client_code,
    c.first_name,
    c.last_name,
    c.phone,
    c.email
FROM receipts r
JOIN clients c ON r.client_id = c.id;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_date ON receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);

-- Habilitar RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS básicas
CREATE POLICY "Enable read access for all users" ON receipts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON receipts FOR UPDATE USING (true);

-- Función para generar el siguiente número de recibo
CREATE OR REPLACE FUNCTION get_next_receipt_number()
RETURNS TEXT AS $$
DECLARE
    last_number INTEGER;
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Obtener el último número de recibo
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(receipt_number FROM 'Rbo - (\d+)') AS INTEGER)), 
        0
    ) INTO last_number
    FROM receipts
    WHERE receipt_number ~ '^Rbo - \d+$';
    
    next_number := last_number + 1;
    
    -- Formatear con ceros a la izquierda (8 dígitos)
    formatted_number := 'Rbo - ' || LPAD(next_number::TEXT, 8, '0');
    
    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Función para procesar un recibo y crear los pagos correspondientes
CREATE OR REPLACE FUNCTION process_receipt(
    p_receipt_id UUID
)
RETURNS JSON AS $$
DECLARE
    receipt_record RECORD;
    installment_record RECORD;
    loan_payments JSONB := '{}';
    payment_result JSON;
    total_processed NUMERIC(12,2) := 0;
BEGIN
    -- Obtener datos del recibo
    SELECT * INTO receipt_record
    FROM receipts
    WHERE id = p_receipt_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recibo con id % no encontrado', p_receipt_id;
    END IF;
    
    -- Procesar cada cuota seleccionada
    FOR installment_record IN
        SELECT 
            si.value->>'installment_id' as installment_id,
            (si.value->>'amount')::NUMERIC as amount,
            i.loan_id
        FROM jsonb_array_elements(receipt_record.selected_installments) si
        JOIN installments i ON i.id = (si.value->>'installment_id')::UUID
    LOOP
        -- Acumular pagos por préstamo
        IF loan_payments ? installment_record.loan_id::TEXT THEN
            loan_payments := jsonb_set(
                loan_payments,
                ARRAY[installment_record.loan_id::TEXT],
                ((loan_payments->>installment_record.loan_id::TEXT)::NUMERIC + installment_record.amount)::TEXT::JSONB
            );
        ELSE
            loan_payments := jsonb_set(
                loan_payments,
                ARRAY[installment_record.loan_id::TEXT],
                installment_record.amount::TEXT::JSONB
            );
        END IF;
        
        total_processed := total_processed + installment_record.amount;
    END LOOP;
    
    -- Aplicar pagos a cada préstamo
    FOR loan_id, amount IN SELECT * FROM jsonb_each_text(loan_payments)
    LOOP
        SELECT apply_payment(
            loan_id::UUID,
            amount::NUMERIC,
            receipt_record.created_at,
            'Pago desde recibo ' || receipt_record.receipt_number
        ) INTO payment_result;
    END LOOP;
    
    RETURN json_build_object(
        'receipt_id', p_receipt_id,
        'total_processed', total_processed,
        'loans_affected', jsonb_object_keys(loan_payments)
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger para procesar automáticamente los pagos cuando se crea un recibo
CREATE OR REPLACE FUNCTION trigger_process_receipt()
RETURNS TRIGGER AS $$
BEGIN
    -- Procesar el recibo después de crearlo
    PERFORM process_receipt(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_receipt_payment_processing ON receipts;
CREATE TRIGGER trigger_receipt_payment_processing
    AFTER INSERT ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_process_receipt();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_receipts_updated_at ON receipts;
CREATE TRIGGER trigger_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE receipts IS 'Recibos de pago emitidos con autonumeración formato Rbo - 00000001';
COMMENT ON VIEW receipts_with_client IS 'Vista de recibos con información completa del cliente';
COMMENT ON FUNCTION get_next_receipt_number() IS 'Genera el siguiente número de recibo con formato Rbo - 00000001';
COMMENT ON FUNCTION process_receipt(UUID) IS 'Procesa un recibo creando los pagos correspondientes en el sistema';
