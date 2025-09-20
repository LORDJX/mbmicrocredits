"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, CreditCard, Calendar, Receipt, AlertCircle, DollarSign, Activity } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/auth-service"

interface DashboardStats {
  totalClients: number
  activeLoans: number
  todayPayments: number
  overduePayments: number
  totalDueToday: number
  totalReceivedToday: number
  totalOverdue: number
  monthlyTotal: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [cronogramData, setCronogramData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = () => {
      try {
        const currentUser = authService.getCurrentUser()
        if (currentUser && authService.isAuthenticated()) {
          setUser(currentUser)
          loadDashboardStats()
          loadCronogramData()
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Error checking user:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    const loadDashboardStats = async () => {
      try {
        const [clientsRes, loansRes] = await Promise.all([fetch("/api/clients"), fetch("/api/loans")])

        const clients = clientsRes.ok ? await clientsRes.json() : []
        const loans = loansRes.ok ? await loansRes.json() : []

        setStats({
          totalClients: clients.length || 0,
          activeLoans: loans.filter((l: any) => l.status === "activo").length || 0,
          todayPayments: 0,
          overduePayments: 0,
          totalDueToday: 0,
          totalReceivedToday: 0,
          totalOverdue: 0,
          monthlyTotal: 0,
        })
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
      }
    }

    const loadCronogramData = async () => {
      try {
        const response = await fetch("/api/cronograma")
        if (response.ok) {
          const data = await response.json()
          setCronogramData(data)
        }
      } catch (error) {
        console.error("Error loading cronogram data:", error)
      }
    }

    checkUser()
  }, [router])

  const handleLogout = async () => {
    await authService.logout()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">MB Microcredits Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome back!</h2>
            <p className="text-gray-600 mb-4">You are logged in as {user.email}</p>
            <p className="text-gray-600">
              Your microcredit management dashboard is ready. You can start managing your loans, clients, and financial
              operations.
            </p>
          </div>

          {cronogramData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Installments</h3>
                <p className="text-3xl font-bold text-blue-600">{cronogramData.today?.length || 0}</p>
                <p className="text-sm text-gray-500">Due today</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Overdue Payments</h3>
                <p className="text-3xl font-bold text-red-600">{cronogramData.overdue?.length || 0}</p>
                <p className="text-sm text-gray-500">Past due</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">This Month</h3>
                <p className="text-3xl font-bold text-green-600">{cronogramData.month?.length || 0}</p>
                <p className="text-sm text-gray-500">Total installments</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
                <p className="text-xs text-muted-foreground">Clientes registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeLoans || 0}</div>
                <p className="text-xs text-muted-foreground">En curso</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagos Hoy</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cronogramData?.today?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Vencen hoy</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagos Vencidos</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{cronogramData?.overdue?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Requieren atención</p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumen Financiero
              </CardTitle>
              <CardDescription>Estado financiero actual del día y mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Por Cobrar Hoy</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${(cronogramData?.summary?.total_due_today || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Recibido Hoy</p>
                  <p className="text-xl font-bold text-green-600">
                    ${(cronogramData?.summary?.total_received_today || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Monto Vencido</p>
                  <p className="text-xl font-bold text-red-600">
                    ${(cronogramData?.summary?.total_overdue || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total del Mes</p>
                  <p className="text-xl font-bold">
                    ${(cronogramData?.summary?.total_due_month || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>Accede rápidamente a las funciones principales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <Link href="/clientes">
                    <Users className="h-6 w-6" />
                    <span>Gestionar Clientes</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <Link href="/prestamos">
                    <CreditCard className="h-6 w-6" />
                    <span>Nuevo Préstamo</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <Link href="/cronogramas">
                    <Calendar className="h-6 w-6" />
                    <span>Ver Cronogramas</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <Link href="/dashboard/receipts">
                    <Receipt className="h-6 w-6" />
                    <span>Generar Recibos</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
