-- New SQL script to create sequence function for loan codes
-- This ensures unique loan codes without race conditions

-- Create sequence for loan codes
CREATE SEQUENCE IF NOT EXISTS loan_code_seq START 1;

-- Create function to get next loan code
CREATE OR REPLACE FUNCTION get_next_loan_code()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  next_num := nextval('loan_code_seq');
  RETURN 'PR' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint to loan_code if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'loans_loan_code_key'
  ) THEN
    ALTER TABLE loans ADD CONSTRAINT loans_loan_code_key UNIQUE (loan_code);
  END IF;
END $$;

-- Update sequence to start from current max + 1
DO $$
DECLARE
  max_code INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(loan_code FROM 3) AS INTEGER)), 0) 
  INTO max_code 
  FROM loans 
  WHERE loan_code ~ '^PR[0-9]+$';
  
  PERFORM setval('loan_code_seq', max_code + 1, false);
END $$;
