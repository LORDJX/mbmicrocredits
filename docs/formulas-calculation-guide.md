# Guía de Fórmulas y Cálculos - Sistema de Microcréditos

## Resumen para Socios

### Métricas Principales

#### 1. Préstamos Activos
**Fórmula:** `COUNT(loans WHERE status = 'activo' AND deleted_at IS NULL)`
- **Descripción:** Cuenta todos los préstamos que están actualmente en curso
- **Fuente de datos:** Tabla `loans`
- **Filtros:** Solo préstamos con estado 'activo' y no eliminados

#### 2. Capital en Circulación
**Fórmula:** `SUM(loans.amount WHERE status = 'activo' AND deleted_at IS NULL)`
- **Descripción:** Suma total del dinero prestado que está actualmente en circulación
- **Fuente de datos:** Tabla `loans`, campo `amount`
- **Filtros:** Solo préstamos activos y no eliminados

#### 3. Clientes Activos
**Fórmula:** `COUNT(DISTINCT clients WHERE deleted_at IS NULL)`
- **Descripción:** Número total de clientes registrados y activos en el sistema
- **Fuente de datos:** Tabla `clients`
- **Filtros:** Solo clientes no eliminados

#### 4. Margen de Ganancia
**Fórmula:** `((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100`
- **Descripción:** Porcentaje de rentabilidad mensual
- **Componentes:**
  - `monthlyIncome`: Suma de todos los recibos del mes actual
  - `monthlyExpenses`: Suma de todas las transacciones de tipo 'egreso' del mes actual

### Resumen Financiero Mensual

#### 1. Ingresos Mensuales
**Fórmula:** `SUM(receipts.total_amount WHERE EXTRACT(MONTH FROM created_at) = CURRENT_MONTH)`
- **Descripción:** Suma total de todos los recibos generados en el mes actual
- **Fuente de datos:** Tabla `receipts`, campo `total_amount`
- **Filtros:** Solo recibos del mes actual

#### 2. Gastos Mensuales
**Fórmula:** `SUM(transactions.amount WHERE type = 'egreso' AND EXTRACT(MONTH FROM created_at) = CURRENT_MONTH)`
- **Descripción:** Suma total de todos los gastos registrados en el mes actual
- **Fuente de datos:** Tabla `transactions`, campo `amount`
- **Filtros:** Solo transacciones de tipo 'egreso' del mes actual

#### 3. Ganancia Neta
**Fórmula:** `monthlyIncome - monthlyExpenses`
- **Descripción:** Diferencia entre ingresos y gastos del mes
- **Resultado:** Puede ser positivo (ganancia) o negativo (pérdida)

### Información de Socios

#### 1. Total de Socios
**Fórmula:** `COUNT(partners WHERE deleted_at IS NULL)`
- **Descripción:** Número total de socios activos
- **Fuente de datos:** Tabla `partners`
- **Filtros:** Solo socios no eliminados

#### 2. Promedio por Préstamo
**Fórmula:** `AVG(loans.amount WHERE status = 'activo')`
- **Descripción:** Monto promedio de los préstamos activos
- **Fuente de datos:** Tabla `loans`, campo `amount`
- **Filtros:** Solo préstamos activos

#### 3. Clientes por Socio
**Fórmula:** `totalClients / totalPartners`
- **Descripción:** Promedio de clientes asignados por socio
- **Resultado:** Se redondea al entero más cercano

### Indicadores Clave

#### 1. Tasa de Ocupación
**Fórmula:** `(totalActiveLoans / totalCapacityLoans) * 100`
- **Descripción:** Porcentaje de utilización de la capacidad de préstamos
- **Nota:** Actualmente se muestra un valor fijo de 94.2% cuando hay préstamos activos
- **Valor por defecto:** 0% cuando no hay préstamos activos

#### 2. Morosidad
**Fórmula:** `(COUNT(overdue_installments) / COUNT(total_installments)) * 100`
- **Descripción:** Porcentaje de cuotas vencidas respecto al total
- **Nota:** Actualmente se muestra un valor fijo de 2.1%
- **Fuente de datos:** Calculado desde el cronograma de cuotas

#### 3. Crecimiento Mensual
**Fórmula:** `((current_month_loans - previous_month_loans) / previous_month_loans) * 100`
- **Descripción:** Porcentaje de crecimiento en préstamos respecto al mes anterior
- **Nota:** Actualmente se muestra un valor fijo de +8.5%

## Informe de Situación Financiera

### Métricas Principales

#### 1. Total Préstamos
**Fórmula:** `COUNT(loans WHERE deleted_at IS NULL)`
- **Descripción:** Número total de préstamos (activos y finalizados)
- **Fuente de datos:** Tabla `loans`
- **Filtros:** Solo préstamos no eliminados

#### 2. Monto Total Préstamos
**Fórmula:** `SUM(loans.amount WHERE deleted_at IS NULL)`
- **Descripción:** Suma total de todos los préstamos desembolsados
- **Fuente de datos:** Tabla `loans`, campo `amount`
- **Filtros:** Solo préstamos no eliminados

#### 3. Total Clientes
**Fórmula:** `COUNT(clients WHERE deleted_at IS NULL)`
- **Descripción:** Número total de clientes registrados
- **Fuente de datos:** Tabla `clients`
- **Filtros:** Solo clientes no eliminados

#### 4. Balance Neto
**Fórmula:** `totalIncome - totalExpenses`
- **Componentes:**
  - `totalIncome`: Suma total de todos los recibos históricos
  - `totalExpenses`: Suma total de todas las transacciones de egreso
- **Descripción:** Diferencia total entre ingresos y egresos históricos

### Préstamos por Tipo

#### Distribución por Categoría
**Fórmula:** `GROUP BY loan_type, COUNT(*) as count, SUM(amount) as amount`
- **Descripción:** Agrupa préstamos por tipo y calcula cantidad y monto total
- **Fuente de datos:** Tabla `loans`, campos `loan_type` y `amount`
- **Resultado:** Objeto con conteo y monto por cada tipo de préstamo

### Tendencia de Transacciones

#### Datos Mensuales Simulados
**Fórmula:** Distribución proporcional de totales anuales
- **Enero:** 10% del total anual
- **Febrero:** 15% del total anual
- **Marzo:** 18% del total anual
- **Abril:** 22% del total anual
- **Mayo:** 25% del total anual
- **Junio:** 30% del total anual

**Nota:** Esta es una simulación para efectos de visualización. En producción debería calcularse con datos reales mensuales.

## Notas Importantes

### Actualización de Datos
- **Frecuencia:** Los datos se actualizan automáticamente cada 5 minutos
- **Método:** Llamadas a APIs que consultan directamente la base de datos
- **Caché:** No se implementa caché para asegurar datos en tiempo real

### Manejo de Errores
- **Valores por defecto:** 0 cuando no hay datos disponibles
- **Errores de API:** Se muestran mensajes descriptivos al usuario
- **Logs:** Todos los errores se registran en la consola para debugging

### Consideraciones de Rendimiento
- **Consultas optimizadas:** Se utilizan índices en campos de fecha y estado
- **Agregaciones:** Los cálculos se realizan en la base de datos, no en el frontend
- **Paginación:** No aplicable para métricas agregadas

### Precisión de Datos
- **Decimales:** Los montos se muestran con 2 decimales de precisión
- **Redondeo:** Los porcentajes se redondean a 1 decimal
- **Formato:** Se utiliza separador de miles para mejor legibilidad
