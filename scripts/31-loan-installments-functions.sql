-- SQL Functions for Loan Installment Management
-- Handles automatic installment generation and payment imputation

-- Function to generate installments when a loan is created
CREATE OR REPLACE FUNCTION generate_installments_on_loan_insert(p_loan_id UUID)
RETURNS VOID AS $$
DECLARE
    loan_record RECORD;
    installment_date DATE;
    i INTEGER;
BEGIN
    -- Get loan details
    SELECT principal, installments_total, start_date, frequency, installment_amount
    INTO loan_record
    FROM loans 
    WHERE id = p_loan_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan with id % not found', p_loan_id;
    END IF;
    
    -- Check if installments already exist (idempotent)
    IF EXISTS (SELECT 1 FROM installments WHERE loan_id = p_loan_id) THEN
        RETURN; -- Already generated
    END IF;
    
    -- Generate installments
    installment_date := loan_record.start_date;
    
    FOR i IN 1..loan_record.installments_total LOOP
        -- Calculate due date based on frequency
        IF loan_record.frequency = 'monthly' THEN
            installment_date := loan_record.start_date + INTERVAL '1 month' * (i - 1);
        ELSIF loan_record.frequency = 'weekly' THEN
            installment_date := loan_record.start_date + INTERVAL '1 week' * (i - 1);
        ELSE
            -- Default to monthly
            installment_date := loan_record.start_date + INTERVAL '1 month' * (i - 1);
        END IF;
        
        -- Insert installment
        INSERT INTO installments (
            loan_id,
            installment_no,
            installments_total,
            code,
            due_date,
            amount_due
        ) VALUES (
            p_loan_id,
            i,
            loan_record.installments_total,
            'L' || REPLACE(p_loan_id::text, '-', '')::text || '-C' || i::text,
            installment_date,
            loan_record.installment_amount
        );
    END LOOP;
    
    RAISE NOTICE 'Generated % installments for loan %', loan_record.installments_total, p_loan_id;
END;
$$ LANGUAGE plpgsql;

-- Function to apply payment with automatic imputation
CREATE OR REPLACE FUNCTION apply_payment(
    p_loan_id UUID,
    p_paid_amount NUMERIC(12,2),
    p_paid_at TIMESTAMPTZ DEFAULT now(),
    p_note TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    payment_id UUID;
    installment_record RECORD;
    remaining_amount NUMERIC(12,2);
    imputation_amount NUMERIC(12,2);
    today_cordoba DATE;
    result JSON;
    imputations JSON[] := '{}';
    affected_installments UUID[] := '{}';
BEGIN
    -- Validate input
    IF p_paid_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be positive';
    END IF;
    
    -- Get today in Argentina/Cordoba timezone
    today_cordoba := timezone('America/Argentina/Cordoba', now())::date;
    
    -- Create payment record
    INSERT INTO payments (loan_id, paid_amount, paid_at, note)
    VALUES (p_loan_id, p_paid_amount, p_paid_at, p_note)
    RETURNING id INTO payment_id;
    
    remaining_amount := p_paid_amount;
    
    -- Apply payment to installments in order: VENCIDA → A_PAGAR_HOY → A_PAGAR
    FOR installment_record IN
        SELECT i.*, 
               (i.amount_due - i.amount_paid) as balance_due,
               CASE 
                   WHEN i.amount_paid >= i.amount_due THEN 'PAID'
                   WHEN today_cordoba > i.due_date THEN 'VENCIDA'
                   WHEN today_cordoba = i.due_date THEN 'A_PAGAR_HOY'
                   ELSE 'A_PAGAR'
               END as status
        FROM installments i
        WHERE i.loan_id = p_loan_id 
          AND i.amount_paid < i.amount_due  -- Only unpaid installments
        ORDER BY 
            CASE 
                WHEN today_cordoba > i.due_date THEN 1  -- VENCIDA first
                WHEN today_cordoba = i.due_date THEN 2  -- A_PAGAR_HOY second
                ELSE 3  -- A_PAGAR last
            END,
            i.due_date ASC  -- Within same priority, earliest due date first
    LOOP
        EXIT WHEN remaining_amount <= 0;
        
        -- Calculate how much to impute to this installment
        imputation_amount := LEAST(remaining_amount, installment_record.balance_due);
        
        -- Create imputation record
        INSERT INTO payment_imputations (payment_id, installment_id, imputed_amount)
        VALUES (payment_id, installment_record.id, imputation_amount);
        
        -- Update installment
        UPDATE installments 
        SET 
            amount_paid = amount_paid + imputation_amount,
            paid_at = CASE 
                WHEN (amount_paid + imputation_amount) >= amount_due AND paid_at IS NULL 
                THEN p_paid_at 
                ELSE paid_at 
            END
        WHERE id = installment_record.id;
        
        -- Track this imputation
        imputations := imputations || json_build_object(
            'installment_id', installment_record.id,
            'installment_no', installment_record.installment_no,
            'code', installment_record.code,
            'imputed_amount', imputation_amount,
            'previous_balance', installment_record.balance_due,
            'new_balance', installment_record.balance_due - imputation_amount
        );
        
        affected_installments := affected_installments || installment_record.id;
        remaining_amount := remaining_amount - imputation_amount;
    END LOOP;
    
    -- Build result
    result := json_build_object(
        'payment_id', payment_id,
        'total_paid', p_paid_amount,
        'remaining_amount', remaining_amount,
        'imputations', array_to_json(imputations),
        'affected_installments', affected_installments
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate installments when a loan is created
CREATE OR REPLACE FUNCTION trigger_generate_installments()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if we have the required fields
    IF NEW.principal IS NOT NULL AND NEW.installments_total IS NOT NULL AND NEW.start_date IS NOT NULL THEN
        PERFORM generate_installments_on_loan_insert(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_loan_installments ON loans;
CREATE TRIGGER trigger_loan_installments
    AFTER INSERT ON loans
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_installments();

-- Function to get loan summary with KPIs
CREATE OR REPLACE FUNCTION get_loan_summary(p_loan_id UUID)
RETURNS JSON AS $$
DECLARE
    loan_info RECORD;
    summary_data JSON;
    total_due NUMERIC(12,2);
    total_paid NUMERIC(12,2);
    count_overdue INTEGER;
    count_due_today INTEGER;
    count_future INTEGER;
    count_paid_ontime INTEGER;
    count_paid_early INTEGER;
    count_paid_late INTEGER;
    next_installments JSON[];
    today_cordoba DATE;
BEGIN
    today_cordoba := timezone('America/Argentina/Cordoba', now())::date;
    
    -- Get loan basic info
    SELECT l.*, c.first_name, c.last_name, c.client_code
    INTO loan_info
    FROM loans l
    JOIN clients c ON l.client_id = c.id
    WHERE l.id = p_loan_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan with id % not found', p_loan_id;
    END IF;
    
    -- Calculate totals and counts
    SELECT 
        COALESCE(SUM(amount_due), 0),
        COALESCE(SUM(amount_paid), 0),
        COUNT(CASE WHEN amount_paid < amount_due AND today_cordoba > due_date THEN 1 END),
        COUNT(CASE WHEN amount_paid < amount_due AND today_cordoba = due_date THEN 1 END),
        COUNT(CASE WHEN amount_paid < amount_due AND today_cordoba < due_date THEN 1 END),
        COUNT(CASE WHEN amount_paid >= amount_due AND paid_at::date = due_date THEN 1 END),
        COUNT(CASE WHEN amount_paid >= amount_due AND paid_at::date < due_date THEN 1 END),
        COUNT(CASE WHEN amount_paid >= amount_due AND paid_at::date > due_date THEN 1 END)
    INTO total_due, total_paid, count_overdue, count_due_today, count_future, 
         count_paid_ontime, count_paid_early, count_paid_late
    FROM installments
    WHERE loan_id = p_loan_id;
    
    -- Get next 3 unpaid installments
    SELECT array_agg(
        json_build_object(
            'installment_no', installment_no,
            'code', code,
            'due_date', due_date,
            'amount_due', amount_due,
            'amount_paid', amount_paid,
            'balance_due', amount_due - amount_paid,
            'status', CASE 
                WHEN amount_paid >= amount_due THEN 'PAID'
                WHEN today_cordoba > due_date THEN 'VENCIDA'
                WHEN today_cordoba = due_date THEN 'A_PAGAR_HOY'
                ELSE 'A_PAGAR'
            END
        )
    )
    INTO next_installments
    FROM (
        SELECT *
        FROM installments
        WHERE loan_id = p_loan_id AND amount_paid < amount_due
        ORDER BY due_date
        LIMIT 3
    ) next_three;
    
    -- Build summary
    summary_data := json_build_object(
        'loan_id', p_loan_id,
        'loan_code', loan_info.loan_code,
        'client', json_build_object(
            'name', loan_info.first_name || ' ' || loan_info.last_name,
            'client_code', loan_info.client_code
        ),
        'totals', json_build_object(
            'principal', loan_info.principal,
            'total_due', total_due,
            'total_paid', total_paid,
            'balance', total_due - total_paid
        ),
        'counts', json_build_object(
            'overdue', count_overdue,
            'due_today', count_due_today,
            'future', count_future,
            'paid_ontime', count_paid_ontime,
            'paid_early', count_paid_early,
            'paid_late', count_paid_late
        ),
        'next_installments', COALESCE(next_installments, '{}'),
        'is_fully_paid', (total_due - total_paid) <= 0,
        'has_overdue', count_overdue > 0
    );
    
    RETURN summary_data;
END;
$$ LANGUAGE plpgsql;
