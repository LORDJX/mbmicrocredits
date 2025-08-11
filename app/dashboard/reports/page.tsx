"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { DollarSign, Users, Handshake, CreditCard, TrendingUp, TrendingDown, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

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
    const fetchReportData = async () => {
      setLoading(true)
      setError(null)
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))
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
  }, [toast])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-700">
        <p>Cargando informes y estadísticas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-red-600">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estilos de impresión para esta página */}
      <style>{`
        @media print {
          header, nav, button, .no-print { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          body { background: #ffffff !important; color: #111827 !important; }
          .card { border: 1px solid #E5E7EB !important; }
        }
      `}</style>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informe de situación Financiera</h1>
          <p className="text-gray-500">Resumen de las métricas clave de tu negocio de microcréditos.</p>
        </div>
        <Button onClick={handlePrint} className="no-print bg-gray-700 text-gray-50 hover:bg-gray-800">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir PDF
        </Button>
      </div>

      <Card className="card bg-white text-gray-900 border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Resumen</CardTitle>
          <CardDescription className="text-gray-500">Indicadores principales</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {metrics && (
            <>
              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Préstamos</CardTitle>
                  <CreditCard className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalLoans}</div>
                  <p className="text-xs text-gray-500">Préstamos activos y finalizados</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Monto Total Préstamos</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">${metrics.totalLoanAmount.toLocaleString()}</div>
                  <p className="text-xs text-gray-500">Monto total desembolsado</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Clientes</CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalClients}</div>
                  <p className="text-xs text-gray-500">Clientes registrados</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Socios</CardTitle>
                  <Handshake className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalPartners}</div>
                  <p className="text-xs text-gray-500">Socios activos</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Capital de Socios</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    ${metrics.totalPartnerCapital.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500">Capital total aportado por socios</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Ingresos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">${metrics.totalIncome.toLocaleString()}</div>
                  <p className="text-xs text-gray-500">Ingresos totales registrados</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Egresos</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">${metrics.totalExpenses.toLocaleString()}</div>
                  <p className="text-xs text-gray-500">Egresos totales registrados</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Balance Neto</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">${metrics.netBalance.toLocaleString()}</div>
                  <p className="text-xs text-gray-500">Ingresos - Egresos</p>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-white text-gray-900 border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Préstamos por Tipo</CardTitle>
            <CardDescription className="text-gray-500">Distribución por categoría.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 rounded-md border border-dashed border-gray-300 bg-gray-50/80 text-gray-500 flex items-center justify-center">
              {"[Gráfico de Barras/Circular]"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white text-gray-900 border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tendencia de Transacciones</CardTitle>
            <CardDescription className="text-gray-500">Ingresos y egresos en el tiempo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 rounded-md border border-dashed border-gray-300 bg-gray-50/80 text-gray-500 flex items-center justify-center">
              {"[Gráfico de Líneas]"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
