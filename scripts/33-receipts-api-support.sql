-- Add support for receipts API queries
-- This script ensures the receipts system works properly with the existing payment system

-- Create a view for easier receipt queries
CREATE OR REPLACE VIEW receipt_details AS
SELECT 
    p.id as payment_id,
    p.loan_id,
    p.paid_amount,
    p.paid_at,
    p.note,
    l.loan_code,
    l.client_id,
    c.client_code,
    c.first_name,
    c.last_name,
    c.phone,
    c.email,
    -- Aggregate payment imputations
    COALESCE(
        json_agg(
            json_build_object(
                'imputation_id', pi.id,
                'imputed_amount', pi.imputed_amount,
                'installment_id', pi.installment_id,
                'installment_no', i.installment_no,
                'installment_code', i.code,
                'due_date', i.due_date
            )
        ) FILTER (WHERE pi.id IS NOT NULL), 
        '[]'::json
    ) as imputations
FROM payments p
JOIN loans l ON p.loan_id = l.id
JOIN clients c ON l.client_id = c.id
LEFT JOIN payment_imputations pi ON p.id = pi.payment_id
LEFT JOIN installments i ON pi.installment_id = i.id
GROUP BY p.id, p.loan_id, p.paid_amount, p.paid_at, p.note, 
         l.loan_code, l.client_id, c.client_code, c.first_name, c.last_name, c.phone, c.email
ORDER BY p.paid_at DESC;

-- Create function to get receipt summary statistics
CREATE OR REPLACE FUNCTION get_receipt_summary(
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_receipts', COUNT(*),
        'total_amount', COALESCE(SUM(paid_amount), 0),
        'today_receipts', COUNT(*) FILTER (WHERE DATE(paid_at) = CURRENT_DATE),
        'today_amount', COALESCE(SUM(paid_amount) FILTER (WHERE DATE(paid_at) = CURRENT_DATE), 0),
        'month_receipts', COUNT(*) FILTER (WHERE DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)),
        'month_amount', COALESCE(SUM(paid_amount) FILTER (WHERE DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)), 0)
    ) INTO result
    FROM payments
    WHERE paid_at >= start_date AND paid_at <= end_date + INTERVAL '1 day';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get pending installments for a loan (for receipt creation)
CREATE OR REPLACE FUNCTION get_pending_installments(p_loan_id UUID)
RETURNS TABLE (
    installment_id UUID,
    installment_no INTEGER,
    code VARCHAR,
    amount_due DECIMAL(10,2),
    amount_paid DECIMAL(10,2),
    balance_due DECIMAL(10,2),
    due_date DATE,
    status VARCHAR,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.installment_no,
        i.code,
        i.amount_due,
        i.amount_paid,
        (i.amount_due - i.amount_paid) as balance_due,
        i.due_date,
        CASE 
            WHEN i.amount_paid >= i.amount_due THEN 'PAGADA'
            WHEN i.due_date < CURRENT_DATE THEN 'VENCIDA'
            WHEN i.due_date = CURRENT_DATE THEN 'VENCE_HOY'
            ELSE 'PENDIENTE'
        END as status,
        CASE 
            WHEN i.due_date < CURRENT_DATE THEN (CURRENT_DATE - i.due_date)::INTEGER
            ELSE 0
        END as days_overdue
    FROM installments i
    WHERE i.loan_id = p_loan_id
    AND i.amount_paid < i.amount_due
    ORDER BY i.installment_no;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON receipt_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_receipt_summary(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_installments(UUID) TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_loan_client ON payments(loan_id) INCLUDE (paid_amount, paid_at);
CREATE INDEX IF NOT EXISTS idx_payment_imputations_payment ON payment_imputations(payment_id);

-- Add comment
COMMENT ON VIEW receipt_details IS 'Comprehensive view for receipt/payment details with client and imputation information';
COMMENT ON FUNCTION get_receipt_summary IS 'Returns summary statistics for receipts in a given date range';
COMMENT ON FUNCTION get_pending_installments IS 'Returns pending installments for a loan that can be included in a receipt';
