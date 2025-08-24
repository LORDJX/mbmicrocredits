"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, AlertTriangle, DollarSign, Plus, MessageCircle, Search } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { toast } from "sonner"

interface Installment {
  id: string
  client_id: string
  client_name: string
  loan_code: string
  installment_number: number
  total_installments: number
  amount: number
  due_date: string
  status: "pending" | "paid" | "overdue"
}

interface DailySummary {
  total_due_today: number
  total_received_today: number
  total_overdue: number
  total_received_month: number
  total_due_month: number
}

interface ReceiptFormData {
  receipt_date: string
  client_id: string
  client_name: string
  loan_code: string
  payment_type: string
  cash_amount: string
  transfer_amount: string
  observations: string
}

interface Receipt {
  id: string
  receipt_number: string
  total_amount: number
  receipt_date: string
  payment_type: string
  observations: string
  selected_loans: any[]
  client_id: string
  clients: {
    id: string
    first_name: string
    last_name: string
    phone: string
  }
}

export default function CronogramaPage() {
  const [todayInstallments, setTodayInstallments] = useState<Installment[]>([])
  const [overdueInstallments, setOverdueInstallments] = useState<Installment[]>([])
  const [monthInstallments, setMonthInstallments] = useState<Installment[]>([])
  const [todayReceipts, setTodayReceipts] = useState<Receipt[]>([]) // Agregar estado para recibos del día
  const [summary, setSummary] = useState<DailySummary>({
    total_due_today: 0,
    total_received_today: 0,
    total_overdue: 0,
    total_received_month: 0,
    total_due_month: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [receiptForm, setReceiptForm] = useState<ReceiptFormData>({
    receipt_date: new Date().toISOString().split("T")[0],
    client_id: "",
    client_name: "",
    loan_code: "",
    payment_type: "Total",
    cash_amount: "0",
    transfer_amount: "0",
    observations: "",
  })
  const [isCreatingReceipt, setIsCreatingReceipt] = useState(false)
  const [searchFilter, setSearchFilter] = useState("") // Added filter state for search functionality
  const [paidInstallments, setPaidInstallments] = useState<Set<string>>(new Set()) // Agregar estado para cuotas pagadas

  useEffect(() => {
    fetchCronogramaData()
  }, [])

  const fetchCronogramaData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/cronograma")
      const data = await response.json()

      if (data.success) {
        setTodayInstallments(data.today || [])
        setOverdueInstallments(data.overdue || [])
        setMonthInstallments(data.month || [])
        setTodayReceipts(data.todayReceipts || []) // Cargar recibos del día
        setSummary(data.summary || {})

        const paidIds = new Set<string>()
        data.todayReceipts?.forEach((receipt: Receipt) => {
          receipt.selected_loans?.forEach((loan: any) => {
            if (loan.loan_code && loan.installment_number) {
              paidIds.add(`${loan.loan_code}-${loan.installment_number}`)
            }
          })
        })
        setPaidInstallments(paidIds)
      }
    } catch (error) {
      console.error("Error fetching cronograma data:", error)
    } finally {
      setLoading(false)
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

  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, "")
    return numericValue
  }

  const openReceiptModal = (installment: Installment) => {
    const installmentKey = `${installment.loan_code}-${installment.installment_number}`
    if (paidInstallments.has(installmentKey)) {
      toast.error("Ya existe un recibo para esta cuota. No se pueden crear recibos duplicados.")
      return
    }

    if (installment.status === "paid") {
      toast.error("Esta cuota ya está marcada como pagada.")
      return
    }

    setSelectedInstallment(installment)
    setReceiptForm({
      receipt_date: new Date().toISOString().split("T")[0],
      client_id: installment.client_id,
      client_name: installment.client_name,
      loan_code: installment.loan_code,
      payment_type: "Total",
      cash_amount: installment.amount.toString(),
      transfer_amount: "0",
      observations: `Pago cuota ${installment.installment_number} de ${installment.total_installments}`,
    })
    setIsReceiptModalOpen(true)
  }

  const handleCreateReceipt = async () => {
    if (isCreatingReceipt) {
      console.log("[v0] Already creating receipt, preventing duplicate")
      return
    }

    if (!selectedInstallment) {
      toast.error("No hay cuota seleccionada")
      return
    }

    const installmentKey = `${selectedInstallment.loan_code}-${selectedInstallment.installment_number}`
    if (paidInstallments.has(installmentKey)) {
      toast.error("Ya existe un recibo para esta cuota. No se pueden crear recibos duplicados.")
      setIsReceiptModalOpen(false)
      return
    }

    try {
      setIsCreatingReceipt(true)
      console.log("[v0] Starting receipt creation")

      if (!receiptForm.client_id || !selectedInstallment) {
        console.log("[v0] Missing required data for receipt creation")
        toast.error("Faltan datos requeridos para crear el recibo")
        return
      }

      const receiptData = {
        receipt_date: receiptForm.receipt_date,
        client_id: receiptForm.client_id,
        payment_type: receiptForm.payment_type,
        cash_amount: Number.parseFloat(receiptForm.cash_amount) || 0,
        transfer_amount: Number.parseFloat(receiptForm.transfer_amount) || 0,
        total_amount:
          (Number.parseFloat(receiptForm.cash_amount) || 0) + (Number.parseFloat(receiptForm.transfer_amount) || 0),
        observations: receiptForm.observations,
        selected_loans: [
          {
            loan_code: receiptForm.loan_code,
            installment_number: selectedInstallment?.installment_number,
            amount: selectedInstallment?.amount,
          },
        ],
      }

      console.log("[v0] Sending receipt data:", receiptData)

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData),
      })

      const result = await response.json()
      console.log("[v0] Receipt API response:", result)

      if (response.ok && result.id) {
        console.log("[v0] Receipt created successfully")
        toast.success("Recibo creado exitosamente")

        const receiptAmount = receiptData.total_amount
        setSummary((prev) => ({
          ...prev,
          total_received_today: prev.total_received_today + receiptAmount,
          total_received_month: prev.total_received_month + receiptAmount,
          total_due_today: Math.max(0, prev.total_due_today - receiptAmount),
          total_overdue:
            selectedInstallment.status === "overdue"
              ? Math.max(0, prev.total_overdue - receiptAmount)
              : prev.total_overdue,
          total_due_month: Math.max(0, prev.total_due_month - receiptAmount),
        }))

        const newPaidInstallments = new Set(paidInstallments)
        newPaidInstallments.add(installmentKey)
        setPaidInstallments(newPaidInstallments)

        const removeInstallment = (installments: Installment[]) =>
          installments.filter((inst) => inst.id !== selectedInstallment.id)

        setTodayInstallments((prev) => removeInstallment(prev))
        setOverdueInstallments((prev) => removeInstallment(prev))
        setMonthInstallments((prev) => removeInstallment(prev))

        const newReceipt: Receipt = {
          id: result.id,
          receipt_number: result.receipt_number,
          total_amount: result.total_amount,
          receipt_date: result.receipt_date,
          payment_type: result.payment_type,
          observations: result.observations,
          selected_loans: result.selected_loans,
          client_id: result.client_id,
          clients: {
            id: selectedInstallment.client_id,
            first_name: selectedInstallment.client_name.split(" ")[0] || "",
            last_name: selectedInstallment.client_name.split(" ").slice(1).join(" ") || "",
            phone: "", // Se obtendrá cuando se necesite para WhatsApp
          },
        }
        setTodayReceipts((prev) => [newReceipt, ...prev])

        console.log("[v0] Updated installment status to paid")

        setIsReceiptModalOpen(false)
        setSelectedInstallment(null)
        setReceiptForm({
          receipt_date: new Date().toISOString().split("T")[0],
          client_id: "",
          client_name: "",
          loan_code: "",
          payment_type: "Total",
          cash_amount: "0",
          transfer_amount: "0",
          observations: "",
        })

        setTimeout(() => {
          fetchCronogramaData()
        }, 500)
      } else {
        const errorMessage = result.error || result.message || "Error desconocido"
        console.log("[v0] Receipt creation failed:", errorMessage)
        toast.error("Error al crear recibo: " + errorMessage)
      }
    } catch (error) {
      console.error("[v0] Error creating receipt:", error)
      console.log("[v0] Receipt creation failed:", error)
      toast.error("Error al crear recibo: " + (error instanceof Error ? error.message : "Error de conexión"))
    } finally {
      setIsCreatingReceipt(false)
      console.log("[v0] Receipt creation process completed")
    }
  }

  const shareViaWhatsApp = async (installment: Installment) => {
    try {
      // Get client phone number from database
      const response = await fetch(`/api/clients/${installment.client_id}`)
      const clientData = await response.json()

      if (clientData.success && clientData.client.phone) {
        const phoneNumber = clientData.client.phone.replace(/[^\d]/g, "") // Remove non-numeric characters
        const message = `Hola ${installment.client_name}! 

Su cuota ${installment.installment_number} de ${installment.total_installments} del préstamo ${installment.loan_code} por ${formatCurrency(installment.amount)} ha sido registrada como pagada.

Gracias por su pago puntual.

BM Microcréditos`

        // Use WhatsApp Web API
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, "_blank")
        toast.success("Mensaje de WhatsApp enviado")
      } else {
        toast.error("No se encontró número de teléfono para este cliente")
      }
    } catch (error) {
      console.error("Error getting client phone:", error)
      toast.error("Error al obtener datos del cliente")
    }
  }

  const shareReceiptViaWhatsApp = (receipt: Receipt) => {
    const phoneNumber = receipt.clients.phone?.replace(/[^\d]/g, "") // Remove non-numeric characters

    if (!phoneNumber) {
      toast.error("No se encontró número de teléfono para este cliente")
      return
    }

    const clientName = `${receipt.clients.first_name} ${receipt.clients.last_name}`
    const loanInfo = receipt.selected_loans?.[0] || {}

    const message = `🧾 *RECIBO DE PAGO* 🧾

Hola ${clientName}!

Su recibo N° *${receipt.receipt_number}* ha sido generado exitosamente.

📋 *DETALLE DEL PAGO:*
💰 Monto: *${formatCurrency(receipt.total_amount)}*
📅 Fecha: ${formatDate(receipt.receipt_date)}
💳 Tipo: ${receipt.payment_type}
${loanInfo.loan_code ? `🏦 Préstamo: ${loanInfo.loan_code}` : ""}
${loanInfo.installment_number ? `📊 Cuota: ${loanInfo.installment_number}` : ""}

${receipt.observations ? `📝 Observaciones: ${receipt.observations}` : ""}

✅ Gracias por su pago puntual.

*BM Microcréditos*
_Su confianza es nuestro compromiso_`

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    toast.success("Recibo enviado por WhatsApp")
  }

  const InstallmentCard = ({ installment }: { installment: Installment }) => {
    const installmentKey = `${installment.loan_code}-${installment.installment_number}`
    const hasReceipt = paidInstallments.has(installmentKey)
    const isPaid = installment.status === "paid" || hasReceipt

    if (hasReceipt || isPaid) {
      return null
    }

    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{installment.client_name}</h4>
              <p className="text-sm text-muted-foreground">
                Cuota {installment.installment_number} de {installment.total_installments} - {installment.loan_code}
              </p>
              <p className="text-sm text-muted-foreground">Vencimiento: {formatDate(installment.due_date)}</p>
            </div>
            <div className="text-right space-y-2">
              <p className="text-xl font-bold">{formatCurrency(installment.amount)}</p>
              <Badge variant={installment.status === "overdue" ? "destructive" : "secondary"} className="block">
                {installment.status === "overdue" ? "Vencida" : "Pendiente"}
              </Badge>
              <Button size="sm" className="w-full mt-2" onClick={() => openReceiptModal(installment)}>
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Recibo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ReceiptCard = ({ receipt }: { receipt: Receipt }) => (
    <Card className="mb-3 border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold text-lg text-green-800">
              {receipt.clients.first_name} {receipt.clients.last_name}
            </h4>
            <p className="text-sm text-green-600">Recibo N° {receipt.receipt_number}</p>
            <p className="text-sm text-green-600">
              {receipt.selected_loans?.[0]?.loan_code && <>Préstamo: {receipt.selected_loans[0].loan_code}</>}
            </p>
            <p className="text-sm text-muted-foreground">
              Tipo: {receipt.payment_type} - {formatDate(receipt.receipt_date)}
            </p>
          </div>
          <div className="text-right space-y-2">
            <p className="text-xl font-bold text-green-700">{formatCurrency(receipt.total_amount)}</p>
            <Badge variant="secondary" className="block bg-green-100 text-green-800">
              Pagado
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2 bg-green-100 border-green-300 text-green-700 hover:bg-green-200"
              onClick={() => shareReceiptViaWhatsApp(receipt)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Compartir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const filterData = (items: (Installment | Receipt)[], searchTerm: string) => {
    if (!searchTerm.trim()) return items

    const term = searchTerm.toLowerCase().trim()

    return items.filter((item) => {
      // For installments
      if ("client_name" in item) {
        return item.client_name.toLowerCase().includes(term) || item.loan_code.toLowerCase().includes(term)
      }
      // For receipts
      if ("clients" in item) {
        const fullName = `${item.clients.first_name} ${item.clients.last_name}`.toLowerCase()
        return fullName.includes(term) || (item.receipt_number && item.receipt_number.toLowerCase().includes(term))
      }
      return false
    })
  }

  const filteredTodayInstallments = filterData(todayInstallments, searchFilter) as Installment[]
  const filteredOverdueInstallments = filterData(overdueInstallments, searchFilter) as Installment[]
  const filteredMonthInstallments = filterData(monthInstallments, searchFilter) as Installment[]
  const filteredTodayReceipts = filterData(todayReceipts, searchFilter) as Receipt[]

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

  return (
    <div className="space-y-6">
      <AppHeader title="Cronograma de Pagos" />

      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre del cliente, DNI o código de préstamo..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchFilter && (
              <Button variant="outline" size="sm" onClick={() => setSearchFilter("")}>
                Limpiar
              </Button>
            )}
          </div>
          {searchFilter && (
            <p className="text-sm text-muted-foreground mt-2">Mostrando resultados para: "{searchFilter}"</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sección HOY */}
        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Calendar className="h-5 w-5" />
                Hoy
                {searchFilter && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredTodayInstallments.length + filteredTodayReceipts.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4 bg-white/50 p-3 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Por cobrar hoy:</span>
                  <span className="font-bold text-lg text-blue-700">{formatCurrency(summary.total_due_today)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Cobrado hoy:</span>
                  <span className="font-bold text-lg text-green-700">
                    {formatCurrency(summary.total_received_today)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTodayReceipts.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-green-700 mb-2">Recibos Generados Hoy</h5>
                    {filteredTodayReceipts.map((receipt) => (
                      <ReceiptCard key={receipt.id} receipt={receipt} />
                    ))}
                  </div>
                )}

                {filteredTodayInstallments.filter((inst) => {
                  const key = `${inst.loan_code}-${inst.installment_number}`
                  return !paidInstallments.has(key) && inst.status !== "paid"
                }).length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-blue-700 mb-2">Cuotas Pendientes</h5>
                    {filteredTodayInstallments.map((installment) => (
                      <InstallmentCard key={installment.id} installment={installment} />
                    ))}
                  </div>
                )}

                {filteredTodayInstallments.filter((inst) => {
                  const key = `${inst.loan_code}-${inst.installment_number}`
                  return !paidInstallments.has(key) && inst.status !== "paid"
                }).length === 0 &&
                  filteredTodayReceipts.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      {searchFilter ? "No se encontraron resultados" : "No hay cuotas ni recibos para hoy"}
                    </p>
                  )}

                {filteredTodayInstallments.filter((inst) => {
                  const key = `${inst.loan_code}-${inst.installment_number}`
                  return !paidInstallments.has(key) && inst.status !== "paid"
                }).length === 0 &&
                  filteredTodayReceipts.length > 0 && (
                    <p className="text-center text-green-600 py-2 text-sm font-medium">
                      ✅ Todas las cuotas de hoy han sido cobradas
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección VENCIDOS */}
        <div className="space-y-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Vencidos
                {searchFilter && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredOverdueInstallments.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4 bg-white/50 p-3 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Total vencido:</span>
                  <span className="font-bold text-lg text-red-700">{formatCurrency(summary.total_overdue)}</span>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredOverdueInstallments.length > 0 ? (
                  filteredOverdueInstallments.map((installment) => (
                    <InstallmentCard key={installment.id} installment={installment} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    {searchFilter ? "No se encontraron resultados" : "No hay cuotas vencidas"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección MES */}
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <DollarSign className="h-5 w-5" />
                Este Mes
                {searchFilter && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredMonthInstallments.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4 bg-white/50 p-3 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Total a cobrar:</span>
                  <span className="font-bold text-lg text-gray-800">
                    {formatCurrency(summary.total_due_month + summary.total_received_month)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Ya cobrado:</span>
                  <span className="font-bold text-lg text-green-700">
                    {formatCurrency(summary.total_received_month)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span className="font-semibold text-gray-800">Pendiente:</span>
                  <span className="font-bold text-xl text-orange-600">{formatCurrency(summary.total_due_month)}</span>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMonthInstallments.length > 0 ? (
                  filteredMonthInstallments.map((installment) => (
                    <InstallmentCard key={installment.id} installment={installment} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    {searchFilter ? "No se encontraron resultados" : "No hay cuotas para este mes"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Recibo - {receiptForm.client_name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receipt_date">Fecha</Label>
                <Input
                  id="receipt_date"
                  type="date"
                  value={receiptForm.receipt_date}
                  onChange={(e) => setReceiptForm({ ...receiptForm, receipt_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="payment_type">Tipo de Pago</Label>
                <Select
                  value={receiptForm.payment_type}
                  onValueChange={(value) => setReceiptForm({ ...receiptForm, payment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Total">Total</SelectItem>
                    <SelectItem value="Parcial">Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cash_amount">Importe en Efectivo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="cash_amount"
                    type="text"
                    placeholder="Ej: 15000.50"
                    className="pl-8"
                    value={receiptForm.cash_amount || "0"}
                    onChange={(e) =>
                      setReceiptForm({ ...receiptForm, cash_amount: formatCurrencyInput(e.target.value) })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Formato: 15000.50 (sin puntos ni espacios)</p>
              </div>
              <div>
                <Label htmlFor="transfer_amount">Importe en Transferencia</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="transfer_amount"
                    type="text"
                    placeholder="Ej: 5000.00"
                    className="pl-8"
                    value={receiptForm.transfer_amount || "0"}
                    onChange={(e) =>
                      setReceiptForm({ ...receiptForm, transfer_amount: formatCurrencyInput(e.target.value) })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Formato: 5000.00 (sin puntos ni espacios)</p>
              </div>
            </div>

            <div>
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                rows={3}
                placeholder="Observaciones adicionales..."
                value={receiptForm.observations}
                onChange={(e) => setReceiptForm({ ...receiptForm, observations: e.target.value })}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold mb-2">Detalle del Pago</h4>
              <p className="text-sm text-muted-foreground">Cliente: {receiptForm.client_name}</p>
              <p className="text-sm text-muted-foreground">Préstamo: {receiptForm.loan_code}</p>
              <p className="text-sm text-muted-foreground">
                Cuota: {selectedInstallment?.installment_number} de {selectedInstallment?.total_installments}
              </p>
              <p className="text-sm font-semibold">
                Monto: {selectedInstallment ? formatCurrency(selectedInstallment.amount) : "$0.00"}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsReceiptModalOpen(false)} disabled={isCreatingReceipt}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateReceipt}
                disabled={isCreatingReceipt || !receiptForm.client_id}
                className={isCreatingReceipt ? "opacity-50 cursor-not-allowed" : ""}
              >
                {isCreatingReceipt ? "Creando..." : "Crear Recibo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
