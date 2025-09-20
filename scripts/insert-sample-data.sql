-- Insertar datos de prueba para BM Microcréditos
-- Ejecutar este script en Supabase SQL Editor

-- 1. Insertar clientes de prueba
INSERT INTO clients (first_name, last_name, dni, phone, email, address, status, client_code) VALUES
('Juan Carlos', 'Pérez', '12345678', '+5491123456789', 'juan.perez@email.com', 'Av. Corrientes 1234, CABA', 'Activo', 'CLI-001'),
('María Elena', 'González', '87654321', '+5491987654321', 'maria.gonzalez@email.com', 'Av. Rivadavia 5678, CABA', 'Activo', 'CLI-002'),
('Roberto Carlos', 'Martínez', '11223344', '+5491155667788', 'roberto.martinez@email.com', 'Av. Santa Fe 9012, CABA', 'Activo', 'CLI-003'),
('Ana Sofía', 'López', '44332211', '+5491199887766', 'ana.lopez@email.com', 'Av. Cabildo 3456, CABA', 'Activo', 'CLI-004'),
('Carlos Eduardo', 'Fernández', '55667788', '+5491144556677', 'carlos.fernandez@email.com', 'Av. Las Heras 7890, CABA', 'Activo', 'CLI-005');

-- 2. Insertar socios de prueba
INSERT INTO partners (name, capital, generated_interest, withdrawals) VALUES
('Socio Principal', 500000.00, 25000.00, 10000.00),
('Socio Inversor A', 300000.00, 15000.00, 5000.00),
('Socio Inversor B', 200000.00, 10000.00, 2000.00);

-- 3. Insertar préstamos de prueba
INSERT INTO loans (client_id, amount, installments, interest_rate, start_date, end_date, status, loan_type, loan_code, installment_amount, amount_to_repay, delivery_mode) 
SELECT 
    c.id,
    CASE 
        WHEN c.client_code = 'CLI-001' THEN 50000.00
        WHEN c.client_code = 'CLI-002' THEN 75000.00
        WHEN c.client_code = 'CLI-003' THEN 30000.00
        WHEN c.client_code = 'CLI-004' THEN 100000.00
        WHEN c.client_code = 'CLI-005' THEN 25000.00
    END as amount,
    CASE 
        WHEN c.client_code = 'CLI-001' THEN 10
        WHEN c.client_code = 'CLI-002' THEN 15
        WHEN c.client_code = 'CLI-003' THEN 6
        WHEN c.client_code = 'CLI-004' THEN 20
        WHEN c.client_code = 'CLI-005' THEN 8
    END as installments,
    20.00 as interest_rate,
    CURRENT_DATE - INTERVAL '30 days' as start_date,
    CURRENT_DATE + INTERVAL '6 months' as end_date,
    'Activo' as status,
    'Semanal' as loan_type,
    'PR-' || LPAD(ROW_NUMBER() OVER (ORDER BY c.client_code)::TEXT, 3, '0') as loan_code,
    CASE 
        WHEN c.client_code = 'CLI-001' THEN 6000.00
        WHEN c.client_code = 'CLI-002' THEN 6000.00
        WHEN c.client_code = 'CLI-003' THEN 6000.00
        WHEN c.client_code = 'CLI-004' THEN 6000.00
        WHEN c.client_code = 'CLI-005' THEN 3750.00
    END as installment_amount,
    CASE 
        WHEN c.client_code = 'CLI-001' THEN 60000.00
        WHEN c.client_code = 'CLI-002' THEN 90000.00
        WHEN c.client_code = 'CLI-003' THEN 36000.00
        WHEN c.client_code = 'CLI-004' THEN 120000.00
        WHEN c.client_code = 'CLI-005' THEN 30000.00
    END as amount_to_repay,
    'Efectivo' as delivery_mode
FROM clients c
WHERE c.client_code IN ('CLI-001', 'CLI-002', 'CLI-003', 'CLI-004', 'CLI-005');

-- 4. Insertar algunos recibos de prueba
INSERT INTO receipts (client_id, receipt_date, payment_type, cash_amount, transfer_amount, total_amount, observations, selected_loans)
SELECT 
    c.id,
    CURRENT_DATE - INTERVAL '5 days' as receipt_date,
    'Total' as payment_type,
    6000.00 as cash_amount,
    0.00 as transfer_amount,
    6000.00 as total_amount,
    'Pago de cuota semanal' as observations,
    '[]'::jsonb as selected_loans
FROM clients c
WHERE c.client_code IN ('CLI-001', 'CLI-002')
LIMIT 2;

-- 5. Insertar transacciones de prueba
INSERT INTO transactions (partner_id, type, amount, description)
SELECT 
    p.id,
    'Aporte' as type,
    p.capital as amount,
    'Aporte inicial de capital' as description
FROM partners p;

-- 6. Insertar seguimientos de prueba
INSERT INTO follow_ups (client_id, date, reminder_date, notes)
SELECT 
    c.id,
    CURRENT_DATE as date,
    CURRENT_DATE + INTERVAL '7 days' as reminder_date,
    'Seguimiento de pago semanal - Cliente ' || c.first_name || ' ' || c.last_name as notes
FROM clients c
WHERE c.client_code IN ('CLI-003', 'CLI-004', 'CLI-005');

-- Mensaje de confirmación
SELECT 'Datos de prueba insertados correctamente' as resultado;
