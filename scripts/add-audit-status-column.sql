-- Add audit_status column to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS audit_status TEXT DEFAULT 'pendiente' CHECK (audit_status IN ('pendiente', 'aprobado', 'rechazado'));

-- Update the v_expenses view to include audit_status
CREATE OR REPLACE VIEW v_expenses AS
SELECT 
  e.*,
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

-- Add comment
COMMENT ON COLUMN expenses.audit_status IS 'Estado de auditoría del gasto: pendiente, aprobado, rechazado';
