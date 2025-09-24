-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number VARCHAR(20) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  loan_id UUID NOT NULL REFERENCES loans(id),
  payment_id UUID REFERENCES payments(id),
  total_amount DECIMAL(10,2) NOT NULL,
  cash_amount DECIMAL(10,2) DEFAULT 0,
  transfer_amount DECIMAL(10,2) DEFAULT 0,
  payment_type VARCHAR(10) CHECK (payment_type IN ('total', 'partial')) DEFAULT 'total',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_receipts_loan_id ON receipts(loan_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);

-- Function to get next receipt number with format "Rbo - 00000001"
CREATE OR REPLACE FUNCTION get_next_receipt_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get the highest receipt number and increment
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(receipt_number FROM 'Rbo - (\d+)') AS INTEGER)), 
    0
  ) + 1 INTO next_number
  FROM receipts
  WHERE receipt_number ~ '^Rbo - \d{8}$';
  
  -- Format with leading zeros (8 digits)
  formatted_number := 'Rbo - ' || LPAD(next_number::TEXT, 8, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create receipt and process payment atomically
CREATE OR REPLACE FUNCTION create_receipt_with_payment(
  p_client_id UUID,
  p_loan_id UUID,
  p_installment_ids UUID[],
  p_total_amount DECIMAL(10,2),
  p_cash_amount DECIMAL(10,2) DEFAULT 0,
  p_transfer_amount DECIMAL(10,2) DEFAULT 0,
  p_payment_type VARCHAR(10) DEFAULT 'total',
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  receipt_id UUID;
  payment_id UUID;
  receipt_number TEXT;
BEGIN
  -- Get next receipt number
  receipt_number := get_next_receipt_number();
  
  -- Create receipt
  INSERT INTO receipts (
    receipt_number,
    client_id,
    loan_id,
    total_amount,
    cash_amount,
    transfer_amount,
    payment_type,
    notes
  ) VALUES (
    receipt_number,
    p_client_id,
    p_loan_id,
    p_total_amount,
    p_cash_amount,
    p_transfer_amount,
    p_payment_type,
    p_notes
  ) RETURNING id INTO receipt_id;
  
  -- Process payment using existing function
  SELECT process_payment(
    p_loan_id,
    p_total_amount,
    CONCAT('Recibo ', receipt_number, CASE WHEN p_notes IS NOT NULL THEN ' - ' || p_notes ELSE '' END)
  ) INTO payment_id;
  
  -- Update receipt with payment_id
  UPDATE receipts 
  SET payment_id = payment_id 
  WHERE id = receipt_id;
  
  RETURN receipt_id;
END;
$$ LANGUAGE plpgsql;

-- Update trigger for receipts
CREATE OR REPLACE FUNCTION update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_receipts_updated_at ON receipts;
CREATE TRIGGER trigger_update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_receipts_updated_at();

-- Add RLS policies for receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all receipts
CREATE POLICY "Users can read all receipts" ON receipts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert receipts
CREATE POLICY "Users can insert receipts" ON receipts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update receipts
CREATE POLICY "Users can update receipts" ON receipts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON receipts TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_receipt_number() TO authenticated;
GRANT EXECUTE ON FUNCTION create_receipt_with_payment(UUID, UUID, UUID[], DECIMAL, DECIMAL, DECIMAL, VARCHAR, TEXT) TO authenticated;

-- Insert some sample data for testing (optional)
-- This will be commented out in production
/*
INSERT INTO receipts (receipt_number, client_id, loan_id, total_amount, cash_amount, transfer_amount, payment_type, notes)
SELECT 
  'Rbo - 00000001',
  c.id,
  l.id,
  50000.00,
  50000.00,
  0.00,
  'total',
  'Pago de prueba'
FROM clients c
JOIN loans l ON l.client_id = c.id
LIMIT 1;
*/

COMMIT;
