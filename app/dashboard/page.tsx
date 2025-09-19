"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, CreditCard, Calendar, Receipt, AlertCircle, DollarSign, Activity } from "lucide-react"
import Link from "next/link"

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
  const router = useRouter()

  useEffect(() => {
    const checkUser = () => {
      try {
        const session = localStorage.getItem("mb_session")
        if (session) {
          const sessionData = JSON.parse(session)
          if (sessionData.user && sessionData.expires > Date.now()) {
            setUser(sessionData.user)
            loadDashboardStats()
          } else {
            router.push("/login")
          }
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
        const [clientsRes, loansRes, cronogramRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/loans"),
          fetch("/api/cronograma"),
        ])

        const clients = clientsRes.ok ? await clientsRes.json() : []
        const loans = loansRes.ok ? await loansRes.json() : []
        const cronogram = cronogramRes.ok ? await cronogramRes.json() : {}

        setStats({
          totalClients: clients.length || 0,
          activeLoans: loans.filter((l: any) => l.status === "activo").length || 0,
          todayPayments: cronogram.today?.length || 0,
          overduePayments: cronogram.overdue?.length || 0,
          totalDueToday: cronogram.summary?.total_due_today || 0,
          totalReceivedToday: cronogram.summary?.total_received_today || 0,
          totalOverdue: cronogram.summary?.total_overdue || 0,
          monthlyTotal: cronogram.summary?.total_due_month || 0,
        })
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
      }
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <PageLayout title="Dashboard Principal">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border">
          <h1 className="text-2xl font-bold mb-2">¡Bienvenido de vuelta!</h1>
          <p className="text-muted-foreground mb-4">Conectado como {user.email}</p>
          <p className="text-sm text-muted-foreground">
            Tu panel de gestión de microcréditos está listo. Puedes comenzar a administrar préstamos, clientes y
            operaciones financieras.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="text-2xl font-bold">{stats?.todayPayments || 0}</div>
              <p className="text-xs text-muted-foreground">Vencen hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Vencidos</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.overduePayments || 0}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card>
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
                <p className="text-xl font-bold text-blue-600">${(stats?.totalDueToday || 0).toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Recibido Hoy</p>
                <p className="text-xl font-bold text-green-600">${(stats?.totalReceivedToday || 0).toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Monto Vencido</p>
                <p className="text-xl font-bold text-red-600">${(stats?.totalOverdue || 0).toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Total del Mes</p>
                <p className="text-xl font-bold">${(stats?.monthlyTotal || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
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
    </PageLayout>
  )
}
