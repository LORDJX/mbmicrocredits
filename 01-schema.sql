-- Crear tabla de socios
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    initial_capital NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_capital NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_code TEXT UNIQUE NOT NULL,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    dni TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    referred_by TEXT,
    status TEXT,
    observations TEXT,
    dni_photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Crear tabla de préstamos
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_code TEXT UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    amount NUMERIC(10, 2) NOT NULL,
    installments INTEGER NOT NULL,
    loan_type TEXT,
    interest_rate NUMERIC(5, 2),
    start_date DATE,
    end_date DATE,
    status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Crear tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT,
    partner_id UUID REFERENCES partners(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Crear tabla de seguimientos
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    date DATE NOT NULL,
    notes TEXT,
    reminder_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Crear tabla de recibos que faltaba
-- Crear tabla de recibos
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT,
    receipt_date DATE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    payment_type TEXT NOT NULL,
    cash_amount NUMERIC(10, 2) DEFAULT 0.00,
    transfer_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    observations TEXT,
    attachment_url TEXT,
    selected_loans JSONB,
    selected_installments JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ
);
