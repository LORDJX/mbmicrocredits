-- Script para generar cuotas reales basadas en préstamos existentes
-- Este script reemplaza la generación dinámica con datos reales en la base de datos

-- Primero, verificar qué préstamos existen
DO $$
DECLARE
    loan_record RECORD;
    installment_count INTEGER;
    current_date DATE := CURRENT_DATE;
    due_date DATE;
    installment_amount NUMERIC;
    i INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando generación de cuotas reales...';
    
    -- Verificar préstamos existentes
    SELECT COUNT(*) INTO installment_count FROM loans WHERE status IN ('Activo', 'activo', 'En Mora', 'en_mora');
    RAISE NOTICE 'Préstamos activos encontrados: %', installment_count;
    
    -- Limpiar cuotas existentes para regenerar
    DELETE FROM installments WHERE loan_id IN (
        SELECT id FROM loans WHERE status IN ('Activo', 'activo', 'En Mora', 'en_mora')
    );
    RAISE NOTICE 'Cuotas existentes eliminadas para regeneración';
    
    -- Generar cuotas para cada préstamo activo
    FOR loan_record IN 
        SELECT 
            l.id,
            l.loan_code,
            l.client_id,
            l.amount,
            l.installments,
            l.installment_amount,
            l.start_date,
            l.frequency,
            l.loan_type,
            c.first_name,
            c.last_name
        FROM loans l
        JOIN clients c ON l.client_id = c.id
        WHERE l.status IN ('Activo', 'activo', 'En Mora', 'en_mora')
        ORDER BY l.created_at
    LOOP
        RAISE NOTICE 'Procesando préstamo: % - Cliente: % %', 
            loan_record.loan_code, 
            loan_record.first_name, 
            loan_record.last_name;
        
        -- Calcular monto de cuota si no existe
        installment_amount := COALESCE(loan_record.installment_amount, loan_record.amount / loan_record.installments);
        
        -- Generar cuotas para este préstamo
        FOR i IN 1..loan_record.installments LOOP
            -- Calcular fecha de vencimiento basada en la frecuencia
            CASE 
                WHEN loan_record.frequency = 'Semanal' OR loan_record.loan_type = 'Semanal' THEN
                    due_date := loan_record.start_date + (i * INTERVAL '7 days');
                WHEN loan_record.frequency = 'Quincenal' OR loan_record.loan_type = 'Quincenal' THEN
                    due_date := loan_record.start_date + (i * INTERVAL '15 days');
                ELSE -- Mensual por defecto
                    due_date := loan_record.start_date + (i * INTERVAL '1 month');
            END CASE;
            
            -- Insertar cuota
            INSERT INTO installments (
                id,
                loan_id,
                installment_no,
                installments_total,
                amount_due,
                due_date,
                status,
                code,
                created_at
            ) VALUES (
                gen_random_uuid(),
                loan_record.id,
                i,
                loan_record.installments,
                installment_amount,
                due_date,
                CASE 
                    WHEN due_date < current_date THEN 'vencida'
                    WHEN due_date = current_date THEN 'vence_hoy'
                    ELSE 'pendiente'
                END,
                loan_record.loan_code || '-' || LPAD(i::text, 3, '0'),
                NOW()
            );
        END LOOP;
        
        RAISE NOTICE 'Generadas % cuotas para préstamo %', loan_record.installments, loan_record.loan_code;
    END LOOP;
    
    -- Actualizar estados basados en pagos existentes
    UPDATE installments SET 
        status = 'pagada',
        amount_paid = amount_due,
        paid_at = NOW()
    WHERE id IN (
        SELECT DISTINCT i.id
        FROM installments i
        JOIN payment_imputations pi ON i.id = pi.installment_id
        WHERE pi.imputed_amount >= i.amount_due
    );
    
    -- Reporte final
    SELECT COUNT(*) INTO installment_count FROM installments;
    RAISE NOTICE 'Total de cuotas generadas: %', installment_count;
    
    -- Reporte por estado
    FOR loan_record IN 
        SELECT status, COUNT(*) as count
        FROM installments 
        GROUP BY status
        ORDER BY status
    LOOP
        RAISE NOTICE 'Estado %: % cuotas', loan_record.status, loan_record.count;
    END LOOP;
    
    RAISE NOTICE 'Generación de cuotas reales completada exitosamente!';
END $$;

-- Verificar resultados
SELECT 
    'Resumen de Cuotas Generadas' as titulo,
    COUNT(*) as total_cuotas,
    COUNT(DISTINCT loan_id) as prestamos_procesados,
    SUM(amount_due) as monto_total_cuotas
FROM installments;

-- Mostrar distribución por estado
SELECT 
    status,
    COUNT(*) as cantidad,
    SUM(amount_due) as monto_total,
    ROUND(AVG(amount_due), 2) as monto_promedio
FROM installments
GROUP BY status
ORDER BY status;

-- Mostrar próximas cuotas (siguientes 30 días)
SELECT 
    i.code,
    i.due_date,
    i.amount_due,
    i.status,
    c.first_name || ' ' || c.last_name as cliente,
    l.loan_code
FROM installments i
JOIN loans l ON i.loan_id = l.id
JOIN clients c ON l.client_id = c.id
WHERE i.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
AND i.status IN ('pendiente', 'vence_hoy')
ORDER BY i.due_date, c.last_name;
