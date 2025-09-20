-- Desactivar RLS temporalmente para insertar datos
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups DISABLE ROW LEVEL SECURITY;

-- Insertar 5 socios de prueba
INSERT INTO public.partners (name, initial_capital, current_capital) VALUES
('Juan Pérez', 50000.00, 52000.00),
('Ana Gómez', 75000.00, 78000.00),
('Luis Rodríguez', 60000.00, 59000.00),
('María Fernández', 100000.00, 110000.00),
('Carlos Sánchez', 40000.00, 41500.00)
ON CONFLICT DO NOTHING;

-- Insertar 20 clientes de prueba
INSERT INTO public.clients (first_name, last_name, dni, email, phone, address, status) VALUES
('Elena', 'Vargas', '12345678A', 'elena.vargas@example.com', '600111222', 'Calle Falsa 123', 'activo'),
('Pedro', 'Jiménez', '87654321B', 'pedro.jimenez@example.com', '600222333', 'Avenida Siempre Viva 742', 'activo'),
('Laura', 'Ruiz', '11223344C', 'laura.ruiz@example.com', '600333444', 'Plaza Mayor 1', 'activo'),
('Miguel', 'Hernández', '55667788D', 'miguel.hernandez@example.com', '600444555', 'Paseo de la Castellana 100', 'inactivo'),
('Sofía', 'Díaz', '99887766E', 'sofia.diaz@example.com', '600555666', 'Calle Gran Vía 50', 'activo'),
('Javier', 'Moreno', '12312312F', 'javier.moreno@example.com', '600666777', 'Calle de Alcalá 200', 'activo'),
('Carmen', 'Muñoz', '45645645G', 'carmen.munoz@example.com', '600777888', 'Calle Serrano 50', 'activo'),
('David', 'Álvarez', '78978978H', 'david.alvarez@example.com', '600888999', 'Avenida de América 10', 'activo'),
('Isabel', 'Romero', '14725836I', 'isabel.romero@example.com', '600999000', 'Calle del Príncipe de Vergara 150', 'activo'),
('Francisco', 'Navarro', '36925814J', 'francisco.navarro@example.com', '601000111', 'Calle de la Princesa 30', 'activo'),
('Lucía', 'Gutiérrez', '25814736K', 'lucia.gutierrez@example.com', '601111222', 'Calle de Velázquez 80', 'activo'),
('Daniel', 'Ortega', '14736925L', 'daniel.ortega@example.com', '601222333', 'Calle de Goya 10', 'activo'),
('Paula', 'Reyes', '36914725M', 'paula.reyes@example.com', '601333444', 'Avenida del Mediterráneo 5', 'activo'),
('Adrián', 'Guerrero', '25836914N', 'adrian.guerrero@example.com', '601444555', 'Calle de Atocha 40', 'activo'),
('Marta', 'Cano', '14725836O', 'marta.cano@example.com', '601555666', 'Paseo del Prado 20', 'activo'),
('Sergio', 'Prieto', '36925814P', 'sergio.prieto@example.com', '601666777', 'Calle Mayor 80', 'activo'),
('Cristina', 'Molina', '25814736Q', 'cristina.molina@example.com', '601777888', 'Ronda de Valencia 1', 'activo'),
('Alejandro', 'Soria', '14736925R', 'alejandro.soria@example.com', '601888999', 'Calle de Bailén 15', 'activo'),
('Beatriz', 'León', '36914725S', 'beatriz.leon@example.com', '601999000', 'Carrera de San Jerónimo 10', 'activo'),
('Manuel', 'Vega', '25836914T', 'manuel.vega@example.com', '602000111', 'Calle de Hortaleza 60', 'activo')
ON CONFLICT (client_code) DO NOTHING;

-- Insertar 15 préstamos de prueba
DO $$
DECLARE
    client_ids UUID[];
    random_client_id UUID;
BEGIN
    SELECT array_agg(id) INTO client_ids FROM public.clients;
    FOR i IN 1..15 LOOP
        random_client_id := client_ids[1 + floor(random() * array_length(client_ids, 1))];
        INSERT INTO public.loans (client_id, amount, installments, interest_rate, start_date, status)
        VALUES (
            random_client_id,
            floor(random() * 5000 + 500)::NUMERIC(10, 2),
            (floor(random() * 12 + 6))::INTEGER,
            (random() * 15 + 5)::NUMERIC(5, 2),
            CURRENT_DATE - (floor(random() * 365) * interval '1 day'),
            'activo'
        );
    END LOOP;
END $$;

-- Insertar 30 transacciones de prueba
DO $$
DECLARE
    partner_ids UUID[];
    random_partner_id UUID;
BEGIN
    SELECT array_agg(id) INTO partner_ids FROM public.partners;
    FOR i IN 1..30 LOOP
        random_partner_id := partner_ids[1 + floor(random() * array_length(partner_ids, 1))];
        INSERT INTO public.transactions (type, amount, description, partner_id)
        VALUES (
            CASE WHEN random() > 0.4 THEN 'income' ELSE 'expense' END,
            floor(random() * 1000 + 50)::NUMERIC(10, 2),
            'Transacción de prueba ' || i,
            CASE WHEN random() > 0.5 THEN random_partner_id ELSE NULL END
        );
    END LOOP;
END $$;

-- Insertar 10 seguimientos de prueba
DO $$
DECLARE
    client_ids UUID[];
    random_client_id UUID;
BEGIN
    SELECT array_agg(id) INTO client_ids FROM public.clients;
    FOR i IN 1..10 LOOP
        random_client_id := client_ids[1 + floor(random() * array_length(client_ids, 1))];
        INSERT INTO public.follow_ups (client_id, date, notes)
        VALUES (
            random_client_id,
            CURRENT_DATE - (floor(random() * 90) * interval '1 day'),
            'Nota de seguimiento de prueba ' || i
        );
    END LOOP;
END $$;

-- Reactivar RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
