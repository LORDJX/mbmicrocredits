-- Script para migrar préstamos existentes al sistema de cuotas
-- Genera cuotas para todos los préstamos que no las tengan

-- Función para migrar préstamos existentes con validaciones
CREATE OR REPLACE FUNCTION migrate_existing_loans_to_installments()
RETURNS TABLE (
    loan_id UUID,
    loan_code TEXT,
    installments_generated INTEGER,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    loan_record RECORD;
    installments_count INTEGER;
    error_message TEXT;
BEGIN
    -- Procesar todos los préstamos activos que no tengan cuotas
    FOR loan_record IN 
        SELECT 
            l.id,
            l.loan_code,
            l.client_id,
            l.amount,
            l.installments,
            l.installment_amount,
            l.amount_to_repay,
            l.loan_type,
            l.start_date,
            l.end_date,
            l.status,
            l.created_at,
            c.first_name,
            c.last_name
        FROM loans l 
        INNER JOIN clients c ON l.client_id = c.id
        LEFT JOIN installments i ON l.id = i.loan_id 
        WHERE l.deleted_at IS NULL 
        AND i.id IS NULL
        AND l.status NOT IN ('Cancelado', 'Finalizado')
        ORDER BY l.created_at ASC
    LOOP
        BEGIN
            -- Validar datos del préstamo
            IF loan_record.installments IS NULL OR loan_record.installments <= 0 THEN
                loan_id := loan_record.id;
                loan_code := loan_record.loan_code;
                installments_generated := 0;
                status := 'ERROR';
                message := 'Número de cuotas inválido o nulo';
                RETURN NEXT;
                CONTINUE;
            END IF;

            IF loan_record.start_date IS NULL THEN
                loan_id := loan_record.id;
                loan_code := loan_record.loan_code;
                installments_generated := 0;
                status := 'ERROR';
                message := 'Fecha de inicio no definida';
                RETURN NEXT;
                CONTINUE;
            END IF;

            IF loan_record.amount_to_repay IS NULL OR loan_record.amount_to_repay <= 0 THEN
                -- Calcular amount_to_repay si no existe
                UPDATE loans 
                SET amount_to_repay = amount * (1 + COALESCE(interest_rate, 0) / 100)
                WHERE id = loan_record.id;
                
                -- Actualizar el record con el nuevo valor
                SELECT amount_to_repay INTO loan_record.amount_to_repay 
                FROM loans WHERE id = loan_record.id;
            END IF;

            -- Generar cuotas para este préstamo
            PERFORM generate_loan_installments(loan_record.id);
            
            -- Contar cuotas generadas
            SELECT COUNT(*) INTO installments_count
            FROM installments 
            WHERE loan_id = loan_record.id;
            
            -- Retornar resultado exitoso
            loan_id := loan_record.id;
            loan_code := loan_record.loan_code;
            installments_generated := installments_count;
            status := 'SUCCESS';
            message := format('Generadas %s cuotas para %s %s', 
                            installments_count, 
                            loan_record.first_name, 
                            loan_record.last_name);
            RETURN NEXT;
            
        EXCEPTION WHEN OTHERS THEN
            -- Capturar errores y continuar con el siguiente préstamo
            GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
            
            loan_id := loan_record.id;
            loan_code := loan_record.loan_code;
            installments_generated := 0;
            status := 'ERROR';
            message := format('Error: %s', error_message);
            RETURN NEXT;
        END;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Función para generar reporte de migración
CREATE OR REPLACE FUNCTION get_migration_report()
RETURNS TABLE (
    total_loans INTEGER,
    loans_with_installments INTEGER,
    loans_without_installments INTEGER,
    loans_with_errors INTEGER,
    total_installments_generated INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM loans WHERE deleted_at IS NULL) as total_loans,
        (SELECT COUNT(DISTINCT loan_id)::INTEGER FROM installments) as loans_with_installments,
        (SELECT COUNT(*)::INTEGER 
         FROM loans l 
         LEFT JOIN installments i ON l.id = i.loan_id 
         WHERE l.deleted_at IS NULL AND i.id IS NULL) as loans_without_installments,
        (SELECT COUNT(*)::INTEGER 
         FROM loans l 
         WHERE l.deleted_at IS NULL 
         AND (l.installments IS NULL OR l.installments <= 0 OR l.start_date IS NULL)) as loans_with_errors,
        (SELECT COUNT(*)::INTEGER FROM installments) as total_installments_generated;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar migración y mostrar resultados
DO $$
DECLARE
    migration_result RECORD;
    total_processed INTEGER := 0;
    total_success INTEGER := 0;
    total_errors INTEGER := 0;
BEGIN
    RAISE NOTICE '=== INICIANDO MIGRACIÓN DE PRÉSTAMOS EXISTENTES ===';
    RAISE NOTICE 'Fecha: %', NOW();
    RAISE NOTICE '';
    
    -- Mostrar reporte pre-migración
    FOR migration_result IN SELECT * FROM get_migration_report() LOOP
        RAISE NOTICE 'REPORTE PRE-MIGRACIÓN:';
        RAISE NOTICE '- Total de préstamos: %', migration_result.total_loans;
        RAISE NOTICE '- Préstamos con cuotas: %', migration_result.loans_with_installments;
        RAISE NOTICE '- Préstamos sin cuotas: %', migration_result.loans_without_installments;
        RAISE NOTICE '- Préstamos con errores: %', migration_result.loans_with_errors;
        RAISE NOTICE '- Total cuotas existentes: %', migration_result.total_installments_generated;
        RAISE NOTICE '';
    END LOOP;
    
    -- Ejecutar migración
    RAISE NOTICE 'PROCESANDO PRÉSTAMOS:';
    FOR migration_result IN SELECT * FROM migrate_existing_loans_to_installments() LOOP
        total_processed := total_processed + 1;
        
        IF migration_result.status = 'SUCCESS' THEN
            total_success := total_success + 1;
            RAISE NOTICE '✓ %: % - %', migration_result.loan_code, migration_result.status, migration_result.message;
        ELSE
            total_errors := total_errors + 1;
            RAISE NOTICE '✗ %: % - %', migration_result.loan_code, migration_result.status, migration_result.message;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RESUMEN DE MIGRACIÓN ===';
    RAISE NOTICE 'Préstamos procesados: %', total_processed;
    RAISE NOTICE 'Migraciones exitosas: %', total_success;
    RAISE NOTICE 'Errores encontrados: %', total_errors;
    RAISE NOTICE '';
    
    -- Mostrar reporte post-migración
    FOR migration_result IN SELECT * FROM get_migration_report() LOOP
        RAISE NOTICE 'REPORTE POST-MIGRACIÓN:';
        RAISE NOTICE '- Total de préstamos: %', migration_result.total_loans;
        RAISE NOTICE '- Préstamos con cuotas: %', migration_result.loans_with_installments;
        RAISE NOTICE '- Préstamos sin cuotas: %', migration_result.loans_without_installments;
        RAISE NOTICE '- Préstamos con errores: %', migration_result.loans_with_errors;
        RAISE NOTICE '- Total cuotas generadas: %', migration_result.total_installments_generated;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
END $$;
