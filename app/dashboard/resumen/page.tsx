"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, CreditCard, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AppHeader } from "@/components/app-header"
import { MetricWithFormula } from "@/components/metric-with-formula"

interface SummaryMetrics {
  totalActiveLoans: number
  totalActiveLoanAmount: number
  totalClients: number
  totalPartners: number
  monthlyIncome: number
  monthlyExpenses: number
  profitMargin: number
  averageLoanAmount: number
}

export default function ResumenPage() {
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handlePrint = () => {
    window.print()
  }

  useEffect(() => {
    const fetchSummaryData = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log("[v0] Cargando datos reales de resumen para socios")

        const response = await fetch("/api/summary")
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[v0] Datos de resumen recibidos:", data)
        setMetrics(data)
      } catch (err: any) {
        console.error("[v0] Error al cargar resumen:", err.message)
        setError("Error al cargar resumen: " + err.message)
        toast({
          title: "Error",
          description: `No se pudo cargar el resumen: ${err.message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSummaryData()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("[v0] Actualizando datos de resumen automáticamente")
      fetchSummaryData()
    }, 300000) // Actualizar cada 5 minutos

    return () => clearInterval(interval)
  }, [])

  const fetchSummaryData = async () => {
    try {
      const response = await fetch("/api/summary")
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (err) {
      console.error("[v0] Error en actualización automática:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <p>Cargando resumen para socios...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-400">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AppHeader title="Resumen para Socios" showPrintButton={true} onPrint={handlePrint} />

      <div className="p-4 space-y-6">
        {/* Métricas principales en formato simple */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics && (
            <>
              <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Préstamos Activos</CardTitle>
                  <CreditCard className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-50">{metrics.totalActiveLoans}</div>
                  <p className="text-xs text-gray-400">Préstamos en curso</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Capital en Circulación</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-50">
                    ${metrics.totalActiveLoanAmount.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-400">Monto total prestado</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Clientes Activos</CardTitle>
                  <Users className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-50">{metrics.totalClients}</div>
                  <p className="text-xs text-gray-400">Base de clientes</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Margen de Ganancia</CardTitle>
                  <TrendingUp className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-50">{metrics.profitMargin.toFixed(1)}%</div>
                  <p className="text-xs text-gray-400">Rentabilidad mensual</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Resumen financiero simplificado */}
        <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-50">Resumen Financiero Mensual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-lg font-semibold text-green-400">Ingresos</div>
                  <div className="text-2xl font-bold text-gray-50">${metrics.monthlyIncome.toLocaleString()}</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-lg font-semibold text-red-400">Gastos</div>
                  <div className="text-2xl font-bold text-gray-50">${metrics.monthlyExpenses.toLocaleString()}</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="text-lg font-semibold text-blue-400">Ganancia Neta</div>
                  <div className="text-2xl font-bold text-gray-50">
                    ${(metrics.monthlyIncome - metrics.monthlyExpenses).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información adicional para socios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-50">Información de Socios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total de Socios:</span>
                    <span className="font-semibold text-gray-50">{metrics.totalPartners}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Promedio por Préstamo:</span>
                    <span className="font-semibold text-gray-50">${metrics.averageLoanAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Clientes por Socio:</span>
                    <span className="font-semibold text-gray-50">
                      {metrics.totalPartners > 0 ? Math.round(metrics.totalClients / metrics.totalPartners) : 0}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-50">Indicadores Clave</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics && (
                <>
                  <MetricWithFormula
                    title="Tasa de Ocupación"
                    value={
                      metrics.totalActiveLoans > 0 ? (metrics.totalActiveLoans / (metrics.totalClients || 1)) * 100 : 0
                    }
                    description="Préstamos activos vs clientes"
                    formula="(Préstamos Activos / Total Clientes) × 100"
                    calculation={`(${metrics.totalActiveLoans} / ${metrics.totalClients || 1}) × 100 = ${metrics.totalActiveLoans > 0 ? ((metrics.totalActiveLoans / (metrics.totalClients || 1)) * 100).toFixed(1) : 0}%`}
                    colorClass="text-green-400"
                    isPercentage={true}
                  />

                  <MetricWithFormula
                    title="Morosidad"
                    value={0} // Calculado dinámicamente cuando haya datos de cuotas vencidas
                    description="Cuotas vencidas vs total"
                    formula="(Cuotas Vencidas / Total Cuotas) × 100"
                    calculation="(0 / 0) × 100 = 0% (Sin datos de cuotas vencidas)"
                    colorClass="text-yellow-400"
                    isPercentage={true}
                  />

                  <MetricWithFormula
                    title="Crecimiento Mensual"
                    value={metrics.profitMargin}
                    description="Margen de ganancia mensual"
                    formula="((Ingresos - Gastos) / Ingresos) × 100"
                    calculation={`((${metrics.monthlyIncome} - ${metrics.monthlyExpenses}) / ${metrics.monthlyIncome || 1}) × 100 = ${metrics.profitMargin.toFixed(1)}%`}
                    colorClass="text-blue-400"
                    isPercentage={true}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .bg-gray-800, .bg-gray-700, .bg-gray-900 {
            background: white !important;
            color: black !important;
          }
          .text-gray-50, .text-gray-100, .text-gray-300 {
            color: black !important;
          }
          .border-gray-700, .border-gray-600 {
            border-color: #ccc !important;
          }
        }
      `}</style>
    </div>
  )
}
