"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Printer,
  DollarSign,
  MessageCircle,
  Filter,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AppHeader } from "@/components/app-header"

interface CronogramItem {
  id: string
  loan_code: string
  client_name: string
  client_id: string
  installment_number: number
  due_date: string
  amount: number
  amount_paid: number
  balance_due: number
  status: string
  paid_at?: string
  payment_date?: string
  first_name?: string
  last_name?: string
}

interface Client {
  id: string
  first_name: string
  last_name: string
  phone: string
}

type FilterType = "all" | "overdue" | "due_today" | "upcoming" | "paid"

export default function DashboardCronogramaPage() {
  const [cronogramData, setCronogramData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [showImputeDialog, setShowImputeDialog] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<CronogramItem | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNote, setPaymentNote] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchCronogramData()
    fetchClients()
  }, [])

  const fetchCronogramData = async () => {
    setLoading(true)
    try {
      console.log("[v0] Fetching cronograma data...")
      const response = await fetch("/api/cronograma")
      if (!response.ok) throw new Error("Error al cargar cronograma")
      const data = await response.json()
      console.log("[v0] Cronograma API response:", data)
      setCronogramData(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el cronograma",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const clientsData = await response.json()
        setClients(clientsData)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const handleFilterClick = (filterType: FilterType) => {
    setActiveFilter(filterType)
  }

  const handleImputePayment = async () => {
    if (!selectedInstallment || !paymentAmount) return

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loan_id: selectedInstallment.loan_id,
          paid_amount: Number.parseFloat(paymentAmount),
          note: paymentNote || `Pago cuota ${selectedInstallment.installment_number}`,
        }),
      })

      if (!response.ok) throw new Error("Error al procesar el pago")

      const result = await response.json()
      toast({
        title: "Pago procesado",
        description: result.message,
      })

      setShowImputeDialog(false)
      setSelectedInstallment(null)
      setPaymentAmount("")
      setPaymentNote("")
      fetchCronogramData()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar el pago",
        variant: "destructive",
      })
    }
  }

  const handlePrintInstallment = (item: CronogramItem) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const isPaid = item.paid_at
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Detalle de Cuota - ${item.loan_code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .detail { margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; }
            .status { padding: 5px 10px; border-radius: 5px; color: white; }
            .paid { background-color: #4caf50; }
            .overdue { background-color: #f44336; }
            .due-today { background-color: #ff9800; }
            .pending { background-color: #2196f3; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BM MICROCRÉDITOS</h1>
            <h2>Detalle de Cuota</h2>
            <p>Fecha de Impresión: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="detail">
            <div class="detail-row">
              <span class="label">Préstamo:</span>
              <span>${item.loan_code}</span>
            </div>
            <div class="detail-row">
              <span class="label">Cliente:</span>
              <span>${item.client_name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Cuota:</span>
              <span>${item.installment_number}</span>
            </div>
            <div class="detail-row">
              <span class="label">Fecha Vencimiento:</span>
              <span>${new Date(item.due_date).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Monto:</span>
              <span>$${item.amount.toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Pagado:</span>
              <span>$${item.amount_paid.toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Saldo:</span>
              <span>$${item.balance_due.toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Estado:</span>
              <span class="status ${item.status}">${getStatusText(item.status)}</span>
            </div>
            ${
              isPaid
                ? `
            <div class="detail-row">
              <span class="label">Fecha de Pago:</span>
              <span>${new Date(item.paid_at!).toLocaleDateString()}</span>
            </div>
            `
                : ""
            }
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const handleWhatsAppShare = (item: CronogramItem) => {
    const client = clients.find((c) => c.id === item.client_id)
    const clientPhone = client?.phone?.replace(/[^\d]/g, "") || ""

    let message = ""

    if (item.paid_at) {
      message = `🧾 RECIBO DE PAGO
📋 Recibo N°: Rbo - ${String(item.installment_number).padStart(6, "0")}
📅 Fecha: ${new Date(item.paid_at).toLocaleDateString()}
👤 Cliente: ${item.client_name}
💰 Total Pagado: $${item.amount_paid.toLocaleString()}
💵 Efectivo: $${item.amount_paid.toLocaleString()}
🏦 Transferencia: $0.00
📝 Tipo: Total
📋 Observaciones: Pago cuota ${item.installment_number} de ${cronogramData?.debug?.total_installments || "N/A"}

¡Gracias por su pago! 🙏
BM Microcréditos`
    } else {
      message = `🧾 Cuota - Pendiente
📋 N° cuota: ${item.installment_number}
📋 Préstamo: ${item.loan_code}
📅 Fecha Vto: ${new Date(item.due_date).toLocaleDateString()}
👤 Cliente: ${item.client_name}
💰 Monto: $${item.amount.toLocaleString()}
📋 Observaciones: Pago cuota ${item.installment_number} de ${cronogramData?.debug?.total_installments || "N/A"}

¡Gracias por su compromiso! 🙏
BM Microcréditos`
    }

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = clientPhone
      ? `https://wa.me/${clientPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`

    window.open(whatsappUrl, "_blank")
  }

  const handlePrintCronogram = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const allItems = [
      ...(cronogramData?.today || []),
      ...(cronogramData?.overdue || []),
      ...(cronogramData?.upcoming || []),
      ...(cronogramData?.paid || []),
    ].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cronograma de Pagos - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-item { text-align: center; padding: 15px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; }
            .overdue { background-color: #ffebee; }
            .today { background-color: #fff3e0; }
            .paid { background-color: #e8f5e8; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BM MICROCRÉDITOS</h1>
            <h2>Cronograma de Pagos</h2>
            <p>Fecha de Reporte: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <h3>Vencidos</h3>
              <p style="font-size: 24px; color: #d32f2f;">${cronogramData?.overdue?.length || 0}</p>
              <p>$${(cronogramData?.summary?.total_overdue || 0).toLocaleString()}</p>
            </div>
            <div class="summary-item">
              <h3>Hoy</h3>
              <p style="font-size: 24px; color: #f57c00;">${cronogramData?.today?.length || 0}</p>
              <p>$${(cronogramData?.summary?.total_due_today || 0).toLocaleString()}</p>
            </div>
            <div class="summary-item">
              <h3>Próximos</h3>
              <p style="font-size: 24px; color: #1976d2;">${cronogramData?.upcoming?.length || 0}</p>
              <p>$${(cronogramData?.summary?.total_upcoming || 0).toLocaleString()}</p>
            </div>
            <div class="summary-item">
              <h3>Recibidos</h3>
              <p style="font-size: 24px; color: #388e3c;">${cronogramData?.paid?.length || 0}</p>
              <p>$${(cronogramData?.summary?.total_paid || 0).toLocaleString()}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Préstamo</th>
                <th>Cliente</th>
                <th>Cuota</th>
                <th>Fecha Vencimiento</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha Pago</th>
              </tr>
            </thead>
            <tbody>
              ${allItems
                .map(
                  (item) => `
                <tr class="${item.status === "overdue" ? "overdue" : item.status === "due_today" ? "today" : item.status === "paid" ? "paid" : ""}">
                  <td>${item.loan_code}</td>
                  <td>${item.client_name}</td>
                  <td>${item.installment_number}</td>
                  <td>${new Date(item.due_date).toLocaleDateString()}</td>
                  <td>$${item.amount.toLocaleString()}</td>
                  <td>${getStatusText(item.status)}</td>
                  <td>${item.paid_at ? new Date(item.paid_at).toLocaleDateString() : "-"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "overdue":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Vencido
          </Badge>
        )
      case "due_today":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Hoy
          </Badge>
        )
      case "paid":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Pagado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            Próximo
          </Badge>
        )
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "overdue":
        return "Vencido"
      case "due_today":
        return "Vence Hoy"
      case "paid":
        return "Pagado"
      default:
        return "Próximo"
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <AppHeader title="Cronograma de Pagos" />
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando cronograma...</p>
        </div>
      </div>
    )
  }

  const allItems = [
    ...(cronogramData?.overdue || []).map((item: any) => ({ ...item, status: "overdue" })),
    ...(cronogramData?.today || []).map((item: any) => ({ ...item, status: "due_today" })),
    ...(cronogramData?.upcoming || []).map((item: any) => ({ ...item, status: "pending" })),
    ...(cronogramData?.paid || []).map((item: any) => ({ ...item, status: "paid" })),
  ]

  const getFilteredItems = () => {
    let items = allItems

    if (activeFilter !== "all") {
      switch (activeFilter) {
        case "overdue":
          items = cronogramData?.overdue || []
          break
        case "due_today":
          items = cronogramData?.today || []
          break
        case "upcoming":
          items = cronogramData?.upcoming || []
          break
        case "paid":
          items = cronogramData?.paid || []
          break
      }
    }

    return items.filter(
      (item: CronogramItem) =>
        item.loan_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <AppHeader title="Cronograma de Pagos" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "overdue" ? "ring-2 ring-destructive" : ""}`}
            onClick={() => handleFilterClick("overdue")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Vencidos</CardTitle>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                {activeFilter === "overdue" && <Filter className="h-4 w-4 text-destructive" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{cronogramData?.overdue?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                ${(cronogramData?.summary?.total_overdue || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "due_today" ? "ring-2 ring-orange-500" : ""}`}
            onClick={() => handleFilterClick("due_today")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencen Hoy</CardTitle>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                {activeFilter === "due_today" && <Filter className="h-4 w-4 text-orange-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{cronogramData?.today?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                ${(cronogramData?.summary?.total_due_today || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "upcoming" ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => handleFilterClick("upcoming")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos Pagos</CardTitle>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                {activeFilter === "upcoming" && <Filter className="h-4 w-4 text-blue-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{cronogramData?.upcoming?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                ${(cronogramData?.summary?.total_upcoming || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "paid" ? "ring-2 ring-green-500" : ""}`}
            onClick={() => handleFilterClick("paid")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Recibidos</CardTitle>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {activeFilter === "paid" && <Filter className="h-4 w-4 text-green-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{cronogramData?.paid?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                ${(cronogramData?.summary?.total_paid || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {activeFilter === "all"
                    ? "Cronograma Completo"
                    : activeFilter === "overdue"
                      ? "Pagos Vencidos"
                      : activeFilter === "due_today"
                        ? "Vencen Hoy"
                        : activeFilter === "upcoming"
                          ? "Próximos Pagos"
                          : "Pagos Recibidos"}
                </CardTitle>
                <CardDescription>
                  {activeFilter === "all"
                    ? "Todos los pagos programados y realizados"
                    : `Filtrado por: ${getStatusText(activeFilter)}`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {activeFilter !== "all" && (
                  <Button onClick={() => handleFilterClick("all")} variant="outline" size="sm">
                    Ver Todos
                  </Button>
                )}
                <Button onClick={handlePrintCronogram} variant="outline" className="gap-2 bg-transparent">
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por préstamo o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredItems.length} pago{filteredItems.length !== 1 ? "s" : ""} encontrado
                {filteredItems.length !== 1 ? "s" : ""}
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Préstamo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Pago</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: CronogramItem) => (
                  <TableRow key={`${item.id}-${item.installment_number}`}>
                    <TableCell className="font-medium">{item.loan_code}</TableCell>
                    <TableCell>{item.client_name}</TableCell>
                    <TableCell>{item.installment_number}</TableCell>
                    <TableCell>{new Date(item.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>${item.amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.paid_at ? new Date(item.paid_at).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!item.paid_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInstallment(item)
                              setPaymentAmount(item.balance_due.toString())
                              setShowImputeDialog(true)
                            }}
                            className="h-8 w-8 p-0"
                            title="Imputar Recibo"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintInstallment(item)}
                          className="h-8 w-8 p-0"
                          title="Imprimir"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWhatsAppShare(item)}
                          className="h-8 w-8 p-0"
                          title="Compartir por WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {cronogramData?.debug?.total_installments === 0
                    ? "No se encontraron cuotas en la base de datos. Asegúrate de que existan préstamos con cuotas generadas."
                    : activeFilter !== "all"
                      ? `No se encontraron ${getStatusText(activeFilter).toLowerCase()} para mostrar.`
                      : "No se encontraron resultados para la búsqueda."}
                </p>
                {cronogramData?.debug && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>Total de cuotas en BD: {cronogramData.debug.total_installments}</p>
                    <p>Fecha actual (Argentina): {cronogramData.debug.argentina_time}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showImputeDialog} onOpenChange={setShowImputeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Imputar Recibo</DialogTitle>
            <DialogDescription>
              Registrar pago para la cuota {selectedInstallment?.installment_number} del préstamo{" "}
              {selectedInstallment?.loan_code}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right">
                Cliente
              </Label>
              <div className="col-span-3 text-sm text-muted-foreground">{selectedInstallment?.client_name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Monto
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right">
                Observaciones
              </Label>
              <Textarea
                id="note"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="col-span-3"
                placeholder="Observaciones del pago..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImputeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImputePayment} disabled={!paymentAmount}>
              Procesar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
