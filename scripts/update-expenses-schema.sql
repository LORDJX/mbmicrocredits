-- Agregar columna audit_status a la tabla expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS audit_status TEXT DEFAULT 'pending' CHECK (audit_status IN ('pending', 'approved', 'rejected'));

-- Actualizar la vista v_expenses para incluir audit_status
CREATE OR REPLACE VIEW v_expenses AS
SELECT 
  e.*,
  ec.name as category_name,
  ec.color as category_color,
  ec.icon as category_icon,
  p1.full_name as created_by_name,
  p2.full_name as approved_by_name
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
LEFT JOIN profiles p1 ON e.created_by = p1.id
LEFT JOIN profiles p2 ON e.approved_by = p2.id
WHERE e.deleted_at IS NULL;

-- Comentario: Actualizar el esquema para incluir audit_status
COMMENT ON COLUMN expenses.audit_status IS 'Estado de auditoría del gasto: pending, approved, rejected';
