-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('total', 'parcial')),
  cash_amount DECIMAL(10,2) DEFAULT 0,
  transfer_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  observations TEXT,
  receipt_file_url TEXT,
  selected_loans JSONB, -- Store array of loan IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_receipts_client_id ON receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);

-- Add RLS policies
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON receipts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON receipts FOR UPDATE USING (true);
