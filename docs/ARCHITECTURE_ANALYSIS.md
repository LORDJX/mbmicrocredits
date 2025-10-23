# Análisis Completo de Arquitectura - Sistema de Gestión de Préstamos

## 1. MAPA DE ARQUITECTURA

### 1.1 Estructura de Rutas/Páginas

\`\`\`
app/
├── auth/
│   ├── login/page.tsx                    # Autenticación de usuarios
│   ├── sign-up/page.tsx                  # Registro de nuevos usuarios
│   └── check-email/page.tsx              # Verificación de email
│
├── dashboard/
│   ├── page.tsx                          # Dashboard principal con estadísticas
│   ├── users/page.tsx                    # Gestión de usuarios y permisos
│   ├── partners/page.tsx                 # Gestión de socios
│   ├── receipts/page.tsx                 # Gestión de recibos
│   └── followups/page.tsx                # Gestión de seguimientos
│
├── clientes/page.tsx                     # Gestión de clientes
├── prestamos/page.tsx                    # Gestión de préstamos
├── cronogramas/page.tsx                  # Cronograma de cuotas
├── gastos/page.tsx                       # Gestión de gastos
├── formulas/page.tsx                     # Fórmulas de cálculo
└── page.tsx                              # Landing page
\`\`\`

### 1.2 Estructura de APIs

\`\`\`
app/api/
├── clients/
│   ├── route.ts                          # GET (listar), POST (crear)
│   ├── [id]/route.ts                     # GET (detalle), PATCH (editar), DELETE
│   ├── [id]/status/route.ts              # PATCH (cambiar estado)
│   ├── [id]/loans/route.ts               # GET (préstamos del cliente)
│   └── bulk-activate/route.ts            # POST (activar todos)
│
├── loans/
│   ├── route.ts                          # GET (listar), POST (crear)
│   ├── [id]/route.ts                     # GET (detalle), PATCH (editar), DELETE
│   ├── [id]/status/route.ts              # PATCH (cambiar estado)
│   ├── [id]/balance/route.ts             # GET (saldo del préstamo)
│   ├── [id]/schedule/route.ts            # GET (cronograma de cuotas)
│   ├── [id]/summary/route.ts             # GET (resumen del préstamo)
│   └── [id]/generate-schedule/route.ts   # POST (generar cuotas)
│
├── receipts/
│   ├── route.ts                          # GET (listar), POST (crear)
│   └── [id]/route.ts                     # GET (detalle), PATCH (editar), DELETE
│
├── expenses/
│   ├── route.ts                          # GET (listar), POST (crear)
│   └── [id]/route.ts                     # GET (detalle), PATCH (editar), DELETE
│
├── expense-categories/
│   ├── route.ts                          # GET (listar), POST (crear)
│   └── [id]/route.ts                     # PATCH (editar), DELETE
│
├── followups/
│   ├── route.ts                          # GET (listar), POST (crear)
│   ├── [id]/route.ts                     # GET (detalle), PATCH (editar), DELETE
│   └── update-status/route.ts            # GET (actualizar estados automáticamente)
│
├── users/
│   ├── route.ts                          # GET (listar), POST (crear)
│   ├── [id]/route.ts                     # GET (detalle), PATCH (editar), DELETE
│   └── [id]/permissions/route.ts         # GET (permisos), POST (asignar)
│
├── roles/route.ts                        # GET (listar roles)
├── payments/route.ts                     # POST (registrar pago)
└── cronograma/route.ts                   # GET (cronograma completo)
\`\`\`

### 1.3 Componentes Principales

\`\`\`
components/
├── forms/
│   ├── create-client-form.tsx            # Formulario de clientes
│   ├── create-loan-form.tsx              # Formulario de préstamos
│   ├── create-receipt-form.tsx           # Formulario de recibos
│   ├── create-expense-form.tsx           # Formulario de gastos
│   └── create-followup-form.tsx          # Formulario de seguimientos
│
├── communication/
│   ├── receipt-actions.tsx               # Acciones de recibos (imprimir, WhatsApp)
│   ├── receipt-templates.tsx             # Plantillas de recibos
│   ├── print-utils.tsx                   # Utilidades de impresión
│   └── whatsapp-share.tsx                # Compartir por WhatsApp
│
├── layout/
│   ├── header.tsx                        # Header principal
│   └── sidebar.tsx                       # Sidebar de navegación
│
├── ui/                                   # Componentes de shadcn/ui
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   ├── select.tsx
│   └── ... (50+ componentes)
│
├── dashboard-sidebar.tsx                 # Sidebar del dashboard
├── date-picker.tsx                       # Selector de fechas
├── stats-card.tsx                        # Tarjetas de estadísticas
├── client-loans-selector.tsx             # Selector de préstamos por cliente
├── loan-status-selector.tsx              # Selector de estado de préstamo
├── loan-actions-menu.tsx                 # Menú de acciones de préstamo
├── cronograma-modal.tsx                  # Modal de cronograma
├── manage-categories-dialog.tsx          # Gestión de categorías
└── client-card-print.tsx                 # Impresión de ficha de cliente
\`\`\`

---

## 2. FLUJOS DE DATOS DETALLADOS

### 2.1 PRÉSTAMOS

#### 2.1.1 Creación de Préstamo

**Componente Iniciador:** `components/forms/create-loan-form.tsx`

**Flujo:**
1. Usuario completa formulario con:
   - `client_id` (seleccionado de lista)
   - `amount` (monto del préstamo)
   - `installments` (número de cuotas)
   - `interest_rate` (tasa de interés)
   - `start_date` (fecha de inicio)
   - `frequency` (mensual/quincenal/semanal)
   - `loan_type` (personal/hipotecario/etc)

2. **Endpoint:** `POST /api/loans`

3. **Payload enviado:**
\`\`\`json
{
  "client_id": "uuid",
  "amount": 10000,
  "installments": 12,
  "interest_rate": 5,
  "start_date": "2025-01-15",
  "frequency": "monthly",
  "loan_type": "personal",
  "status": "active"
}
\`\`\`

4. **Procesamiento en API:**
   - Valida autenticación del usuario
   - Calcula `amount_to_repay = amount * (1 + (interest_rate/100) * installments)`
   - Calcula `installment_amount = amount_to_repay / installments`
   - Genera código único: `PR00001`, `PR00002`, etc.
   - Calcula `end_date` basado en `start_date` + `installments` meses
   - Inserta préstamo en tabla `loans`
   - **Genera automáticamente cuotas** en tabla `installments`:
     - Para cada cuota (1 a N):
       - Calcula `due_date` según frecuencia
       - Asigna `amount_due = installment_amount`
       - Estado inicial: `A_PAGAR`
       - Código: `PR00001-01`, `PR00001-02`, etc.

5. **Response:**
\`\`\`json
{
  "loan": {
    "id": "uuid",
    "loan_code": "PR00001",
    "client_id": "uuid",
    "amount": 10000,
    "installments": 12,
    "interest_rate": 5,
    "amount_to_repay": 16000,
    "installment_amount": 1333.33,
    "start_date": "2025-01-15",
    "end_date": "2026-01-15",
    "status": "active",
    "clients": {
      "first_name": "Juan",
      "last_name": "Pérez",
      "client_code": "CL0001"
    }
  }
}
\`\`\`

6. **Actualización de Estado Local:**
   - Muestra toast de éxito
   - Cierra el diálogo
   - Llama a `onSuccess()` callback
   - La página padre recarga la lista de préstamos

#### 2.1.2 Listado de Préstamos

**Componente:** `app/prestamos/page.tsx`

**Flujo:**
1. **Carga inicial (Server Component):**
   - Ejecuta `createClient()` del servidor
   - Consulta directa a Supabase:
\`\`\`typescript
const { data: loans } = await supabase
  .from("loans")
  .select(`*, clients!inner(first_name, last_name, client_code)`)
  .order("created_at", { ascending: false })
\`\`\`

2. **Filtros disponibles:**
   - Búsqueda por texto (código, nombre cliente)
   - Filtro por estado (activo/cancelado/completado)
   - Filtro por cliente específico

3. **Datos mostrados:**
   - Código de préstamo
   - Cliente (nombre + código)
   - Monto original
   - Cuotas totales
   - Monto a devolver
   - Fecha de inicio
   - Estado (con selector editable)
   - Saldo pendiente (calculado)
   - Acciones (imprimir, WhatsApp, ver cuotas, editar)

#### 2.1.3 Edición de Préstamo

**Componente:** `loan-actions-menu.tsx` → `create-loan-form.tsx`

**Flujo:**
1. Usuario hace clic en "Editar" en el menú de acciones
2. Se abre el formulario con datos precargados
3. Usuario modifica campos permitidos
4. **Endpoint:** `PATCH /api/loans/[id]`
5. **Payload:**
\`\`\`json
{
  "amount": 12000,
  "interest_rate": 6,
  "status": "active"
}
\`\`\`
6. **Response:** Préstamo actualizado
7. **Actualización:** Recarga la lista de préstamos

#### 2.1.4 Cambio de Estado

**Componente:** `loan-status-selector.tsx`

**Flujo:**
1. Usuario selecciona nuevo estado del dropdown
2. **Endpoint:** `PATCH /api/loans/[id]/status`
3. **Payload:**
\`\`\`json
{
  "status": "completado"
}
\`\`\`
4. **Validaciones:**
   - Si cambia a "completado", verifica que todas las cuotas estén pagadas
5. **Response:** Estado actualizado
6. **Actualización:** Refresca la fila en la tabla

#### 2.1.5 Cálculo de Saldo

**Endpoint:** `GET /api/loans/[id]/balance`

**Flujo:**
1. Consulta todas las cuotas del préstamo
2. Suma cuotas impagadas:
\`\`\`typescript
const unpaidInstallments = installments.filter(i => 
  i.amount_paid < i.amount_due
)
const balance = unpaidInstallments.reduce((sum, i) => 
  sum + (i.amount_due - i.amount_paid), 0
)
\`\`\`
3. **Response:**
\`\`\`json
{
  "balance": 8000,
  "unpaid_installments": 6,
  "total_installments": 12
}
\`\`\`

---

### 2.2 CLIENTES

#### 2.2.1 Creación de Cliente

**Componente:** `components/forms/create-client-form.tsx`

**Flujo:**
1. Usuario completa formulario:
   - `first_name`, `last_name` (requeridos)
   - `dni` (requerido, único)
   - `phone`, `email`, `address`
   - `referred_by`, `observations`
   - `status` (activo/inactivo)

2. **Endpoint:** `POST /api/clients`

3. **Payload:**
\`\`\`json
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "dni": "12345678",
  "phone": "+5491123456789",
  "email": "juan@example.com",
  "address": "Calle Falsa 123",
  "status": "active"
}
\`\`\`

4. **Procesamiento:**
   - Valida DNI único
   - Genera código: `CL0001`, `CL0002`, etc.
   - Inserta en tabla `clients`

5. **Response:**
\`\`\`json
{
  "client": {
    "id": "uuid",
    "client_code": "CL0001",
    "first_name": "Juan",
    "last_name": "Pérez",
    "dni": "12345678",
    "status": "active"
  }
}
\`\`\`

#### 2.2.2 Activación Masiva

**Componente:** `app/clientes/page.tsx`

**Flujo:**
1. Usuario hace clic en "Activar Todos"
2. **Endpoint:** `POST /api/clients/bulk-activate`
3. **Procesamiento:**
\`\`\`typescript
await supabase
  .from("clients")
  .update({ status: "active" })
  .eq("status", "inactive")
\`\`\`
4. **Response:** Número de clientes activados
5. **Actualización:** Recarga la lista completa

#### 2.2.3 Cambio de Estado Individual

**Componente:** Selector en tabla de clientes

**Flujo:**
1. Usuario selecciona nuevo estado
2. **Endpoint:** `PATCH /api/clients/[id]/status`
3. **Payload:**
\`\`\`json
{
  "status": "inactive"
}
\`\`\`
4. **Response:** Cliente actualizado
5. **Actualización:** Actualiza la fila en la tabla

#### 2.2.4 Impresión de Ficha

**Componente:** `client-card-print.tsx`

**Flujo:**
1. Usuario hace clic en "Imprimir Ficha"
2. Genera HTML con:
   - Datos personales del cliente
   - Historial de préstamos
   - Estadísticas de pagos
   - Información de contacto
3. Abre ventana de impresión del navegador
4. Usuario imprime o guarda como PDF

---

### 2.3 CUOTAS/INSTALLMENTS

#### 2.3.1 Generación Automática

**Trigger:** Al crear un préstamo

**Lógica:**
\`\`\`typescript
for (let i = 1; i <= total_installments; i++) {
  let dueDate = new Date(start_date)
  
  if (frequency === 'monthly') {
    dueDate.setMonth(dueDate.getMonth() + (i - 1))
  } else if (frequency === 'weekly') {
    dueDate.setDate(dueDate.getDate() + (7 * (i - 1)))
  } else if (frequency === 'biweekly') {
    dueDate.setDate(dueDate.getDate() + (15 * (i - 1)))
  }
  
  installments.push({
    loan_id,
    installment_no: i,
    due_date: dueDate,
    amount_due: installment_amount,
    amount_paid: 0,
    status: "A_PAGAR",
    code: `${loan_code}-${i.toString().padStart(2, '0')}`
  })
}
\`\`\`

#### 2.3.2 Pago de Cuotas

**Componente:** `components/forms/create-receipt-form.tsx`

**Flujo:**
1. Usuario selecciona cliente
2. Sistema carga préstamos activos del cliente
3. Usuario selecciona préstamo(s)
4. Sistema carga cuotas impagadas
5. Usuario ingresa monto total
6. Sistema distribuye automáticamente el monto entre cuotas
7. Usuario puede ajustar manualmente la distribución
8. **Endpoint:** `POST /api/receipts`

**Payload:**
\`\`\`json
{
  "client_id": "uuid",
  "receipt_date": "2025-01-15",
  "payment_type": "cash",
  "cash_amount": 5000,
  "transfer_amount": 0,
  "selected_installments": [
    {
      "installment_id": "uuid-1",
      "imputed_amount": 2500
    },
    {
      "installment_id": "uuid-2",
      "imputed_amount": 2500
    }
  ]
}
\`\`\`

**Procesamiento:**
1. Crea recibo en tabla `receipts`
2. Para cada cuota seleccionada:
   - Crea registro en `payment_imputations`
   - Actualiza `amount_paid` en `installments`
   - Si `amount_paid >= amount_due`, marca como pagada
   - Actualiza `paid_at` con la fecha del recibo

**Response:**
\`\`\`json
{
  "success": true,
  "receipt": {
    "id": "uuid",
    "receipt_number": "REC-0001",
    "total_amount": 5000
  },
  "imputations": [
    {
      "installment_id": "uuid-1",
      "success": true,
      "newAmountPaid": 2500,
      "isPaid": true
    }
  ]
}
\`\`\`

#### 2.3.3 Estados de Cuotas

**Cálculo automático:**
- `A_PAGAR`: `amount_paid < amount_due` y `due_date >= hoy`
- `VENCIDA`: `amount_paid < amount_due` y `due_date < hoy`
- `PAGADA`: `amount_paid >= amount_due`
- `PARCIAL`: `amount_paid > 0` y `amount_paid < amount_due`

---

### 2.4 RECIBOS

#### 2.4.1 Creación de Recibo

**Ver sección 2.3.2** (Pago de Cuotas)

#### 2.4.2 Listado de Recibos

**Componente:** `app/dashboard/receipts/page.tsx`

**Flujo:**
1. **Carga inicial:**
\`\`\`typescript
const response = await fetch("/api/receipts")
const { receipts } = await response.json()
\`\`\`

2. **Datos mostrados:**
   - Número de recibo
   - Cliente
   - Fecha
   - Tipo de pago (efectivo/transferencia)
   - Monto total
   - Acciones (ver resumen, imprimir, WhatsApp)

#### 2.4.3 Impresión de Recibo

**Componente:** `components/communication/receipt-actions.tsx`

**Flujo:**
1. Usuario hace clic en "Imprimir"
2. Genera HTML con formato de impresora térmica:
   - Logo de la empresa
   - Datos del recibo
   - Datos del cliente
   - Detalle de cuotas pagadas
   - Cuotas próximas a vencer
   - Total pagado
3. Abre ventana de impresión

#### 2.4.4 Compartir por WhatsApp

**Componente:** `components/communication/receipt-actions.tsx`

**Flujo:**
1. Usuario hace clic en "Compartir por WhatsApp"
2. Genera mensaje con:
   - Saludo personalizado
   - Número de recibo
   - Monto pagado
   - Cuotas pagadas
   - Próximas cuotas
3. Abre WhatsApp Web con mensaje pre-formateado
4. URL: `https://wa.me/${phone}?text=${encodedMessage}`

---

## 3. GESTIÓN DE ESTADO

### 3.1 Estrategia General

**NO se usa:**
- React Query
- SWR
- Zustand
- Context API global

**SÍ se usa:**
- `useState` local en componentes cliente
- Server Components para datos iniciales
- `fetch` manual con revalidación

### 3.2 Patrones de Estado por Tipo

#### 3.2.1 Datos de Listados

**Patrón:**
\`\`\`typescript
const [items, setItems] = useState<Item[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchItems()
}, [])

const fetchItems = async () => {
  const response = await fetch("/api/items")
  const data = await response.json()
  setItems(data.items)
  setLoading(false)
}
\`\`\`

**Problema:** No hay caché, cada navegación recarga todo

#### 3.2.2 Formularios

**Patrón:**
\`\`\`typescript
const [formData, setFormData] = useState({
  field1: "",
  field2: ""
})

const handleChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }))
}
\`\`\`

#### 3.2.3 Diálogos/Modales

**Patrón:**
\`\`\`typescript
const [dialogOpen, setDialogOpen] = useState(false)
const [selectedItem, setSelectedItem] = useState<Item | null>(null)

const handleEdit = (item: Item) => {
  setSelectedItem(item)
  setDialogOpen(true)
}
\`\`\`

### 3.3 Invalidación de Datos

**Patrón actual:**
\`\`\`typescript
const handleCreate = async () => {
  await fetch("/api/items", { method: "POST", ... })
  // Recarga manual
  await fetchItems()
  setDialogOpen(false)
}
\`\`\`

**Problema:** No hay invalidación automática, se recarga todo manualmente

---

## 4. LLAMADAS A APIs - INVENTARIO COMPLETO

### 4.1 `/api/loans/*`

| Endpoint | Método | Parámetros | Response | Usado en |
|----------|--------|------------|----------|----------|
| `/api/loans` | GET | `?search=`, `?status=`, `?client_id=` | `{ loans: Loan[] }` | `app/prestamos/page.tsx` |
| `/api/loans` | POST | `{ client_id, amount, installments, interest_rate, start_date, frequency }` | `{ loan: Loan }` | `components/forms/create-loan-form.tsx` |
| `/api/loans/[id]` | GET | - | `{ loan: Loan }` | - |
| `/api/loans/[id]` | PATCH | `{ amount?, interest_rate?, status? }` | `{ loan: Loan }` | `components/forms/create-loan-form.tsx` |
| `/api/loans/[id]` | DELETE | - | `{ success: true }` | - |
| `/api/loans/[id]/status` | PATCH | `{ status: string }` | `{ loan: Loan }` | `components/loan-status-selector.tsx` |
| `/api/loans/[id]/balance` | GET | - | `{ balance, unpaid_installments }` | `app/prestamos/page.tsx` |
| `/api/loans/[id]/schedule` | GET | - | `{ installments: Installment[] }` | - |
| `/api/loans/[id]/summary` | GET | - | `{ summary: LoanSummary }` | - |

### 4.2 `/api/clients/*`

| Endpoint | Método | Parámetros | Response | Usado en |
|----------|--------|------------|----------|----------|
| `/api/clients` | GET | `?search=`, `?status=` | `{ clients: Client[] }` | `app/clientes/page.tsx`, `components/forms/create-loan-form.tsx` |
| `/api/clients` | POST | `{ first_name, last_name, dni, phone, email, address, status }` | `{ client: Client }` | `components/forms/create-client-form.tsx` |
| `/api/clients/[id]` | GET | - | `{ client: Client }` | - |
| `/api/clients/[id]` | PATCH | `{ first_name?, last_name?, phone?, ... }` | `{ client: Client }` | `app/clientes/page.tsx` |
| `/api/clients/[id]` | DELETE | - | `{ success: true }` | - |
| `/api/clients/[id]/status` | PATCH | `{ status: string }` | `{ client: Client }` | `app/clientes/page.tsx` |
| `/api/clients/[id]/loans` | GET | - | `{ loans: Loan[] }` | `components/client-loans-selector.tsx` |
| `/api/clients/bulk-activate` | POST | - | `{ count: number }` | `app/clientes/page.tsx` |

### 4.3 `/api/receipts/*`

| Endpoint | Método | Parámetros | Response | Usado en |
|----------|--------|------------|----------|----------|
| `/api/receipts` | GET | `?search=`, `?client_id=`, `?payment_type=` | `{ receipts: Receipt[] }` | `app/dashboard/receipts/page.tsx` |
| `/api/receipts` | POST | `{ client_id, receipt_date, payment_type, cash_amount, transfer_amount, selected_installments }` | `{ success, receipt, imputations }` | `components/forms/create-receipt-form.tsx` |
| `/api/receipts/[id]` | GET | - | `{ receipt: Receipt }` | - |
| `/api/receipts/[id]` | PATCH | `{ receipt_date?, payment_type?, ... }` | `{ receipt: Receipt }` | - |
| `/api/receipts/[id]` | DELETE | - | `{ success: true }` | - |

### 4.4 Otras APIs

| Endpoint | Método | Usado en |
|----------|--------|----------|
| `/api/expenses` | GET, POST | `app/gastos/page.tsx` |
| `/api/expenses/[id]` | GET, PATCH, DELETE | `app/gastos/page.tsx` |
| `/api/expense-categories` | GET, POST | `app/gastos/page.tsx` |
| `/api/followups` | GET, POST | `app/dashboard/followups/page.tsx` |
| `/api/followups/[id]` | GET, PATCH, DELETE | `app/dashboard/followups/page.tsx` |
| `/api/users` | GET, POST | `app/dashboard/users/page.tsx` |
| `/api/cronograma` | GET | `app/cronogramas/page.tsx` |

---

## 5. COMPONENTES QUE HACEN MUTACIONES

### 5.1 Formularios de Creación

| Componente | Endpoint | Método | Datos Creados |
|------------|----------|--------|---------------|
| `create-client-form.tsx` | `/api/clients` | POST | Cliente |
| `create-loan-form.tsx` | `/api/loans` | POST | Préstamo + Cuotas |
| `create-receipt-form.tsx` | `/api/receipts` | POST | Recibo + Imputaciones |
| `create-expense-form.tsx` | `/api/expenses` | POST | Gasto |
| `create-followup-form.tsx` | `/api/followups` | POST | Seguimiento |

### 5.2 Formularios de Edición

| Componente | Endpoint | Método | Datos Actualizados |
|------------|----------|--------|-------------------|
| `create-client-form.tsx` | `/api/clients/[id]` | PATCH | Cliente |
| `create-loan-form.tsx` | `/api/loans/[id]` | PATCH | Préstamo |
| `create-expense-form.tsx` | `/api/expenses/[id]` | PATCH | Gasto |
| `create-followup-form.tsx` | `/api/followups/[id]` | PATCH | Seguimiento |

### 5.3 Selectores de Estado

| Componente | Endpoint | Método | Campo Actualizado |
|------------|----------|--------|-------------------|
| `loan-status-selector.tsx` | `/api/loans/[id]/status` | PATCH | `status` |
| Selector en `clientes/page.tsx` | `/api/clients/[id]/status` | PATCH | `status` |
| Selector en `gastos/page.tsx` | `/api/expenses/[id]` | PATCH | `status`, `audit_status` |

### 5.4 Botones de Eliminación

| Ubicación | Endpoint | Método |
|-----------|----------|--------|
| `app/dashboard/users/page.tsx` | `/api/users/[id]` | DELETE |
| `app/gastos/page.tsx` | `/api/expenses/[id]` | DELETE |
| `manage-categories-dialog.tsx` | `/api/expense-categories/[id]` | DELETE |

---

## 6. PROBLEMAS DETECTADOS

### 6.1 Llamadas Duplicadas

**Problema:** Múltiples componentes hacen la misma llamada

**Ejemplos:**
1. **Clientes:**
   - `app/clientes/page.tsx` → `GET /api/clients`
   - `create-loan-form.tsx` → `GET /api/clients`
   - `create-receipt-form.tsx` → `GET /api/clients`
   - **Solución:** Caché compartida con SWR o React Query

2. **Préstamos por cliente:**
   - `client-loans-selector.tsx` → `GET /api/clients/[id]/loans`
   - `create-receipt-form.tsx` → Carga préstamos del cliente
   - **Solución:** Hook compartido `useClientLoans(clientId)`

### 6.2 Datos que se Fetchean Múltiples Veces

**Problema:** Sin caché, cada navegación recarga todo

**Ejemplos:**
1. Usuario va a `/clientes` → Carga clientes
2. Usuario va a `/prestamos` → Vuelve a cargar clientes
3. Usuario regresa a `/clientes` → Carga clientes OTRA VEZ

**Solución:** Implementar SWR con caché global:
\`\`\`typescript
// hooks/use-clients.ts
import useSWR from 'swr'

export function useClients(search?: string) {
  const { data, error, mutate } = useSWR(
    `/api/clients${search ? `?search=${search}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  )
  
  return {
    clients: data?.clients || [],
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
\`\`\`

### 6.3 Componentes que Podrían Compartir Estado

**Problema:** Estado duplicado en múltiples componentes

**Ejemplos:**
1. **Lista de clientes:**
   - `app/clientes/page.tsx` tiene su propio estado
   - `create-loan-form.tsx` tiene su propio estado
   - No se sincronizan

2. **Diálogos:**
   - Cada página maneja su propio `dialogOpen`
   - No hay estado global de diálogos

**Solución:** Context API o Zustand para estado compartido:
\`\`\`typescript
// store/clients-store.ts
import { create } from 'zustand'

interface ClientsStore {
  clients: Client[]
  setClients: (clients: Client[]) => void
  addClient: (client: Client) => void
  updateClient: (id: string, data: Partial<Client>) => void
}

export const useClientsStore = create<ClientsStore>((set) => ({
  clients: [],
  setClients: (clients) => set({ clients }),
  addClient: (client) => set((state) => ({ 
    clients: [...state.clients, client] 
  })),
  updateClient: (id, data) => set((state) => ({
    clients: state.clients.map(c => 
      c.id === id ? { ...c, ...data } : c
    )
  }))
}))
\`\`\`

### 6.4 Lógica Repetida

**Problema:** Mismo código en múltiples lugares

**Ejemplos:**
1. **Generación de códigos:**
   - Cada API genera códigos de forma similar
   - Código duplicado en `/api/clients`, `/api/loans`, `/api/receipts`
   
   **Solución:**
\`\`\`typescript
// lib/utils/code-generator.ts
export async function generateCode(
  supabase: SupabaseClient,
  table: string,
  prefix: string,
  length: number = 4
) {
  const { data: lastRecord } = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  
  let nextNumber = 1
  if (lastRecord?.code) {
    const match = lastRecord.code.match(new RegExp(`${prefix}(\\d+)`))
    if (match) nextNumber = parseInt(match[1]) + 1
  }
  
  return `${prefix}${nextNumber.toString().padStart(length, '0')}`
}
\`\`\`

2. **Validación de autenticación:**
   - Cada API repite el mismo código de auth
   
   **Solución:** Middleware `withAuth`:
\`\`\`typescript
// lib/middleware/withAuth.ts
export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json(
        { error: "No autorizado" }, 
        { status: 401 }
      )
    }
    
    return handler(request, { supabase, user })
  }
}
\`\`\`

3. **Cálculo de fechas:**
   - Lógica de fechas repetida en múltiples lugares
   - Ya existe `lib/utils/date-utils.ts` pero no se usa consistentemente

### 6.5 Oportunidades de Optimización

#### 6.5.1 Server Components vs Client Components

**Problema:** Algunos componentes son cliente cuando podrían ser servidor

**Ejemplos:**
- `app/prestamos/page.tsx` podría ser Server Component
- `app/clientes/page.tsx` podría ser Server Component
- Solo las partes interactivas necesitan ser cliente

**Solución:**
\`\`\`typescript
// app/prestamos/page.tsx (Server Component)
export default async function PrestamosPage() {
  const supabase = await createClient()
  const { data: loans } = await supabase.from("loans").select("*")
  
  return <PrestamosTable loans={loans} />
}

// components/prestamos-table.tsx (Client Component)
"use client"
export function PrestamosTable({ loans }: { loans: Loan[] }) {
  const [filteredLoans, setFilteredLoans] = useState(loans)
  // ... lógica de filtros y acciones
}
\`\`\`

#### 6.5.2 Paginación

**Problema:** Se cargan todos los registros de una vez

**Solución:** Implementar paginación:
\`\`\`typescript
const { data, error } = await supabase
  .from("loans")
  .select("*", { count: "exact" })
  .range(page * pageSize, (page + 1) * pageSize - 1)
\`\`\`

#### 6.5.3 Lazy Loading de Componentes

**Problema:** Todos los componentes se cargan al inicio

**Solución:**
\`\`\`typescript
import dynamic from 'next/dynamic'

const CreateLoanForm = dynamic(
  () => import('@/components/forms/create-loan-form'),
  { loading: () => <Skeleton /> }
)
\`\`\`

#### 6.5.4 Optimistic Updates

**Problema:** UI espera respuesta del servidor para actualizar

**Solución con SWR:**
\`\`\`typescript
const { mutate } = useSWR('/api/clients')

const handleCreate = async (data) => {
  // Actualización optimista
  mutate(
    (current) => ({
      clients: [...current.clients, { ...data, id: 'temp' }]
    }),
    false
  )
  
  // Llamada real
  const response = await fetch('/api/clients', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  
  // Revalidar con datos reales
  mutate()
}
\`\`\`

---

## 7. DEPENDENCIAS ENTRE COMPONENTES

### 7.1 Jerarquía de Componentes

\`\`\`
app/layout.tsx
├── app/dashboard/layout.tsx
│   ├── dashboard-sidebar.tsx
│   │   └── Usa: createClient (cliente)
│   │   └── Carga: permisos del usuario
│   │
│   ├── app/dashboard/page.tsx
│   │   ├── stats-card.tsx (x4)
│   │   ├── create-client-form.tsx
│   │   ├── create-loan-form.tsx
│   │   └── create-receipt-form.tsx
│   │
│   ├── app/dashboard/users/page.tsx
│   │   └── Gestiona: usuarios, roles, permisos
│   │
│   └── app/dashboard/receipts/page.tsx
│       ├── create-receipt-form.tsx
│       │   ├── client-loans-selector.tsx
│       │   └── Carga: clientes, préstamos, cuotas
│       │
│       └── receipt-actions.tsx
│           ├── print-utils.tsx
│           ├── receipt-templates.tsx
│           └── whatsapp-share.tsx
│
├── app/clientes/page.tsx
│   ├── create-client-form.tsx
│   └── client-card-print.tsx
│
├── app/prestamos/page.tsx
│   ├── create-loan-form.tsx
│   │   └── Carga: clientes
│   ├── loan-status-selector.tsx
│   └── loan-actions-menu.tsx
│       └── Acciones: imprimir, WhatsApp, ver cuotas
│
└── app/gastos/page.tsx
    ├── create-expense-form.tsx
    │   └── Carga: categorías
    └── manage-categories-dialog.tsx
\`\`\`

### 7.2 Prop Drilling Detectado

**Problema:** Props pasadas a través de múltiples niveles

**Ejemplo 1:**
\`\`\`
app/dashboard/receipts/page.tsx
  └── onSuccess={() => fetchReceipts()}
      └── create-receipt-form.tsx
          └── onSuccess prop
              └── Ejecuta callback del padre
\`\`\`

**Solución:** Context o estado global
\`\`\`typescript
// context/receipts-context.tsx
const ReceiptsContext = createContext({
  receipts: [],
  refetch: () => {}
})

// app/dashboard/receipts/page.tsx
<ReceiptsProvider>
  <ReceiptsTable />
  <CreateReceiptForm />
</ReceiptsProvider>

// components/forms/create-receipt-form.tsx
const { refetch } = useReceipts()
// Llama a refetch() después de crear
\`\`\`

**Ejemplo 2:**
\`\`\`
app/prestamos/page.tsx
  └── loans={loans}
      └── prestamos-table.tsx
          └── loans prop
              └── loan-row.tsx
                  └── loan prop
                      └── loan-actions-menu.tsx
                          └── loan prop
\`\`\`

**Solución:** Pasar solo IDs y usar hooks
\`\`\`typescript
// components/loan-actions-menu.tsx
function LoanActionsMenu({ loanId }: { loanId: string }) {
  const { loan } = useLoan(loanId) // Hook que obtiene del caché
  // ...
}
\`\`\`

### 7.3 Componentes Acoplados

**Problema:** Componentes que dependen fuertemente de otros

**Ejemplo:**
- `create-receipt-form.tsx` depende de:
  - `client-loans-selector.tsx`
  - Lista de clientes
  - Lista de préstamos
  - Lista de cuotas

**Solución:** Desacoplar con hooks compartidos
\`\`\`typescript
// hooks/use-receipt-form.ts
export function useReceiptForm() {
  const { clients } = useClients()
  const { loans, loadLoans } = useLoans()
  const { installments, loadInstallments } = useInstallments()
  
  return {
    clients,
    loans,
    installments,
    loadLoans,
    loadInstallments
  }
}
\`\`\`

---

## 8. RECOMENDACIONES DE REFACTORING

### 8.1 Prioridad Alta

1. **Implementar SWR o React Query**
   - Eliminar llamadas duplicadas
   - Caché automático
   - Revalidación inteligente

2. **Crear hooks compartidos**
   - `useClients()`
   - `useLoans()`
   - `useReceipts()`
   - `useInstallments()`

3. **Extraer lógica común**
   - Generación de códigos
   - Validación de auth
   - Manejo de errores

### 8.2 Prioridad Media

1. **Optimizar Server/Client Components**
   - Mover lógica de datos a Server Components
   - Solo hacer cliente lo interactivo

2. **Implementar paginación**
   - En todas las listas grandes
   - Mejorar rendimiento

3. **Agregar optimistic updates**
   - Mejor UX
   - Feedback inmediato

### 8.3 Prioridad Baja

1. **Lazy loading de componentes**
2. **Code splitting**
3. **Memoización de componentes pesados**

---

## 9. DIAGRAMA DE FLUJO PRINCIPAL

\`\`\`mermaid
graph TD
    A[Usuario] --> B{Acción}
    
    B -->|Crear Préstamo| C[create-loan-form.tsx]
    C --> D[POST /api/loans]
    D --> E[Crea Préstamo]
    E --> F[Genera Cuotas]
    F --> G[Retorna Préstamo]
    G --> H[Actualiza UI]
    
    B -->|Pagar Cuota| I[create-receipt-form.tsx]
    I --> J[Selecciona Cliente]
    J --> K[Carga Préstamos]
    K --> L[Carga Cuotas]
    L --> M[Distribuye Monto]
    M --> N[POST /api/receipts]
    N --> O[Crea Recibo]
    O --> P[Crea Imputaciones]
    P --> Q[Actualiza Cuotas]
    Q --> R[Retorna Recibo]
    R --> S[Actualiza UI]
    
    B -->|Ver Cronograma| T[cronogramas/page.tsx]
    T --> U[GET /api/cronograma]
    U --> V[Calcula Estados]
    V --> W[Agrupa por Estado]
    W --> X[Muestra Modal]
\`\`\`

---

## 10. CONCLUSIONES

### 10.1 Fortalezas

1. **Arquitectura clara:** Separación de APIs, componentes y páginas
2. **Tipado fuerte:** TypeScript en todo el proyecto
3. **Componentes reutilizables:** Buena librería de UI con shadcn
4. **Autenticación robusta:** Supabase Auth bien implementado

### 10.2 Debilidades

1. **Sin gestión de estado global:** Todo es local
2. **Llamadas duplicadas:** Mismo dato se fetchea múltiples veces
3. **Sin caché:** Cada navegación recarga todo
4. **Prop drilling:** Props pasadas por múltiples niveles
5. **Lógica repetida:** Código duplicado en APIs

### 10.3 Próximos Pasos

1. Implementar SWR para caché y revalidación
2. Crear hooks compartidos para datos comunes
3. Extraer lógica común a utilidades
4. Optimizar Server/Client Components
5. Agregar paginación a listas grandes
