-- Crear tabla de categorías de gastos
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'DollarSign',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de gastos
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_code TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'card', 'check', 'other')),
  description TEXT NOT NULL,
  notes TEXT,
  receipt_number TEXT,
  attachment_url TEXT,
  vendor_name TEXT,
  vendor_phone TEXT,
  vendor_email TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency TEXT CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_code ON expenses(expense_code);

-- Crear función para generar código de gasto
CREATE OR REPLACE FUNCTION generate_expense_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'EXP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM expenses WHERE expense_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para auto-generar código de gasto
CREATE OR REPLACE FUNCTION set_expense_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expense_code IS NULL OR NEW.expense_code = '' THEN
    NEW.expense_code := generate_expense_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_expense_code
BEFORE INSERT ON expenses
FOR EACH ROW
EXECUTE FUNCTION set_expense_code();

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expenses_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_expense_categories_updated_at
BEFORE UPDATE ON expense_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insertar categorías predeterminadas
INSERT INTO expense_categories (name, description, color, icon) VALUES
  ('Salarios', 'Pagos de salarios y sueldos', '#3B82F6', 'Users'),
  ('Alquiler', 'Alquiler de oficina o local', '#8B5CF6', 'Home'),
  ('Servicios', 'Luz, agua, internet, teléfono', '#10B981', 'Zap'),
  ('Suministros', 'Materiales de oficina y suministros', '#F59E0B', 'Package'),
  ('Marketing', 'Publicidad y marketing', '#EC4899', 'Megaphone'),
  ('Transporte', 'Combustible, mantenimiento, transporte', '#6366F1', 'Car'),
  ('Tecnología', 'Software, hardware, licencias', '#14B8A6', 'Laptop'),
  ('Mantenimiento', 'Reparaciones y mantenimiento', '#EF4444', 'Wrench'),
  ('Impuestos', 'Impuestos y tasas', '#F97316', 'FileText'),
  ('Otros', 'Gastos varios', '#6B7280', 'MoreHorizontal')
ON CONFLICT (name) DO NOTHING;

-- Crear vista para gastos con información completa
CREATE OR REPLACE VIEW v_expenses AS
SELECT 
  e.*,
  ec.name as category_name,
  ec.color as category_color,
  ec.icon as category_icon,
  u1.first_name || ' ' || u1.last_name as created_by_name,
  u2.first_name || ' ' || u2.last_name as approved_by_name
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
LEFT JOIN profiles u1 ON e.created_by = u1.id
LEFT JOIN profiles u2 ON e.approved_by = u2.id
WHERE e.deleted_at IS NULL;

-- Habilitar RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para expense_categories (todos pueden leer, solo admins pueden modificar)
CREATE POLICY "Anyone can view expense categories"
  ON expense_categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert expense categories"
  ON expense_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update expense categories"
  ON expense_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Políticas RLS para expenses (usuarios autenticados pueden ver y crear, solo admins pueden aprobar/eliminar)
CREATE POLICY "Authenticated users can view expenses"
  ON expenses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

CREATE POLICY "Only admins can delete expenses"
  ON expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
