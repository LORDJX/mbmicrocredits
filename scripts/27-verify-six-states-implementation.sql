-- Verification script for the six-state installment management system
-- This script validates that all six states are properly implemented

-- 1. Verify the installments_with_status view exists and has the correct structure
SELECT 'VIEW_STRUCTURE_CHECK' as test_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'installments_with_status' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Test all six states are being generated correctly
SELECT 'SIX_STATES_VERIFICATION' as test_name;
SELECT 
    status,
    COUNT(*) as count,
    CASE status
        WHEN 'pagadas_anticipadas' THEN '1. Paid Early'
        WHEN 'pagadas' THEN '2. Paid On Time'
        WHEN 'pagadas_con_mora' THEN '3. Paid Late'
        WHEN 'con_mora' THEN '4. Overdue'
        WHEN 'a_pagar_hoy' THEN '5. Due Today'
        WHEN 'a_vencer' THEN '6. Future Due'
        ELSE 'UNKNOWN STATE'
    END as state_description
FROM installments_with_status
GROUP BY status
ORDER BY status;

-- 3. Verify state logic with sample data
SELECT 'STATE_LOGIC_VERIFICATION' as test_name;
SELECT 
    id,
    due_date,
    payment_date,
    amount_paid,
    status,
    CASE 
        WHEN amount_paid > 0 AND payment_date IS NOT NULL THEN 'PAID'
        ELSE 'UNPAID'
    END as payment_status,
    CASE 
        WHEN due_date < CURRENT_DATE THEN 'PAST_DUE'
        WHEN due_date = CURRENT_DATE THEN 'DUE_TODAY'
        ELSE 'FUTURE_DUE'
    END as date_status
FROM installments_with_status
ORDER BY due_date DESC
LIMIT 10;

-- 4. Validate state transitions and business rules
SELECT 'BUSINESS_RULES_VALIDATION' as test_name;
SELECT 
    'Paid installments should have payment_date and amount_paid > 0' as rule,
    COUNT(*) as violations
FROM installments_with_status
WHERE status IN ('pagadas_anticipadas', 'pagadas', 'pagadas_con_mora')
  AND (payment_date IS NULL OR amount_paid <= 0);

SELECT 
    'Unpaid installments should not have payment_date or amount_paid' as rule,
    COUNT(*) as violations
FROM installments_with_status
WHERE status IN ('con_mora', 'a_pagar_hoy', 'a_vencer')
  AND (payment_date IS NOT NULL OR amount_paid > 0);

-- 5. Performance check - ensure indexes are working
SELECT 'PERFORMANCE_CHECK' as test_name;
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM installments_with_status 
WHERE status = 'con_mora' 
ORDER BY due_date;

-- 6. Data consistency check
SELECT 'DATA_CONSISTENCY_CHECK' as test_name;
SELECT 
    'Total installments in base table' as metric,
    COUNT(*) as value
FROM installments;

SELECT 
    'Total installments in view' as metric,
    COUNT(*) as value
FROM installments_with_status;

-- 7. State distribution summary
SELECT 'STATE_DISTRIBUTION_SUMMARY' as test_name;
WITH state_summary AS (
    SELECT 
        status,
        COUNT(*) as count,
        SUM(amount_due) as total_amount,
        AVG(amount_due) as avg_amount
    FROM installments_with_status
    GROUP BY status
)
SELECT 
    status,
    count,
    ROUND(total_amount, 2) as total_amount,
    ROUND(avg_amount, 2) as avg_amount,
    ROUND(100.0 * count / SUM(count) OVER (), 2) as percentage
FROM state_summary
ORDER BY count DESC;

-- 8. Verify timezone handling for Argentina (UTC-3)
SELECT 'TIMEZONE_VERIFICATION' as test_name;
SELECT 
    NOW() as utc_time,
    (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires') as argentina_time,
    (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date as argentina_date;
