-- Fix the installments_with_calculated_status view to properly calculate status with Argentina timezone
DROP VIEW IF EXISTS installments_with_calculated_status;

CREATE VIEW installments_with_calculated_status AS
SELECT 
    i.*,
    l.loan_code,
    l.client_id,
    c.first_name,
    c.last_name,
    CONCAT(c.first_name, ' ', c.last_name) as client_name,
    CASE 
        -- Pagadas: tienen amount_paid > 0
        WHEN i.amount_paid > 0 THEN
            CASE 
                -- Pagadas anticipadas: fecha de pago anterior a fecha de vencimiento
                WHEN i.payment_date < i.due_date THEN 'pagadas_anticipadas'
                -- Pagadas: fecha de pago igual a fecha de vencimiento
                WHEN i.payment_date = i.due_date THEN 'pagadas'
                -- Pagadas con mora: fecha de pago posterior a fecha de vencimiento
                WHEN i.payment_date > i.due_date THEN 'pagadas_con_mora'
                ELSE 'pagadas'
            END
        -- No pagadas: amount_paid = 0 o NULL
        ELSE
            CASE 
                -- Con mora: fecha de vencimiento anterior a hoy (Argentina UTC-3)
                WHEN i.due_date < (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date THEN 'con_mora'
                -- A pagar hoy: fecha de vencimiento igual a hoy
                WHEN i.due_date = (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date THEN 'a_pagar_hoy'
                -- A vencer: fecha de vencimiento posterior a hoy
                WHEN i.due_date > (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date THEN 'a_vencer'
                ELSE 'a_vencer'
            END
    END as calculated_status
FROM installments i
JOIN loans l ON i.loan_id = l.id
JOIN clients c ON l.client_id = c.id
WHERE l.deleted_at IS NULL 
  AND c.deleted_at IS NULL
  AND l.status IN ('Activo', 'En Mora');
