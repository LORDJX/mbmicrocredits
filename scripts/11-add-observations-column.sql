-- Add observations column to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS observations TEXT;

-- Add comment to the column
COMMENT ON COLUMN loans.observations IS 'Additional observations or notes about the loan';
