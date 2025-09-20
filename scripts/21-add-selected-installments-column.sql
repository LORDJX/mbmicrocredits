-- Add missing selected_installments column to receipts table
-- This column is required by the receipts API to store installment selection data

-- Add the missing column
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS selected_installments JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.receipts.selected_installments IS 'JSON array storing selected installment details for the receipt';

-- Update RLS policies to ensure the new column is accessible
-- (The existing policies should already cover this, but let's be explicit)

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'receipts' 
  AND table_schema = 'public'
  AND column_name = 'selected_installments';
