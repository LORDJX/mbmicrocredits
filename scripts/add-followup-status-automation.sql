-- =====================================================
-- SCRIPT: Automatización de Estados de Seguimientos
-- Descripción: Agrega columna status y lógica automática
-- para actualizar estados de follow_ups
-- =====================================================

-- Paso 1: Agregar columna status a la tabla follow_ups
ALTER TABLE follow_ups 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendiente'
CHECK (status IN ('pendiente', 'completado', 'vencido', 'programado'));

-- Paso 2: Crear índice para mejorar performance de consultas por status
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_reminder_date ON follow_ups(reminder_date);

-- Paso 3: Crear función para actualizar estados automáticamente
CREATE OR REPLACE FUNCTION update_followup_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_date_arg DATE;
BEGIN
  -- Obtener fecha actual en zona horaria de Argentina (UTC-3)
  current_date_arg := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE;
  
  -- Actualizar seguimientos vencidos
  -- Si la fecha del seguimiento es anterior a hoy y no está completado
  UPDATE follow_ups
  SET 
    status = 'vencido',
    updated_at = NOW()
  WHERE 
    date < current_date_arg
    AND status != 'completado'
    AND status != 'vencido';
  
  -- Actualizar seguimientos pendientes
  -- Si la fecha del seguimiento es hoy o el reminder_date es hoy/pasado
  UPDATE follow_ups
  SET 
    status = 'pendiente',
    updated_at = NOW()
  WHERE 
    status != 'completado'
    AND status != 'vencido'
    AND (
      date = current_date_arg
      OR (reminder_date IS NOT NULL AND reminder_date <= current_date_arg)
    );
  
  -- Actualizar seguimientos programados
  -- Si la fecha del seguimiento es futura y no hay reminder activo
  UPDATE follow_ups
  SET 
    status = 'programado',
    updated_at = NOW()
  WHERE 
    date > current_date_arg
    AND status != 'completado'
    AND (reminder_date IS NULL OR reminder_date > current_date_arg)
    AND status != 'programado';
    
  -- Log de ejecución
  RAISE NOTICE 'Estados de seguimientos actualizados correctamente a las %', NOW();
END;
$$;

-- Paso 4: Crear función trigger para actualizar estado al insertar/modificar
CREATE OR REPLACE FUNCTION trigger_update_followup_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_date_arg DATE;
BEGIN
  -- Obtener fecha actual en zona horaria de Argentina (UTC-3)
  current_date_arg := (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE;
  
  -- Si el status es 'completado', mantenerlo
  IF NEW.status = 'completado' THEN
    RETURN NEW;
  END IF;
  
  -- Determinar el estado correcto basado en las fechas
  IF NEW.date < current_date_arg THEN
    NEW.status := 'vencido';
  ELSIF NEW.date = current_date_arg OR (NEW.reminder_date IS NOT NULL AND NEW.reminder_date <= current_date_arg) THEN
    NEW.status := 'pendiente';
  ELSE
    NEW.status := 'programado';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Paso 5: Crear trigger que se ejecuta antes de INSERT o UPDATE
DROP TRIGGER IF EXISTS trg_update_followup_status ON follow_ups;
CREATE TRIGGER trg_update_followup_status
  BEFORE INSERT OR UPDATE ON follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_followup_status();

-- Paso 6: Actualizar estados existentes
SELECT update_followup_status();

-- Paso 7: Crear cron job para ejecutar diariamente a las 00:00:30
-- Nota: Requiere la extensión pg_cron habilitada en Supabase
SELECT cron.schedule(
  'update-followup-status-daily',
  '30 0 * * *', -- Cron expression: 00:00:30 todos los días
  $$SELECT update_followup_status();$$
);

-- Paso 8: Recrear la vista v_follow_ups para usar la columna status real
DROP VIEW IF EXISTS v_follow_ups;
CREATE OR REPLACE VIEW v_follow_ups AS
SELECT 
  f.id,
  f.client_id,
  f.date,
  f.reminder_date,
  f.notes,
  f.status,
  f.created_at,
  f.updated_at,
  c.client_code,
  CONCAT(c.first_name, ' ', c.last_name) AS client_name,
  c.phone AS client_phone,
  c.email AS client_email
FROM follow_ups f
LEFT JOIN clients c ON f.client_id = c.id
WHERE f.deleted_at IS NULL;

-- Paso 9: Agregar políticas RLS para la función de actualización
-- Permitir que usuarios autenticados ejecuten la función manualmente
GRANT EXECUTE ON FUNCTION update_followup_status() TO authenticated;

-- Paso 10: Comentarios para documentación
COMMENT ON COLUMN follow_ups.status IS 'Estado del seguimiento: pendiente, completado, vencido, programado';
COMMENT ON FUNCTION update_followup_status() IS 'Actualiza automáticamente los estados de todos los seguimientos basándose en las fechas';
COMMENT ON FUNCTION trigger_update_followup_status() IS 'Trigger function que actualiza el estado de un seguimiento al insertar o modificar';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
