-- Script de migración de datos históricos
-- Pobla las nuevas tablas (payments y payment_imputations) con información de recibos existentes
-- IMPORTANTE: Ejecutar solo una vez

DO $$
DECLARE
    rec record;
    v_payment_id uuid;
    v_loan_id uuid;
    v_remaining_amount numeric;
    v_imputed_amount numeric;
    v_total_paid_per_installment numeric;
    v_installment_record record;
BEGIN
    FOR rec IN 
        SELECT id, total_amount, selected_loans, selected_installments, created_at
        FROM public.receipts
        WHERE selected_loans IS NOT NULL AND selected_installments IS NOT NULL
        AND payment_id IS NULL -- Solo procesar recibos que no han sido migrados
        ORDER BY created_at ASC
    LOOP
        BEGIN
            -- Iniciar una transacción para cada recibo para garantizar la atomicidad
            RAISE NOTICE 'Procesando recibo: %', rec.id;

            -- Extraer el loan_id del array JSON
            v_loan_id := (rec.selected_loans->>0)::uuid;

            -- Crear un registro en payments
            INSERT INTO public.payments (loan_id, paid_amount, paid_at, note)
            VALUES (v_loan_id, rec.total_amount, rec.created_at, 'Migración de recibo histórico')
            RETURNING id INTO v_payment_id;

            -- Vincular el recibo con el pago
            UPDATE public.receipts
            SET payment_id = v_payment_id
            WHERE id = rec.id;

            v_remaining_amount := rec.total_amount;

            -- Iterar sobre las cuotas seleccionadas
            FOR v_installment_record IN
                SELECT i.id, i.amount_due, i.amount_paid
                FROM public.installments i
                WHERE i.loan_id = v_loan_id 
                AND i.installment_no::text = ANY(
                    SELECT jsonb_array_elements_text(rec.selected_installments)
                )
                ORDER BY i.due_date ASC, i.installment_no ASC
            LOOP
                IF v_remaining_amount <= 0 THEN
                    EXIT;
                END IF;

                -- Calcular el saldo actual de la cuota
                v_total_paid_per_installment := (SELECT SUM(imputed_amount) FROM public.payment_imputations WHERE installment_id = v_installment_record.id);
                IF v_total_paid_per_installment IS NULL THEN
                    v_total_paid_per_installment := 0;
                END IF;

                v_imputed_amount := LEAST(v_installment_record.amount_due - v_total_paid_per_installment, v_remaining_amount);

                IF v_imputed_amount > 0 THEN
                    -- Insertar imputación
                    INSERT INTO public.payment_imputations (payment_id, installment_id, imputed_amount)
                    VALUES (v_payment_id, v_installment_record.id, v_imputed_amount);

                    -- Actualizar la cuota
                    UPDATE public.installments
                    SET amount_paid = amount_paid + v_imputed_amount,
                        status = CASE
                            WHEN (amount_paid + v_imputed_amount) >= v_installment_record.amount_due THEN 'pagada'
                            ELSE 'pago_parcial'
                        END
                    WHERE id = v_installment_record.id;
                    
                    v_remaining_amount := v_remaining_amount - v_imputed_amount;
                END IF;
            END LOOP;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error al procesar el recibo %: %', rec.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migración de recibos históricos completada';
END $$;
