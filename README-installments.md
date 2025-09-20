# Loan Installments Control System

Sistema de control de imputaciones de cuotas para préstamos con cronograma automático y manejo de pagos secuenciales.

## 🚀 Características

- **Generación automática de cronogramas** al crear préstamos
- **Imputación secuencial de pagos** (vencidas → hoy → futuras)
- **Pagos parciales y excedentes** con propagación automática
- **Estados de cuota en tiempo real** usando timezone Argentina/Córdoba
- **APIs RESTful** con validación Zod
- **Funciones SQL optimizadas** para transacciones atómicas

## 📐 Modelo de Datos

### Tablas Principales

\`\`\`sql
-- Préstamos (tabla existente mejorada)
loans: id, principal, installments_total, installment_amount, start_date, frequency

-- Cuotas individuales
installments: id, loan_id, installment_no, code, due_date, amount_due, amount_paid, paid_at

-- Pagos realizados
payments: id, loan_id, paid_amount, paid_at, note

-- Imputaciones de pagos a cuotas
payment_imputations: id, payment_id, installment_id, imputed_amount
\`\`\`

### Estados de Cuota

- **A_PAGAR** → no pagada y hoy < due_date
- **A_PAGAR_HOY** → no pagada y hoy == due_date  
- **VENCIDA** → no pagada y hoy > due_date
- **PAGO_ANTICIPADO** → paid_at < due_date
- **PAGADA_EN_FECHA** → paid_at == due_date
- **PAGADA_CON_MORA** → paid_at > due_date

## 🛠️ Instalación

### 1. Ejecutar Migraciones

Pegar en el editor SQL de Supabase:

\`\`\`sql
-- Ejecutar en orden:
\i scripts/30-loan-installments-schema.sql
\i scripts/31-loan-installments-functions.sql
\`\`\`

### 2. Cargar Datos de Prueba

\`\`\`sql
\i scripts/32-loan-installments-seed.sql
\`\`\`

### 3. Verificar Instalación

\`\`\`bash
# Ejecutar tests
npm run test:installments

# O manualmente:
node scripts/test-installments.ts
\`\`\`

## 🛣️ API Endpoints

### Crear Préstamo
\`\`\`bash
POST /api/loans
Content-Type: application/json

{
  "client_id": "uuid",
  "principal": 60000.00,
  "installments_total": 6,
  "installment_amount": 10000.00,
  "start_date": "2025-01-01",
  "frequency": "monthly"
}
\`\`\`

### Ver Cronograma
\`\`\`bash
GET /api/loans/{id}/schedule

# Respuesta:
{
  "installments": [
    {
      "installment_no": 1,
      "code": "L{loan_id}-C1",
      "due_date": "2025-01-01",
      "amount_due": 10000.00,
      "amount_paid": 10000.00,
      "status": "PAGO_ANTICIPADO",
      "balance_due": 0
    }
  ],
  "totals": {
    "total_due": 60000.00,
    "total_paid": 30000.00,
    "count_overdue": 0,
    "count_due_today": 1,
    "count_future": 2
  }
}
\`\`\`

### Registrar Pago
\`\`\`bash
POST /api/payments
Content-Type: application/json

{
  "loan_id": "uuid",
  "paid_amount": 15000.00,
  "note": "Pago parcial con excedente"
}

# Respuesta:
{
  "payment_id": "uuid",
  "total_paid": 15000.00,
  "remaining_amount": 0,
  "imputations": [
    {
      "installment_no": 2,
      "code": "L{loan_id}-C2",
      "imputed_amount": 10000.00,
      "previous_balance": 10000.00,
      "new_balance": 0
    },
    {
      "installment_no": 3,
      "code": "L{loan_id}-C3", 
      "imputed_amount": 5000.00,
      "previous_balance": 10000.00,
      "new_balance": 5000.00
    }
  ]
}
\`\`\`

### Resumen de Préstamo
\`\`\`bash
GET /api/loans/{id}/summary

# Respuesta:
{
  "loan_id": "uuid",
  "loan_code": "LOAN-001",
  "client": {
    "name": "Juan Pérez",
    "client_code": "CLI-001"
  },
  "totals": {
    "principal": 60000.00,
    "total_due": 60000.00,
    "total_paid": 30000.00,
    "balance": 30000.00
  },
  "counts": {
    "overdue": 0,
    "due_today": 1,
    "future": 2,
    "paid_ontime": 2,
    "paid_early": 1,
    "paid_late": 0
  },
  "next_installments": [...],
  "is_fully_paid": false,
  "has_overdue": false
}
\`\`\`

## 🧪 Testing

### Casos de Prueba Automatizados

\`\`\`bash
# Ejecutar suite completa
npm test

# Solo tests de imputación
npm run test:imputation

# Tests de endpoints
npm run test:api
\`\`\`

### Casos de Prueba Manuales

1. **Pago exacto**: $10,000 → completa 1 cuota
2. **Pago parcial**: $6,000 → pago parcial en cuota 1
3. **Pago excedente**: $25,000 → completa 2 cuotas + parcial en tercera
4. **Sin fondos**: $0 → no afecta ninguna cuota

### cURL Examples

\`\`\`bash
# Crear préstamo de prueba
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "uuid-here",
    "principal": 30000,
    "installments_total": 6,
    "installment_amount": 5000,
    "start_date": "2025-01-01"
  }'

# Ver cronograma
curl http://localhost:3000/api/loans/{loan-id}/schedule

# Hacer pago
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "uuid-here",
    "paid_amount": 7500,
    "note": "Pago parcial con excedente"
  }'

# Ver resumen
curl http://localhost:3000/api/loans/{loan-id}/summary
\`\`\`

## 🔐 Seguridad

- **RLS habilitado** en todas las tablas nuevas
- **Validación Zod** en todos los endpoints
- **Service Role** solo en servidor (nunca en cliente)
- **Transacciones atómicas** para pagos
- **Constraints de base de datos** para integridad

## ✅ Criterios de Aceptación

- [x] Crear préstamo genera 6 cuotas con códigos únicos L{loan}-C{n}
- [x] Cuota con due_date == hoy aparece como A_PAGAR_HOY (timezone Córdoba)
- [x] Pago parcial se imputa correctamente y deja amount_paid correcto
- [x] Excedente se propaga automáticamente a siguiente(s) cuota(s)
- [x] Al completar cuota, paid_at se setea y estado cambia apropiadamente
- [x] GET /api/loans/{id}/summary refleja saldos y contadores correctos
- [x] No se rompe ningún endpoint existente

## 🐛 Troubleshooting

### Error: "Function generate_installments_on_loan_insert does not exist"
\`\`\`sql
-- Verificar que las funciones se crearon:
SELECT proname FROM pg_proc WHERE proname LIKE '%installment%';

-- Re-ejecutar si es necesario:
\i scripts/31-loan-installments-functions.sql
\`\`\`

### Error: "Timezone America/Argentina/Cordoba not found"
\`\`\`sql
-- Verificar timezones disponibles:
SELECT name FROM pg_timezone_names WHERE name LIKE '%Argentina%';

-- Usar alternativa si es necesario:
-- timezone('America/Argentina/Buenos_Aires', now())
\`\`\`

### Pagos no se imputan correctamente
\`\`\`sql
-- Verificar estado de cuotas:
SELECT * FROM installments_with_status WHERE loan_id = 'your-loan-id';

-- Verificar imputaciones:
SELECT * FROM payment_imputations WHERE payment_id = 'your-payment-id';
