-- Sistema integral de gestión de cuotas
-- Crea tabla de cuotas y funciones para generación automática

-- Crear tabla de cuotas si no existe
CREATE TABLE IF NOT EXISTS installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    installment_no INTEGER NOT NULL,
    installments_total INTEGER NOT NULL,
    amount_due NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_installments_loan_id ON installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_code ON installments(code);

-- Crear vista con estados calculados dinámicamente
CREATE OR REPLACE VIEW installments_with_status AS
SELECT 
    i.*,
    i.amount_due - i.amount_paid AS balance_due,
    CASE 
        WHEN i.amount_paid >= i.amount_due THEN 
            CASE 
                WHEN i.paid_at::date < i.due_date THEN 'pago_anticipado'
                WHEN i.paid_at::date = i.due_date THEN 'pagada'
                WHEN i.paid_at::date > i.due_date THEN 'pagada_con_mora'
                ELSE 'pagada'
            END
        WHEN CURRENT_DATE < i.due_date THEN 'a_pagar'
        WHEN CURRENT_DATE = i.due_date THEN 'a_pagar_hoy'
        WHEN CURRENT_DATE > i.due_date THEN 'vencida'
        ELSE 'a_pagar'
    END AS status
FROM installments i;

-- Función para generar código único de cuota
CREATE OR REPLACE FUNCTION generate_installment_code(loan_code TEXT, installment_no INTEGER)
RETURNS TEXT AS $$
BEGIN
    RETURN loan_code || '-C' || LPAD(installment_no::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Función para calcular fecha de vencimiento según tipo de préstamo
CREATE OR REPLACE FUNCTION calculate_due_date(start_date DATE, loan_type TEXT, installment_no INTEGER)
RETURNS DATE AS $$
BEGIN
    CASE loan_type
        WHEN 'Semanal' THEN
            RETURN start_date + (installment_no * INTERVAL '7 days')::INTEGER;
        WHEN 'Quincenal' THEN
            RETURN start_date + (installment_no * INTERVAL '14 days')::INTEGER;
        WHEN 'Mensual' THEN
            RETURN start_date + (installment_no * INTERVAL '1 month');
        ELSE
            -- Por defecto mensual
            RETURN start_date + (installment_no * INTERVAL '1 month');
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Función principal para generar cuotas automáticamente
CREATE OR REPLACE FUNCTION generate_loan_installments(loan_id UUID)
RETURNS VOID AS $$
DECLARE
    loan_record RECORD;
    installment_amount NUMERIC(10, 2);
    i INTEGER;
    due_date DATE;
    installment_code TEXT;
BEGIN
    -- Obtener información del préstamo
    SELECT * INTO loan_record FROM loans WHERE id = loan_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Préstamo no encontrado: %', loan_id;
    END IF;
    
    -- Calcular monto por cuota
    installment_amount := loan_record.amount_to_repay / loan_record.installments;
    
    -- Generar cada cuota
    FOR i IN 1..loan_record.installments LOOP
        -- Calcular fecha de vencimiento
        due_date := calculate_due_date(loan_record.start_date, loan_record.loan_type, i);
        
        -- Generar código único
        installment_code := generate_installment_code(loan_record.loan_code, i);
        
        -- Insertar cuota
        INSERT INTO installments (
            code,
            loan_id,
            installment_no,
            installments_total,
            amount_due,
            due_date
        ) VALUES (
            installment_code,
            loan_id,
            i,
            loan_record.installments,
            installment_amount,
            due_date
        );
    END LOOP;
    
    RAISE NOTICE 'Generadas % cuotas para el préstamo %', loan_record.installments, loan_record.loan_code;
END;
$$ LANGUAGE plpgsql;

-- Función para regenerar cuotas de préstamos existentes
CREATE OR REPLACE FUNCTION regenerate_existing_loan_installments()
RETURNS INTEGER AS $$
DECLARE
    loan_record RECORD;
    total_processed INTEGER := 0;
BEGIN
    -- Procesar todos los préstamos activos que no tengan cuotas
    FOR loan_record IN 
        SELECT l.* 
        FROM loans l 
        LEFT JOIN installments i ON l.id = i.loan_id 
        WHERE l.deleted_at IS NULL 
        AND i.id IS NULL
        AND l.status != 'Cancelado'
    LOOP
        -- Generar cuotas para este préstamo
        PERFORM generate_loan_installments(loan_record.id);
        total_processed := total_processed + 1;
    END LOOP;
    
    RAISE NOTICE 'Procesados % préstamos existentes', total_processed;
    RETURN total_processed;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar cuotas automáticamente al crear un préstamo
CREATE OR REPLACE FUNCTION trigger_generate_installments()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo generar cuotas si el préstamo tiene datos completos
    IF NEW.installments > 0 AND NEW.start_date IS NOT NULL AND NEW.amount_to_repay > 0 THEN
        PERFORM generate_loan_installments(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para generación automática
DROP TRIGGER IF EXISTS after_insert_loan_generate_installments ON loans;
CREATE TRIGGER after_insert_loan_generate_installments
    AFTER INSERT ON loans
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_installments();

-- Trigger para regenerar cuotas si se actualiza información relevante del préstamo
CREATE OR REPLACE FUNCTION trigger_update_installments()
RETURNS TRIGGER AS $$
BEGIN
    -- Si cambiaron datos relevantes, regenerar cuotas
    IF (OLD.installments != NEW.installments OR 
        OLD.start_date != NEW.start_date OR 
        OLD.amount_to_repay != NEW.amount_to_repay OR
        OLD.loan_type != NEW.loan_type) THEN
        
        -- Eliminar cuotas existentes no pagadas
        DELETE FROM installments 
        WHERE loan_id = NEW.id AND amount_paid = 0;
        
        -- Regenerar cuotas
        PERFORM generate_loan_installments(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualización
DROP TRIGGER IF EXISTS after_update_loan_regenerate_installments ON loans;
CREATE TRIGGER after_update_loan_regenerate_installments
    AFTER UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_installments();

-- Habilitar RLS en la tabla installments
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Enable read access for all users" ON installments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON installments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON installments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON installments FOR DELETE USING (true);
