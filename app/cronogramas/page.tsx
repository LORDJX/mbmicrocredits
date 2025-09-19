import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Search, Clock, CheckCircle, AlertTriangle } from "lucide-react"

async function getPaymentSchedules() {
  const supabase = await createClient()

  const { data: schedules, error } = await supabase
    .from("payment_schedules")
    .select(`
      *,
      loans!inner(
        loan_code,
        active_clients!inner(first_name, last_name, client_code)
      )
    `)
    .order("due_date", { ascending: true })
    .limit(100)

  if (error) {
    console.error("Error fetching payment schedules:", error)
    return []
  }

  return schedules || []
}

export default async function CronogramasPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const schedules = await getPaymentSchedules()
  const today = new Date().toISOString().split("T")[0]

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = dueDate < today && status !== "paid"

    if (status === "paid") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Pagado
        </Badge>
      )
    }

    if (isOverdue) {
      return <Badge variant="destructive">Vencido</Badge>
    }

    if (dueDate === today) {
      return (
        <Badge variant="outline" className="border-orange-200 text-orange-800">
          Vence Hoy
        </Badge>
      )
    }

    return <Badge variant="secondary">Pendiente</Badge>
  }

  const paidSchedules = schedules.filter((s) => s.status === "paid")
  const overdueSchedules = schedules.filter((s) => s.due_date < today && s.status !== "paid")
  const todaySchedules = schedules.filter((s) => s.due_date === today && s.status !== "paid")
  const totalAmount = schedules.reduce((sum, s) => sum + (Number.parseFloat(s.total_amount) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-work-sans">Cronogramas de Pago</h1>
          <p className="text-muted-foreground mt-2">Gestiona los cronogramas y vencimientos de pagos</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          Generar Cronograma
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Cuotas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{schedules.length}</div>
            <p className="text-xs text-muted-foreground">Cuotas programadas</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Vencen Hoy</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{todaySchedules.length}</div>
            <p className="text-xs text-muted-foreground">Cuotas por cobrar hoy</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{overdueSchedules.length}</div>
            <p className="text-xs text-muted-foreground">Cuotas vencidas</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Pagadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{paidSchedules.length}</div>
            <p className="text-xs text-muted-foreground">Cuotas cobradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Buscar Cronogramas</CardTitle>
          <CardDescription>Encuentra cronogramas por cliente, préstamo o fecha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente o código de préstamo..."
                className="pl-10 bg-input border-border"
              />
            </div>
            <Button variant="outline" className="border-border bg-transparent">
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Schedules Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Cronograma de Pagos</CardTitle>
          <CardDescription>Todas las cuotas programadas y su estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-card-foreground">Cuota #</TableHead>
                  <TableHead className="text-card-foreground">Cliente</TableHead>
                  <TableHead className="text-card-foreground">Préstamo</TableHead>
                  <TableHead className="text-card-foreground">Fecha Venc.</TableHead>
                  <TableHead className="text-card-foreground">Monto</TableHead>
                  <TableHead className="text-card-foreground">Estado</TableHead>
                  <TableHead className="text-card-foreground">Fecha Pago</TableHead>
                  <TableHead className="text-card-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id} className="border-border">
                    <TableCell className="font-mono text-sm">{schedule.installment_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-card-foreground">
                          {schedule.loans?.active_clients?.first_name} {schedule.loans?.active_clients?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {schedule.loans?.active_clients?.client_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{schedule.loans?.loan_code || "N/A"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(schedule.due_date).toLocaleDateString("es-ES")}</div>
                      {schedule.due_date < today && schedule.status !== "paid" && (
                        <div className="text-xs text-destructive">
                          {Math.floor(
                            (new Date().getTime() - new Date(schedule.due_date).getTime()) / (1000 * 60 * 60 * 24),
                          )}{" "}
                          días vencida
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-card-foreground">
                        ${Number.parseFloat(schedule.total_amount || "0").toLocaleString()}
                      </div>
                      {schedule.principal_amount && schedule.interest_amount && (
                        <div className="text-xs text-muted-foreground">
                          Capital: ${Number.parseFloat(schedule.principal_amount).toLocaleString()} | Interés: $
                          {Number.parseFloat(schedule.interest_amount).toLocaleString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.status, schedule.due_date)}</TableCell>
                    <TableCell className="text-sm">
                      {schedule.paid_date ? new Date(schedule.paid_date).toLocaleDateString("es-ES") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {schedule.status !== "paid" && (
                          <Button variant="outline" size="sm" className="border-border bg-transparent">
                            Pagar
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="border-border bg-transparent">
                          Ver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {schedules.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">No hay cronogramas</h3>
              <p className="text-muted-foreground">Los cronogramas aparecerán cuando se otorguen préstamos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
