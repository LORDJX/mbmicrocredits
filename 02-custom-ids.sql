-- Secuencia para client_code
CREATE SEQUENCE client_code_seq
  START 1
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 999999
  CACHE 1;

-- Función para generar client_code
CREATE OR REPLACE FUNCTION generate_client_code()
RETURNS TEXT AS $$
DECLARE
  next_id BIGINT;
BEGIN
  SELECT nextval('client_code_seq') INTO next_id;
  RETURN 'CLI-' || LPAD(next_id::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar client_code en la tabla clients
CREATE TRIGGER set_client_code
BEFORE INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION generate_client_code();

-- Secuencia para loan_code
CREATE SEQUENCE loan_code_seq
  START 1
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 999999
  CACHE 1;

-- Función para generar loan_code
CREATE OR REPLACE FUNCTION generate_loan_code()
RETURNS TEXT AS $$
DECLARE
  next_id BIGINT;
BEGIN
  SELECT nextval('loan_code_seq') INTO next_id;
  RETURN 'P-' || LPAD(next_id::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar loan_code en la tabla loans
CREATE TRIGGER set_loan_code
BEFORE INSERT ON loans
FOR EACH ROW
EXECUTE FUNCTION generate_loan_code();
