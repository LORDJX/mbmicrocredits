-- Create the new installments_with_status view with six specific states
-- This replaces installments_with_calculated_status as the primary data source

-- Drop existing view if it exists
DROP VIEW IF EXISTS installments_with_status;

-- Create the new view with comprehensive status calculation
CREATE VIEW installments_with_status AS
SELECT 
    i.id,
    i.loan_id,
    i.installment_no,
    i.installments_total,
    i.created_at,
    i.due_date,
    i.amount_due,
    i.amount_paid,
    i.paid_at,
    i.code,
    i.payment_date,
    l.loan_code,
    l.client_id,
    c.first_name,
    c.last_name,
    CONCAT(c.first_name, ' ', c.last_name) as client_name,
    -- Calculate balance due
    COALESCE(i.amount_due, 0) - COALESCE(i.amount_paid, 0) as balance_due,
    -- Six specific states based on payment status and due dates
    CASE 
        -- Paid installments (3 states)
        WHEN i.amount_paid > 0 AND i.payment_date IS NOT NULL THEN
            CASE 
                -- State 1: Paid early (before due date)
                WHEN i.payment_date < i.due_date THEN 'pagadas_anticipadas'
                -- State 2: Paid on time (on due date)
                WHEN i.payment_date = i.due_date THEN 'pagadas'
                -- State 3: Paid late (after due date)
                WHEN i.payment_date > i.due_date THEN 'pagadas_con_mora'
                ELSE 'pagadas'
            END
        -- Unpaid installments (3 states)
        ELSE
            CASE 
                -- State 4: Overdue (past due date and not paid)
                WHEN i.due_date < (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date THEN 'con_mora'
                -- State 5: Due today (due date is today)
                WHEN i.due_date = (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date THEN 'a_pagar_hoy'
                -- State 6: Future due (due date is in the future)
                WHEN i.due_date > (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date THEN 'a_vencer'
                ELSE 'a_vencer'
            END
    END as status
FROM installments i
JOIN loans l ON i.loan_id = l.id
JOIN clients c ON l.client_id = c.id
WHERE l.deleted_at IS NULL 
  AND c.deleted_at IS NULL
  AND l.status IN ('Activo', 'En Mora', 'activo', 'en_mora');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_installments_with_status_status ON installments_with_status USING btree (status);
CREATE INDEX IF NOT EXISTS idx_installments_with_status_due_date ON installments_with_status USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_installments_with_status_client_id ON installments_with_status USING btree (client_id);

-- Add comments for documentation
COMMENT ON VIEW installments_with_status IS 'Primary view for installment state management with six specific states: pagadas_anticipadas, pagadas, pagadas_con_mora, con_mora, a_pagar_hoy, a_vencer';
