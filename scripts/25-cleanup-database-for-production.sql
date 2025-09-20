-- Script para limpiar la base de datos manteniendo solo usuarios
-- Este script elimina todos los datos de negocio pero preserva usuarios y permisos

-- Limpieza completa de datos de negocio para preparar el sistema para producción

-- Eliminar datos de transacciones y recibos (dependencias)
DELETE FROM transactions;
DELETE FROM receipts;

-- Eliminar datos de seguimientos
DELETE FROM follow_ups;

-- Eliminar datos de préstamos (dependencias de clientes)
DELETE FROM loans;
DELETE FROM active_loans;

-- Eliminar datos de clientes
DELETE FROM clients;
DELETE FROM active_clients;

-- Eliminar datos de socios
DELETE FROM partners;
DELETE FROM active_partners;

-- Reiniciar secuencias para códigos (opcional)
-- Esto asegura que los nuevos registros empiecen desde 1
-- Los códigos se generan automáticamente en las APIs

-- Verificar que solo quedan usuarios
SELECT 'profiles' as tabla, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'user_permissions' as tabla, COUNT(*) as registros FROM user_permissions
UNION ALL
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

-- Mensaje de confirmación
SELECT 'Base de datos limpiada exitosamente. Solo se mantuvieron usuarios y permisos.' as resultado;
