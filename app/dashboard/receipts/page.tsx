"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Download, Eye, Receipt, DollarSign, Calendar } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { toast } from "sonner"

interface PaymentRecord {
  id: string
  loan_id: string
  paid_amount: number
  paid_at: string
  note?: string
  loans: {
    loan_code: string
    client_id: string
    clients: {
      client_code: string
      first_name: string
      last_name: string
      phone?: string
    }
  }
  payment_imputations: Array<{
    id: string
    imputed_amount: number
    installments: {
      code: string
      installment_no: number
      due_date: string
    }
  }>
}

interface PaymentSummary {
  total_payments: number
  total_amount: number
  payments_today: number
  amount_today: number
}

export default function ReceiptsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [summary, setSummary] = useState<PaymentSummary>({
    total_payments: 0,
    total_amount: 0,
    payments_today: 0,
    amount_today: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")

  useEffect(() => {
    fetchPayments()
  }, [dateFromFilter, dateToFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (dateFromFilter) {
        params.append("date_from", dateFromFilter)
      }
      if (dateToFilter) {
        params.append("date_to", dateToFilter)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/payments?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setPayments(data)
        calculateSummary(data)
      } else {
        toast.error("Error al cargar recibos: " + data.detail)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast.error("Error de conexión al cargar recibos")
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (paymentsData: PaymentRecord[]) => {
    const today = new Date().toDateString()
    const paymentsToday = paymentsData.filter((p) => new Date(p.paid_at).toDateString() === today)

    setSummary({
      total_payments: paymentsData.length,
      total_amount: paymentsData.reduce((sum, p) => sum + p.paid_amount, 0),
      payments_today: paymentsToday.length,
      amount_today: paymentsToday.reduce((sum, p) => sum + p.paid_amount, 0),
    })
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-AR")
  }

  const clearFilters = () => {
    setSearchTerm("")
    setDateFromFilter("")
    setDateToFilter("")
  }

  const filteredPayments = payments.filter(
    (payment) =>
      payment.loans.loan_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${payment.loans.clients.first_name} ${payment.loans.clients.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.loans.clients.client_code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <AppHeader title="Recibos de Pago" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando recibos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AppHeader title="Recibos de Pago" />

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recibos</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_payments}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(summary.total_amount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.payments_today}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(summary.amount_today)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Recibo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.total_payments > 0 ? summary.total_amount / summary.total_payments : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Monto promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imputaciones</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.reduce((sum, p) => sum + p.payment_imputations.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total de imputaciones</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Cliente, préstamo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
              <Button onClick={fetchPayments} className="flex-1">
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

      {/* Tabla de Recibos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Listado de Recibos ({filteredPayments.length})</CardTitle>
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
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Préstamo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Imputaciones</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatDate(payment.paid_at)}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(payment.paid_at).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {payment.loans.clients.first_name} {payment.loans.clients.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">{payment.loans.clients.client_code}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{payment.loans.loan_code}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">{formatCurrency(payment.paid_amount)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {payment.payment_imputations.map((imp, index) => (
                          <div key={imp.id} className="text-xs">
                            <Badge variant="outline" className="text-xs">
                              Cuota {imp.installments.installment_no}: {formatCurrency(imp.imputed_amount)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-32 truncate">{payment.note || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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

          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron recibos con los filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
