-- Loan Installments Control System
-- Creates tables for loan installment management with payment imputation
-- Uses timezone America/Argentina/Cordoba for date comparisons

-- Create loans table (enhanced version of existing)
-- Note: This will add columns to existing loans table if it exists
DO $$ 
BEGIN
    -- Add new columns to existing loans table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'principal') THEN
        ALTER TABLE loans ADD COLUMN principal NUMERIC(12,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'installments_total') THEN
        ALTER TABLE loans ADD COLUMN installments_total INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'frequency') THEN
        ALTER TABLE loans ADD COLUMN frequency TEXT DEFAULT 'monthly';
    END IF;
    
    -- Update existing loans to populate new fields from existing data
    UPDATE loans 
    SET 
        principal = amount,
        installments_total = installments,
        frequency = 'monthly'
    WHERE principal IS NULL OR installments_total IS NULL;
END $$;

-- Create installments table
CREATE TABLE IF NOT EXISTS installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    installment_no INTEGER NOT NULL,
    installments_total INTEGER NOT NULL,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date DATE NOT NULL,
    amount_due NUMERIC(12,2) NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_at TIMESTAMPTZ,
    
    CONSTRAINT installments_installment_no_positive CHECK (installment_no > 0),
    CONSTRAINT installments_amount_due_positive CHECK (amount_due > 0),
    CONSTRAINT installments_amount_paid_non_negative CHECK (amount_paid >= 0)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    paid_amount NUMERIC(12,2) NOT NULL,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    note TEXT,
    
    CONSTRAINT payments_paid_amount_positive CHECK (paid_amount > 0)
);

-- Create payment_imputations table
CREATE TABLE IF NOT EXISTS payment_imputations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
    imputed_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT payment_imputations_imputed_amount_positive CHECK (imputed_amount > 0),
    CONSTRAINT payment_imputations_unique_payment_installment UNIQUE (payment_id, installment_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_installments_loan_id_due_date ON installments(loan_id, due_date);
CREATE INDEX IF NOT EXISTS idx_installments_code ON installments(code);
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payment_imputations_installment_id ON payment_imputations(installment_id);
CREATE INDEX IF NOT EXISTS idx_payment_imputations_payment_id ON payment_imputations(payment_id);

-- Create view for installments with status calculation
-- Uses Argentina/Cordoba timezone for "today" comparison
CREATE OR REPLACE VIEW installments_with_status AS
SELECT 
    i.*,
    CASE 
        WHEN i.amount_paid >= i.amount_due THEN
            CASE 
                WHEN i.paid_at::date < i.due_date THEN 'PAGO_ANTICIPADO'
                WHEN i.paid_at::date = i.due_date THEN 'PAGADA_EN_FECHA'
                WHEN i.paid_at::date > i.due_date THEN 'PAGADA_CON_MORA'
                ELSE 'PAGADA_EN_FECHA' -- fallback
            END
        ELSE
            CASE 
                WHEN (timezone('America/Argentina/Cordoba', now())::date) < i.due_date THEN 'A_PAGAR'
                WHEN (timezone('America/Argentina/Cordoba', now())::date) = i.due_date THEN 'A_PAGAR_HOY'
                WHEN (timezone('America/Argentina/Cordoba', now())::date) > i.due_date THEN 'VENCIDA'
                ELSE 'A_PAGAR' -- fallback
            END
    END as status,
    (i.amount_due - i.amount_paid) as balance_due
FROM installments i;

-- Enable RLS on new tables
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_imputations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - can be enhanced based on user requirements)
CREATE POLICY "Enable read access for all users" ON installments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON installments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON installments FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON payments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON payment_imputations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON payment_imputations FOR INSERT WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE installments IS 'Individual loan installments with due dates and payment tracking';
COMMENT ON TABLE payments IS 'Payment records that get imputed to installments';
COMMENT ON TABLE payment_imputations IS 'Links payments to specific installments showing how much was applied';
COMMENT ON VIEW installments_with_status IS 'Installments with calculated status based on Argentina/Cordoba timezone';
