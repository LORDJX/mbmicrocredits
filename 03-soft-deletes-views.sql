-- Vista para socios activos
CREATE OR REPLACE VIEW active_partners AS
SELECT * FROM partners WHERE deleted_at IS NULL;

-- Vista para clientes activos
CREATE OR REPLACE VIEW active_clients AS
SELECT * FROM clients WHERE deleted_at IS NULL;

-- Vista para préstamos activos
CREATE OR REPLACE VIEW active_loans AS
SELECT * FROM loans WHERE deleted_at IS NULL;
