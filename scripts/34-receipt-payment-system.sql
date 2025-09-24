-- Sistema de recibos con procesamiento de pagos
-- Implementa la lógica completa de recibos con imputación automática

-- Función para obtener el siguiente número de recibo
CREATE OR REPLACE FUNCTION get_next_receipt_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Obtener el siguiente número basado en los recibos existentes
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM '[0-9]+') AS INTEGER)), 0) + 1
    INTO next_number
    FROM receipts
    WHERE receipt_number ~ '^[0-9]+$';
    
    -- Formatear con ceros a la izquierda (ej: 001, 002, etc.)
    formatted_number := LPAD(next_number::TEXT, 6, '0');
    
    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Función para procesar un recibo y generar los pagos e imputaciones
CREATE OR REPLACE FUNCTION process_receipt_payment(p_receipt_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_receipt_data record;
    v_payment_id uuid;
    v_remaining_amount numeric;
    v_loan_id uuid;
    v_installment_ids uuid[];
    v_imputed_amount numeric;
    v_total_paid_per_installment numeric;
    v_installment_record record;
    v_unpaid_installments_cursor CURSOR FOR
        SELECT id, amount_due, amount_paid
        FROM public.installments
        WHERE id = ANY(v_installment_ids)
        ORDER BY due_date ASC, installment_no ASC;
BEGIN
    -- 1. Obtener datos del recibo
    SELECT id, total_amount, selected_loans, selected_installments
    INTO v_receipt_data
    FROM public.receipts
    WHERE id = p_receipt_id;

    IF v_receipt_data IS NULL THEN
        RAISE EXCEPTION 'Recibo con ID % no encontrado', p_receipt_id;
    END IF;

    -- Asumimos que selected_loans solo contiene un ID y lo extraemos
    v_loan_id := (v_receipt_data.selected_loans->>0)::uuid;
    
    -- Convertir el JSON de installments a un array de UUIDs
    SELECT ARRAY(
        SELECT jsonb_array_elements_text(v_receipt_data.selected_installments)::uuid
    ) INTO v_installment_ids;

    -- 2. Crear un registro en la tabla 'payments'
    INSERT INTO public.payments (loan_id, paid_amount, note, paid_at)
    VALUES (v_loan_id, v_receipt_data.total_amount, 'Pago generado desde recibo', now())
    RETURNING id INTO v_payment_id;

    -- 3. Imputar el monto a las cuotas seleccionadas
    v_remaining_amount := v_receipt_data.total_amount;

    FOR v_installment_record IN v_unpaid_installments_cursor
    LOOP
        IF v_remaining_amount <= 0 THEN
            EXIT; -- Salir del loop si el monto se agota
        END IF;

        -- Calcular el saldo pendiente de la cuota
        v_total_paid_per_installment := (SELECT SUM(imputed_amount) FROM public.payment_imputations WHERE installment_id = v_installment_record.id);
        IF v_total_paid_per_installment IS NULL THEN
            v_total_paid_per_installment := 0;
        END IF;
        
        v_imputed_amount := LEAST(v_installment_record.amount_due - v_total_paid_per_installment, v_remaining_amount);

        IF v_imputed_amount > 0 THEN
            -- Insertar registro en payment_imputations
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

    -- Opcional: Manejar el sobrante si el pago es mayor que las cuotas seleccionadas
    IF v_remaining_amount > 0 THEN
      -- Considerar qué hacer con este monto extra. Podría ser un "crédito a favor" o un error.
      RAISE NOTICE 'Sobrante de pago no imputado: %', v_remaining_amount;
    END IF;

    -- Actualizar el payment_id en el recibo (opcional pero recomendado)
    UPDATE public.receipts SET payment_id = v_payment_id WHERE id = p_receipt_id;

END;
$$;

-- Agregar columna payment_id a la tabla receipts si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'receipts' AND column_name = 'payment_id') THEN
        ALTER TABLE receipts ADD COLUMN payment_id UUID REFERENCES payments(id);
    END IF;
END $$;
