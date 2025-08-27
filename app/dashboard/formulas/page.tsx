import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function FormulasPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fórmulas de Cálculo</h1>
          <p className="text-muted-foreground">
            Documentación detallada de todas las fórmulas utilizadas en los indicadores financieros
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Versión 1.0
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* Resumen para Socios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Resumen para Socios</CardTitle>
            <CardDescription>Indicadores clave para el seguimiento del negocio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-2">Total de Préstamos Activos</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> COUNT(loans WHERE status = 'activo')
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Cuenta todos los préstamos que tienen estado "activo" en la tabla loans.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-blue-600 mb-2">Monto Total de Préstamos Activos</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> SUM(loans.amount WHERE status = 'activo')
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Suma el monto de todos los préstamos activos.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-purple-600 mb-2">Total de Clientes Activos</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> COUNT(clients WHERE status = 'activo')
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Cuenta todos los clientes que tienen estado "activo".
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-orange-600 mb-2">Total de Socios</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> COUNT(partners WHERE deleted_at IS NULL)
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Cuenta todos los socios que no han sido eliminados.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-cyan-600 mb-2">Ingresos Mensuales</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> SUM(receipts.total_amount WHERE created_at BETWEEN primer_día_mes AND
                  último_día_mes)
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Suma todos los recibos generados en el mes actual.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-red-600 mb-2">Gastos Mensuales</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> Valor fijo: $4,200 (temporal)
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Actualmente es un valor fijo. En el futuro se obtendrá de una tabla de
                  gastos.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-indigo-600 mb-2">Margen de Ganancia</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> ((ingresos_mensuales - gastos_mensuales) / ingresos_mensuales) × 100
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Calcula el porcentaje de ganancia sobre los ingresos mensuales.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-pink-600 mb-2">Promedio de Préstamo</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> monto_total_préstamos_activos / total_préstamos_activos
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Calcula el monto promedio de los préstamos activos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Informe de Situación Financiera */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Informe de Situación Financiera</CardTitle>
            <CardDescription>Métricas financieras detalladas y análisis de rendimiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-2">Ingresos Totales</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> SUM(receipts.total_amount)
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Suma de todos los recibos generados en el sistema.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-red-600 mb-2">Gastos Totales</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> SUM(transactions.amount WHERE type = 'gasto')
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Suma de todas las transacciones marcadas como gastos.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-blue-600 mb-2">Balance Neto</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> ingresos_totales - gastos_totales
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Diferencia entre ingresos y gastos totales.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-yellow-600 mb-2">Tasa de Morosidad</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> (préstamos_vencidos / total_préstamos_activos) × 100
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Porcentaje de préstamos que han superado su fecha de vencimiento.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-purple-600 mb-2">Crecimiento Mensual</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> ((ingresos_mes_actual - ingresos_mes_anterior) / ingresos_mes_anterior) ×
                  100
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Porcentaje de crecimiento de ingresos comparado con el mes anterior.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-cyan-600 mb-2">Tasa de Ocupación</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Fórmula:</strong> (préstamos_activos / capacidad_máxima_préstamos) × 100
                </p>
                <p className="text-sm">
                  <strong>Descripción:</strong> Porcentaje de utilización de la capacidad de préstamos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Notas Importantes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-amber-600">Notas Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-2">Estado Actual de los Datos</h4>
              <p className="text-sm text-amber-700">
                Si los indicadores no muestran cero después de la limpieza, significa que aún existen datos en las
                tablas de la base de datos. Ejecute el script de limpieza para eliminar todos los registros.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Actualización de Datos</h4>
              <p className="text-sm text-blue-700">
                Los datos se actualizan automáticamente cada 5 minutos para reflejar los cambios más recientes en la
                base de datos.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Transparencia</h4>
              <p className="text-sm text-green-700">
                Todas las fórmulas están basadas en datos reales de la base de datos y se calculan en tiempo real para
                garantizar la precisión.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
