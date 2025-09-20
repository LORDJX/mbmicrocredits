-- Script para corregir datos inconsistentes en préstamos antes de la migración
-- Asegura que todos los préstamos tengan los datos necesarios para generar cuotas

-- Función para corregir datos de préstamos
CREATE OR REPLACE FUNCTION fix_loan_data()
RETURNS TABLE (
    loan_id UUID,
    loan_code TEXT,
    action_taken TEXT,
    old_value TEXT,
    new_value TEXT
) AS $$
DECLARE
    loan_record RECORD;
    calculated_amount NUMERIC;
    calculated_installment_amount NUMERIC;
BEGIN
    -- Procesar préstamos con datos faltantes o inconsistentes
    FOR loan_record IN 
        SELECT 
            l.id,
            l.loan_code,
            l.amount,
            l.installments,
            l.installment_amount,
            l.amount_to_repay,
            l.interest_rate,
            l.loan_type,
            l.start_date,
            l.status
        FROM loans l 
        WHERE l.deleted_at IS NULL 
        AND l.status NOT IN ('Cancelado', 'Finalizado')
    LOOP
        -- Corregir loan_type si es nulo
        IF loan_record.loan_type IS NULL OR loan_record.loan_type = '' THEN
            UPDATE loans SET loan_type = 'Mensual' WHERE id = loan_record.id;
            
            loan_id := loan_record.id;
            loan_code := loan_record.loan_code;
            action_taken := 'loan_type_fixed';
            old_value := COALESCE(loan_record.loan_type, 'NULL');
            new_value := 'Mensual';
            RETURN NEXT;
        END IF;

        -- Corregir interest_rate si es nulo
        IF loan_record.interest_rate IS NULL THEN
            UPDATE loans SET interest_rate = 0 WHERE id = loan_record.id;
            
            loan_id := loan_record.id;
            loan_code := loan_record.loan_code;
            action_taken := 'interest_rate_fixed';
            old_value := 'NULL';
            new_value := '0';
            RETURN NEXT;
        END IF;

        -- Calcular amount_to_repay si es nulo
        IF loan_record.amount_to_repay IS NULL OR loan_record.amount_to_repay <= 0 THEN
            calculated_amount := loan_record.amount * (1 + COALESCE(loan_record.interest_rate, 0) / 100);
            UPDATE loans SET amount_to_repay = calculated_amount WHERE id = loan_record.id;
            
            loan_id := loan_record.id;
            loan_code := loan_record.loan_code;
            action_taken := 'amount_to_repay_calculated';
            old_value := COALESCE(loan_record.amount_to_repay::TEXT, 'NULL');
            new_value := calculated_amount::TEXT;
            RETURN NEXT;
            
            -- Actualizar el valor para el siguiente cálculo
            loan_record.amount_to_repay := calculated_amount;
        END IF;

        -- Calcular installment_amount si es nulo o inconsistente
        IF loan_record.installment_amount IS NULL OR loan_record.installment_amount <= 0 THEN
            calculated_installment_amount := loan_record.amount_to_repay / loan_record.installments;
            UPDATE loans SET installment_amount = calculated_installment_amount WHERE id = loan_record.id;
            
            loan_id := loan_record.id;
            loan_code := loan_record.loan_code;
            action_taken := 'installment_amount_calculated';
            old_value := COALESCE(loan_record.installment_amount::TEXT, 'NULL');
            new_value := calculated_installment_amount::TEXT;
            RETURN NEXT;
        END IF;

        -- Establecer start_date si es nulo (usar created_at como fallback)
        IF loan_record.start_date IS NULL THEN
            UPDATE loans 
            SET start_date = created_at::DATE 
            WHERE id = loan_record.id;
            
            loan_id := loan_record.id;
            loan_code := loan_record.loan_code;
            action_taken := 'start_date_set_from_created_at';
            old_value := 'NULL';
            new_value := (SELECT created_at::DATE::TEXT FROM loans WHERE id = loan_record.id);
            RETURN NEXT;
        END IF;

        -- Establecer status si es nulo
        IF loan_record.status IS NULL OR loan_record.status = '' THEN
            UPDATE loans SET status = 'Activo' WHERE id = loan_record.id;
            
            loan_id := loan_record.id;
            loan_code := loan_record.loan_code;
            action_taken := 'status_set_to_active';
            old_value := COALESCE(loan_record.status, 'NULL');
            new_value := 'Activo';
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar corrección de datos
DO $$
DECLARE
    fix_result RECORD;
    total_fixes INTEGER := 0;
BEGIN
    RAISE NOTICE '=== CORRIGIENDO DATOS DE PRÉSTAMOS ===';
    RAISE NOTICE 'Fecha: %', NOW();
    RAISE NOTICE '';
    
    FOR fix_result IN SELECT * FROM fix_loan_data() LOOP
        total_fixes := total_fixes + 1;
        RAISE NOTICE '🔧 %: % - % → %', 
                    fix_result.loan_code, 
                    fix_result.action_taken, 
                    fix_result.old_value, 
                    fix_result.new_value;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== CORRECCIÓN COMPLETADA ===';
    RAISE NOTICE 'Total de correcciones aplicadas: %', total_fixes;
    RAISE NOTICE '';
END $$;
