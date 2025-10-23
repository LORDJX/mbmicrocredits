-- Migration: Add audit_status column to expenses table
-- Version: 2
-- Date: 2025-01-19

-- Step 1: Add audit_status column to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS audit_status TEXT DEFAULT 'pendiente';

-- Step 2: Add constraint to ensure valid values
ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_audit_status_check;

ALTER TABLE expenses
ADD CONSTRAINT expenses_audit_status_check 
CHECK (audit_status IN ('pendiente', 'aprobado', 'rechazado'));

-- Step 3: Update existing records to have default value
UPDATE expenses 
SET audit_status = 'pendiente' 
WHERE audit_status IS NULL;

-- Step 4: Recreate the v_expenses view to include audit_status
DROP VIEW IF EXISTS v_expenses;

CREATE VIEW v_expenses AS
SELECT 
  e.id,
  e.expense_code,
  e.receipt_number,
  e.category_id,
  e.amount,
  e.expense_date,
  e.payment_method,
  e.description,
  e.notes,
  e.vendor_name,
  e.vendor_phone,
  e.vendor_email,
  e.attachment_url,
  e.status,
  e.audit_status,
  e.is_recurring,
  e.recurrence_frequency,
  e.tags,
  e.created_by,
  e.approved_by,
  e.created_at,
  e.updated_at,
  e.deleted_at,
  ec.name as category_name,
  ec.color as category_color,
  ec.icon as category_icon,
  COALESCE(p1.first_name || ' ' || p1.last_name, p1.full_name) as created_by_name,
  COALESCE(p2.first_name || ' ' || p2.last_name, p2.full_name) as approved_by_name
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
LEFT JOIN profiles p1 ON e.created_by = p1.id
LEFT JOIN profiles p2 ON e.approved_by = p2.id
WHERE e.deleted_at IS NULL;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN expenses.audit_status IS 'Estado de auditoría del gasto: pendiente (default), aprobado, rechazado';

-- Step 6: Grant necessary permissions
GRANT SELECT ON v_expenses TO authenticated;
