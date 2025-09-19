import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, Plus, Search, DollarSign, Calendar } from "lucide-react"

async function getLoans() {
  const supabase = await createClient()

  const { data: loans, error } = await supabase
    .from("active_loans")
    .select(`
      *,
      active_clients!inner(first_name, last_name, client_code)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching loans:", error)
    return []
  }

  return loans || []
}

export default async function PrestamosPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const loans = await getLoans()

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Activo
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Completado
          </Badge>
        )
      case "overdue":
        return <Badge variant="destructive">Vencido</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="border-orange-200 text-orange-800">
            Pendiente
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status || "Sin estado"}</Badge>
    }
  }

  const totalAmount = loans.reduce((sum, loan) => sum + (Number.parseFloat(loan.amount) || 0), 0)
  const activeLoans = loans.filter((loan) => loan.status === "active")
  const completedLoans = loans.filter((loan) => loan.status === "completed")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-work-sans">Préstamos</h1>
          <p className="text-muted-foreground mt-2">Gestiona todos los préstamos otorgados</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Préstamo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Préstamos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{loans.length}</div>
            <p className="text-xs text-muted-foreground">Préstamos registrados</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Préstamos Activos</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{activeLoans.length}</div>
            <p className="text-xs text-muted-foreground">En curso</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Monto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">${totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Capital prestado</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Completados</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{completedLoans.length}</div>
            <p className="text-xs text-muted-foreground">Préstamos pagados</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Buscar Préstamos</CardTitle>
          <CardDescription>Encuentra préstamos por código, cliente o monto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código de préstamo o cliente..."
                className="pl-10 bg-input border-border"
              />
            </div>
            <Button variant="outline" className="border-border bg-transparent">
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Lista de Préstamos</CardTitle>
          <CardDescription>Todos los préstamos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-card-foreground">Código</TableHead>
                  <TableHead className="text-card-foreground">Cliente</TableHead>
                  <TableHead className="text-card-foreground">Monto</TableHead>
                  <TableHead className="text-card-foreground">Cuotas</TableHead>
                  <TableHead className="text-card-foreground">Tasa</TableHead>
                  <TableHead className="text-card-foreground">Estado</TableHead>
                  <TableHead className="text-card-foreground">Fechas</TableHead>
                  <TableHead className="text-card-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id} className="border-border">
                    <TableCell className="font-mono text-sm">{loan.loan_code || "N/A"}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-card-foreground">
                          {loan.active_clients?.first_name} {loan.active_clients?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {loan.active_clients?.client_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-card-foreground">
                        ${Number.parseFloat(loan.amount || "0").toLocaleString()}
                      </div>
                      {loan.amount_to_repay && (
                        <div className="text-xs text-muted-foreground">
                          Total: ${Number.parseFloat(loan.amount_to_repay).toLocaleString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{loan.installments || "N/A"}</TableCell>
                    <TableCell className="text-center">
                      {loan.interest_rate ? `${Number.parseFloat(loan.interest_rate)}%` : "N/A"}
                    </TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {loan.start_date && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            Inicio: {new Date(loan.start_date).toLocaleDateString("es-ES")}
                          </div>
                        )}
                        {loan.end_date && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            Fin: {new Date(loan.end_date).toLocaleDateString("es-ES")}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-border bg-transparent">
                          Ver
                        </Button>
                        <Button variant="outline" size="sm" className="border-border bg-transparent">
                          Cronograma
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {loans.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">No hay préstamos</h3>
              <p className="text-muted-foreground">Comienza otorgando tu primer préstamo</p>
              <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Préstamo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
