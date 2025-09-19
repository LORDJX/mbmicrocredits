-- Create additional tables for enhanced microcredit system

-- User roles and permissions
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO user_roles (name, description) VALUES 
  ('admin', 'System administrator with full access'),
  ('loan_officer', 'Can manage loans and client applications'),
  ('borrower', 'Can apply for loans and manage their account'),
  ('lender', 'Can invest capital and view returns')
ON CONFLICT (name) DO NOTHING;

-- Enhanced profiles table with role assignment
CREATE TABLE IF NOT EXISTS enhanced_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES user_roles(id),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  dni TEXT UNIQUE,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on enhanced_profiles
ALTER TABLE enhanced_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for enhanced_profiles
CREATE POLICY "Users can view their own profile" ON enhanced_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON enhanced_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON enhanced_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON enhanced_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enhanced_profiles ep
      JOIN user_roles ur ON ep.role_id = ur.id
      WHERE ep.id = auth.uid() AND ur.name = 'admin'
    )
  );

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Documents table for loan applications
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- 'identity', 'income_proof', 'collateral', etc.
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for documents
CREATE POLICY "Users can view documents they uploaded or own" ON documents
  FOR SELECT USING (
    auth.uid() = uploaded_by OR 
    auth.uid() IN (SELECT id FROM clients WHERE id = documents.client_id)
  );

-- Loan applications table
CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  requested_amount DECIMAL(15,2) NOT NULL,
  purpose TEXT NOT NULL,
  employment_status VARCHAR(100),
  monthly_income DECIMAL(15,2),
  existing_debts DECIMAL(15,2),
  collateral_description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, under_review, approved, rejected
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on loan_applications
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for loan_applications
CREATE POLICY "Clients can view their own applications" ON loan_applications
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE id = auth.uid())
  );

-- Credit scores table
CREATE TABLE IF NOT EXISTS credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 300 AND score <= 850),
  factors JSONB, -- Store scoring factors as JSON
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on credit_scores
ALTER TABLE credit_scores ENABLE ROW LEVEL SECURITY;

-- Payment schedules table
CREATE TABLE IF NOT EXISTS payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue
  paid_date DATE,
  paid_amount DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_schedules
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_schedules
CREATE POLICY "Users can view payment schedules for their loans" ON payment_schedules
  FOR SELECT USING (
    loan_id IN (
      SELECT l.id FROM loans l 
      JOIN clients c ON l.client_id = c.id 
      WHERE c.id = auth.uid()
    )
  );

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id UUID;
BEGIN
  -- Get the borrower role ID (default role for new users)
  SELECT id INTO default_role_id FROM user_roles WHERE name = 'borrower';
  
  -- Insert new profile
  INSERT INTO enhanced_profiles (id, role_id, first_name, last_name)
  VALUES (
    NEW.id,
    default_role_id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enhanced_profiles_role_id ON enhanced_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_loan_id ON documents(loan_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_client_id ON loan_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_loan_id ON payment_schedules(loan_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON payment_schedules(due_date);
