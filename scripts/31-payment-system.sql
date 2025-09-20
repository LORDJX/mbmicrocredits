-- Sistema de pagos e imputaciones
-- Gestiona los pagos de cuotas con imputación automática

-- Crear tabla de pagos si no existe
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    paid_amount NUMERIC(10, 2) NOT NULL,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    note TEXT
);

-- Crear tabla de imputaciones de pagos
CREATE TABLE IF NOT EXISTS payment_imputations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
    imputed_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payment_imputations_payment_id ON payment_imputations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_imputations_installment_id ON payment_imputations(installment_id);

-- Función para procesar pago con imputación automática
CREATE OR REPLACE FUNCTION process_payment(
    p_loan_id UUID,
    p_amount NUMERIC(10, 2),
    p_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    payment_id UUID;
    remaining_amount NUMERIC(10, 2);
    installment_record RECORD;
    imputation_amount NUMERIC(10, 2);
    installment_balance NUMERIC(10, 2);
BEGIN
    -- Validar que el monto sea positivo
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'El monto del pago debe ser mayor a cero';
    END IF;
    
    -- Crear registro de pago
    INSERT INTO payments (loan_id, paid_amount, note)
    VALUES (p_loan_id, p_amount, p_note)
    RETURNING id INTO payment_id;
    
    remaining_amount := p_amount;
    
    -- Imputar a cuotas pendientes en orden cronológico
    FOR installment_record IN 
        SELECT i.*, (i.amount_due - i.amount_paid) as balance
        FROM installments i
        WHERE i.loan_id = p_loan_id 
        AND i.amount_paid < i.amount_due
        ORDER BY i.due_date ASC, i.installment_no ASC
    LOOP
        EXIT WHEN remaining_amount <= 0;
        
        installment_balance := installment_record.balance;
        
        -- Calcular cuánto imputar a esta cuota
        imputation_amount := LEAST(remaining_amount, installment_balance);
        
        -- Crear registro de imputación
        INSERT INTO payment_imputations (payment_id, installment_id, imputed_amount)
        VALUES (payment_id, installment_record.id, imputation_amount);
        
        -- Actualizar cuota
        UPDATE installments 
        SET 
            amount_paid = amount_paid + imputation_amount,
            paid_at = CASE 
                WHEN amount_paid + imputation_amount >= amount_due 
                THEN CURRENT_TIMESTAMP 
                ELSE paid_at 
            END
        WHERE id = installment_record.id;
        
        remaining_amount := remaining_amount - imputation_amount;
    END LOOP;
    
    -- Si queda dinero sin imputar, registrar como sobrepago
    IF remaining_amount > 0 THEN
        RAISE NOTICE 'Sobrepago de % registrado para el préstamo', remaining_amount;
    END IF;
    
    RETURN payment_id;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener resumen de estado de préstamo
CREATE OR REPLACE FUNCTION get_loan_summary(p_loan_id UUID)
RETURNS TABLE (
    loan_code TEXT,
    total_amount NUMERIC,
    total_installments INTEGER,
    paid_installments INTEGER,
    pending_installments INTEGER,
    overdue_installments INTEGER,
    total_paid NUMERIC,
    total_pending NUMERIC,
    next_due_date DATE,
    loan_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.loan_code,
        l.amount_to_repay,
        l.installments,
        COUNT(CASE WHEN i.amount_paid >= i.amount_due THEN 1 END)::INTEGER as paid_count,
        COUNT(CASE WHEN i.amount_paid < i.amount_due THEN 1 END)::INTEGER as pending_count,
        COUNT(CASE WHEN i.amount_paid < i.amount_due AND i.due_date < CURRENT_DATE THEN 1 END)::INTEGER as overdue_count,
        COALESCE(SUM(i.amount_paid), 0) as total_paid_amount,
        COALESCE(SUM(i.amount_due - i.amount_paid), 0) as total_pending_amount,
        MIN(CASE WHEN i.amount_paid < i.amount_due THEN i.due_date END) as next_due,
        l.status
    FROM loans l
    LEFT JOIN installments i ON l.id = i.loan_id
    WHERE l.id = p_loan_id
    GROUP BY l.id, l.loan_code, l.amount_to_repay, l.installments, l.status;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS en las nuevas tablas
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_imputations ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para payments
CREATE POLICY "Enable read access for all users" ON payments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON payments FOR UPDATE USING (true);

-- Políticas de seguridad para payment_imputations
CREATE POLICY "Enable read access for all users" ON payment_imputations FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON payment_imputations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON payment_imputations FOR UPDATE USING (true);
