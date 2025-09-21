-- Script para poblar la base de datos con datos de prueba para el cronograma
-- Este script creará préstamos y cuotas de prueba para verificar el funcionamiento

-- Insertar datos de prueba para verificar el cronograma

-- Insertar un cliente de prueba si no existe
INSERT INTO clients (id, name, dni, phone, email, address, created_at, updated_at)
VALUES (
  'test-client-001',
  'Juan Pérez',
  '12345678',
  '+54 9 11 1234-5678',
  'juan.perez@email.com',
  'Av. Corrientes 1234, CABA',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar un préstamo de prueba si no existe
INSERT INTO loans (id, client_id, amount, interest_rate, installments_count, status, created_at, updated_at)
VALUES (
  'test-loan-001',
  'test-client-001',
  100000.00,
  15.0,
  12,
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar cuotas de prueba para diferentes estados
-- Cuotas vencidas (con mora)
INSERT INTO installments (id, loan_id, installment_number, amount, due_date, status, created_at, updated_at)
VALUES 
  ('inst-001', 'test-loan-001', 1, 9500.00, '2025-08-15', 'con_mora', NOW(), NOW()),
  ('inst-002', 'test-loan-001', 2, 9500.00, '2025-08-30', 'con_mora', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Cuotas para hoy
INSERT INTO installments (id, loan_id, installment_number, amount, due_date, status, created_at, updated_at)
VALUES 
  ('inst-003', 'test-loan-001', 3, 9500.00, CURRENT_DATE, 'pendiente', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Cuotas del mes actual (pendientes)
INSERT INTO installments (id, loan_id, installment_number, amount, due_date, status, created_at, updated_at)
VALUES 
  ('inst-004', 'test-loan-001', 4, 9500.00, '2025-09-25', 'pendiente', NOW(), NOW()),
  ('inst-005', 'test-loan-001', 5, 9500.00, '2025-09-30', 'pendiente', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Cuotas futuras (a vencer)
INSERT INTO installments (id, loan_id, installment_number, amount, due_date, status, created_at, updated_at)
VALUES 
  ('inst-006', 'test-loan-001', 6, 9500.00, '2025-10-15', 'pendiente', NOW(), NOW()),
  ('inst-007', 'test-loan-001', 7, 9500.00, '2025-10-30', 'pendiente', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Cuotas pagadas
INSERT INTO installments (id, loan_id, installment_number, amount, due_date, status, created_at, updated_at)
VALUES 
  ('inst-008', 'test-loan-001', 8, 9500.00, '2025-07-15', 'pagada', NOW(), NOW()),
  ('inst-009', 'test-loan-001', 9, 9500.00, '2025-07-30', 'pagada', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insertar algunos recibos de prueba para hoy
INSERT INTO receipts (id, client_id, loan_id, installment_id, amount, payment_date, payment_method, created_at, updated_at)
VALUES 
  ('receipt-001', 'test-client-001', 'test-loan-001', 'inst-008', 9500.00, CURRENT_DATE, 'efectivo', NOW(), NOW()),
  ('receipt-002', 'test-client-001', 'test-loan-001', 'inst-009', 9500.00, CURRENT_DATE, 'transferencia', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verificar los datos insertados
SELECT 'Clients inserted:' as info, COUNT(*) as count FROM clients WHERE id = 'test-client-001';
SELECT 'Loans inserted:' as info, COUNT(*) as count FROM loans WHERE id = 'test-loan-001';
SELECT 'Installments inserted:' as info, COUNT(*) as count FROM installments WHERE loan_id = 'test-loan-001';
SELECT 'Receipts inserted:' as info, COUNT(*) as count FROM receipts WHERE loan_id = 'test-loan-001';

-- Mostrar resumen por estado
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM installments 
WHERE loan_id = 'test-loan-001'
GROUP BY status
ORDER BY status;
