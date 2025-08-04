-- Vistas para registros "activos" (soft deletes)
CREATE VIEW active_partners AS
SELECT * FROM partners
WHERE deleted_at IS NULL;

CREATE VIEW active_clients AS
SELECT * FROM clients
WHERE deleted_at IS NULL;

CREATE VIEW active_loans AS
SELECT * FROM loans
WHERE deleted_at IS NULL;
