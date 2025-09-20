-- Seed data for loan installments system
-- Creates test loan with 6 installments and sample payments

DO $$
DECLARE
    test_client_id UUID;
    test_loan_id UUID;
    current_month_start DATE;
BEGIN
    -- Get first day of current month for consistent testing
    current_month_start := date_trunc('month', CURRENT_DATE)::date;
    
    -- Create or get test client
    INSERT INTO clients (
        client_code,
        first_name,
        last_name,
        dni,
        address,
        phone,
        status
    ) VALUES (
        'TEST001',
        'Juan Carlos',
        'Pérez',
        '12345678',
        'Av. Test 123, Córdoba',
        '+54 351 123-4567',
        'activo'
    )
    ON CONFLICT (client_code) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
    RETURNING id INTO test_client_id;
    
    -- Create test loan with 6 installments
    INSERT INTO loans (
        loan_code,
        client_id,
        amount,
        principal,
        installments,
        installments_total,
        installment_amount,
        start_date,
        frequency,
        loan_type,
        interest_rate,
        status
    ) VALUES (
        'LOAN-TEST-001',
        test_client_id,
        60000.00,  -- $60,000 total
        60000.00,
        6,
        6,
        10000.00,  -- $10,000 per installment
        current_month_start,
        'monthly',
        'Personal',
        0.00,
        'activo'
    )
    ON CONFLICT (loan_code) DO UPDATE SET
        principal = EXCLUDED.principal,
        installments_total = EXCLUDED.installments_total
    RETURNING id INTO test_loan_id;
    
    -- The trigger should automatically generate installments
    -- Let's verify they were created
    IF NOT EXISTS (SELECT 1 FROM installments WHERE loan_id = test_loan_id) THEN
        -- If trigger didn't work, manually generate installments
        PERFORM generate_installments_on_loan_insert(test_loan_id);
    END IF;
    
    -- Wait a moment to ensure installments are created
    PERFORM pg_sleep(0.1);
    
    -- Create sample payments to demonstrate different scenarios
    
    -- 1. Early payment (before due date) - pays first installment completely
    PERFORM apply_payment(
        test_loan_id,
        10000.00,
        (current_month_start - INTERVAL '2 days')::timestamptz,
        'Pago anticipado - primera cuota'
    );
    
    -- 2. On-time payment (exact due date) - pays second installment
    PERFORM apply_payment(
        test_loan_id,
        10000.00,
        (current_month_start + INTERVAL '1 month')::timestamptz,
        'Pago en fecha - segunda cuota'
    );
    
    -- 3. Late payment (after due date) - pays third installment with delay
    PERFORM apply_payment(
        test_loan_id,
        10000.00,
        (current_month_start + INTERVAL '2 months' + INTERVAL '5 days')::timestamptz,
        'Pago con mora - tercera cuota'
    );
    
    -- 4. Partial payment - pays only part of fourth installment
    PERFORM apply_payment(
        test_loan_id,
        6000.00,
        (current_month_start + INTERVAL '3 months' + INTERVAL '2 days')::timestamptz,
        'Pago parcial - cuarta cuota'
    );
    
    -- 5. Excess payment - pays remaining of fourth + full fifth installment
    PERFORM apply_payment(
        test_loan_id,
        14000.00,
        (current_month_start + INTERVAL '4 months')::timestamptz,
        'Pago excedente - completa cuarta y quinta cuota'
    );
    
    RAISE NOTICE 'Seed data created successfully:';
    RAISE NOTICE '- Test client: % (ID: %)', 'Juan Carlos Pérez', test_client_id;
    RAISE NOTICE '- Test loan: % (ID: %)', 'LOAN-TEST-001', test_loan_id;
    RAISE NOTICE '- 6 installments generated with various payment scenarios';
    RAISE NOTICE '- Use GET /api/loans/%/schedule to view installment status', test_loan_id;
    RAISE NOTICE '- Use GET /api/loans/%/summary to view loan summary', test_loan_id;
    
END $$;
