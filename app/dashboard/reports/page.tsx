"use client"

import { CardDescription } from "@/components/ui/card"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Handshake, CreditCard, TrendingUp, TrendingDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Definición de tipos para las métricas (usaremos datos mock por ahora)
interface ReportMetrics {
  totalLoans: number
  totalLoanAmount: number
  totalClients: number
  totalPartners: number
  totalPartnerCapital: number
  totalIncome: number
  totalExpenses: number
  netBalance: number
}

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Simular la carga de datos
    const fetchReportData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Aquí iría la lógica real para obtener datos de tu API
        // Por ahora, usamos datos mock
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simular retardo de red

        const mockData: ReportMetrics = {
          totalLoans: 125,
          totalLoanAmount: 150000.75,
          totalClients: 80,
          totalPartners: 15,
          totalPartnerCapital: 250000.0,
          totalIncome: 75000.5,
          totalExpenses: 20000.25,
          netBalance: 55000.25,
        }
        setMetrics(mockData)
      } catch (err: any) {
        console.error("Error al cargar informes:", err.message)
        setError("Error al cargar informes: " + err.message)
        toast({
          title: "Error",
          description: `No se pudieron cargar los informes: ${err.message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <p>Cargando informes y estadísticas...</p>
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
    <div className="p-4 space-y-6">
      <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-50">Informes y Estadísticas</CardTitle>
          <CardDescription className="text-gray-400">
            Resumen de las métricas clave de tu negocio de microcréditos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics && (
            <>
              <Card className="bg-gray-700 border border-gray-600 text-gray-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Préstamos</CardTitle>
                  <CreditCard className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-50">{metrics.totalLoans}</div>
                  <p className="text-xs text-gray-400">Préstamos activos y finalizados</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border border-gray-600 text-gray-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Monto Total Préstamos</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-50">${metrics.totalLoanAmount.toLocaleString()}</div>
                  <p className="text-xs text-gray-400">Monto total desembolsado</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border border-gray-600 text-gray-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Clientes</CardTitle>
                  <Users className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-50">{metrics.totalClients}</div>
                  <p className="text-xs text-gray-400">Clientes registrados</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border border-gray-600 text-gray-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Socios</CardTitle>
                  <Handshake className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-50">{metrics.totalPartners}</div>
                  <p className="text-xs text-gray-400">Socios activos</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border border-gray-600 text-gray-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Capital de Socios</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-50">${metrics.totalPartnerCapital.toLocaleString()}</div>
                  <p className="text-xs text-gray-400">Capital total aportado por socios</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border border-gray-600 text-gray-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Ingresos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">${metrics.totalIncome.toLocaleString()}</div>
                  <p className="text-xs text-gray-400">Ingresos totales registrados</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border border-gray-600 text-gray-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Egresos</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">${metrics.totalExpenses.toLocaleString()}</div>
                  <p className="text-xs text-gray-400">Egresos totales registrados</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border border-gray-600 text-gray-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Balance Neto</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-50">${metrics.netBalance.toLocaleString()}</div>
                  <p className="text-xs text-gray-400">Ingresos - Egresos</p>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-50">Gráfico de Préstamos por Tipo</CardTitle>
            <CardDescription className="text-gray-400">Distribución de préstamos por categoría.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
              [Placeholder para Gráfico de Barras/Circular]
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-50">Tendencia de Transacciones</CardTitle>
            <CardDescription className="text-gray-400">Ingresos y egresos a lo largo del tiempo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
              [Placeholder para Gráfico de Líneas]
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
