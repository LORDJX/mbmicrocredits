-- Script para limpieza completa de datos financieros
-- Elimina todos los registros de las tablas de datos manteniendo solo usuarios

-- Limpieza completa de todas las tablas de datos
BEGIN;

-- Eliminar todos los recibos
DELETE FROM receipts;
RESET IDENTITY receipts RESTART IDENTITY;

-- Eliminar todos los préstamos
DELETE FROM loans;
RESET IDENTITY loans RESTART IDENTITY;

-- Eliminar todos los clientes
DELETE FROM clients;
RESET IDENTITY clients RESTART IDENTITY;

-- Eliminar todos los socios
DELETE FROM partners;
RESET IDENTITY partners RESTART IDENTITY;

-- Eliminar todas las transacciones
DELETE FROM transactions;
RESET IDENTITY transactions RESTART IDENTITY;

-- Eliminar todos los seguimientos
DELETE FROM follow_ups;
RESET IDENTITY follow_ups RESTART IDENTITY;

-- Eliminar tablas activas (si existen)
DELETE FROM active_clients;
DELETE FROM active_loans;
DELETE FROM active_partners;

-- Verificar que las tablas estén vacías
SELECT 'receipts' as tabla, COUNT(*) as registros FROM receipts
UNION ALL
SELECT 'loans' as tabla, COUNT(*) as registros FROM loans
UNION ALL
SELECT 'clients' as tabla, COUNT(*) as registros FROM clients
UNION ALL
SELECT 'partners' as tabla, COUNT(*) as registros FROM partners
UNION ALL
SELECT 'transactions' as tabla, COUNT(*) as registros FROM transactions
UNION ALL
SELECT 'follow_ups' as tabla, COUNT(*) as registros FROM follow_ups;

COMMIT;
