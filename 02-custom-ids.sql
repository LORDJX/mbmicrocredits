-- Función para generar códigos personalizados
CREATE OR REPLACE FUNCTION generate_custom_id(prefix TEXT, table_name TEXT)
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    next_val BIGINT;
BEGIN
    -- Asegurarse de que la secuencia exista
    EXECUTE 'CREATE SEQUENCE IF NOT EXISTS ' || table_name || '_code_seq;';
    -- Obtener el siguiente valor de la secuencia
    EXECUTE 'SELECT nextval(''' || table_name || '_code_seq'');' INTO next_val;
    -- Formatear el nuevo ID
    new_id := prefix || LPAD(next_val::TEXT, 6, '0');
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para autogenerar client_code en la tabla clients
CREATE OR REPLACE FUNCTION set_client_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.client_code := generate_custom_id('CLI', 'clients');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_insert_clients ON clients;
CREATE TRIGGER before_insert_clients
BEFORE INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION set_client_code();

-- Trigger para autogenerar loan_code en la tabla loans
CREATE OR REPLACE FUNCTION set_loan_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.loan_code := generate_custom_id('PRE', 'loans');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_insert_loans ON loans;
CREATE TRIGGER before_insert_loans
BEFORE INSERT ON loans
FOR EACH ROW
EXECUTE FUNCTION set_loan_code();
