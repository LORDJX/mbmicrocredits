"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, CreditCard, DollarSign, AlertTriangle, Calendar, CheckCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreateClientForm } from "@/components/forms/create-client-form"
import { CreateLoanForm } from "@/components/forms/create-loan-form"
import { CreateReceiptForm } from "@/components/forms/create-receipt-form"
import { CurrentDateTimeHeader } from "@/components/current-datetime-header"
import { UpcomingFollowupsCard } from "@/components/upcoming-followups-card"

interface DashboardData {
  totalClients: number
  totalLoans: number
  activeLoans: number
  totalLoanedAmount: number
  totalOwedAmount: number
  todayPaymentsCount: number
  todayPaymentsAmount: number
  todayInstallmentsDue: number
  overduePayments: number
  overdueAmount: number
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalClients: 0,
    totalLoans: 0,
    activeLoans: 0,
    totalLoanedAmount: 0,
    totalOwedAmount: 0,
    todayPaymentsCount: 0,
    todayPaymentsAmount: 0,
    todayInstallmentsDue: 0,
    overduePayments: 0,
    overdueAmount: 0,
  })
  const [userEmail, setUserEmail] = useState("")
  const [loading, setLoading] = useState(true)

  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [loanDialogOpen, setLoanDialogOpen] = useState(false)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)

  const [summaryData, setSummaryData] = useState({
    client: null,
    loans: [],
    totalLoans: 0,
    totalCuotas: 0,
    totalAmount: 0,
    cash: 0,
    transfer: 0,
    paymentType: "total",
    totalInstallments: 0,
  })

  useEffect(() => {
    async function loadDashboard() {
      const supabase = await createClient()

      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
      }

      // Get total clients
      const { data: clients } = await supabase.from("clients").select("id").is("deleted_at", null)

      // Get all loans
      const { data: loans } = await supabase.from("loans").select("id, principal, status").is("deleted_at", null)

      // Count active loans (status puede ser 'ACTIVO', 'activo', 'active', etc.)
      const activeLoans =
        loans?.filter(
          (loan) => loan.status && (loan.status.toLowerCase() === "activo" || loan.status.toLowerCase() === "active"),
        ).length || 0

      // Calculate total loaned amount (sum of all principals)
      const totalLoanedAmount = loans?.reduce((sum, loan) => sum + (Number(loan.principal) || 0), 0) || 0

      // Get all installments to calculate total paid
      const { data: allInstallments } = await supabase.from("installments").select("amount_paid")

      // Calculate total paid amount
      const totalPaidAmount = allInstallments?.reduce((sum, inst) => sum + (Number(inst.amount_paid) || 0), 0) || 0

      // Calculate total owed (loaned - paid)
      const totalOwedAmount = totalLoanedAmount - totalPaidAmount

      // Get receipts for today
      const today = new Date().toISOString().split("T")[0]
      const { data: todayReceipts } = await supabase.from("receipts").select("total_amount").eq("receipt_date", today)

      // Sum today's receipts
      const todayPaymentsAmount =
        todayReceipts?.reduce((sum, receipt) => sum + (Number(receipt.total_amount) || 0), 0) || 0

      // Get installments due today (for count)
      const { data: todayInstallments } = await supabase
        .from("installments")
        .select("id")
        .eq("due_date", today)
        .is("paid_at", null)

      // Get overdue payments
      const { data: overduePayments } = await supabase
        .from("installments")
        .select("amount_due, amount_paid")
        .lt("due_date", today)
        .is("paid_at", null)

      const overdueAmount =
        overduePayments?.reduce((sum, payment) => {
          const balanceDue = (Number(payment.amount_due) || 0) - (Number(payment.amount_paid) || 0)
          return sum + balanceDue
        }, 0) || 0

      setDashboardData({
        totalClients: clients?.length || 0,
        totalLoans: loans?.length || 0,
        activeLoans,
        totalLoanedAmount,
        totalOwedAmount,
        todayPaymentsCount: todayReceipts?.length || 0,
        todayPaymentsAmount,
        todayInstallmentsDue: todayInstallments?.length || 0,
        overduePayments: overduePayments?.length || 0,
        overdueAmount,
      })

      setLoading(false)
    }

    loadDashboard()
  }, [])

  const handleSummaryChange = (newSummary: any) => {
    setSummaryData(newSummary)
  }

  const handleReceiptSuccess = () => {
    setReceiptDialogOpen(false)
    // Recargar datos del dashboard
    window.location.reload()
  }

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
      title: "Monto Total Prestado",
      value: `$${dashboardData.totalLoanedAmount.toLocaleString("es-AR")}`,
      description: "En todos los préstamos",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Monto Total Adeudado",
      value: `$${dashboardData.totalOwedAmount.toLocaleString("es-AR")}`,
      description: "Pendiente de cobro",
      icon: DollarSign,
      color: "text-red-600",
      bgColor: "bg-red-50",
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
      count: dashboardData.todayPaymentsCount,
      amount: dashboardData.todayPaymentsAmount,
      type: "warning" as const,
      icon: Calendar,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ffffff;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e0e0e0;
        }
      `}</style>

      <PageHeader
        title="Dashboard"
        description={`Bienvenido de vuelta, ${userEmail}. Aquí tienes un resumen de tu sistema de microcréditos.`}
      />

      <CurrentDateTimeHeader />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>

      <UpcomingFollowupsCard />

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
                  <p className="text-xs text-muted-foreground">${alert.amount.toLocaleString("es-AR")}</p>
                </div>
                <Badge variant={alert.type === "danger" ? "destructive" : "secondary"}>
                  {alert.type === "danger" ? "Urgente" : "Pendiente"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Acciones Rápidas</CardTitle>
          <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
              <DialogTrigger asChild>
                <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border-border">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-card-foreground">Nuevo Cliente</h3>
                      <p className="text-sm text-muted-foreground">Registrar cliente</p>
                    </div>
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="!max-w-none w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
                <div className="custom-scrollbar overflow-y-auto h-full p-6">
                  <DialogHeader className="mb-4">
                    <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                  </DialogHeader>
                  <CreateClientForm onSuccess={() => setClientDialogOpen(false)} />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={loanDialogOpen} onOpenChange={setLoanDialogOpen}>
              <DialogTrigger asChild>
                <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border-border">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-card-foreground">Nuevo Préstamo</h3>
                      <p className="text-sm text-muted-foreground">Otorgar préstamo</p>
                    </div>
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="!max-w-none w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
                <div className="custom-scrollbar overflow-y-auto h-full p-6">
                  <DialogHeader className="mb-4">
                    <DialogTitle>Crear Nuevo Préstamo</DialogTitle>
                  </DialogHeader>
                  <CreateLoanForm onSuccess={() => setLoanDialogOpen(false)} />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
              <DialogTrigger asChild>
                <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border-border">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-card-foreground">Registrar Pago</h3>
                      <p className="text-sm text-muted-foreground">Procesar pago</p>
                    </div>
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="!max-w-none w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
                <div className="flex h-full">
                  <div className="w-[60%] h-full overflow-y-auto border-r p-6 custom-scrollbar">
                    <DialogHeader className="mb-4">
                      <DialogTitle>Crear Nuevo Recibo</DialogTitle>
                    </DialogHeader>
                    <CreateReceiptForm onSuccess={handleReceiptSuccess} onSummaryChange={handleSummaryChange} />
                  </div>

                  <div className="w-[40%] h-full overflow-y-auto bg-muted/30 p-6 custom-scrollbar">
                    <h3 className="text-lg font-semibold mb-4">Resumen del Recibo</h3>

                    {summaryData.client ? (
                      <Card className="mb-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Cliente</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <p className="font-semibold">
                              {summaryData.client.first_name} {summaryData.client.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{summaryData.client.client_code}</p>
                            <p className="text-sm text-muted-foreground">{summaryData.client.phone}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="mb-4">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground text-center">Selecciona un cliente</p>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="mb-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Préstamos Seleccionados</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {summaryData.totalLoans > 0 ? (
                          <div className="space-y-2">
                            {summaryData.loans.map((loan: any) => (
                              <div key={loan.id} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{loan.loan_code}</span>
                                <span className="text-muted-foreground">
                                  ${Number(loan.principal).toLocaleString()}
                                </span>
                              </div>
                            ))}
                            <div className="pt-2 border-t">
                              <p className="text-sm font-semibold">Total: {summaryData.totalLoans} préstamo(s)</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center">No hay préstamos seleccionados</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="mb-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Cuotas a Pagar</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {summaryData.totalCuotas > 0 ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Cuotas seleccionadas:</span>
                              <Badge variant="secondary">{summaryData.totalCuotas}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Total disponibles:</span>
                              <span className="text-sm text-muted-foreground">{summaryData.totalInstallments}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center">No hay cuotas seleccionadas</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Detalle de Pago</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Efectivo:</span>
                            <span className="font-medium">
                              ${summaryData.cash.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Transferencia:</span>
                            <span className="font-medium">
                              ${summaryData.transfer.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="pt-3 border-t flex justify-between items-center">
                            <span className="font-semibold">Total:</span>
                            <span className="text-lg font-bold text-primary">
                              ${summaryData.totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="pt-2">
                            <Badge
                              variant={summaryData.paymentType === "total" ? "default" : "secondary"}
                              className="w-full justify-center"
                            >
                              Pago {summaryData.paymentType === "total" ? "Total" : "Parcial"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

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
