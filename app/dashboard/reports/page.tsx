"use client"

import { CardDescription } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AppHeader } from "@/components/app-header"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

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

const loanTypeData = [
  { name: "Semanal", value: 45, amount: 67500 },
  { name: "Quincenal", value: 35, amount: 52500 },
  { name: "Mensual", value: 45, amount: 30000 },
]

const transactionTrendData = [
  { month: "Ene", ingresos: 12000, egresos: 3000 },
  { month: "Feb", ingresos: 15000, egresos: 4000 },
  { month: "Mar", ingresos: 18000, egresos: 3500 },
  { month: "Abr", ingresos: 22000, egresos: 5000 },
  { month: "May", ingresos: 25000, egresos: 4500 },
  { month: "Jun", ingresos: 28000, egresos: 6000 },
]

const COLORS = ["#8884d8", "#82ca9d", "#ffc658"]

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handlePrint = () => {
    window.print()
  }

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true)
      setError(null)
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

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
    <div className="min-h-screen bg-gray-900">
      <AppHeader title="Informe de situación Financiera" showPrintButton={true} onPrint={handlePrint} />

      <div className="p-4 space-y-6">
        <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-50">Métricas Principales</CardTitle>
            <CardDescription className="text-gray-400">
              Resumen de las métricas clave de tu negocio de microcréditos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <CardTitle className="text-xl font-bold text-gray-50">Préstamos por Tipo</CardTitle>
              <CardDescription className="text-gray-400">Distribución de préstamos por categoría.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={loanTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {loanTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-50">Tendencia de Transacciones</CardTitle>
              <CardDescription className="text-gray-400">Ingresos y egresos a lo largo del tiempo.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={transactionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#374151",
                      border: "1px solid #6B7280",
                      borderRadius: "6px",
                    }}
                  />
                  <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="egresos" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
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
