-- Diagnóstico completo de datos para el cronograma
-- Este script verifica qué datos existen en las tablas relevantes

-- 1. Verificar préstamos activos
SELECT 'LOANS TABLE' as table_name, COUNT(*) as total_records FROM loans;
SELECT 'ACTIVE_LOANS TABLE' as table_name, COUNT(*) as total_records FROM active_loans;

-- 2. Verificar cuotas existentes
SELECT 'INSTALLMENTS TABLE' as table_name, COUNT(*) as total_records FROM installments;

-- 3. Verificar vista de cuotas con estados calculados
SELECT 'INSTALLMENTS_WITH_CALCULATED_STATUS VIEW' as table_name, COUNT(*) as total_records FROM installments_with_calculated_status;

-- 4. Verificar recibos
SELECT 'RECEIPTS TABLE' as table_name, COUNT(*) as total_records FROM receipts;

-- 5. Mostrar algunos préstamos de ejemplo
SELECT 'SAMPLE LOANS' as info;
SELECT id, loan_code, client_id, amount, installments, status, start_date 
FROM loans 
WHERE status IN ('Activo', 'En Mora', 'activo', 'en_mora')
LIMIT 5;

-- 6. Mostrar algunas cuotas de ejemplo
SELECT 'SAMPLE INSTALLMENTS' as info;
SELECT id, loan_id, installment_no, due_date, amount_due, status, calculated_status
FROM installments_with_calculated_status
ORDER BY due_date DESC
LIMIT 10;

-- 7. Verificar estados de cuotas
SELECT 'INSTALLMENT STATUSES' as info;
SELECT calculated_status, COUNT(*) as count
FROM installments_with_calculated_status
GROUP BY calculated_status;

-- 8. Verificar cuotas del mes actual
SELECT 'CURRENT MONTH INSTALLMENTS' as info;
SELECT COUNT(*) as count, SUM(amount_due) as total_amount
FROM installments_with_calculated_status
WHERE due_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND due_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- 9. Verificar cuotas de hoy
SELECT 'TODAY INSTALLMENTS' as info;
SELECT COUNT(*) as count, SUM(amount_due) as total_amount
FROM installments_with_calculated_status
WHERE due_date = CURRENT_DATE;

-- 10. Verificar cuotas vencidas
SELECT 'OVERDUE INSTALLMENTS' as info;
SELECT COUNT(*) as count, SUM(amount_due) as total_amount
FROM installments_with_calculated_status
WHERE calculated_status = 'con_mora';
