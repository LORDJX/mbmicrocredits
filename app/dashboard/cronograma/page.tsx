"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
import { AppHeader } from "@/components/app-header"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CronogramItem {
  id: string
  loan_code: string
  client_name: string
  client_phone?: string
  installment_number: number
  total_installments: number
  due_date: string
  amount: number
  amount_paid: number
  balance_due: number
  status: string
  paid_at?: string
  payment_date?: string
}

type FilterType = "all" | "overdue" | "due_today" | "upcoming" | "paid"

export default function DashboardCronogramaPage() {
  const [cronogramData, setCronogramData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<CronogramItem | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNote, setPaymentNote] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    fetchCronogramData()
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
      toast.error("No se pudo cargar el cronograma")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterClick = (filterType: FilterType) => {
    setActiveFilter(filterType)
  }

  const openPaymentModal = (installment: CronogramItem) => {
    if (installment.status === "paid") {
      toast.error("Esta cuota ya está pagada")
      return
    }

    setSelectedInstallment(installment)
    setPaymentAmount(installment.balance_due.toString())
    setPaymentNote(`Pago cuota ${installment.installment_number} de ${installment.total_installments}`)
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
          loan_id: selectedInstallment.id, // Assuming this maps to loan_id
          paid_amount: Number.parseFloat(paymentAmount),
          note: paymentNote,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Pago procesado exitosamente")
        setIsPaymentModalOpen(false)
        setSelectedInstallment(null)
        setPaymentAmount("")
        setPaymentNote("")

        // Refrescar datos
        fetchCronogramData()
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

  const generateWhatsAppMessage = (item: CronogramItem, isPaid = false) => {
    const clientName = item.client_name
    const phone = item.client_phone?.replace(/\D/g, "") // Remove non-digits

    if (!phone) {
      toast.error("No se encontró número de teléfono para este cliente")
      return
    }

    let message = ""

    if (isPaid) {
      // Formato para pagos realizados
      message = `🧾 RECIBO DE PAGO
📋 Recibo N°: Rbo - ${String(Math.floor(Math.random() * 100000)).padStart(6, "0")}
📅 Fecha: ${new Date().toLocaleDateString("es-AR")}
👤 Cliente: ${clientName}
💰 Total Pagado: $${item.amount.toLocaleString("es-AR")}
💵 Efectivo: $${item.amount.toLocaleString("es-AR")}
🏦 Transferencia: $0.00
📝 Tipo: Total
📋 Observaciones: Pago cuota ${item.installment_number} de ${item.total_installments}

¡Gracias por su pago! 🙏
BM Microcréditos`
    } else {
      // Formato para cuotas pendientes
      message = `🧾 Cuota - Pendiente
📋 N° cuota: ${item.installment_number} de ${item.total_installments}
📋 Préstamo: ${item.loan_code}
📅 Fecha Vto: ${new Date(item.due_date).toLocaleDateString("es-AR")}
👤 Cliente: ${clientName}
💰 Monto: $${item.balance_due.toLocaleString("es-AR")}
📋 Observaciones: Pago cuota ${item.installment_number} de ${item.total_installments}

¡Gracias por su compromiso! 🙏
BM Microcréditos`
    }

    const whatsappUrl = `https://web.whatsapp.com/send?phone=54${phone}&text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handlePrintInstallment = (item: CronogramItem) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

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
            .status { padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 10px; }
            .paid { background-color: #e8f5e8; color: #2e7d32; }
            .overdue { background-color: #ffebee; color: #c62828; }
            .pending { background-color: #e3f2fd; color: #1565c0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BM MICROCRÉDITOS</h1>
            <h2>Detalle de Cuota</h2>
            <p>Fecha de Impresión: ${new Date().toLocaleDateString("es-AR")}</p>
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
              <span>${item.installment_number} de ${item.total_installments}</span>
            </div>
            <div class="detail-row">
              <span class="label">Fecha de Vencimiento:</span>
              <span>${new Date(item.due_date).toLocaleDateString("es-AR")}</span>
            </div>
            <div class="detail-row">
              <span class="label">Monto Original:</span>
              <span>$${item.amount.toLocaleString("es-AR")}</span>
            </div>
            <div class="detail-row">
              <span class="label">Monto Pagado:</span>
              <span>$${item.amount_paid.toLocaleString("es-AR")}</span>
            </div>
            <div class="detail-row">
              <span class="label">Saldo Pendiente:</span>
              <span>$${item.balance_due.toLocaleString("es-AR")}</span>
            </div>
            <div class="detail-row">
              <span class="label">Estado:</span>
              <span class="status ${item.status === "paid" ? "paid" : item.status === "overdue" ? "overdue" : "pending"}">
                ${item.status === "paid" ? "Pagado" : item.status === "overdue" ? "Vencido" : item.status === "due_today" ? "Vence Hoy" : "Pendiente"}
              </span>
            </div>
            ${
              item.paid_at
                ? `
            <div class="detail-row">
              <span class="label">Fecha de Pago:</span>
              <span>${new Date(item.paid_at).toLocaleDateString("es-AR")}</span>
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

  const handlePrintCronogram = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const allItems = getFilteredItems()

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
              <h3>Pagos Recibidos</h3>
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
                  <td>${item.status}</td>
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
          <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-800">
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

  const getFilteredItems = () => {
    if (!cronogramData) return []

    let allItems: CronogramItem[] = []

    switch (activeFilter) {
      case "overdue":
        allItems = (cronogramData.overdue || []).map((item: any) => ({ ...item, status: "overdue" }))
        break
      case "due_today":
        allItems = (cronogramData.today || []).map((item: any) => ({ ...item, status: "due_today" }))
        break
      case "upcoming":
        allItems = (cronogramData.upcoming || []).map((item: any) => ({ ...item, status: "pending" }))
        break
      case "paid":
        allItems = (cronogramData.paid || []).map((item: any) => ({ ...item, status: "paid" }))
        break
      default:
        allItems = [
          ...(cronogramData.overdue || []).map((item: any) => ({ ...item, status: "overdue" })),
          ...(cronogramData.today || []).map((item: any) => ({ ...item, status: "due_today" })),
          ...(cronogramData.upcoming || []).map((item: any) => ({ ...item, status: "pending" })),
          ...(cronogramData.paid || []).map((item: any) => ({ ...item, status: "paid" })),
        ]
    }

    return allItems.filter(
      (item: CronogramItem) =>
        item.loan_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AppHeader title="Cronograma de Pagos" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando cronograma...</p>
          </div>
        </div>
      </div>
    )
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="space-y-6">
      <AppHeader title="Cronograma de Pagos" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md",
            activeFilter === "overdue" && "ring-2 ring-red-500 shadow-lg",
          )}
          onClick={() => handleFilterClick("overdue")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Vencidos</CardTitle>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              {activeFilter === "overdue" && <Filter className="h-4 w-4 text-red-500" />}
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
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md",
            activeFilter === "due_today" && "ring-2 ring-orange-500 shadow-lg",
          )}
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
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md",
            activeFilter === "upcoming" && "ring-2 ring-blue-500 shadow-lg",
          )}
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
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md",
            activeFilter === "paid" && "ring-2 ring-green-500 shadow-lg",
          )}
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

      {activeFilter !== "all" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => handleFilterClick("all")} className="gap-2">
            <Filter className="h-4 w-4" />
            Mostrar Todos
          </Button>
        </div>
      )}

      {/* Tabla de Cronograma */}
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
                  : `Mostrando ${filteredItems.length} registro${filteredItems.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            <Button onClick={handlePrintCronogram} variant="outline" className="gap-2 bg-transparent">
              <Printer className="h-4 w-4" />
              Imprimir Cronograma
            </Button>
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
                <TableHead>Saldo</TableHead>
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
                  <TableCell>
                    {item.installment_number} de {item.total_installments}
                  </TableCell>
                  <TableCell>{new Date(item.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>${item.amount.toLocaleString()}</TableCell>
                  <TableCell>${item.balance_due.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.paid_at ? new Date(item.paid_at).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.status !== "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPaymentModal(item)}
                          title="Imputar Recibo"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handlePrintInstallment(item)} title="Imprimir">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateWhatsAppMessage(item, item.status === "paid")}
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
                  : activeFilter === "all"
                    ? "No se encontraron resultados para la búsqueda."
                    : `No hay registros para el filtro "${
                        activeFilter === "overdue"
                          ? "Pagos Vencidos"
                          : activeFilter === "due_today"
                            ? "Vencen Hoy"
                            : activeFilter === "upcoming"
                              ? "Próximos Pagos"
                              : "Pagos Recibidos"
                      }".`}
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

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
          </DialogHeader>

          {selectedInstallment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold mb-2">Detalle de la Cuota</h4>
                <p className="text-sm text-muted-foreground">Cliente: {selectedInstallment.client_name}</p>
                <p className="text-sm text-muted-foreground">Préstamo: {selectedInstallment.loan_code}</p>
                <p className="text-sm text-muted-foreground">
                  Cuota: {selectedInstallment.installment_number} de {selectedInstallment.total_installments}
                </p>
                <p className="text-sm text-muted-foreground">
                  Saldo pendiente: ${selectedInstallment.balance_due.toLocaleString()}
                </p>
              </div>

              <div>
                <Label htmlFor="paid_amount">Monto a Pagar</Label>
                <Input
                  id="paid_amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="note">Observaciones</Label>
                <Input id="note" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isProcessingPayment}>
                  Cancelar
                </Button>
                <Button onClick={handleProcessPayment} disabled={isProcessingPayment || !paymentAmount}>
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
