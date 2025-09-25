"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Users,
  CreditCard,
  DollarSign,
  Calendar,
  Activity,
  ArrowUpRight,
} from "lucide-react"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [diagnostics, setDiagnostics] = useState({
    authStatus: "checking",
    permissionsStatus: "checking",
    sessionStatus: "checking",
  })
  const [stats, setStats] = useState({
    totalClients: 0,
    activeLoans: 0,
    totalAmount: 0,
    overduePayments: 0,
    paymentsToday: 0,
    collectionRate: 0,
  })

  useEffect(() => {
    const runDiagnostics = async () => {
      console.log("[v0] Iniciando diagnóstico completo del dashboard")

      try {
        setDiagnostics((prev) => ({ ...prev, authStatus: "checking" }))
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          console.log("[v0] Error de autenticación:", authError)
          setDiagnostics((prev) => ({ ...prev, authStatus: "error" }))
          return
        }

        if (!user) {
          console.log("[v0] No hay usuario autenticado")
          setDiagnostics((prev) => ({ ...prev, authStatus: "no-user" }))
          return
        }

        console.log("[v0] Usuario autenticado:", user.id)
        setUser(user)
        setDiagnostics((prev) => ({ ...prev, authStatus: "success" }))

        setDiagnostics((prev) => ({ ...prev, sessionStatus: "checking" }))
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session) {
          console.log("[v0] Error de sesión:", sessionError)
          setDiagnostics((prev) => ({ ...prev, sessionStatus: "error" }))
        } else {
          console.log("[v0] Sesión válida")
          setDiagnostics((prev) => ({ ...prev, sessionStatus: "success" }))
        }

        setDiagnostics((prev) => ({ ...prev, permissionsStatus: "checking" }))
        try {
          const response = await fetch(`/api/users/permissions?userId=${user.id}`)
          if (response.ok) {
            console.log("[v0] API de permisos funcionando correctamente")
            setDiagnostics((prev) => ({ ...prev, permissionsStatus: "success" }))
          } else {
            console.log("[v0] Error en API de permisos:", response.status)
            setDiagnostics((prev) => ({ ...prev, permissionsStatus: "error" }))
          }
        } catch (permError) {
          console.log("[v0] Error al verificar permisos:", permError)
          setDiagnostics((prev) => ({ ...prev, permissionsStatus: "error" }))
        }

        await loadDashboardStats()
      } catch (error) {
        console.log("[v0] Error general en diagnóstico:", error)
        setDiagnostics((prev) => ({
          ...prev,
          authStatus: "error",
          sessionStatus: "error",
          permissionsStatus: "error",
        }))
      } finally {
        setLoading(false)
      }
    }

    const loadDashboardStats = async () => {
      try {
        // Simular carga de estadísticas (en producción vendría de APIs)
        setStats({
          totalClients: 156,
          activeLoans: 89,
          totalAmount: 2450000,
          overduePayments: 12,
          paymentsToday: 8,
          collectionRate: 94.2,
        })
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
      }
    }

    runDiagnostics()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[v0] Cambio de estado de auth:", event)
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "error":
      case "no-user":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "Funcionando correctamente"
      case "error":
        return "Error detectado"
      case "no-user":
        return "Usuario no autenticado"
      case "checking":
        return "Verificando..."
      default:
        return "Estado desconocido"
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Ejecutando diagnóstico del dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-8 h-full w-full animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard de Microcréditos</h1>
        {user && (
          <p className="text-muted-foreground">
            Bienvenido de vuelta, <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card className="card-modern hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalClients}</div>
            <div className="flex items-center text-xs text-green-400 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12% este mes
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Préstamos Activos</CardTitle>
            <CreditCard className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeLoans}</div>
            <div className="flex items-center text-xs text-green-400 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8% este mes
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${stats.totalAmount.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-400 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +15% este mes
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.overduePayments}</div>
            <div className="flex items-center text-xs text-red-400 mt-1">Requieren atención</div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.paymentsToday}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">Vencen hoy</div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Cobro</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.collectionRate}%</div>
            <div className="flex items-center text-xs text-green-400 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +2.1% este mes
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5 text-primary" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Alert className="bg-card/50 border-border/50">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnostics.authStatus)}
                <div>
                  <h4 className="font-semibold text-foreground">Autenticación</h4>
                  <AlertDescription className="text-sm text-muted-foreground">
                    {getStatusText(diagnostics.authStatus)}
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            <Alert className="bg-card/50 border-border/50">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnostics.sessionStatus)}
                <div>
                  <h4 className="font-semibold text-foreground">Sesión</h4>
                  <AlertDescription className="text-sm text-muted-foreground">
                    {getStatusText(diagnostics.sessionStatus)}
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            <Alert className="bg-card/50 border-border/50">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnostics.permissionsStatus)}
                <div>
                  <h4 className="font-semibold text-foreground">API Permisos</h4>
                  <AlertDescription className="text-sm text-muted-foreground">
                    {getStatusText(diagnostics.permissionsStatus)}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center gap-2 hover-glow bg-transparent" variant="outline">
              <Users className="h-6 w-6 text-primary" />
              <span className="font-medium">Nuevo Cliente</span>
              <span className="text-xs text-muted-foreground">Registrar cliente</span>
            </Button>

            <Button className="h-auto p-4 flex flex-col items-center gap-2 hover-glow bg-transparent" variant="outline">
              <CreditCard className="h-6 w-6 text-primary" />
              <span className="font-medium">Nuevo Préstamo</span>
              <span className="text-xs text-muted-foreground">Crear préstamo</span>
            </Button>

            <Button className="h-auto p-4 flex flex-col items-center gap-2 hover-glow bg-transparent" variant="outline">
              <DollarSign className="h-6 w-6 text-primary" />
              <span className="font-medium">Registrar Pago</span>
              <span className="text-xs text-muted-foreground">Procesar pago</span>
            </Button>

            <Button className="h-auto p-4 flex flex-col items-center gap-2 hover-glow bg-transparent" variant="outline">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="font-medium">Ver Cronograma</span>
              <span className="text-xs text-muted-foreground">Pagos programados</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {Object.values(diagnostics).every((status) => status === "success") && (
        <Alert className="bg-green-500/10 border-green-500/20 animate-slide-in">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-400">
            <strong>Sistema Operativo:</strong> Todos los componentes funcionan correctamente. El dashboard se ha
            cargado exitosamente.
          </AlertDescription>
        </Alert>
      )}

      {Object.values(diagnostics).some((status) => status === "error" || status === "no-user") && (
        <Alert className="bg-red-500/10 border-red-500/20 animate-slide-in">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">
            <strong>Problemas Detectados:</strong> Se encontraron problemas en el sistema. Revisa el panel de
            diagnóstico arriba.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
