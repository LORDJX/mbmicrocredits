"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Calendar, DollarSign, TrendingUp, AlertTriangle, Search, Filter, Download, Eye } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { toast } from "sonner"

interface Installment {
  id: string
  code: string
  loan_id: string
  installment_no: number
  installments_total: number
  amount_due: number
  amount_paid: number
  balance_due: number
  due_date: string
  paid_at?: string
  status: string
  created_at: string
  loans: {
    loan_code: string
    client_id: string
    loan_type: string
    status: string
    clients: {
      client_code: string
      first_name: string
      last_name: string
      phone: string
    }
  }
}

interface InstallmentSummary {
  total_installments: number
  paid_installments: number
  pending_installments: number
  overdue_installments: number
  total_amount_due: number
  total_amount_paid: number
  total_balance_due: number
  by_status: {
    a_pagar: number
    a_pagar_hoy: number
    vencida: number
    pagada: number
    pago_anticipado: number
    pagada_con_mora: number
  }
}

interface PaymentFormData {
  loan_id: string
  paid_amount: string
  note: string
}

const statusColors = {
  a_pagar: "bg-blue-100 text-blue-800 border-blue-200",
  a_pagar_hoy: "bg-yellow-100 text-yellow-800 border-yellow-200",
  vencida: "bg-red-100 text-red-800 border-red-200",
  pagada: "bg-green-100 text-green-800 border-green-200",
  pago_anticipado: "bg-purple-100 text-purple-800 border-purple-200",
  pagada_con_mora: "bg-orange-100 text-orange-800 border-orange-200",
}

const statusLabels = {
  a_pagar: "A Pagar",
  a_pagar_hoy: "Vence Hoy",
  vencida: "Vencida",
  pagada: "Pagada",
  pago_anticipado: "Pago Anticipado",
  pagada_con_mora: "Pagada con Mora",
}

export default function CuotasPage() {
  const [installments, setInstallments] = useState<Installment[]>([])
  const [summary, setSummary] = useState<InstallmentSummary>({
    total_installments: 0,
    paid_installments: 0,
    pending_installments: 0,
    overdue_installments: 0,
    total_amount_due: 0,
    total_amount_paid: 0,
    total_balance_due: 0,
    by_status: {
      a_pagar: 0,
      a_pagar_hoy: 0,
      vencida: 0,
      pagada: 0,
      pago_anticipado: 0,
      pagada_con_mora: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    loan_id: "",
    paid_amount: "",
    note: "",
  })
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    fetchInstallments()
    fetchSummary()
  }, [statusFilter, dateFromFilter, dateToFilter])

  const fetchInstallments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (dateFromFilter) {
        params.append("due_date_from", dateFromFilter)
      }
      if (dateToFilter) {
        params.append("due_date_to", dateToFilter)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/installments?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setInstallments(data)
      } else {
        toast.error("Error al cargar cuotas: " + data.detail)
      }
    } catch (error) {
      console.error("Error fetching installments:", error)
      toast.error("Error de conexión al cargar cuotas")
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams()

      if (dateFromFilter) {
        params.append("date_from", dateFromFilter)
      }
      if (dateToFilter) {
        params.append("date_to", dateToFilter)
      }

      const response = await fetch(`/api/installments/summary?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setSummary(data)
      }
    } catch (error) {
      console.error("Error fetching summary:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR")
  }

  const openPaymentModal = (installment: Installment) => {
    if (installment.status.includes("pagada") || installment.status === "pago_anticipado") {
      toast.error("Esta cuota ya está pagada")
      return
    }

    setSelectedInstallment(installment)
    setPaymentForm({
      loan_id: installment.loan_id,
      paid_amount: installment.balance_due.toString(),
      note: `Pago cuota ${installment.installment_no} - ${installment.code}`,
    })
    setIsPaymentModalOpen(true)
  }

  const handleProcessPayment = async () => {
    if (!selectedInstallment || isProcessingPayment) return

    try {
      setIsProcessingPayment(true)

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: paymentForm.loan_id,
          paid_amount: Number.parseFloat(paymentForm.paid_amount),
          note: paymentForm.note,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Pago procesado exitosamente")
        setIsPaymentModalOpen(false)
        setSelectedInstallment(null)
        setPaymentForm({ loan_id: "", paid_amount: "", note: "" })

        // Refrescar datos
        fetchInstallments()
        fetchSummary()
      } else {
        toast.error("Error al procesar pago: " + result.detail)
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.error("Error de conexión al procesar pago")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDateFromFilter("")
    setDateToFilter("")
  }

  // Datos para gráficos
  const chartData = [
    { name: "A Pagar", value: summary.by_status.a_pagar, color: "#3B82F6" },
    { name: "Vence Hoy", value: summary.by_status.a_pagar_hoy, color: "#F59E0B" },
    { name: "Vencidas", value: summary.by_status.vencida, color: "#EF4444" },
    { name: "Pagadas", value: summary.by_status.pagada, color: "#10B981" },
    { name: "Pago Anticipado", value: summary.by_status.pago_anticipado, color: "#8B5CF6" },
    { name: "Pagada con Mora", value: summary.by_status.pagada_con_mora, color: "#F97316" },
  ]

  const paymentProgress =
    summary.total_installments > 0 ? (summary.paid_installments / summary.total_installments) * 100 : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <AppHeader title="Gestión de Cuotas" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando cuotas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AppHeader title="Gestión de Cuotas" />

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cuotas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_installments}</div>
            <p className="text-xs text-muted-foreground">
              {summary.paid_installments} pagadas, {summary.pending_installments} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total_amount_due)}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(summary.total_amount_paid)} cobrado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso de Cobro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentProgress.toFixed(1)}%</div>
            <Progress value={paymentProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuotas Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.overdue_installments}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(summary.total_balance_due)} pendiente</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Cantidad" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estados de Cuotas</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Cantidad" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Cliente, código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="a_pagar">A Pagar</SelectItem>
                  <SelectItem value="a_pagar_hoy">Vence Hoy</SelectItem>
                  <SelectItem value="vencida">Vencidas</SelectItem>
                  <SelectItem value="pagada">Pagadas</SelectItem>
                  <SelectItem value="pago_anticipado">Pago Anticipado</SelectItem>
                  <SelectItem value="pagada_con_mora">Pagada con Mora</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-from">Desde</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date-to">Hasta</Label>
              <Input id="date-to" type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={fetchInstallments} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Cuotas */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Listado de Cuotas ({installments.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Préstamo</TableHead>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell className="font-mono text-sm">{installment.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {installment.loans.clients.first_name} {installment.loans.clients.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">{installment.loans.clients.client_code}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{installment.loans.loan_code}</TableCell>
                    <TableCell>
                      {installment.installment_no}/{installment.installments_total}
                    </TableCell>
                    <TableCell>{formatDate(installment.due_date)}</TableCell>
                    <TableCell>{formatCurrency(installment.amount_due)}</TableCell>
                    <TableCell>{formatCurrency(installment.amount_paid)}</TableCell>
                    <TableCell>{formatCurrency(installment.balance_due)}</TableCell>
                    <TableCell>
                      <Badge
                        className={statusColors[installment.status as keyof typeof statusColors]}
                        variant="outline"
                      >
                        {statusLabels[installment.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPaymentModal(installment)}
                          disabled={installment.status.includes("pagada") || installment.status === "pago_anticipado"}
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {installments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron cuotas con los filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Pago */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
          </DialogHeader>

          {selectedInstallment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold mb-2">Detalle de la Cuota</h4>
                <p className="text-sm text-muted-foreground">
                  Cliente: {selectedInstallment.loans.clients.first_name} {selectedInstallment.loans.clients.last_name}
                </p>
                <p className="text-sm text-muted-foreground">Código: {selectedInstallment.code}</p>
                <p className="text-sm text-muted-foreground">
                  Saldo pendiente: {formatCurrency(selectedInstallment.balance_due)}
                </p>
              </div>

              <div>
                <Label htmlFor="paid_amount">Monto a Pagar</Label>
                <Input
                  id="paid_amount"
                  type="number"
                  step="0.01"
                  value={paymentForm.paid_amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paid_amount: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="note">Nota (opcional)</Label>
                <Input
                  id="note"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isProcessingPayment}>
                  Cancelar
                </Button>
                <Button onClick={handleProcessPayment} disabled={isProcessingPayment || !paymentForm.paid_amount}>
                  {isProcessingPayment ? "Procesando..." : "Procesar Pago"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
