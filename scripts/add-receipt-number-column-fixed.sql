-- Add receipt_number column to receipts table
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- Create a function to generate the next receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    receipt_number TEXT;
BEGIN
    -- Get the highest existing receipt number
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(receipt_number FROM 'Rbo - (\d+)') AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM receipts 
    WHERE receipt_number IS NOT NULL 
    AND receipt_number ~ '^Rbo - \d+$';
    
    -- Format the receipt number
    receipt_number := 'Rbo - ' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Using CTE with UPDATE instead of window function in UPDATE
WITH numbered_receipts AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY created_at) as row_num
    FROM receipts 
    WHERE receipt_number IS NULL
)
UPDATE receipts 
SET receipt_number = 'Rbo - ' || LPAD(numbered_receipts.row_num::TEXT, 6, '0')
FROM numbered_receipts
WHERE receipts.id = numbered_receipts.id;

-- Create trigger to auto-generate receipt numbers for new receipts
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_receipt_number ON receipts;
CREATE TRIGGER trigger_set_receipt_number
    BEFORE INSERT ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION set_receipt_number();
