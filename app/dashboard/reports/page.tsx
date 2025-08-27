"use client"

import { CardDescription } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AppHeader } from "@/components/app-header"
import { MetricWithFormula } from "@/components/metric-with-formula"
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
  loansByType: any
}

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
        console.log("[v0] Cargando datos reales de informes financieros")

        const response = await fetch("/api/reports")
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[v0] Datos de informes recibidos:", data)
        setMetrics(data)
      } catch (err: any) {
        console.error("[v0] Error al cargar informes:", err.message)
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

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("[v0] Actualizando datos de informes automáticamente")
      fetchReportData()
    }, 300000) // Actualizar cada 5 minutos

    return () => clearInterval(interval)
  }, [])

  const fetchReportData = async () => {
    try {
      const response = await fetch("/api/reports")
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (err) {
      console.error("[v0] Error en actualización automática:", err)
    }
  }

  const loanTypeData = metrics?.loansByType
    ? Object.entries(metrics.loansByType).map(([name, data]: [string, any]) => ({
        name,
        value: data.count,
        amount: data.amount,
      }))
    : []

  const transactionTrendData = [
    { month: "Ene", ingresos: 0, egresos: 0 },
    { month: "Feb", ingresos: 0, egresos: 0 },
    { month: "Mar", ingresos: 0, egresos: 0 },
    { month: "Abr", ingresos: 0, egresos: 0 },
    { month: "May", ingresos: 0, egresos: 0 },
    { month: "Jun", ingresos: metrics?.totalIncome || 0, egresos: metrics?.totalExpenses || 0 },
  ]

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
              Resumen de las métricas clave con fórmulas transparentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics && (
              <>
                <MetricWithFormula
                  title="Total Préstamos"
                  value={metrics.totalLoans}
                  description="Préstamos activos y finalizados"
                  formula="COUNT(loans WHERE deleted_at IS NULL)"
                  calculation={`Conteo de todos los préstamos no eliminados = ${metrics.totalLoans}`}
                  icon={<CreditCard className="h-4 w-4 text-gray-400" />}
                />

                <MetricWithFormula
                  title="Monto Total Préstamos"
                  value={`$${metrics.totalLoanAmount.toLocaleString()}`}
                  description="Monto total desembolsado"
                  formula="SUM(loans.amount WHERE deleted_at IS NULL)"
                  calculation={`Suma de todos los montos de préstamos = $${metrics.totalLoanAmount.toLocaleString()}`}
                  icon={<DollarSign className="h-4 w-4 text-gray-400" />}
                />

                <MetricWithFormula
                  title="Total Clientes"
                  value={metrics.totalClients}
                  description="Clientes registrados"
                  formula="COUNT(clients WHERE deleted_at IS NULL)"
                  calculation={`Conteo de todos los clientes activos = ${metrics.totalClients}`}
                  icon={<Users className="h-4 w-4 text-gray-400" />}
                />

                <MetricWithFormula
                  title="Balance Neto"
                  value={`$${metrics.netBalance.toLocaleString()}`}
                  description="Ingresos - Egresos"
                  formula="SUM(receipts.amount) - SUM(transactions.amount WHERE type='expense')"
                  calculation={`${metrics.totalIncome.toLocaleString()} - ${metrics.totalExpenses.toLocaleString()} = $${metrics.netBalance.toLocaleString()}`}
                  icon={<DollarSign className="h-4 w-4 text-gray-400" />}
                  colorClass={metrics.netBalance >= 0 ? "text-green-400" : "text-red-400"}
                />
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
