-- Script para forzar la limpieza completa de todos los datos
-- Mantiene solo usuarios y permisos

-- Eliminar todos los recibos
DELETE FROM receipts;

-- Eliminar todos los préstamos
DELETE FROM loans;

-- Eliminar todos los clientes
DELETE FROM clients;

-- Eliminar todos los socios
DELETE FROM partners;

-- Eliminar todas las transacciones
DELETE FROM transactions;

-- Eliminar todos los seguimientos
DELETE FROM follow_ups;

-- Eliminar tablas activas (si existen datos)
DELETE FROM active_clients;
DELETE FROM active_loans;
DELETE FROM active_partners;

-- Reiniciar secuencias para códigos
-- Esto asegura que los nuevos registros empiecen desde 1
ALTER SEQUENCE IF EXISTS clients_client_code_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS loans_loan_code_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS receipts_receipt_number_seq RESTART WITH 1;

-- Verificar que las tablas estén vacías
SELECT 'clients' as tabla, COUNT(*) as registros FROM clients
UNION ALL
SELECT 'loans' as tabla, COUNT(*) as registros FROM loans
UNION ALL
SELECT 'receipts' as tabla, COUNT(*) as registros FROM receipts
UNION ALL
SELECT 'partners' as tabla, COUNT(*) as registros FROM partners
UNION ALL
SELECT 'transactions' as tabla, COUNT(*) as registros FROM transactions
UNION ALL
SELECT 'follow_ups' as tabla, COUNT(*) as registros FROM follow_ups;
