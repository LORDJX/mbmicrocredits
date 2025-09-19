import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, CreditCard, DollarSign, AlertTriangle, Calendar, CheckCircle, Clock } from "lucide-react"

async function getDashboardData() {
  const supabase = await createClient()

  // Get total clients
  const { data: clients, error: clientsError } = await supabase
    .from("active_clients")
    .select("id")
    .is("deleted_at", null)

  // Get total loans
  const { data: loans, error: loansError } = await supabase
    .from("active_loans")
    .select("id, amount, status")
    .is("deleted_at", null)

  // Get payment schedules for today
  const today = new Date().toISOString().split("T")[0]
  const { data: todayPayments, error: todayError } = await supabase
    .from("payment_schedules")
    .select("total_amount, status")
    .eq("due_date", today)

  // Get overdue payments
  const { data: overduePayments, error: overdueError } = await supabase
    .from("payment_schedules")
    .select("total_amount, status")
    .lt("due_date", today)
    .neq("status", "paid")

  return {
    totalClients: clients?.length || 0,
    totalLoans: loans?.length || 0,
    activeLoans: loans?.filter((loan) => loan.status === "active").length || 0,
    totalLoanAmount: loans?.reduce((sum, loan) => sum + (Number.parseFloat(loan.amount) || 0), 0) || 0,
    todayPayments: todayPayments?.length || 0,
    todayAmount: todayPayments?.reduce((sum, payment) => sum + (Number.parseFloat(payment.total_amount) || 0), 0) || 0,
    overduePayments: overduePayments?.length || 0,
    overdueAmount:
      overduePayments?.reduce((sum, payment) => sum + (Number.parseFloat(payment.total_amount) || 0), 0) || 0,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const dashboardData = await getDashboardData()

  const stats = [
    {
      title: "Total Clientes",
      value: dashboardData.totalClients.toString(),
      description: "Clientes activos",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Préstamos Activos",
      value: dashboardData.activeLoans.toString(),
      description: `de ${dashboardData.totalLoans} totales`,
      icon: CreditCard,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Monto Total",
      value: `$${dashboardData.totalLoanAmount.toLocaleString()}`,
      description: "En préstamos activos",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Pagos Hoy",
      value: dashboardData.todayPayments.toString(),
      description: `$${dashboardData.todayAmount.toLocaleString()}`,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  const alerts = [
    {
      title: "Pagos Vencidos",
      count: dashboardData.overduePayments,
      amount: dashboardData.overdueAmount,
      type: "danger" as const,
      icon: AlertTriangle,
    },
    {
      title: "Pagos de Hoy",
      count: dashboardData.todayPayments,
      amount: dashboardData.todayAmount,
      type: "warning" as const,
      icon: Clock,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-work-sans">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido de vuelta, {user.email}. Aquí tienes un resumen de tu sistema de microcréditos.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {alerts.map((alert) => (
          <Card
            key={alert.title}
            className={`border-border bg-card ${
              alert.type === "danger"
                ? "border-l-4 border-l-destructive"
                : alert.type === "warning"
                  ? "border-l-4 border-l-orange-500"
                  : ""
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{alert.title}</CardTitle>
              <alert.icon
                className={`h-4 w-4 ${
                  alert.type === "danger"
                    ? "text-destructive"
                    : alert.type === "warning"
                      ? "text-orange-500"
                      : "text-muted-foreground"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-card-foreground">{alert.count}</div>
                  <p className="text-xs text-muted-foreground">${alert.amount.toLocaleString()}</p>
                </div>
                <Badge variant={alert.type === "danger" ? "destructive" : "secondary"}>
                  {alert.type === "danger" ? "Urgente" : "Pendiente"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Acciones Rápidas</CardTitle>
          <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border-border">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Nuevo Cliente</h3>
                  <p className="text-sm text-muted-foreground">Registrar cliente</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border-border">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Nuevo Préstamo</h3>
                  <p className="text-sm text-muted-foreground">Otorgar préstamo</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border-border">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Registrar Pago</h3>
                  <p className="text-sm text-muted-foreground">Procesar pago</p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Rendimiento del Mes</CardTitle>
          <CardDescription>Progreso hacia los objetivos mensuales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-card-foreground">Nuevos Clientes</span>
              <span className="text-sm text-muted-foreground">75%</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-card-foreground">Préstamos Otorgados</span>
              <span className="text-sm text-muted-foreground">60%</span>
            </div>
            <Progress value={60} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-card-foreground">Tasa de Recuperación</span>
              <span className="text-sm text-muted-foreground">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
