-- Sistema de recibos integrado con pagos
-- Crea la tabla de recibos y funciones de integración

-- Crear tabla de recibos si no existe
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL,
    cash_amount NUMERIC(10, 2) DEFAULT 0,
    transfer_amount NUMERIC(10, 2) DEFAULT 0,
    payment_type VARCHAR(20) NOT NULL DEFAULT 'efectivo',
    observations TEXT,
    attachment_url TEXT,
    selected_loans JSONB DEFAULT '[]'::jsonb,
    selected_installments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_date ON receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_receipts_updated_at ON receipts;
CREATE TRIGGER trigger_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_receipts_updated_at();

-- Función para crear recibo con pago automático
CREATE OR REPLACE FUNCTION create_receipt_with_payment(
    p_receipt_number VARCHAR(50),
    p_receipt_date DATE,
    p_client_id UUID,
    p_total_amount NUMERIC(10, 2),
    p_cash_amount NUMERIC(10, 2) DEFAULT 0,
    p_transfer_amount NUMERIC(10, 2) DEFAULT 0,
    p_payment_type VARCHAR(20) DEFAULT 'efectivo',
    p_observations TEXT DEFAULT NULL,
    p_selected_loans JSONB DEFAULT '[]'::jsonb,
    p_selected_installments JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
    receipt_id UUID;
    payment_id UUID;
    loan_id UUID;
    installment_id TEXT;
BEGIN
    -- Crear el recibo
    INSERT INTO receipts (
        receipt_number, receipt_date, client_id, total_amount,
        cash_amount, transfer_amount, payment_type, observations,
        selected_loans, selected_installments
    )
    VALUES (
        p_receipt_number, p_receipt_date, p_client_id, p_total_amount,
        p_cash_amount, p_transfer_amount, p_payment_type, p_observations,
        p_selected_loans, p_selected_installments
    )
    RETURNING id INTO receipt_id;
    
    -- Si hay cuotas seleccionadas, crear pago automático
    IF jsonb_array_length(p_selected_installments) > 0 THEN
        -- Obtener el loan_id de la primera cuota seleccionada
        SELECT i.loan_id INTO loan_id
        FROM installments i
        WHERE i.id::text = (p_selected_installments->0)::text;
        
        IF loan_id IS NOT NULL THEN
            -- Crear pago usando la función existente
            SELECT process_payment(
                loan_id,
                p_total_amount,
                'Recibo #' || p_receipt_number || CASE 
                    WHEN p_observations IS NOT NULL THEN ' - ' || p_observations 
                    ELSE '' 
                END
            ) INTO payment_id;
            
            RAISE NOTICE 'Pago automático creado con ID: %', payment_id;
        END IF;
    END IF;
    
    RETURN receipt_id;
END;
$$ LANGUAGE plpgsql;

-- Vista para recibos con información del cliente
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

-- Función para obtener resumen de recibos por período
CREATE OR REPLACE FUNCTION get_receipts_summary(
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_receipts INTEGER,
    total_amount NUMERIC,
    cash_total NUMERIC,
    transfer_total NUMERIC,
    by_payment_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_receipts,
        COALESCE(SUM(r.total_amount), 0) as total_amount,
        COALESCE(SUM(r.cash_amount), 0) as cash_total,
        COALESCE(SUM(r.transfer_amount), 0) as transfer_total,
        jsonb_object_agg(
            r.payment_type, 
            jsonb_build_object(
                'count', COUNT(*),
                'amount', COALESCE(SUM(r.total_amount), 0)
            )
        ) as by_payment_type
    FROM receipts r
    WHERE r.receipt_date BETWEEN p_start_date AND p_end_date
    GROUP BY ();
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para receipts
CREATE POLICY "Enable read access for all users" ON receipts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON receipts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON receipts FOR DELETE USING (true);

-- Comentarios para documentación
COMMENT ON TABLE receipts IS 'Tabla de recibos de pago con integración automática al sistema de pagos';
COMMENT ON FUNCTION create_receipt_with_payment IS 'Crea un recibo y automáticamente genera el pago correspondiente si hay cuotas seleccionadas';
COMMENT ON FUNCTION get_receipts_summary IS 'Obtiene resumen estadístico de recibos por período';
