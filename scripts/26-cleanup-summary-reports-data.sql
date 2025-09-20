-- Script para limpiar todos los datos de las rutas "Resumen para Socios" e "Informe de Situación Financiera"
-- Este script elimina todos los registros que afectan los cálculos de estas rutas

-- Limpiar datos de recibos (afecta ingresos y gastos)
DELETE FROM receipts;

-- Limpiar datos de préstamos (afecta capital en circulación y métricas de préstamos)
DELETE FROM loans;

-- Limpiar datos de clientes (afecta conteo de clientes activos)
DELETE FROM clients;

-- Limpiar datos de socios (afecta información de socios y capital)
DELETE FROM partners;

-- Limpiar datos de transacciones (afecta balance neto)
DELETE FROM transactions;

-- Limpiar datos de seguimientos
DELETE FROM follow_ups;

-- Limpiar vistas materializadas si existen
DELETE FROM active_clients;
DELETE FROM active_loans;
DELETE FROM active_partners;

-- Reiniciar secuencias para códigos
-- Nota: Los códigos se generan automáticamente, no hay secuencias específicas que reiniciar

COMMIT;
