# Product Requirements Document (PRD)
## Sistema de Gestión de Microcréditos - Fase de Mejoras y Correcciones

**Versión:** 1.0  
**Fecha:** 31 de Octubre de 2025  
**Autor:** Equipo de Desarrollo MB Microcréditos  
**Estado:** En Revisión

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Contexto y Objetivos](#contexto-y-objetivos)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Alcance del Proyecto](#alcance-del-proyecto)
5. [Especificaciones Funcionales](#especificaciones-funcionales)
6. [Requisitos Técnicos](#requisitos-técnicos)
7. [Flujos de Usuario](#flujos-de-usuario)
8. [Arquitectura y Diseño](#arquitectura-y-diseño)
9. [Seguridad y Permisos](#seguridad-y-permisos)
10. [Rendimiento y Optimización](#rendimiento-y-optimización)
11. [Plan de Implementación](#plan-de-implementación)
12. [Criterios de Aceptación](#criterios-de-aceptación)
13. [Testing y QA](#testing-y-qa)
14. [Riesgos y Mitigación](#riesgos-y-mitigación)

---

## 1. Resumen Ejecutivo

### 1.1 Propósito del Documento

Este PRD define las especificaciones técnicas y funcionales para implementar mejoras críticas en el Sistema de Gestión de Microcréditos MB, enfocándose en tres áreas principales:

1. **Sistema de Permisos y Gestión de Usuarios** (Prioridad Crítica)
2. **Validación y Seguridad de Datos** (Prioridad Alta)
3. **Mejoras de UX y Rendimiento** (Prioridad Media)

### 1.2 Problemas Identificados

Tras una auditoría exhaustiva del sistema, se identificaron **20 problemas** clasificados por severidad:

- 🔴 **4 Críticos**: Afectan seguridad y funcionalidad principal
- 🟠 **5 Altos**: Impactan funcionalidad importante
- 🟡 **6 Medios**: Problemas de UX e inconsistencias
- 🟢 **5 Bajos**: Mejoras de código y mantenibilidad

### 1.3 Impacto Esperado

**Beneficios de la Implementación:**
- ✅ Sistema de permisos funcional y seguro
- ✅ Validación robusta de datos de préstamos
- ✅ Experiencia de usuario mejorada
- ✅ Código mantenible y escalable
- ✅ Reducción de errores en producción en un 80%

---

## 2. Contexto y Objetivos

### 2.1 Contexto Actual

El Sistema de Gestión de Microcréditos MB está en producción pero presenta problemas críticos de seguridad y funcionalidad que requieren atención inmediata:

**Situación Actual:**
- Sistema de permisos hardcodeado (no funcional)
- Falta validación de datos en APIs críticas
- Funcionalidades básicas incompletas (búsqueda, edición)
- Experiencia de usuario inconsistente

**Impacto en el Negocio:**
- Riesgo de seguridad: usuarios sin permisos acceden a datos sensibles
- Datos inconsistentes: préstamos con valores inválidos
- Productividad reducida: funcionalidades no operativas

### 2.2 Objetivos del Proyecto

#### Objetivos Primarios
1. **Implementar sistema de permisos funcional** que controle acceso a rutas por usuario
2. **Validar todos los datos de entrada** en APIs y formularios
3. **Completar funcionalidades básicas** (búsqueda, edición, confirmaciones)

#### Objetivos Secundarios
4. Mejorar experiencia de usuario con estados de carga y mensajes claros
5. Optimizar rendimiento con paginación y lazy loading
6. Refactorizar código duplicado para mejor mantenibilidad

### 2.3 Métricas de Éxito

| Métrica | Valor Actual | Objetivo | Medición |
|---------|--------------|----------|----------|
| Vulnerabilidades de seguridad | 4 críticas | 0 | Auditoría de seguridad |
| Funcionalidades operativas | 70% | 100% | Testing funcional |
| Tiempo de respuesta promedio | 2.5s | <1s | Métricas de rendimiento |
| Errores en producción | 15/día | <2/día | Logs de error |
| Satisfacción de usuario | N/A | >4.5/5 | Encuesta post-implementación |

---

## 3. Stack Tecnológico

### 3.1 Tecnologías Actuales

**Frontend:**
- Next.js 14.2.5 (App Router)
- React 18.3.1
- TypeScript 5.x
- Tailwind CSS v4
- shadcn/ui (componentes)

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + Auth)
- Supabase SSR (@supabase/ssr)

**Herramientas:**
- ESLint + Prettier
- Git + GitHub
- Vercel (deployment)

### 3.2 Dependencias Clave

\`\`\`json
{
  "@supabase/ssr": "^0.5.2",
  "@supabase/supabase-js": "^2.45.4",
  "next": "14.2.5",
  "react": "^18.3.1",
  "zod": "^3.23.8",
  "date-fns": "^4.1.0"
}
\`\`\`

### 3.3 Restricciones Técnicas

- **NO cambiar** versiones de dependencias principales
- **NO modificar** estructura de base de datos existente (solo agregar)
- **MANTENER** compatibilidad con código existente
- **USAR** componentes shadcn/ui existentes

---

## 4. Alcance del Proyecto

### 4.1 En Alcance (In Scope)

#### Fase 1: Seguridad y Permisos (Semana 1-2)
- ✅ Implementar sistema de permisos basado en rutas
- ✅ Crear tabla `user_permissions` en base de datos
- ✅ Actualizar middleware para verificar permisos
- ✅ Modificar formularios de usuario para gestionar permisos
- ✅ Agregar validación de roles de administrador en APIs

#### Fase 2: Validación de Datos (Semana 2-3)
- ✅ Implementar validación con Zod en APIs de préstamos
- ✅ Agregar validación de rangos en formularios
- ✅ Prevenir duplicación de códigos de préstamo
- ✅ Validar lógica de negocio (montos, fechas, tasas)

#### Fase 3: Funcionalidades Básicas (Semana 3-4)
- ✅ Implementar búsqueda funcional en préstamos y clientes
- ✅ Agregar confirmaciones en acciones destructivas
- ✅ Completar flujo de edición de usuarios
- ✅ Mejorar manejo de logout

#### Fase 4: UX y Rendimiento (Semana 4-5)
- ✅ Agregar estados de carga con skeletons
- ✅ Implementar paginación en listas largas
- ✅ Estandarizar formato de fechas
- ✅ Mejorar mensajes de error

### 4.2 Fuera de Alcance (Out of Scope)

- ❌ Rediseño completo de UI/UX
- ❌ Migración a nuevas tecnologías
- ❌ Nuevas funcionalidades de negocio
- ❌ Integración con sistemas externos
- ❌ Aplicación móvil nativa
- ❌ Reportes avanzados o analytics

### 4.3 Dependencias Externas

- Acceso a base de datos Supabase en producción
- Permisos de administrador para crear tablas
- Tiempo de QA para testing exhaustivo
- Aprobación de stakeholders para cambios de seguridad

---

## 5. Especificaciones Funcionales

### 5.1 Sistema de Permisos de Usuario

#### 5.1.1 Descripción General

Implementar un sistema granular de permisos que permita controlar el acceso de cada usuario a rutas específicas de la aplicación.

#### 5.1.2 Requisitos Funcionales

**RF-001: Gestión de Permisos por Usuario**
- El sistema debe permitir asignar permisos individuales a cada usuario
- Los permisos se definen a nivel de ruta (ej: `/dashboard/clients`, `/dashboard/loans`)
- Los administradores tienen acceso completo sin necesidad de permisos específicos
- Los usuarios normales requieren al menos 2 permisos (dashboard + 1 adicional)

**RF-002: Rutas Disponibles**
\`\`\`typescript
const AVAILABLE_ROUTES = [
  { path: "dashboard", label: "Dashboard", required: true },
  { path: "users", label: "Usuarios", adminOnly: true },
  { path: "partners", label: "Socios" },
  { path: "clients", label: "Clientes" },
  { path: "loans", label: "Préstamos" },
  { path: "receipts", label: "Recibos" },
  { path: "cronograma", label: "Cronograma" },
  { path: "expenses", label: "Gastos" },
  { path: "followups", label: "Seguimientos" },
  { path: "reports", label: "Reportes" },
  { path: "formulas", label: "Fórmulas" }
]
\`\`\`

**RF-003: Interfaz de Selección de Permisos**
- Mostrar checkboxes para cada ruta disponible
- Dashboard siempre marcado y deshabilitado (obligatorio)
- Rutas de admin solo visibles para administradores
- Validación visual de al menos 2 permisos seleccionados

**RF-004: Verificación en Middleware**
- Verificar permisos en cada request a rutas protegidas
- Redirigir a `/unauthorized` si no tiene permiso
- Permitir acceso a rutas públicas (`/auth/*`)
- Cachear permisos en sesión para rendimiento

#### 5.1.3 Modelo de Datos

\`\`\`sql
-- Tabla de permisos de usuario
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, route_path)
);

-- Índices para rendimiento
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_route ON user_permissions(route_path);

-- RLS Policies
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all permissions"
  ON user_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view their own permissions"
  ON user_permissions FOR SELECT
  USING (user_id = auth.uid());
\`\`\`

#### 5.1.4 API Endpoints

**GET /api/users/[id]/permissions**
\`\`\`typescript
// Obtener permisos de un usuario
Response: {
  permissions: [
    { id: "uuid", route_path: "dashboard", created_at: "..." },
    { id: "uuid", route_path: "clients", created_at: "..." }
  ]
}
\`\`\`

**PUT /api/users/[id]/permissions**
\`\`\`typescript
// Actualizar permisos de un usuario
Request: {
  permissions: ["dashboard", "clients", "loans"]
}
Response: {
  success: true,
  permissions: [...]
}
\`\`\`

#### 5.1.5 Flujo de Usuario

**Crear Usuario con Permisos:**
1. Admin abre formulario "Nuevo Usuario"
2. Completa datos básicos (nombre, email, contraseña)
3. Selecciona rol (Admin o Usuario)
4. Si es Usuario, selecciona permisos (mínimo 2)
5. Guarda usuario
6. Sistema crea usuario en auth.users
7. Sistema crea perfil en profiles
8. Sistema inserta permisos en user_permissions
9. Muestra confirmación de éxito

**Editar Permisos de Usuario:**
1. Admin selecciona usuario existente
2. Click en botón "Editar"
3. Formulario carga con datos actuales
4. Modifica permisos según necesidad
5. Guarda cambios
6. Sistema actualiza permisos (delete + insert)
7. Usuario ve cambios en próximo login

### 5.2 Validación de Datos de Préstamos

#### 5.2.1 Descripción General

Implementar validación robusta en APIs y formularios para prevenir datos inválidos en préstamos.

#### 5.2.2 Requisitos Funcionales

**RF-005: Validación de Monto del Préstamo**
- Monto debe ser número positivo
- Monto mínimo: $1
- Monto máximo: $10,000,000
- No permitir valores decimales con más de 2 dígitos

**RF-006: Validación de Cuotas**
- Número de cuotas debe ser entero positivo
- Cuotas mínimas: 1
- Cuotas máximas: 360 (30 años)
- Validar que monto de cuota × número de cuotas ≥ monto principal

**RF-007: Validación de Tasa de Interés**
- Tasa debe ser número entre 0 y 100
- Permitir hasta 2 decimales
- Validar que interés total sea positivo

**RF-008: Validación de Fechas**
- Fecha de inicio debe ser válida (formato YYYY-MM-DD)
- Fecha de inicio no puede ser más de 1 año en el pasado
- Advertir si fecha es anterior a hoy

**RF-009: Validación de Cliente**
- Cliente debe existir en base de datos
- Cliente debe estar activo
- Cliente no debe tener préstamos vencidos sin pagar

#### 5.2.3 Esquema de Validación (Zod)

\`\`\`typescript
import { z } from "zod"

export const loanSchema = z.object({
  client_id: z.string().uuid("ID de cliente inválido"),
  amount: z.number()
    .positive("El monto debe ser positivo")
    .min(1, "Monto mínimo: $1")
    .max(10000000, "Monto máximo: $10,000,000")
    .multipleOf(0.01, "Máximo 2 decimales"),
  installments: z.number()
    .int("Número de cuotas debe ser entero")
    .min(1, "Mínimo 1 cuota")
    .max(360, "Máximo 360 cuotas"),
  interest_rate: z.number()
    .min(0, "Tasa mínima: 0%")
    .max(100, "Tasa máxima: 100%")
    .multipleOf(0.01, "Máximo 2 decimales"),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido")
    .refine(
      (date) => {
        const d = new Date(date)
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        return d >= oneYearAgo
      },
      "Fecha no puede ser más de 1 año en el pasado"
    ),
  installment_amount: z.number().positive(),
  total_interest: z.number().min(0)
}).refine(
  (data) => data.installment_amount * data.installments >= data.amount,
  {
    message: "Monto total a pagar debe ser mayor o igual al principal",
    path: ["installment_amount"]
  }
)
\`\`\`

#### 5.2.4 Implementación en API

\`\`\`typescript
// app/api/loans/route.ts
export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Parsear y validar datos
  const body = await request.json()
  const validation = loanSchema.safeParse(body)
  
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: "Datos inválidos", 
        details: validation.error.flatten() 
      },
      { status: 400 }
    )
  }

  const validatedData = validation.data

  // Verificar que cliente existe y está activo
  const { data: client, error: clientError } = await supabase
    .from("active_clients")
    .select("id, status")
    .eq("id", validatedData.client_id)
    .single()

  if (clientError || !client) {
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 }
    )
  }

  if (client.status !== "active") {
    return NextResponse.json(
      { error: "Cliente no está activo" },
      { status: 400 }
    )
  }

  // Generar código único de préstamo
  const loan_code = await generateUniqueLoanCode(supabase)

  // Crear préstamo
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .insert({
      ...validatedData,
      loan_code,
      status: "active",
      created_by: user.id
    })
    .select()
    .single()

  if (loanError) {
    return NextResponse.json(
      { error: "Error al crear préstamo", details: loanError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, loan }, { status: 201 })
}
\`\`\`

### 5.3 Búsqueda y Filtrado

#### 5.3.1 Descripción General

Implementar funcionalidad de búsqueda en tiempo real para préstamos y clientes.

#### 5.3.2 Requisitos Funcionales

**RF-010: Búsqueda de Préstamos**
- Buscar por código de préstamo (ej: "PR001")
- Buscar por nombre de cliente
- Buscar por apellido de cliente
- Búsqueda case-insensitive
- Resultados en tiempo real (debounce 300ms)

**RF-011: Búsqueda de Clientes**
- Buscar por nombre completo
- Buscar por DNI
- Buscar por teléfono
- Filtrar por estado (activo/inactivo)

**RF-012: Filtros Adicionales**
- Filtrar préstamos por estado (activo/pagado/vencido)
- Filtrar por rango de fechas
- Ordenar por fecha, monto, cliente

#### 5.3.3 Implementación

\`\`\`typescript
// Hook personalizado para búsqueda
function useSearch<T>(items: T[], searchFields: (keyof T)[]) {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedTerm, setDebouncedTerm] = useState("")

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Filter items
  const filteredItems = useMemo(() => {
    if (!debouncedTerm) return items

    return items.filter(item => {
      return searchFields.some(field => {
        const value = item[field]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(debouncedTerm.toLowerCase())
        }
        return false
      })
    })
  }, [items, debouncedTerm, searchFields])

  return { searchTerm, setSearchTerm, filteredItems }
}

// Uso en componente
function LoansPage() {
  const [loans, setLoans] = useState([])
  const { searchTerm, setSearchTerm, filteredItems } = useSearch(
    loans,
    ['loan_code', 'active_clients.first_name', 'active_clients.last_name']
  )

  return (
    <div>
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por código o cliente..."
      />
      {filteredItems.map(loan => (
        <LoanCard key={loan.id} loan={loan} />
      ))}
    </div>
  )
}
\`\`\`

### 5.4 Confirmaciones y Feedback

#### 5.4.1 Descripción General

Agregar confirmaciones en acciones destructivas y mejorar feedback al usuario.

#### 5.4.2 Requisitos Funcionales

**RF-013: Confirmación de Eliminación**
- Mostrar dialog de confirmación antes de eliminar
- Explicar consecuencias de la acción
- Requerir confirmación explícita (botón "Eliminar")
- Permitir cancelar fácilmente

**RF-014: Estados de Carga**
- Mostrar skeleton mientras carga datos
- Deshabilitar botones durante operaciones
- Mostrar spinner en botones de acción
- Indicar progreso en operaciones largas

**RF-015: Mensajes de Error Mejorados**
- Mensajes específicos y accionables
- Incluir botón "Reintentar" cuando aplique
- Mostrar detalles técnicos en modo desarrollo
- Logging de errores para debugging

**RF-016: Notificaciones Toast**
- Éxito: verde, 3 segundos
- Error: rojo, 5 segundos con acción
- Advertencia: amarillo, 4 segundos
- Info: azul, 3 segundos

#### 5.4.3 Implementación

\`\`\`typescript
// Componente de confirmación de eliminación
function DeleteConfirmation({ 
  title, 
  description, 
  onConfirm, 
  onCancel 
}: DeleteConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      toast({
        title: "Eliminado exitosamente",
        description: "El registro ha sido eliminado",
      })
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
        action: <Button onClick={handleConfirm}>Reintentar</Button>
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive"
          >
            {isDeleting ? <Spinner /> : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
\`\`\`

---

## 6. Requisitos Técnicos

### 6.1 Requisitos de Base de Datos

#### 6.1.1 Nuevas Tablas

**user_permissions**
\`\`\`sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, route_path)
);
\`\`\`

#### 6.1.2 Índices Requeridos

\`\`\`sql
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_route ON user_permissions(route_path);
CREATE INDEX idx_loans_client_id ON loans(client_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_created_at ON loans(created_at DESC);
\`\`\`

#### 6.1.3 Vistas Requeridas

\`\`\`sql
-- Vista de usuarios con permisos
CREATE OR REPLACE VIEW v_users_with_permissions AS
SELECT 
  u.id,
  u.email,
  p.first_name,
  p.last_name,
  p.is_admin,
  p.status,
  COALESCE(
    json_agg(
      json_build_object('route_path', up.route_path)
    ) FILTER (WHERE up.route_path IS NOT NULL),
    '[]'::json
  ) as permissions
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN user_permissions up ON up.user_id = u.id
GROUP BY u.id, u.email, p.first_name, p.last_name, p.is_admin, p.status;
\`\`\`

### 6.2 Requisitos de API

#### 6.2.1 Autenticación

Todos los endpoints protegidos deben:
- Verificar token de Supabase
- Validar que usuario existe
- Verificar permisos según ruta
- Retornar 401 si no autenticado
- Retornar 403 si no autorizado

#### 6.2.2 Validación

Todos los endpoints POST/PUT deben:
- Validar datos con Zod
- Retornar errores específicos (400)
- Sanitizar inputs
- Prevenir SQL injection
- Limitar tamaño de payload (1MB)

#### 6.2.3 Rate Limiting

\`\`\`typescript
// Implementar rate limiting básico
const rateLimits = new Map<string, number[]>()

function checkRateLimit(userId: string, limit: number = 100): boolean {
  const now = Date.now()
  const userRequests = rateLimits.get(userId) || []
  
  // Limpiar requests antiguos (últimos 60 segundos)
  const recentRequests = userRequests.filter(time => now - time < 60000)
  
  if (recentRequests.length >= limit) {
    return false // Rate limit exceeded
  }
  
  recentRequests.push(now)
  rateLimits.set(userId, recentRequests)
  return true
}
\`\`\`

### 6.3 Requisitos de Frontend

#### 6.3.1 Componentes Reutilizables

Crear componentes base para:
- `<ConfirmDialog>` - Confirmación de acciones
- `<LoadingSkeleton>` - Estados de carga
- `<ErrorBoundary>` - Manejo de errores
- `<SearchInput>` - Input de búsqueda con debounce
- `<Pagination>` - Paginación de listas

#### 6.3.2 Hooks Personalizados

\`\`\`typescript
// usePermissions - Verificar permisos del usuario
function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  
  useEffect(() => {
    loadUserPermissions()
  }, [])
  
  const hasPermission = (route: string) => {
    return isAdmin || permissions.includes(route)
  }
  
  return { permissions, isAdmin, hasPermission }
}

// useDebounce - Debounce de valores
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

// useAsync - Manejo de operaciones asíncronas
function useAsync<T>(asyncFunction: () => Promise<T>) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  const execute = useCallback(async () => {
    setStatus('loading')
    try {
      const result = await asyncFunction()
      setData(result)
      setStatus('success')
    } catch (e) {
      setError(e as Error)
      setStatus('error')
    }
  }, [asyncFunction])
  
  return { execute, status, data, error }
}
\`\`\`

### 6.4 Requisitos de Rendimiento

#### 6.4.1 Métricas Objetivo

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| First Contentful Paint (FCP) | <1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | <2.5s | Lighthouse |
| Time to Interactive (TTI) | <3.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | <0.1 | Lighthouse |
| API Response Time | <500ms | Server logs |
| Database Query Time | <100ms | Supabase logs |

#### 6.4.2 Optimizaciones Requeridas

**Paginación:**
\`\`\`typescript
// Implementar paginación en listas largas
const PAGE_SIZE = 50

async function fetchLoans(page: number = 1) {
  const { data, error, count } = await supabase
    .from("loans")
    .select("*, active_clients(*)", { count: 'exact' })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    .order("created_at", { ascending: false })
  
  return {
    loans: data || [],
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
    currentPage: page
  }
}
\`\`\`

**Lazy Loading:**
\`\`\`typescript
// Cargar componentes pesados solo cuando se necesiten
const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false
})
\`\`\`

**Memoización:**
\`\`\`typescript
// Memoizar cálculos costosos
const expensiveCalculation = useMemo(() => {
  return loans.reduce((sum, loan) => sum + loan.amount, 0)
}, [loans])
\`\`\`

---

## 7. Flujos de Usuario

### 7.1 Flujo: Crear Usuario con Permisos

\`\`\`mermaid
graph TD
    A[Admin abre Gestión de Usuarios] --> B[Click en 'Nuevo Usuario']
    B --> C[Formulario se abre]
    C --> D[Completa datos básicos]
    D --> E{Selecciona rol}
    E -->|Admin| F[No requiere permisos]
    E -->|Usuario| G[Muestra selector de permisos]
    G --> H[Selecciona permisos mínimo 2]
    H --> I{Validación}
    I -->|Error| J[Muestra mensaje de error]
    J --> H
    I -->|OK| K[Click en Guardar]
    K --> L[API crea usuario en auth.users]
    L --> M[API crea perfil en profiles]
    M --> N[API inserta permisos en user_permissions]
    N --> O[Muestra toast de éxito]
    O --> P[Cierra formulario]
    P --> Q[Recarga lista de usuarios]
\`\`\`

**Pasos Detallados:**

1. **Inicio del Flujo**
   - Usuario: Administrador autenticado
   - Ubicación: `/dashboard/users`
   - Acción: Click en botón "Nuevo Usuario"

2. **Apertura del Formulario**
   - Sistema abre Dialog con formulario
   - Campos visibles: Nombre, Apellido, Email, Contraseña, Rol
   - Estado inicial: Todos los campos vacíos

3. **Ingreso de Datos Básicos**
   - Admin completa:
     - Nombre (requerido, min 2 caracteres)
     - Apellido (requerido, min 2 caracteres)
     - Email (requerido, formato válido)
     - Contraseña (requerido, min 6 caracteres)

4. **Selección de Rol**
   - Admin selecciona de dropdown:
     - "Administrador" → Oculta selector de permisos
     - "Usuario" → Muestra selector de permisos

5. **Selección de Permisos (solo si rol = Usuario)**
   - Sistema muestra checkboxes de rutas
   - Dashboard: Siempre marcado y deshabilitado
   - Otras rutas: Habilitadas para selección
   - Validación: Mínimo 2 permisos (dashboard + 1)

6. **Validación del Formulario**
   - Frontend valida:
     - Campos requeridos completos
     - Email formato válido
     - Contraseña mínimo 6 caracteres
     - Si Usuario: mínimo 2 permisos seleccionados
   - Si error: Muestra mensaje específico

7. **Envío al Backend**
   - POST `/api/users`
   - Body: `{ first_name, last_name, email, password, is_admin, permissions }`

8. **Procesamiento en Backend**
   - Verifica que usuario actual es admin
   - Valida datos con Zod
   - Crea usuario en `auth.users` (Supabase Auth)
   - Crea perfil en `profiles`
   - Si no es admin: Inserta permisos en `user_permissions`

9. **Respuesta y Feedback**
   - Si éxito:
     - Toast verde: "Usuario creado exitosamente"
     - Cierra dialog
     - Recarga lista de usuarios
   - Si error:
     - Toast rojo con mensaje específico
     - Mantiene formulario abierto
     - Permite reintentar

### 7.2 Flujo: Editar Permisos de Usuario

\`\`\`mermaid
graph TD
    A[Admin ve lista de usuarios] --> B[Click en botón Editar]
    B --> C[Sistema carga datos del usuario]
    C --> D[Formulario se abre con datos]
    D --> E[Admin modifica permisos]
    E --> F{Validación}
    F -->|Error| G[Muestra mensaje]
    G --> E
    F -->|OK| H[Click en Guardar]
    H --> I[PUT /api/users/id]
    I --> J[API actualiza perfil]
    J --> K[API elimina permisos antiguos]
    K --> L[API inserta nuevos permisos]
    L --> M[Toast de éxito]
    M --> N[Cierra formulario]
    N --> O[Recarga lista]
\`\`\`

**Pasos Detallados:**

1. **Selección de Usuario**
   - Admin ve tabla de usuarios
   - Identifica usuario a editar
   - Click en botón "Editar" (ícono de lápiz)

2. **Carga de Datos**
   - Sistema hace GET `/api/users/[id]`
   - Obtiene datos del perfil
   - Hace GET `/api/users/[id]/permissions`
   - Obtiene permisos actuales

3. **Apertura del Formulario**
   - Dialog se abre con datos pre-cargados
   - Campos editables: Nombre, Apellido, Rol
   - Email: Solo lectura (no editable)
   - Permisos: Checkboxes marcados según permisos actuales

4. **Modificación de Datos**
   - Admin puede cambiar:
     - Nombre y/o Apellido
     - Rol (Admin ↔ Usuario)
     - Permisos (si es Usuario)

5. **Cambio de Rol**
   - Si cambia de Usuario → Admin:
     - Oculta selector de permisos
     - Limpia permisos seleccionados
   - Si cambia de Admin → Usuario:
     - Muestra selector de permisos
     - Requiere seleccionar mínimo 2

6. **Validación**
   - Mismas reglas que crear usuario
   - Adicional: Verificar que no se auto-elimine como admin

7. **Envío al Backend**
   - PUT `/api/users/[id]`
   - Body: `{ first_name, last_name, is_admin }`
   - PUT `/api/users/[id]/permissions`
   - Body: `{ permissions: ["dashboard", "clients", ...] }`

8. **Procesamiento en Backend**
   - Actualiza perfil en `profiles`
   - Si cambió a admin: Elimina todos los permisos
   - Si es usuario: 
     - DELETE todos los permisos antiguos
     - INSERT nuevos permisos

9. **Respuesta**
   - Toast de éxito
   - Cierra formulario
   - Recarga lista
   - Si el usuario editado está logueado: Forzar re-login

### 7.3 Flujo: Crear Préstamo con Validación

\`\`\`mermaid
graph TD
    A[Usuario abre Préstamos] --> B[Click en 'Nuevo Préstamo']
    B --> C[Formulario se abre]
    C --> D[Selecciona cliente]
    D --> E[Ingresa monto]
    E --> F[Ingresa tasa de interés]
    F --> G[Ingresa número de cuotas]
    G --> H[Sistema calcula automáticamente]
    H --> I{Validación frontend}
    I -->|Error| J[Muestra errores en campos]
    J --> E
    I -->|OK| K[Click en Guardar]
    K --> L[POST /api/loans]
    L --> M{Validación backend}
    M -->|Error| N[Toast con error específico]
    N --> E
    M -->|OK| O[Crea préstamo en DB]
    O --> P[Genera cronograma de pagos]
    P --> Q[Toast de éxito]
    Q --> R[Redirige a detalle del préstamo]
\`\`\`

**Validaciones en Cada Paso:**

**Paso E: Ingresa Monto**
- Validación en tiempo real:
  - ✅ Número positivo
  - ✅ Mínimo $1
  - ✅ Máximo $10,000,000
  - ✅ Máximo 2 decimales
- Mensaje de error si no cumple

**Paso F: Ingresa Tasa**
- Validación en tiempo real:
  - ✅ Número entre 0 y 100
  - ✅ Máximo 2 decimales
- Cálculo automático de interés total

**Paso G: Ingresa Cuotas**
- Validación en tiempo real:
  - ✅ Número entero
  - ✅ Mínimo 1
  - ✅ Máximo 360
- Cálculo automático de monto de cuota

**Paso H: Cálculos Automáticos**
\`\`\`typescript
// Fórmula de cálculo
const monthlyRate = (interest_rate / 100) / 12
const installmentAmount = principal * (
  monthlyRate * Math.pow(1 + monthlyRate, installments)
) / (
  Math.pow(1 + monthlyRate, installments) - 1
)
const totalInterest = (installmentAmount * installments) - principal
\`\`\`

**Paso M: Validación Backend**
- Verifica que cliente existe y está activo
- Valida todos los campos con Zod
- Verifica que cliente no tenga préstamos vencidos
- Genera código único de préstamo
- Previene duplicación con transacción

### 7.4 Flujo: Búsqueda de Préstamos

\`\`\`mermaid
graph TD
    A[Usuario en página Préstamos] --> B[Ve lista completa]
    B --> C[Escribe en campo de búsqueda]
    C --> D[Sistema espera 300ms debounce]
    D --> E[Filtra lista localmente]
    E --> F{Hay resultados?}
    F -->|Sí| G[Muestra préstamos filtrados]
    F -->|No| H[Muestra mensaje 'Sin resultados']
    G --> I[Usuario puede seguir escribiendo]
    I --> D
    H --> J[Usuario puede limpiar búsqueda]
    J --> B
\`\`\`

**Implementación de Búsqueda:**

\`\`\`typescript
// Búsqueda con debounce
const [searchTerm, setSearchTerm] = useState("")
const debouncedSearch = useDebounce(searchTerm, 300)

const filteredLoans = useMemo(() => {
  if (!debouncedSearch) return loans
  
  const term = debouncedSearch.toLowerCase()
  return loans.filter(loan => {
    const code = loan.loan_code.toLowerCase()
    const clientName = `${loan.active_clients.first_name} ${loan.active_clients.last_name}`.toLowerCase()
    
    return code.includes(term) || clientName.includes(term)
  })
}, [loans, debouncedSearch])
\`\`\`

---

## 8. Arquitectura y Diseño

### 8.1 Arquitectura de Componentes

\`\`\`
app/
├── dashboard/
│   ├── users/
│   │   └── page.tsx (Gestión de usuarios)
│   ├── clients/
│   │   └── page.tsx (Lista de clientes)
│   ├── loans/
│   │   └── page.tsx (Lista de préstamos)
│   └── ...
├── api/
│   ├── users/
│   │   ├── route.ts (CRUD usuarios)
│   │   └── [id]/
│   │       ├── route.ts (GET/PUT/DELETE usuario)
│   │       └── permissions/
│   │           └── route.ts (Gestión de permisos)
│   ├── loans/
│   │   ├── route.ts (CRUD préstamos)
│   │   └── [id]/
│   │       └── route.ts
│   └── ...
components/
├── forms/
│   ├── create-user-form.tsx
│   ├── edit-user-form.tsx
│   ├── create-loan-form.tsx
│   └── ...
├── ui/ (shadcn/ui components)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
├── route-permissions-selector.tsx (Nuevo)
├── loading-skeleton.tsx
├── confirm-dialog.tsx (Nuevo)
└── ...
lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
├── utils/
│   ├── validation.ts (Esquemas Zod)
│   ├── date-utils.ts (Formateo de fechas)
│   └── permissions.ts (Helpers de permisos)
└── hooks/
    ├── use-permissions.ts (Nuevo)
    ├── use-debounce.ts (Nuevo)
    └── use-async.ts (Nuevo)
\`\`\`

### 8.2 Flujo de Datos

\`\`\`mermaid
graph LR
    A[Usuario] --> B[Componente React]
    B --> C[Hook personalizado]
    C --> D[API Route]
    D --> E[Supabase Client]
    E --> F[PostgreSQL]
    F --> E
    E --> D
    D --> C
    C --> B
    B --> A
\`\`\`

**Ejemplo: Crear Usuario**

1. Usuario completa formulario → `CreateUserForm`
2. Submit → `handleSubmit` en componente
3. Validación frontend → Zod schema
4. Fetch → `POST /api/users`
5. API valida → Zod schema backend
6. API crea usuario → Supabase Auth
7. API crea perfil → Supabase DB
8. API crea permisos → Supabase DB
9. Respuesta → JSON con usuario creado
10. Hook actualiza estado → `setUsers([...users, newUser])`
11. UI se actualiza → Muestra nuevo usuario en lista

### 8.3 Gestión de Estado

**Estado Local (useState):**
- Formularios
- UI temporal (modals, dropdowns)
- Búsqueda y filtros

**Estado del Servidor (SWR/React Query):**
- Listas de datos (usuarios, préstamos, clientes)
- Datos de detalle
- Caché automático

**Contexto Global (React Context):**
- Usuario autenticado
- Permisos del usuario
- Tema (dark/light)

\`\`\`typescript
// Contexto de permisos
const PermissionsContext = createContext<PermissionsContextType | null>(null)

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserPermissions()
  }, [])

  const hasPermission = (route: string) => {
    return isAdmin || permissions.includes(route)
  }

  return (
    <PermissionsContext.Provider value={{ permissions, isAdmin, hasPermission, loading }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionsContext)
  if (!context) throw new Error('usePermissions must be used within PermissionsProvider')
  return context
}
\`\`\`

### 8.4 Patrones de Diseño

**Repository Pattern (APIs):**
\`\`\`typescript
// lib/repositories/user-repository.ts
export class UserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll() {
    const { data, error } = await this.supabase
      .from('v_users_with_permissions')
      .select('*')
    if (error) throw error
    return data
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('v_users_with_permissions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async create(userData: CreateUserDTO) {
    // Lógica de creación
  }

  async update(id: string, userData: UpdateUserDTO) {
    // Lógica de actualización
  }
}
\`\`\`

**Factory Pattern (Validación):**
\`\`\`typescript
// lib/utils/validation.ts
export class ValidationFactory {
  static createLoanValidator() {
    return z.object({
      client_id: z.string().uuid(),
      amount: z.number().positive().min(1).max(10000000),
      // ...
    })
  }

  static createUserValidator() {
    return z.object({
      email: z.string().email(),
      first_name: z.string().min(2),
      // ...
    })
  }
}
\`\`\`

**Observer Pattern (Eventos):**
\`\`\`typescript
// lib/events/event-emitter.ts
class EventEmitter {
  private events: Map<string, Function[]> = new Map()

  on(event: string, callback: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }

  emit(event: string, data: any) {
    const callbacks = this.events.get(event) || []
    callbacks.forEach(callback => callback(data))
  }
}

export const eventBus = new EventEmitter()

// Uso
eventBus.on('user:created', (user) => {
  console.log('Nuevo usuario creado:', user)
  // Enviar email de bienvenida
  // Registrar en analytics
})
\`\`\`

---

## 9. Seguridad y Permisos

### 9.1 Modelo de Seguridad

#### 9.1.1 Capas de Seguridad

\`\`\`
┌─────────────────────────────────────┐
│   1. Autenticación (Supabase Auth)  │
│   - JWT tokens                       │
│   - Session management               │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   2. Middleware (Next.js)            │
│   - Verificar token válido           │
│   - Verificar permisos de ruta       │
│   - Redirigir si no autorizado       │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   3. API Routes                      │
│   - Verificar usuario autenticado    │
│   - Verificar rol (admin/user)       │
│   - Validar datos de entrada         │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   4. Row Level Security (RLS)        │
│   - Políticas en Supabase            │
│   - Acceso a nivel de fila           │
└─────────────────────────────────────┘
\`\`\`

#### 9.1.2 Matriz de Permisos

| Ruta | Admin | Usuario con Permiso | Usuario sin Permiso |
|------|-------|---------------------|---------------------|
| `/dashboard` | ✅ | ✅ | ✅ (siempre) |
| `/dashboard/users` | ✅ | ❌ | ❌ |
| `/dashboard/clients` | ✅ | ✅ (si tiene permiso) | ❌ |
| `/dashboard/loans` | ✅ | ✅ (si tiene permiso) | ❌ |
| `/dashboard/expenses` | ✅ | ✅ (si tiene permiso) | ❌ |
| `/dashboard/reports` | ✅ | ✅ (si tiene permiso) | ❌ |
| `/api/users/*` | ✅ | ❌ | ❌ |
| `/api/clients/*` | ✅ | ✅ (solo lectura) | ❌ |
| `/api/loans/*` | ✅ | ✅ (CRUD completo) | ❌ |

### 9.2 Implementación de Seguridad

#### 9.2.1 Middleware de Autenticación

\`\`\`typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Verificar autenticación
  const { data: { user }, error } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isPublicRoute = request.nextUrl.pathname === '/'

  // Redirigir a login si no autenticado
  if (!user && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirigir a dashboard si ya autenticado y en login
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Verificar permisos de ruta
  if (user && !isAuthRoute && !isPublicRoute) {
    const hasPermission = await checkUserPermission(supabase, user.id, request.nextUrl.pathname)
    
    if (!hasPermission) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

async function checkUserPermission(supabase: any, userId: string, pathname: string): Promise<boolean> {
  // Extraer ruta base (ej: /dashboard/clients → clients)
  const routeParts = pathname.split('/').filter(Boolean)
  const routePath = routeParts[1] // Asume /dashboard/[route]

  // Verificar si es admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (profile?.is_admin) return true

  // Dashboard siempre permitido
  if (routePath === 'dashboard' || !routePath) return true

  // Verificar permiso específico
  const { data: permission } = await supabase
    .from('user_permissions')
    .select('id')
    .eq('user_id', userId)
    .eq('route_path', routePath)
    .single()

  return !!permission
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
\`\`\`

#### 9.2.2 Verificación en API Routes

\`\`\`typescript
// lib/utils/api-auth.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function verifyAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
      user: null,
      supabase: null
    }
  }

  return { error: null, user, supabase }
}

export async function verifyAdmin() {
  const { error, user, supabase } = await verifyAuth()
  if (error) return { error, user: null, supabase: null }

  const { data: profile } = await supabase!
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  if (!profile?.is_admin) {
    return {
      error: NextResponse.json({ error: 'Requiere permisos de administrador' }, { status: 403 }),
      user: null,
      supabase: null
    }
  }

  return { error: null, user, supabase }
}

// Uso en API route
export async function POST(request: Request) {
  const { error, user, supabase } = await verifyAdmin()
  if (error) return error

  // Continuar con lógica de la API
  // ...
}
\`\`\`

#### 9.2.3 Row Level Security (RLS)

\`\`\`sql
-- Políticas RLS para tabla profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Solo admins pueden crear/actualizar/eliminar perfiles
CREATE POLICY "Only admins can modify profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Políticas RLS para tabla loans
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden ver préstamos
CREATE POLICY "Authenticated users can view loans"
  ON loans FOR SELECT
  TO authenticated
  USING (true);

-- Solo usuarios con permiso pueden crear préstamos
CREATE POLICY "Users with permission can create loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.is_admin = true
        OR EXISTS (
          SELECT 1 FROM user_permissions
          WHERE user_permissions.user_id = auth.uid()
          AND user_permissions.route_path = 'loans'
        )
      )
    )
  );

-- Solo admins pueden eliminar préstamos
CREATE POLICY "Only admins can delete loans"
  ON loans FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
\`\`\`

### 9.3 Prevención de Vulnerabilidades

#### 9.3.1 SQL Injection

**Problema:**
\`\`\`typescript
// ❌ VULNERABLE
const query = `SELECT * FROM users WHERE email = '${email}'`
\`\`\`

**Solución:**
\`\`\`typescript
// ✅ SEGURO - Usar Supabase query builder
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', email) // Parámetros escapados automáticamente
\`\`\`

#### 9.3.2 XSS (Cross-Site Scripting)

**Problema:**
\`\`\`typescript
// ❌ VULNERABLE
<div dangerouslySetInnerHTML={{ __html: userInput }} />
\`\`\`

**Solución:**
\`\`\`typescript
// ✅ SEGURO - React escapa automáticamente
<div>{userInput}</div>

// Si necesitas HTML, sanitiza primero
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
\`\`\`

#### 9.3.3 CSRF (Cross-Site Request Forgery)

**Solución:**
- Supabase JWT tokens incluyen protección CSRF
- Verificar origin en API routes sensibles

\`\`\`typescript
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000'
  ]

  if (!origin || !allowedOrigins.includes(origin)) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
  }

  // Continuar con lógica
}
\`\`\`

#### 9.3.4 Rate Limiting

\`\`\`typescript
// lib/utils/rate-limit.ts
import { LRUCache } from 'lru-cache'

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export default function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  })

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0]
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount)
        }
        tokenCount[0] += 1

        const currentUsage = tokenCount[0]
        const isRateLimited = currentUsage >= limit

        return isRateLimited ? reject() : resolve()
      }),
  }
}

// Uso en API route
const limiter = rateLimit({
  interval: 60 * 1000, // 60 segundos
  uniqueTokenPerInterval: 500,
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    await limiter.check(10, ip) // 10 requests por minuto
  } catch {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes' },
      { status: 429 }
    )
  }

  // Continuar con lógica
}
\`\`\`

---

## 10. Rendimiento y Optimización

### 10.1 Estrategias de Optimización

#### 10.1.1 Paginación Server-Side

\`\`\`typescript
// app/api/loans/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const search = searchParams.get('search') || ''

  const supabase = await createClient()

  let query = supabase
    .from('loans')
    .select('*, active_clients(*)', { count: 'exact' })

  // Aplicar búsqueda si existe
  if (search) {
    query = query.or(`loan_code.ilike.%${search}%,active_clients.first_name.ilike.%${search}%`)
  }

  // Aplicar paginación
  const { data, error, count } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    loans: data,
    pagination: {
      page,
      pageSize,
      totalItems: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  })
}
\`\`\`

#### 10.1.2 Caché de Datos

\`\`\`typescript
// lib/hooks/use-loans.ts
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useLoans(page: number = 1, search: string = '') {
  const { data, error, mutate } = useSWR(
    `/api/loans?page=${page}&search=${search}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000, // No refetch si ya se hizo en últimos 5s
    }
  )

  return {
    loans: data?.loans || [],
    pagination: data?.pagination,
    isLoading: !error && !data,
    isError: error,
    mutate // Para invalidar caché manualmente
  }
}

// Uso en componente
function LoansPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { loans, pagination, isLoading, mutate } = useLoans(page, search)

  const handleCreateLoan = async (loanData) => {
    await fetch('/api/loans', { method: 'POST', body: JSON.stringify(loanData) })
    mutate() // Revalidar caché
  }

  // ...
}
\`\`\`

#### 10.1.3 Lazy Loading de Componentes

\`\`\`typescript
// app/dashboard/reports/page.tsx
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Cargar componente pesado solo cuando se necesite
const HeavyChart = dynamic(
  () => import('@/components/charts/heavy-chart'),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false // No renderizar en servidor
  }
)

const ExpensiveTable = dynamic(
  () => import('@/components/tables/expensive-table'),
  {
    loading: () => <div>Cargando tabla...</div>
  }
)

export default function ReportsPage() {
  const [showChart, setShowChart] = useState(false)

  return (
    <div>
      <Button onClick={() => setShowChart(true)}>
        Mostrar Gráfico
      </Button>
      
      {showChart && <HeavyChart />}
      
      <ExpensiveTable />
    </div>
  )
}
\`\`\`

#### 10.1.4 Optimización de Imágenes

\`\`\`typescript
// Usar Next.js Image component
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // Para imágenes above-the-fold
  placeholder="blur" // Mostrar blur mientras carga
  blurDataURL="data:image/..." // Base64 de imagen pequeña
/>
\`\`\`

#### 10.1.5 Memoización

\`\`\`typescript
// Memoizar cálculos costosos
const totalAmount = useMemo(() => {
  return loans.reduce((sum, loan) => sum + loan.amount, 0)
}, [loans])

// Memoizar componentes
const LoanCard = memo(({ loan }: { loan: Loan }) => {
  return (
    <Card>
      <CardHeader>{loan.loan_code}</CardHeader>
      <CardContent>{loan.amount}</CardContent>
    </Card>
  )
})

// Memoizar callbacks
const handleDelete = useCallback((id: string) => {
  deleteLoan(id)
}, [deleteLoan])
\`\`\`

### 10.2 Métricas de Rendimiento

#### 10.2.1 Core Web Vitals

**Largest Contentful Paint (LCP):**
- Objetivo: < 2.5s
- Optimizaciones:
  - Lazy load de imágenes
  - Preload de recursos críticos
  - Optimizar servidor (Vercel Edge)

**First Input Delay (FID):**
- Objetivo: < 100ms
- Optimizaciones:
  - Code splitting
  - Reducir JavaScript bloqueante
  - Web Workers para tareas pesadas

**Cumulative Layout Shift (CLS):**
- Objetivo: < 0.1
- Optimizaciones:
  - Definir dimensiones de imágenes
  - Reservar espacio para contenido dinámico
  - Evitar insertar contenido arriba del viewport

#### 10.2.2 Monitoreo

\`\`\`typescript
// lib/utils/performance.ts
export function measurePerformance(metricName: string) {
  if (typeof window === 'undefined') return

  const startTime = performance.now()

  return {
    end: () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Enviar a servicio de analytics
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/analytics/performance', {
          method: 'POST',
          body: JSON.stringify({
            metric: metricName,
            duration,
            timestamp: new Date().toISOString()
          })
        })
      }

      console.log(`[Performance] ${metricName}: ${duration.toFixed(2)}ms`)
    }
  }
}

// Uso
const perf = measurePerformance('load-loans')
await fetchLoans()
perf.end()
\`\`\`

---

## 11. Plan de Implementación

### 11.1 Cronograma

#### Semana 1: Seguridad y Permisos (Crítico)

**Días 1-2: Base de Datos**
- [ ] Crear tabla `user_permissions`
- [ ] Crear índices necesarios
- [ ] Crear vista `v_users_with_permissions`
- [ ] Configurar RLS policies
- [ ] Testing de permisos en DB

**Días 3-4: Backend**
- [ ] Implementar API `/api/users/[id]/permissions`
- [ ] Actualizar middleware para verificar permisos
- [ ] Agregar verificación de admin en APIs críticas
- [ ] Testing de APIs

**Día 5: Frontend**
- [ ] Crear componente `RoutePermissionsSelector`
- [ ] Actualizar `CreateUserForm`
- [ ] Actualizar `EditUserForm`
- [ ] Actualizar página `/dashboard/users`
- [ ] Testing de formularios

#### Semana 2: Validación de Datos (Alto)

**Días 1-2: Esquemas de Validación**
- [ ] Crear esquemas Zod para préstamos
- [ ] Crear esquemas Zod para clientes
- [ ] Crear esquemas Zod para gastos
- [ ] Crear utilidades de validación

**Días 3-4: Implementación en APIs**
- [ ] Actualizar API de préstamos con validación
- [ ] Actualizar API de clientes con validación
- [ ] Prevenir duplicación de códigos
- [ ] Testing de validación

**Día 5: Implementación en Formularios**
- [ ] Actualizar formulario de préstamos
- [ ] Agregar validaciones en tiempo real
- [ ] Mejorar mensajes de error
- [ ] Testing de formularios

#### Semana 3: Funcionalidades Básicas (Alto)

**Días 1-2: Búsqueda**
- [ ] Implementar búsqueda en préstamos
- [ ] Implementar búsqueda en clientes
- [ ] Crear hook `useSearch`
- [ ] Testing de búsqueda

**Días 3-4: Confirmaciones**
- [ ] Crear componente `ConfirmDialog`
- [ ] Agregar confirmación en eliminar usuario
- [ ] Agregar confirmación en eliminar préstamo
- [ ] Agregar confirmación en eliminar cliente
- [ ] Testing de confirmaciones

**Día 5: Logout y Sesión**
- [ ] Mejorar función de logout
- [ ] Limpiar cookies correctamente
- [ ] Testing de logout

#### Semana 4: UX y Rendimiento (Medio)

**Días 1-2: Estados de Carga**
- [ ] Crear componente `LoadingSkeleton`
- [ ] Agregar skeletons en todas las páginas
- [ ] Agregar spinners en botones
- [ ] Testing de estados de carga

**Días 3-4: Paginación**
- [ ] Implementar paginación en API de préstamos
- [ ] Implementar paginación en API de clientes
- [ ] Crear componente `Pagination`
- [ ] Testing de paginación

**Día 5: Mejoras Finales**
- [ ] Estandarizar formato de fechas
- [ ] Mejorar mensajes de error
- [ ] Optimizar rendimiento
- [ ] Testing general

#### Semana 5: Testing y Deployment

**Días 1-2: Testing Exhaustivo**
- [ ] Testing de seguridad
- [ ] Testing de validación
- [ ] Testing de funcionalidades
- [ ] Testing de rendimiento
- [ ] Corrección de bugs

**Días 3-4: Documentación**
- [ ] Actualizar README
- [ ] Documentar APIs
- [ ] Documentar componentes
- [ ] Crear guía de usuario

**Día 5: Deployment**
- [ ] Deploy a staging
- [ ] Testing en staging
- [ ] Deploy a producción
- [ ] Monitoreo post-deployment

### 11.2 Recursos Necesarios

**Equipo:**
- 1 Desarrollador Full-Stack (40 horas/semana)
- 1 QA Tester (20 horas/semana)
- 1 Product Owner (10 horas/semana)

**Herramientas:**
- Acceso a Supabase (producción y staging)
- Acceso a Vercel
- Herramientas de testing (Jest, Playwright)
- Herramientas de monitoreo (Sentry, Vercel Analytics)

**Presupuesto:**
- Desarrollo: 200 horas × $X/hora
- Testing: 100 horas × $Y/hora
- Infraestructura: $Z/mes (Supabase + Vercel)

### 11.3 Dependencias y Riesgos

**Dependencias:**
- Aprobación de cambios en base de datos
- Disponibilidad de ambiente de staging
- Tiempo de QA para testing

**Riesgos:**

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Cambios rompen funcionalidad existente | Media | Alto | Testing exhaustivo, feature flags |
| Migración de permisos falla | Baja | Alto | Backup de DB, rollback plan |
| Rendimiento degradado | Media | Medio | Monitoreo, optimización incremental |
| Usuarios pierden acceso | Baja | Alto | Comunicación previa, soporte 24/7 |
| Bugs en producción | Media | Medio | Staging environment, gradual rollout |

---

## 12. Criterios de Aceptación

### 12.1 Funcionalidades Críticas

#### Sistema de Permisos

**Criterio 1: Crear Usuario con Permisos**
- [ ] Admin puede abrir formulario "Nuevo Usuario"
- [ ] Formulario muestra todos los campos requeridos
- [ ] Selector de rol funciona correctamente
- [ ] Selector de permisos se muestra solo para usuarios normales
- [ ] Dashboard está siempre marcado y deshabilitado
- [ ] Validación requiere mínimo 2 permisos para usuarios normales
- [ ] Usuario se crea exitosamente en base de datos
- [ ] Permisos se guardan correctamente en `user_permissions`
- [ ] Toast de éxito se muestra
- [ ] Lista de usuarios se actualiza automáticamente

**Criterio 2: Editar Permisos de Usuario**
- [ ] Admin puede abrir formulario de edición
- [ ] Formulario carga con datos actuales del usuario
- [ ] Permisos actuales están marcados correctamente
- [ ] Admin puede modificar permisos
- [ ] Cambios se guardan correctamente
- [ ] Usuario ve cambios en próximo login
- [ ] Toast de éxito se muestra

**Criterio 3: Verificación de Permisos en Middleware**
- [ ] Usuario sin permiso no puede acceder a ruta protegida
- [ ] Usuario es redirigido a `/unauthorized`
- [ ] Admin puede acceder a todas las rutas
- [ ] Dashboard es accesible para todos los usuarios autenticados
- [ ] Rutas públicas son accesibles sin autenticación

**Criterio 4: Verificación de Permisos en Sidebar**
- [ ] Sidebar muestra solo rutas con permiso
- [ ] Admin ve todas las rutas
- [ ] Usuario normal ve solo sus rutas permitidas
- [ ] Dashboard siempre visible

#### Validación de Datos

**Criterio 5: Validación de Préstamos**
- [ ] No se puede crear préstamo con monto negativo
- [ ] No se puede crear préstamo con monto > $10,000,000
- [ ] No se puede crear préstamo con cuotas < 1
- [ ] No se puede crear préstamo con cuotas > 360
- [ ] No se puede crear préstamo con tasa < 0% o > 100%
- [ ] No se puede crear préstamo con fecha inválida
- [ ] Validación muestra mensajes específicos
- [ ] Validación funciona en frontend y backend

**Criterio 6: Prevención de Duplicados**
- [ ] No se pueden crear dos préstamos con mismo código
- [ ] Sistema genera códigos únicos automáticamente
- [ ] Manejo de condiciones de carrera

#### Funcionalidades Básicas

**Criterio 7: Búsqueda de Préstamos**
- [ ] Input de búsqueda visible en página de préstamos
- [ ] Búsqueda funciona por código de préstamo
- [ ] Búsqueda funciona por nombre de cliente
- [ ] Búsqueda es case-insensitive
- [ ] Resultados se actualizan en tiempo real
- [ ] Debounce de 300ms funciona correctamente

**Criterio 8: Confirmación de Eliminación**
- [ ] Dialog de confirmación aparece al intentar eliminar
- [ ] Dialog explica consecuencias de la acción
- [ ] Usuario puede cancelar fácilmente
- [ ] Eliminación solo ocurre después de confirmar
- [ ] Toast de éxito/error se muestra

**Criterio 9: Logout Funcional**
- [ ] Botón de logout visible en sidebar
- [ ] Click en logout cierra sesión correctamente
- [ ] Cookies se limpian completamente
- [ ] Usuario es redirigido a login
- [ ] Usuario no puede acceder a rutas protegidas después de logout

### 12.2 Calidad de Código

**Criterio 10: TypeScript**
- [ ] No hay errores de TypeScript
- [ ] Todos los tipos están definidos correctamente
- [ ] No se usa `any` sin justificación

**Criterio 11: Testing**
- [ ] Cobertura de tests > 80%
- [ ] Todos los tests pasan
- [ ] Tests incluyen casos edge

**Criterio 12: Rendimiento**
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] API response time < 500ms

### 12.3 Seguridad

**Criterio 13: Autenticación**
- [ ] Solo usuarios autenticados acceden a rutas protegidas
- [ ] Tokens JWT son válidos
- [ ] Sesiones expiran correctamente

**Criterio 14: Autorización**
- [ ] Permisos se verifican en middleware
- [ ] Permisos se verifican en APIs
- [ ] RLS policies funcionan correctamente

**Criterio 15: Validación**
- [ ] Todos los inputs son validados
- [ ] No hay vulnerabilidades SQL injection
- [ ] No hay vulnerabilidades XSS

---

## 13. Testing y QA

### 13.1 Estrategia de Testing

#### 13.1.1 Pirámide de Testing

\`\`\`
        /\
       /  \
      / E2E \
     /--------\
    /          \
   / Integration \
  /--------------\
 /                \
/   Unit Tests     \
--------------------
\`\`\`

**Unit Tests (70%):**
- Funciones de utilidad
- Hooks personalizados
- Validaciones Zod
- Helpers de permisos

**Integration Tests (20%):**
- API routes
- Componentes con estado
- Flujos de formularios

**E2E Tests (10%):**
- Flujos críticos de usuario
- Crear usuario con permisos
- Crear préstamo
- Login/Logout

#### 13.1.2 Herramientas

- **Unit/Integration:** Jest + React Testing Library
- **E2E:** Playwright
- **Coverage:** Jest Coverage
- **Mocking:** MSW (Mock Service Worker)

### 13.2 Casos de Prueba

#### 13.2.1 Sistema de Permisos

**Test Suite: Crear Usuario con Permisos**

\`\`\`typescript
describe('CreateUserForm', () => {
  it('should show permission selector for non-admin users', () => {
    render(<CreateUserForm />)
    
    const roleSelect = screen.getByLabelText('Rol')
    fireEvent.change(roleSelect, { target: { value: 'user' } })
    
    expect(screen.getByText('Permisos de Acceso')).toBeInTheDocument()
  })

  it('should require minimum 2 permissions for non-admin', async () => {
    render(<CreateUserForm />)
    
    // Select user role
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'user' } })
    
    // Try to submit with only dashboard (default)
    fireEvent.click(screen.getByText('Guardar'))
    
    await waitFor(() => {
      expect(screen.getByText(/debe seleccionar al menos 2 permisos/i)).toBeInTheDocument()
    })
  })

  it('should create user with selected permissions', async () => {
    const mockOnSuccess = jest.fn()
    render(<CreateUserForm onSuccess={mockOnSuccess} />)
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Juan' } })
    fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'juan@test.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'user' } })
    
    // Select permissions
    fireEvent.click(screen.getByLabelText('Clientes'))
    fireEvent.click(screen.getByLabelText('Préstamos'))
    
    // Submit
    fireEvent.click(screen.getByText('Guardar'))
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })
})
\`\`\`

**Test Suite: Middleware de Permisos**

\`\`\`typescript
describe('Permissions Middleware', () => {
  it('should redirect unauthenticated users to login', async () => {
    const request = new NextRequest('http://localhost:3000/dashboard')
    const response = await middleware(request)
    
    expect(response.status).toBe(307) // Redirect
    expect(response.headers.get('location')).toContain('/auth/login')
  })

  it('should allow admin to access all routes', async () => {
    const request = new NextRequest('http://localhost:3000/dashboard/users')
    // Mock authenticated admin user
    mockSupabaseAuth({ user: { id: '123' }, profile: { is_admin: true } })
    
    const response = await middleware(request)
    
    expect(response.status).toBe(200)
  })

  it('should block user without permission', async () => {
    const request = new NextRequest('http://localhost:3000/dashboard/users')
    // Mock authenticated non-admin user without permissions
    mockSupabaseAuth({ 
      user: { id: '456' }, 
      profile: { is_admin: false },
      permissions: ['dashboard', 'clients']
    })
    
    const response = await middleware(request)
    
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/unauthorized')
  })
})
\`\`\`

#### 13.2.2 Validación de Datos

**Test Suite: Validación de Préstamos**

\`\`\`typescript
describe('Loan Validation', () => {
  it('should reject negative amount', () => {
    const result = loanSchema.safeParse({
      client_id: 'uuid',
      amount: -1000,
      installments: 12,
      interest_rate: 5,
      start_date: '2025-01-01'
    })
    
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('positivo')
  })

  it('should reject amount over maximum', () => {
    const result = loanSchema.safeParse({
      client_id: 'uuid',
      amount: 20000000,
      installments: 12,
      interest_rate: 5,
      start_date: '2025-01-01'
    })
    
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('máximo')
  })

  it('should accept valid loan data', () => {
    const result = loanSchema.safeParse({
      client_id: 'valid-uuid',
      amount: 5000,
      installments: 12,
      interest_rate: 5,
      start_date: '2025-01-01',
      installment_amount: 450,
      total_interest: 400
    })
    
    expect(result.success).toBe(true)
  })
})
\`\`\`

#### 13.2.3 E2E Tests

**Test Suite: Flujo Completo de Usuario**

\`\`\`typescript
import { test, expect } from '@playwright/test'

test.describe('User Management Flow', () => {
  test('admin can create user with permissions', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    
    // Navigate to users
    await page.goto('/dashboard/users')
    await expect(page).toHaveURL('/dashboard/users')
    
    // Open create user dialog
    await page.click('text=Nuevo Usuario')
    await expect(page.locator('dialog')).toBeVisible()
    
    // Fill form
    await page.fill('[name="first_name"]', 'Test')
    await page.fill('[name="last_name"]', 'User')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    
    // Select user role
    await page.selectOption('[name="role"]', 'user')
    
    // Select permissions
    await page.check('label:has-text("Clientes")')
    await page.check('label:has-text("Préstamos")')
    
    // Submit
    await page.click('button:has-text("Guardar")')
    
    // Verify success
    await expect(page.locator('text=Usuario creado exitosamente')).toBeVisible()
    await expect(page.locator('text=test@example.com')).toBeVisible()
  })

  test('user can only access permitted routes', async ({ page }) => {
    // Login as regular user
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'user@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    
    // Try to access users page (no permission)
    await page.goto('/dashboard/users')
    await expect(page).toHaveURL('/unauthorized')
    
    // Access clients page (has permission)
    await page.goto('/dashboard/clients')
    await expect(page).toHaveURL('/dashboard/clients')
    await expect(page.locator('h1:has-text("Clientes")')).toBeVisible()
  })
})
\`\`\`

### 13.3 Checklist de QA

#### Pre-Deployment

**Funcionalidad:**
- [ ] Todas las funcionalidades críticas funcionan
- [ ] No hay errores en consola
- [ ] Todos los formularios validan correctamente
- [ ] Todos los botones funcionan
- [ ] Navegación funciona correctamente

**Seguridad:**
- [ ] Permisos se verifican correctamente
- [ ] No hay acceso no autorizado
- [ ] Datos sensibles no se exponen
- [ ] Validación funciona en frontend y backend

**Rendimiento:**
- [ ] Páginas cargan en < 3 segundos
- [ ] No hay memory leaks
- [ ] Imágenes están optimizadas
- [ ] Paginación funciona correctamente

**UX:**
- [ ] Estados de carga visibles
- [ ] Mensajes de error claros
- [ ] Confirmaciones en acciones destructivas
- [ ] Diseño responsive

**Compatibilidad:**
- [ ] Funciona en Chrome
- [ ] Funciona en Firefox
- [ ] Funciona en Safari
- [ ] Funciona en mobile

#### Post-Deployment

**Monitoreo:**
- [ ] Logs de error configurados
- [ ] Analytics funcionando
- [ ] Alertas configuradas
- [ ] Backup automático activo

**Verificación:**
- [ ] Usuarios pueden login
- [ ] Permisos funcionan en producción
- [ ] APIs responden correctamente
- [ ] Base de datos accesible

---

## 14. Riesgos y Mitigación

### 14.1 Riesgos Técnicos

#### Riesgo 1: Migración de Permisos Falla

**Descripción:**
Al migrar usuarios existentes al nuevo sistema de permisos, algunos usuarios pueden perder acceso.

**Probabilidad:** Media  
**Impacto:** Alto

**Mitigación:**
1. Crear script de migración que asigne permisos por defecto
2. Hacer backup completo de base de datos antes de migración
3. Probar migración en staging primero
4. Tener plan de rollback preparado
5. Comunicar a usuarios con anticipación

**Script de Migración:**
\`\`\`sql
-- Asignar permisos por defecto a usuarios existentes no-admin
INSERT INTO user_permissions (user_id, route_path)
SELECT 
  p.id,
  unnest(ARRAY['dashboard', 'clients', 'loans', 'receipts']) as route_path
FROM profiles p
WHERE p.is_admin = false
ON CONFLICT (user_id, route_path) DO NOTHING;
\`\`\`

#### Riesgo 2: Rendimiento Degradado

**Descripción:**
Verificación de permisos en cada request puede degradar rendimiento.

**Probabilidad:** Media  
**Impacto:** Medio

**Mitigación:**
1. Cachear permisos en sesión del usuario
2. Usar índices en base de datos
3. Implementar rate limiting
4. Monitorear métricas de rendimiento
5. Optimizar queries de permisos

**Implementación de Caché:**
\`\`\`typescript
// Cachear permisos en cookie encriptada
const cachePermissions = async (userId: string, permissions: string[]) => {
  const encrypted = encrypt(JSON.stringify(permissions))
  cookies().set('user_permissions', encrypted, {
    httpOnly: true,
    secure: true,
    maxAge: 3600 // 1 hora
  })
}

const getCachedPermissions = (): string[] | null => {
  const cached = cookies().get('user_permissions')
  if (!cached) return null
  
  try {
    return JSON.parse(decrypt(cached.value))
  } catch {
    return null
  }
}
\`\`\`

#### Riesgo 3: Bugs en Producción

**Descripción:**
Nuevas funcionalidades pueden introducir bugs no detectados en testing.

**Probabilidad:** Media  
**Impacto:** Medio

**Mitigación:**
1. Testing exhaustivo en staging
2. Gradual rollout (feature flags)
3. Monitoreo en tiempo real
4. Rollback automático si errores > threshold
5. Soporte 24/7 durante primera semana

**Feature Flags:**
\`\`\`typescript
// lib/feature-flags.ts
export const featureFlags = {
  newPermissionsSystem: process.env.NEXT_PUBLIC_ENABLE_NEW_PERMISSIONS === 'true',
  enhancedValidation: process.env.NEXT_PUBLIC_ENABLE_VALIDATION === 'true',
}

// Uso en componente
if (featureFlags.newPermissionsSystem) {
  return <NewPermissionsUI />
} else {
  return <LegacyPermissionsUI />
}
\`\`\`

### 14.2 Riesgos de Negocio

#### Riesgo 4: Resistencia al Cambio

**Descripción:**
Usuarios pueden resistirse al nuevo sistema de permisos.

**Probabilidad:** Alta  
**Impacto:** Bajo

**Mitigación:**
1. Comunicación clara de beneficios
2. Capacitación a usuarios
3. Documentación detallada
4. Soporte dedicado durante transición
5. Recoger feedback y ajustar

#### Riesgo 5: Downtime Durante Deployment

**Descripción:**
Deployment puede causar downtime no planificado.

**Probabilidad:** Baja  
**Impacto:** Alto

**Mitigación:**
1. Deployment en horario de bajo tráfico
2. Blue-green deployment
3. Health checks antes de switch
4. Rollback automático si falla
5. Comunicar mantenimiento programado

### 14.3 Plan de Contingencia

#### Escenario 1: Sistema de Permisos No Funciona

**Síntomas:**
- Usuarios no pueden acceder a ninguna ruta
- Middleware falla constantemente
- Errores 500 en APIs

**Acciones:**
1. Activar feature flag para deshabilitar nuevo sistema
2. Revertir a sistema anterior
3. Investigar causa raíz
4. Corregir en staging
5. Re-deploy cuando esté listo

#### Escenario 2: Base de Datos Corrupta

**Síntomas:**
- Errores de integridad referencial
- Datos inconsistentes
- Queries fallan

**Acciones:**
1. Detener escrituras a base de datos
2. Restaurar desde backup más reciente
3. Aplicar transacciones desde logs
4. Verificar integridad de datos
5. Reanudar operaciones

#### Escenario 3: Rendimiento Inaceptable

**Síntomas:**
- Páginas tardan > 5 segundos en cargar
- APIs timeout
- Usuarios reportan lentitud

**Acciones:**
1. Identificar bottleneck con profiling
2. Deshabilitar features no críticas
3. Escalar recursos (vertical/horizontal)
4. Optimizar queries problemáticas
5. Implementar caché agresivo

---

## 15. Apéndices

### 15.1 Glosario

**Términos Técnicos:**

- **RLS (Row Level Security):** Políticas de seguridad a nivel de fila en PostgreSQL
- **JWT (JSON Web Token):** Token de autenticación usado por Supabase
- **SSR (Server-Side Rendering):** Renderizado en servidor de Next.js
- **Middleware:** Código que se ejecuta antes de cada request
- **Zod:** Librería de validación de esquemas en TypeScript
- **shadcn/ui:** Colección de componentes UI reutilizables
- **Debounce:** Técnica para retrasar ejecución de función
- **Memoization:** Técnica de optimización que cachea resultados

**Términos de Negocio:**

- **Microcrédito:** Préstamo de pequeño monto
- **Cuota:** Pago periódico de un préstamo
- **Cronograma:** Calendario de pagos de un préstamo
- **Socio:** Inversor que aporta capital
- **Seguimiento:** Registro de interacciones con clientes

### 15.2 Referencias

**Documentación Oficial:**
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Zod Documentation](https://zod.dev)

**Guías de Seguridad:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)

**Recursos de Rendimiento:**
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance](https://react.dev/learn/render-and-commit)

### 15.3 Contactos

**Equipo de Desarrollo:**
- Product Owner: [Nombre]
- Tech Lead: [Nombre]
- Desarrollador Full-Stack: [Nombre]
- QA Engineer: [Nombre]

**Stakeholders:**
- CEO: [Nombre]
- CFO: [Nombre]
- Gerente de Operaciones: [Nombre]

**Soporte:**
- Email: soporte@mbmicrocreditos.com
- Slack: #mb-microcreditos-dev
- Jira: [Link al proyecto]

---

## Aprobaciones

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
| Stakeholder | | | |

---

**Fin del Documento**

*Este PRD es un documento vivo y será actualizado según evolucione el proyecto.*
