-- Tabla profiles para la gestión de usuarios y roles
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamptz DEFAULT now(),
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  is_admin boolean DEFAULT FALSE NOT NULL,

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Habilitar RLS en la tabla profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para profiles
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Tabla partners para la información de los socios y su capital
CREATE TABLE partners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz, -- Para soft deletes
  name text NOT NULL,
  capital numeric DEFAULT 0 NOT NULL,
  withdrawals numeric DEFAULT 0 NOT NULL,
  generated_interest numeric DEFAULT 0 NOT NULL
);

-- Habilitar RLS en la tabla partners
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Tabla transactions para el detalle de ingresos y egresos
CREATE TABLE transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  type text NOT NULL, -- 'income' o 'expense'
  amount numeric NOT NULL,
  description text,
  partner_id uuid REFERENCES partners(id) ON DELETE SET NULL
);

-- Habilitar RLS en la tabla transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Tabla clients para la gestión de clientes de préstamos
CREATE TABLE clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_code text UNIQUE, -- ID formateado
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz, -- Para soft deletes
  last_name text NOT NULL,
  first_name text NOT NULL,
  dni text UNIQUE,
  address text,
  phone text,
  email text,
  referred_by text,
  status text,
  observations text,
  dni_photo_url text -- URL de la foto del DNI en Supabase Storage
);

-- Habilitar RLS en la tabla clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Tabla loans para el registro de préstamos
CREATE TABLE loans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_code text UNIQUE, -- ID formateado
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz, -- Para soft deletes
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  installments integer NOT NULL,
  loan_type text,
  interest_rate numeric,
  start_date date,
  end_date date,
  status text
);

-- Habilitar RLS en la tabla loans
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Tabla follow_ups para el seguimiento y recordatorios de clientes
CREATE TABLE follow_ups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  notes text,
  reminder_date date
);

-- Habilitar RLS en la tabla follow_ups
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
