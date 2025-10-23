# Automatización de Estados de Seguimientos

## Descripción General

Sistema automático para actualizar los estados de seguimientos (follow_ups) basándose en fechas y lógica de negocio. La actualización se ejecuta de dos formas:

1. **Automáticamente**: Cada día a las 00:00:30 (hora de Argentina, UTC-3)
2. **En tiempo real**: Cada vez que se crea o modifica un seguimiento

## Estados de Seguimientos

| Estado | Descripción | Condición |
|--------|-------------|-----------|
| `programado` | Seguimiento futuro sin recordatorio activo | `date > hoy` Y (`reminder_date` es NULL O `reminder_date > hoy`) |
| `pendiente` | Requiere atención inmediata | `date = hoy` O `reminder_date <= hoy` |
| `vencido` | Seguimiento no completado con fecha pasada | `date < hoy` Y `status != 'completado'` |
| `completado` | Seguimiento finalizado (manual) | Establecido manualmente por el usuario |

## Componentes del Sistema

### 1. Base de Datos (Supabase)

#### Columna `status`
\`\`\`sql
ALTER TABLE follow_ups 
ADD COLUMN status TEXT DEFAULT 'pendiente'
CHECK (status IN ('pendiente', 'completado', 'vencido', 'programado'));
\`\`\`

#### Función de Actualización
\`\`\`sql
CREATE FUNCTION update_followup_status() RETURNS void
\`\`\`
- Actualiza todos los seguimientos según su fecha
- Respeta el estado 'completado' (no lo modifica)
- Usa zona horaria de Argentina (UTC-3)

#### Trigger Automático
\`\`\`sql
CREATE TRIGGER trg_update_followup_status
  BEFORE INSERT OR UPDATE ON follow_ups
\`\`\`
- Se ejecuta antes de insertar o actualizar un registro
- Calcula el estado correcto automáticamente
- Mantiene el estado 'completado' si ya está establecido

#### Cron Job de Supabase
\`\`\`sql
SELECT cron.schedule(
  'update-followup-status-daily',
  '30 0 * * *',
  $$SELECT update_followup_status();$$
);
\`\`\`
- Se ejecuta diariamente a las 00:00:30
- Actualiza todos los seguimientos en batch

### 2. API Route (Next.js)

**Endpoint**: `/api/followups/update-status`

**Métodos**:
- `POST`: Ejecuta la actualización de estados
- `GET`: Verifica el estado del servicio

**Autenticación**:
- Usuarios autenticados pueden ejecutar manualmente
- Vercel Cron Jobs pueden ejecutar con `CRON_SECRET`

**Respuesta**:
\`\`\`json
{
  "success": true,
  "message": "Estados de seguimientos actualizados correctamente",
  "timestamp": "2025-01-19T03:00:30.000Z",
  "stats": {
    "pendiente": 5,
    "vencido": 2,
    "programado": 10,
    "completado": 3
  }
}
\`\`\`

### 3. Vercel Cron Job

**Configuración** (`vercel.json`):
\`\`\`json
{
  "crons": [
    {
      "path": "/api/followups/update-status",
      "schedule": "30 0 * * *"
    }
  ]
}
\`\`\`

**Nota**: Actúa como backup del cron job de Supabase

## Flujo de Actualización

### Actualización Automática Diaria

\`\`\`mermaid
graph LR
    A[00:00:30 UTC-3] --> B[Cron Job Supabase]
    B --> C[update_followup_status()]
    C --> D[Actualizar estados]
    D --> E[Log de resultados]
    
    A --> F[Vercel Cron Job]
    F --> G[POST /api/followups/update-status]
    G --> C
\`\`\`

### Actualización en Tiempo Real

\`\`\`mermaid
graph LR
    A[INSERT/UPDATE follow_up] --> B[Trigger]
    B --> C[trigger_update_followup_status()]
    C --> D[Calcular estado]
    D --> E[Aplicar estado]
    E --> F[Guardar registro]
\`\`\`

## Configuración Requerida

### Variables de Entorno

\`\`\`env
# Para Vercel Cron Jobs (opcional)
CRON_SECRET=tu_secreto_aqui
\`\`\`

### Extensiones de Supabase

Asegúrate de que la extensión `pg_cron` esté habilitada:

\`\`\`sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
\`\`\`

## Uso Manual

### Desde la Aplicación

Los usuarios autenticados pueden forzar una actualización llamando al endpoint:

\`\`\`typescript
const response = await fetch('/api/followups/update-status', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
})

const result = await response.json()
console.log(result.stats) // Estadísticas de estados
\`\`\`

### Desde SQL (Supabase Dashboard)

\`\`\`sql
SELECT update_followup_status();
\`\`\`

## Monitoreo

### Ver Ejecuciones del Cron Job

\`\`\`sql
SELECT * FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'update-followup-status-daily'
)
ORDER BY start_time DESC
LIMIT 10;
\`\`\`

### Ver Distribución de Estados

\`\`\`sql
SELECT 
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje
FROM follow_ups
GROUP BY status
ORDER BY total DESC;
\`\`\`

## Mantenimiento

### Desactivar Cron Job

\`\`\`sql
SELECT cron.unschedule('update-followup-status-daily');
\`\`\`

### Reactivar Cron Job

\`\`\`sql
SELECT cron.schedule(
  'update-followup-status-daily',
  '30 0 * * *',
  $$SELECT update_followup_status();$$
);
\`\`\`

### Cambiar Horario de Ejecución

\`\`\`sql
-- Cambiar a las 01:00:00
SELECT cron.unschedule('update-followup-status-daily');
SELECT cron.schedule(
  'update-followup-status-daily',
  '0 1 * * *',
  $$SELECT update_followup_status();$$
);
\`\`\`

## Solución de Problemas

### Los estados no se actualizan

1. Verificar que el cron job esté activo:
\`\`\`sql
SELECT * FROM cron.job WHERE jobname = 'update-followup-status-daily';
\`\`\`

2. Verificar logs de ejecución:
\`\`\`sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
\`\`\`

3. Ejecutar manualmente para ver errores:
\`\`\`sql
SELECT update_followup_status();
\`\`\`

### Zona horaria incorrecta

Verificar la zona horaria de la base de datos:
\`\`\`sql
SHOW timezone;
\`\`\`

Si es necesario, ajustar en la función:
\`\`\`sql
-- Cambiar 'America/Argentina/Buenos_Aires' por la zona horaria correcta
\`\`\`

## Mejoras Futuras

- [ ] Notificaciones cuando un seguimiento cambia a 'vencido'
- [ ] Dashboard de métricas de seguimientos
- [ ] Recordatorios automáticos por email/SMS
- [ ] Historial de cambios de estado
- [ ] Reglas personalizables por usuario

## Contacto y Soporte

Para problemas o sugerencias, contactar al equipo de desarrollo.
