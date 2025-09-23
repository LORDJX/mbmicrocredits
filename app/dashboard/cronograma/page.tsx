"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Calendar, AlertCircle, CheckCircle, Clock, Printer, DollarSign, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AppHeader } from "@/components/app-header"

interface CronogramItem {
  id: string
  loan_code: string
  client_name: string
  installment_number: number
  due_date: string
  amount: number
  status: string
  paid_at?: string
  payment_date?: string
  loan_id: string
  client_id: string
  first_name: string
  last_name: string
  balance_due: number
}

type FilterType = "all" | "overdue" | "today" | "upcoming" | "received"

export default function DashboardCronogramaPage() {
  const [cronogramData, setCronogramData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CronogramItem | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNote, setPaymentNote] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const { toast } = useToast()

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
      toast({
        title: "Error",
        description: "No se pudo cargar el cronograma",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayment = async () => {
    if (!selectedItem || isProcessingPayment) return

    try {
      setIsProcessingPayment(true)

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: selectedItem.loan_id,
          paid_amount: Number.parseFloat(paymentAmount),
          note: paymentNote,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Pago procesado exitosamente",
        })
        setIsPaymentModalOpen(false)
        setSelectedItem(null)
        setPaymentAmount("")
        setPaymentNote("")
        // Refrescar datos
        fetchCronogramData()
      } else {
        toast({
          title: "Error",
          description: "Error al procesar pago: " + result.detail,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Error",
        description: "Error de conexión al procesar pago",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handlePrintItem = (item: CronogramItem) => {
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
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BM MICROCRÉDITOS</h1>
            <h2>Detalle de Cuota</h2>
            <p>Fecha: ${new Date().toLocaleDateString()}</p>
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
              <span class="label">Estado:</span>
              <span>${getStatusLabel(item.status)}</span>
            </div>
            ${
              item.paid_at
                ? `
            <div class="detail-row">
              <span class="label">Fecha Pago:</span>
              <span>${new Date(item.paid_at).toLocaleDateString()}</span>
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

  const handleShareWhatsApp = (item: CronogramItem) => {
    const message = `*BM MICROCRÉDITOS*
    
*Detalle de Cuota*
Préstamo: ${item.loan_code}
Cliente: ${item.client_name}
Cuota: ${item.installment_number}
Fecha Vencimiento: ${new Date(item.due_date).toLocaleDateString()}
Monto: $${item.amount.toLocaleString()}
Estado: ${getStatusLabel(item.status)}
${item.paid_at ? `Fecha Pago: ${new Date(item.paid_at).toLocaleDateString()}` : ""}

Generado el ${new Date().toLocaleDateString()}`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`
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
                  <td>${getStatusLabel(item.status)}</td>
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

  const getStatusLabel = (status: string) => {
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

  const handleCardFilter = (filterType: FilterType) => {
    setActiveFilter(filterType)
  }

  const openPaymentModal = (item: CronogramItem) => {
    if (item.status === "paid") {
      toast({
        title: "Información",
        description: "Esta cuota ya está pagada",
      })
      return
    }

    setSelectedItem(item)
    setPaymentAmount(item.balance_due?.toString() || item.amount.toString())
    setPaymentNote(`Pago cuota ${item.installment_number} - ${item.loan_code}`)
    setIsPaymentModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
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

    switch (activeFilter) {
      case "overdue":
        items = cronogramData?.overdue?.map((item: any) => ({ ...item, status: "overdue" })) || []
        break
      case "today":
        items = cronogramData?.today?.map((item: any) => ({ ...item, status: "due_today" })) || []
        break
      case "upcoming":
        items = cronogramData?.upcoming?.map((item: any) => ({ ...item, status: "pending" })) || []
        break
      case "received":
        items = cronogramData?.paid?.map((item: any) => ({ ...item, status: "paid" })) || []
        break
      default:
        items = allItems
    }

    return items.filter(
      (item: CronogramItem) =>
        item.loan_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  const filteredItems = getFilteredItems()

  const paidInstallments = cronogramData?.debug?.installments_by_status?.pagadas || 0
  console.log("[v0] Paid installments tracked:", paidInstallments)
  console.log("[v0] Debug info:", cronogramData?.debug)

  return (
    <div className="space-y-6">
      <AppHeader title="Cronograma de Pagos" />

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "overdue" ? "ring-2 ring-destructive" : ""}`}
          onClick={() => handleCardFilter("overdue")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{cronogramData?.overdue?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${(cronogramData?.summary?.total_overdue || 0).toLocaleString()}
            </p>
            <Button variant="outline" size="sm" className="mt-2 w-full bg-transparent">
              Filtrar Vencidos
            </Button>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "today" ? "ring-2 ring-orange-500" : ""}`}
          onClick={() => handleCardFilter("today")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencen Hoy</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{cronogramData?.today?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${(cronogramData?.summary?.total_due_today || 0).toLocaleString()}
            </p>
            <Button variant="outline" size="sm" className="mt-2 w-full bg-transparent">
              Filtrar Hoy
            </Button>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "upcoming" ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => handleCardFilter("upcoming")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Pagos</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{cronogramData?.upcoming?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${(cronogramData?.summary?.total_upcoming || 0).toLocaleString()}
            </p>
            <Button variant="outline" size="sm" className="mt-2 w-full bg-transparent">
              Filtrar Próximos
            </Button>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === "received" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => handleCardFilter("received")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Recibidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{cronogramData?.paid?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${(cronogramData?.summary?.total_paid || 0).toLocaleString()}
            </p>
            <Button variant="outline" size="sm" className="mt-2 w-full bg-transparent">
              Filtrar Recibidos
            </Button>
          </CardContent>
        </Card>
      </div>

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
                    : activeFilter === "today"
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
            <div className="flex gap-2">
              {activeFilter !== "all" && (
                <Button onClick={() => handleCardFilter("all")} variant="outline" size="sm">
                  Ver Todos
                </Button>
              )}
              <Button onClick={handlePrintCronogram} variant="outline" size="sm" className="gap-2 bg-transparent">
                <Printer className="h-4 w-4" />
                Imprimir Cronograma
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
                    <div className="flex gap-1">
                      {/* Imputar Recibo button - only for unpaid items */}
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
                      {/* Print button */}
                      <Button size="sm" variant="outline" onClick={() => handlePrintItem(item)} title="Imprimir">
                        <Printer className="h-4 w-4" />
                      </Button>
                      {/* WhatsApp share button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShareWhatsApp(item)}
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
                          ? "Vencidos"
                          : activeFilter === "today"
                            ? "Vencen Hoy"
                            : activeFilter === "upcoming"
                              ? "Próximos"
                              : "Recibidos"
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
            <DialogTitle>Imputar Recibo</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold mb-2">Detalle de la Cuota</h4>
                <p className="text-sm text-muted-foreground">Cliente: {selectedItem.client_name}</p>
                <p className="text-sm text-muted-foreground">Préstamo: {selectedItem.loan_code}</p>
                <p className="text-sm text-muted-foreground">Cuota: {selectedItem.installment_number}</p>
                <p className="text-sm text-muted-foreground">
                  Monto pendiente: ${(selectedItem.balance_due || selectedItem.amount).toLocaleString()}
                </p>
              </div>

              <div>
                <Label htmlFor="payment_amount">Monto a Imputar</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="payment_note">Nota (opcional)</Label>
                <Input id="payment_note" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isProcessingPayment}>
                  Cancelar
                </Button>
                <Button onClick={handleProcessPayment} disabled={isProcessingPayment || !paymentAmount}>
                  {isProcessingPayment ? "Procesando..." : "Imputar Recibo"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
