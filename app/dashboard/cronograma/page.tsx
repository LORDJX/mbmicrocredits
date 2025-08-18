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
import { Calendar, AlertTriangle, DollarSign, Plus } from "lucide-react"
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

export default function CronogramaPage() {
  const [todayInstallments, setTodayInstallments] = useState<Installment[]>([])
  const [overdueInstallments, setOverdueInstallments] = useState<Installment[]>([])
  const [monthInstallments, setMonthInstallments] = useState<Installment[]>([])
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
    cash_amount: "",
    transfer_amount: "0",
    observations: "",
  })
  const [isCreatingReceipt, setIsCreatingReceipt] = useState(false)

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
        setSummary(data.summary || {})
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
    if (isCreatingReceipt) return // Prevent multiple clicks

    try {
      setIsCreatingReceipt(true)

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

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Recibo creado exitosamente")

        if (selectedInstallment) {
          const updateInstallmentStatus = (installments: Installment[]) =>
            installments.map((inst) =>
              inst.id === selectedInstallment.id ? { ...inst, status: "paid" as const } : inst,
            )

          setTodayInstallments((prev) => updateInstallmentStatus(prev))
          setOverdueInstallments((prev) => updateInstallmentStatus(prev))
          setMonthInstallments((prev) => updateInstallmentStatus(prev))
        }

        setIsReceiptModalOpen(false)
        setSelectedInstallment(null)
        setReceiptForm({
          receipt_date: new Date().toISOString().split("T")[0],
          client_id: "",
          client_name: "",
          loan_code: "",
          payment_type: "Total",
          cash_amount: "",
          transfer_amount: "0",
          observations: "",
        })

        setTimeout(() => {
          fetchCronogramaData()
        }, 500)
      } else {
        toast.error("Error al crear recibo: " + (result.error || "Error desconocido"))
      }
    } catch (error) {
      console.error("Error creating receipt:", error)
      toast.error("Error al crear recibo")
    } finally {
      setIsCreatingReceipt(false)
    }
  }

  const InstallmentCard = ({ installment }: { installment: Installment }) => (
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
              {installment.status === "overdue" ? "Vencida" : installment.status === "paid" ? "Pagada" : "Pendiente"}
            </Badge>
            {installment.status !== "paid" && (
              <Button size="sm" className="w-full mt-2" onClick={() => openReceiptModal(installment)}>
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Recibo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sección HOY */}
        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Calendar className="h-5 w-5" />
                Hoy
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
                {todayInstallments.length > 0 ? (
                  todayInstallments.map((installment) => (
                    <InstallmentCard key={installment.id} installment={installment} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay cuotas para hoy</p>
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4 bg-white/50 p-3 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Total vencido:</span>
                  <span className="font-bold text-lg text-red-700">{formatCurrency(summary.total_overdue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Cobrado este mes:</span>
                  <span className="font-bold text-lg text-green-700">
                    {formatCurrency(summary.total_received_month)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {overdueInstallments.length > 0 ? (
                  overdueInstallments.map((installment) => (
                    <InstallmentCard key={installment.id} installment={installment} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay cuotas vencidas</p>
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4 bg-white/50 p-3 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Total a cobrar:</span>
                  <span className="font-bold text-lg text-gray-800">{formatCurrency(summary.total_due_month)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Ya cobrado:</span>
                  <span className="font-bold text-lg text-green-700">
                    {formatCurrency(summary.total_received_month)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span className="font-semibold text-gray-800">Pendiente:</span>
                  <span className="font-bold text-xl text-orange-600">
                    {formatCurrency(summary.total_due_month - summary.total_received_month)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {monthInstallments.length > 0 ? (
                  monthInstallments.map((installment) => (
                    <InstallmentCard key={installment.id} installment={installment} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay cuotas para este mes</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Modal */}
      <Dialog
        open={isReceiptModalOpen}
        onOpenChange={(open) => {
          if (!isCreatingReceipt) {
            setIsReceiptModalOpen(open)
          }
        }}
      >
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
                    value={receiptForm.cash_amount}
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
                    value={receiptForm.transfer_amount}
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
              <Button
                variant="outline"
                onClick={() => {
                  if (!isCreatingReceipt) {
                    setIsReceiptModalOpen(false)
                  }
                }}
                disabled={isCreatingReceipt}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateReceipt} disabled={isCreatingReceipt || !receiptForm.client_id}>
                {isCreatingReceipt ? "Creando..." : "Crear Recibo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
