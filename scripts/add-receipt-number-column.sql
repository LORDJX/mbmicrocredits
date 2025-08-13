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

-- Update existing receipts without receipt_number
UPDATE receipts 
SET receipt_number = 'Rbo - ' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0')
WHERE receipt_number IS NULL;
