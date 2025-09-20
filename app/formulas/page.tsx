"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calculator, TrendingUp, DollarSign, Users, AlertTriangle, BarChart3 } from "lucide-react"

export default function FormulasPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Documentación de Fórmulas Financieras</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Guía completa de todas las fórmulas y cálculos utilizados en el sistema de microcréditos
        </p>
      </div>

      {/* Resumen para Socios */}
      <Card className="border-2">
        <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Resumen para Socios
          </CardTitle>
          <CardDescription>Indicadores clave para el seguimiento del negocio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Métricas Principales
            </h3>

            <div className="grid gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-400">Total de Préstamos Activos</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">Fórmula:</Badge> COUNT(loans WHERE status = 'activo')
                </p>
                <p className="text-sm mt-2">Cuenta todos los préstamos con estado activo en la base de datos.</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-400">Monto Total de Préstamos Activos</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">Fórmula:</Badge> SUM(loans.amount WHERE status = 'activo')
                </p>
                <p className="text-sm mt-2">Suma el monto de todos los préstamos activos.</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-blue-700 dark:text-blue-400">Total de Clientes Activos</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">Fórmula:</Badge> COUNT(clients WHERE status = 'activo')
                </p>
                <p className="text-sm mt-2">Cuenta todos los clientes con estado activo.</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-purple-700 dark:text-purple-400">Ingresos Mensuales</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">Fórmula:</Badge> SUM(receipts.total_amount WHERE created_at BETWEEN
                  primer_día_mes AND último_día_mes)
                </p>
                <p className="text-sm mt-2">Suma todos los recibos generados en el mes actual.</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-orange-700 dark:text-orange-400">Margen de Ganancia</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">Fórmula:</Badge> ((ingresos_mensuales - gastos_mensuales) /
                  ingresos_mensuales) × 100
                </p>
                <p className="text-sm mt-2">Porcentaje de ganancia sobre los ingresos mensuales.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informe de Situación Financiera */}
      <Card className="border-2">
        <CardHeader className="bg-green-50 dark:bg-green-950/20">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-green-600" />
            Informe de Situación Financiera
          </CardTitle>
          <CardDescription>Análisis detallado de la situación financiera del negocio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Indicadores Financieros
            </h3>

            <div className="grid gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-400">Balance Neto</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">Fórmula:</Badge> total_ingresos - total_gastos
                </p>
                <p className="text-sm mt-2">
                  <strong>Ingresos:</strong> SUM(receipts.total_amount)
                  <br />
                  <strong>Gastos:</strong> Valor fijo configurado (actualmente $20,000.25)
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-red-700 dark:text-red-400">Tasa de Morosidad</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">Fórmula:</Badge> (préstamos_vencidos / total_préstamos_activos) × 100
                </p>
                <p className="text-sm mt-2">
                  Porcentaje de préstamos que han superado su fecha de vencimiento sin pago completo.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-blue-700 dark:text-blue-400">Tasa de Ocupación</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">Fórmula:</Badge> (préstamos_activos / capacidad_máxima_préstamos) × 100
                </p>
                <p className="text-sm mt-2">Porcentaje de utilización de la capacidad de préstamos del negocio.</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-purple-700 dark:text-purple-400">Crecimiento Mensual</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">Fórmula:</Badge> ((ingresos_mes_actual - ingresos_mes_anterior) /
                  ingresos_mes_anterior) × 100
                </p>
                <p className="text-sm mt-2">Porcentaje de crecimiento de ingresos comparado con el mes anterior.</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-orange-700 dark:text-orange-400">Capital de Socios</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">Fórmula:</Badge> SUM(partners.capital WHERE deleted_at IS NULL)
                </p>
                <p className="text-sm mt-2">Suma total del capital aportado por todos los socios activos.</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Análisis por Tipo de Préstamo
            </h3>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-indigo-700 dark:text-indigo-400">Distribución por Tipo</h4>
              <p className="text-sm text-muted-foreground mt-1">
                <Badge variant="outline">Fórmula:</Badge> GROUP BY loan_type: COUNT(*) y SUM(amount)
              </p>
              <p className="text-sm mt-2">
                Agrupa los préstamos por tipo (Semanal, Quincenal, Mensual) y calcula:
                <br />• Cantidad de préstamos por tipo
                <br />• Monto total por tipo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consideraciones Importantes */}
      <Card className="border-2 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="bg-yellow-50 dark:bg-yellow-950/20">
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-6 w-6" />
            Consideraciones Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/10 rounded-lg">
              <h4 className="font-semibold">Actualización de Datos</h4>
              <p className="text-sm">
                Los datos se actualizan automáticamente cada 5 minutos para reflejar cambios en tiempo real.
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/10 rounded-lg">
              <h4 className="font-semibold">Filtros de Fecha</h4>
              <p className="text-sm">
                Los cálculos mensuales utilizan el primer y último día del mes actual en la zona horaria del sistema.
              </p>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-950/10 rounded-lg">
              <h4 className="font-semibold">Estados Válidos</h4>
              <p className="text-sm">
                Solo se consideran registros con estado 'activo' o que no tengan fecha de eliminación (deleted_at IS
                NULL).
              </p>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/10 rounded-lg">
              <h4 className="font-semibold">Valores por Defecto</h4>
              <p className="text-sm">
                Los gastos utilizan valores fijos configurados que deben actualizarse según los gastos reales del
                negocio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
