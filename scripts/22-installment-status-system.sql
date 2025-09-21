-- Sistema de Estados de Cuotas para BM Microcréditos
-- Implementa clasificación automática de cuotas según fechas y pagos
-- Manejo de fechas en UTC-3 (Argentina)

-- Función para obtener fecha actual en Argentina (UTC-3)
CREATE OR REPLACE FUNCTION get_argentina_date()
RETURNS DATE AS $$
BEGIN
    RETURN (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular el estado de una cuota
CREATE OR REPLACE FUNCTION calculate_installment_status(
    p_due_date DATE,
    p_payment_date DATE DEFAULT NULL,
    p_amount_paid NUMERIC DEFAULT 0
)
RETURNS TEXT AS $$
DECLARE
    v_today DATE;
    v_status TEXT;
BEGIN
    -- Obtener fecha actual en Argentina
    v_today := get_argentina_date();
    
    -- Si la cuota está pagada completamente
    IF p_payment_date IS NOT NULL AND p_amount_paid > 0 THEN
        -- Clasificar según cuándo se pagó
        IF p_payment_date < p_due_date THEN
            RETURN 'pagada_anticipada';  -- Pagada antes del vencimiento
        ELSIF p_payment_date = p_due_date THEN
            RETURN 'pagada';             -- Pagada en fecha
        ELSE
            RETURN 'pagada_con_mora';    -- Pagada después del vencimiento
        END IF;
    END IF;
    
    -- Si no está pagada, clasificar según fecha de vencimiento
    IF p_due_date > v_today THEN
        RETURN 'a_vencer';               -- Fecha posterior a hoy
    ELSIF p_due_date = v_today THEN
        RETURN 'a_pagar_hoy';           -- Vence hoy
    ELSE
        RETURN 'con_mora';              -- Vencida y no pagada
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Actualizar tabla installments para incluir campos necesarios
ALTER TABLE installments 
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS calculated_status TEXT;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_payment_date ON installments(payment_date);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(calculated_status);

-- Vista mejorada con estados calculados automáticamente
CREATE OR REPLACE VIEW installments_with_enhanced_status AS
SELECT 
    i.*,
    l.loan_code,
    l.client_id,
    c.first_name,
    c.last_name,
    (c.first_name || ' ' || c.last_name) as client_name,
    calculate_installment_status(i.due_date, i.payment_date, i.amount_paid) as enhanced_status,
    -- Información adicional para el frontend
    CASE 
        WHEN calculate_installment_status(i.due_date, i.payment_date, i.amount_paid) = 'a_vencer' THEN 'A Vencer'
        WHEN calculate_installment_status(i.due_date, i.payment_date, i.amount_paid) = 'a_pagar_hoy' THEN 'A Pagar Hoy'
        WHEN calculate_installment_status(i.due_date, i.payment_date, i.amount_paid) = 'con_mora' THEN 'Con Mora'
        WHEN calculate_installment_status(i.due_date, i.payment_date, i.amount_paid) = 'pagada_anticipada' THEN 'Pagada Anticipada'
        WHEN calculate_installment_status(i.due_date, i.payment_date, i.amount_paid) = 'pagada' THEN 'Pagada'
        WHEN calculate_installment_status(i.due_date, i.payment_date, i.amount_paid) = 'pagada_con_mora' THEN 'Pagada con Mora'
        ELSE 'Desconocido'
    END as status_display,
    -- Días de diferencia para ordenamiento
    (i.due_date - get_argentina_date()) as days_to_due,
    -- Información de mora
    CASE 
        WHEN calculate_installment_status(i.due_date, i.payment_date, i.amount_paid) = 'con_mora' 
        THEN (get_argentina_date() - i.due_date)
        ELSE 0
    END as days_overdue
FROM installments i
JOIN loans l ON i.loan_id = l.id
JOIN clients c ON l.client_id = c.id
WHERE i.deleted_at IS NULL 
  AND l.deleted_at IS NULL 
  AND c.deleted_at IS NULL;

-- Función para actualizar estados de cuotas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION update_installment_statuses()
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER := 0;
BEGIN
    -- Actualizar el campo calculated_status en la tabla
    UPDATE installments 
    SET calculated_status = calculate_installment_status(due_date, payment_date, amount_paid),
        updated_at = NOW()
    WHERE calculated_status IS DISTINCT FROM calculate_installment_status(due_date, payment_date, amount_paid);
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente el estado cuando cambian los datos
CREATE OR REPLACE FUNCTION trigger_update_installment_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.calculated_status := calculate_installment_status(NEW.due_date, NEW.payment_date, NEW.amount_paid);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS tr_update_installment_status ON installments;
CREATE TRIGGER tr_update_installment_status
    BEFORE INSERT OR UPDATE ON installments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_installment_status();

-- Función para marcar cuota como pagada
CREATE OR REPLACE FUNCTION mark_installment_as_paid(
    p_installment_id UUID,
    p_payment_date DATE DEFAULT NULL,
    p_amount_paid NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_installment RECORD;
    v_payment_date DATE;
    v_amount_paid NUMERIC;
BEGIN
    -- Obtener datos de la cuota
    SELECT * INTO v_installment 
    FROM installments 
    WHERE id = p_installment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cuota no encontrada: %', p_installment_id;
    END IF;
    
    -- Usar fecha actual si no se especifica
    v_payment_date := COALESCE(p_payment_date, get_argentina_date());
    
    -- Usar monto debido si no se especifica
    v_amount_paid := COALESCE(p_amount_paid, v_installment.amount_due);
    
    -- Actualizar la cuota
    UPDATE installments 
    SET 
        payment_date = v_payment_date,
        amount_paid = v_amount_paid,
        paid_at = NOW(),
        status = 'paid'
    WHERE id = p_installment_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener resumen de estados por préstamo
CREATE OR REPLACE FUNCTION get_loan_installments_summary(p_loan_id UUID)
RETURNS TABLE(
    status_type TEXT,
    status_display TEXT,
    count_installments BIGINT,
    total_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.enhanced_status as status_type,
        i.status_display,
        COUNT(*) as count_installments,
        SUM(i.amount_due) as total_amount
    FROM installments_with_enhanced_status i
    WHERE i.loan_id = p_loan_id
    GROUP BY i.enhanced_status, i.status_display
    ORDER BY 
        CASE i.enhanced_status
            WHEN 'con_mora' THEN 1
            WHEN 'a_pagar_hoy' THEN 2
            WHEN 'a_vencer' THEN 3
            WHEN 'pagada_con_mora' THEN 4
            WHEN 'pagada' THEN 5
            WHEN 'pagada_anticipada' THEN 6
            ELSE 7
        END;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener cronograma del día
CREATE OR REPLACE FUNCTION get_daily_schedule(p_date DATE DEFAULT NULL)
RETURNS TABLE(
    installment_id UUID,
    loan_code TEXT,
    client_name TEXT,
    installment_no INTEGER,
    installments_total INTEGER,
    amount_due NUMERIC,
    due_date DATE,
    enhanced_status TEXT,
    status_display TEXT,
    days_overdue INTEGER
) AS $$
DECLARE
    v_date DATE;
BEGIN
    v_date := COALESCE(p_date, get_argentina_date());
    
    RETURN QUERY
    SELECT 
        i.id as installment_id,
        i.loan_code,
        i.client_name,
        i.installment_no,
        i.installments_total,
        i.amount_due,
        i.due_date,
        i.enhanced_status,
        i.status_display,
        i.days_overdue::INTEGER
    FROM installments_with_enhanced_status i
    WHERE i.due_date = v_date
       OR i.enhanced_status IN ('con_mora', 'a_pagar_hoy')
    ORDER BY 
        CASE i.enhanced_status
            WHEN 'con_mora' THEN 1
            WHEN 'a_pagar_hoy' THEN 2
            ELSE 3
        END,
        i.days_overdue DESC,
        i.client_name;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar actualización inicial de estados
SELECT update_installment_statuses();

-- Comentarios para documentación
COMMENT ON FUNCTION calculate_installment_status IS 'Calcula el estado de una cuota basado en fechas de vencimiento y pago';
COMMENT ON FUNCTION get_argentina_date IS 'Obtiene la fecha actual en zona horaria de Argentina (UTC-3)';
COMMENT ON FUNCTION mark_installment_as_paid IS 'Marca una cuota como pagada con fecha y monto especificados';
COMMENT ON VIEW installments_with_enhanced_status IS 'Vista con estados de cuotas calculados automáticamente';
