-- Add receipt_number column to receipts table
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(20) UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);

-- Update existing receipts with generated receipt numbers
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    FOR rec IN SELECT id FROM receipts WHERE receipt_number IS NULL ORDER BY created_at
    LOOP
        UPDATE receipts 
        SET receipt_number = 'Rbo - ' || LPAD(counter::text, 6, '0')
        WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END $$;
