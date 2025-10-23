-- Create a view for follow_ups with client information
CREATE OR REPLACE VIEW v_follow_ups AS
SELECT 
  f.id,
  f.client_id,
  f.date,
  f.reminder_date,
  f.notes,
  f.created_at,
  f.updated_at,
  c.client_code,
  c.first_name || ' ' || c.last_name AS client_name,
  c.phone AS client_phone,
  c.email AS client_email,
  CASE 
    WHEN f.date > CURRENT_DATE THEN 'pending'
    WHEN f.date = CURRENT_DATE THEN 'pending'
    ELSE 'overdue'
  END AS status
FROM follow_ups f
INNER JOIN clients c ON f.client_id = c.id
WHERE c.deleted_at IS NULL
ORDER BY f.date DESC;

-- Add RLS policies for follow_ups table
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all follow_ups
CREATE POLICY "Allow authenticated users to read follow_ups"
ON follow_ups FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert follow_ups
CREATE POLICY "Allow authenticated users to insert follow_ups"
ON follow_ups FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update follow_ups
CREATE POLICY "Allow authenticated users to update follow_ups"
ON follow_ups FOR UPDATE
TO authenticated
USING (true);

-- Policy: Allow authenticated users to delete follow_ups
CREATE POLICY "Allow authenticated users to delete follow_ups"
ON follow_ups FOR DELETE
TO authenticated
USING (true);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_follow_ups_client_id ON follow_ups(client_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_reminder_date ON follow_ups(reminder_date);
