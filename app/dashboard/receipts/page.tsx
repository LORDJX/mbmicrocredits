"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Loader2, Receipt, DollarSign, User, Calendar, Calculator } from "lucide-react"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
}

interface Loan {
  id: string
  loan_code: string
  amount: number
  status: string
  installments: number
}

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
  status: string
  loans: {
    loan_code: string
    client_id: string
    clients: {
      client_code: string
      first_name: string
      last_name: string
    }
  }
}

interface SelectedInstallment extends Installment {
  selected: boolean
  partial_payment?: number
}

interface ReceiptFormData {
  client_id: string
  payment_type: "total" | "partial"
  cash_amount: string
  transfer_amount: string
  observations: string
  selected_installments: SelectedInstallment[]
}

export default function ReceiptsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [selectedInstallments, setSelectedInstallments] = useState<SelectedInstallment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false)

  const [formData, setFormData] = useState<ReceiptFormData>({
    client_id: "",
    payment_type: "total",
    cash_amount: "",
    transfer_amount: "",
    observations: "",
    selected_installments: [],
  })

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    if (formData.client_id) {
      fetchPendingInstallments(formData.client_id)
    } else {
      setInstallments([])
      setSelectedInstallments([])
    }
  }, [formData.client_id])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setIsLoadingClients(false)
    }
  }

  const fetchPendingInstallments = async (clientId: string) => {
    try {
      setIsLoadingInstallments(true)
      const response = await fetch(`/api/installments?client_id=${clientId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      const pendingInstallments = data.filter(
        (inst: Installment) =>
          inst.balance_due > 0 &&
          (inst.status === "a_pagar" || inst.status === "a_pagar_hoy" || inst.status === "vencida"),
      )

      setInstallments(pendingInstallments)
      setSelectedInstallments([])
    } catch (error) {
      console.error("Error fetching installments:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuotas pendientes",
        variant: "destructive",
      })
    } finally {
      setIsLoadingInstallments(false)
    }
  }

  const handleInstallmentSelection = (installment: Installment, selected: boolean) => {
    if (selected) {
      const newSelected: SelectedInstallment = {
        ...installment,
        selected: true,
        partial_payment: installment.balance_due,
      }
      setSelectedInstallments((prev) => [...prev, newSelected])
    } else {
      setSelectedInstallments((prev) => prev.filter((item) => item.id !== installment.id))
    }
  }

  const handlePartialPaymentChange = (installmentId: string, amount: string) => {
    const numAmount = Number.parseFloat(amount) || 0
    setSelectedInstallments((prev) =>
      prev.map((item) =>
        item.id === installmentId ? { ...item, partial_payment: Math.min(numAmount, item.balance_due) } : item,
      ),
    )
  }

  const calculateTotalAmount = () => {
    if (formData.payment_type === "total") {
      return selectedInstallments.reduce((sum, item) => sum + item.balance_due, 0)
    } else {
      return selectedInstallments.reduce((sum, item) => sum + (item.partial_payment || 0), 0)
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

  const handleCreateReceipt = async () => {
    if (!formData.client_id || selectedInstallments.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona un cliente y al menos una cuota",
        variant: "destructive",
      })
      return
    }

    const totalAmount = calculateTotalAmount()
    const cashAmount = Number.parseFloat(formData.cash_amount) || 0
    const transferAmount = Number.parseFloat(formData.transfer_amount) || 0
    const paymentTotal = cashAmount + transferAmount

    if (Math.abs(paymentTotal - totalAmount) > 0.01) {
      toast({
        title: "Error",
        description: "El monto total del pago debe coincidir con el monto de las cuotas seleccionadas",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const receiptData = {
        client_id: formData.client_id,
        payment_type: formData.payment_type,
        cash_amount: cashAmount,
        transfer_amount: transferAmount,
        total_amount: totalAmount,
        observations: formData.observations,
        selected_installments: selectedInstallments.map((item) => ({
          installment_id: item.id,
          amount_to_pay: formData.payment_type === "total" ? item.balance_due : item.partial_payment || 0,
          is_partial: formData.payment_type === "partial" && (item.partial_payment || 0) < item.balance_due,
        })),
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error creating receipt")
      }

      const result = await response.json()
      toast({
        title: "Éxito",
        description: `Recibo ${result.receipt_number} creado exitosamente`,
      })

      setFormData({
        client_id: "",
        payment_type: "total",
        cash_amount: "",
        transfer_amount: "",
        observations: "",
        selected_installments: [],
      })
      setSelectedInstallments([])
      setInstallments([])
    } catch (error) {
      console.error("Error creating receipt:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalSuggested = calculateTotalAmount()
  const cashAmount = Number.parseFloat(formData.cash_amount) || 0
  const transferAmount = Number.parseFloat(formData.transfer_amount) || 0
  const paymentTotal = cashAmount + transferAmount

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Receipt className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Crear Recibo de Pago</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulario Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, client_id: value }))}
                  disabled={isLoadingClients}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingClients ? "Cargando clientes..." : "Seleccionar cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.client_code} - {client.first_name} {client.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cuotas Pendientes */}
          {formData.client_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Cuotas Pendientes de Pago
                </CardTitle>
                <CardDescription>Selecciona las cuotas que deseas incluir en el recibo</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInstallments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Cargando cuotas...</span>
                  </div>
                ) : installments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay cuotas pendientes para este cliente
                  </div>
                ) : (
                  <div className="space-y-3">
                    {installments.map((installment) => {
                      const isSelected = selectedInstallments.some((item) => item.id === installment.id)
                      const selectedItem = selectedInstallments.find((item) => item.id === installment.id)

                      return (
                        <div key={installment.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleInstallmentSelection(installment, checked as boolean)
                                }
                              />
                              <div>
                                <div className="font-medium">
                                  Cuota {installment.installment_no}/{installment.installments_total}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {installment.code} - Vence: {formatDate(installment.due_date)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(installment.balance_due)}</div>
                              <Badge
                                variant={installment.status === "vencida" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {installment.status === "vencida"
                                  ? "Vencida"
                                  : installment.status === "a_pagar_hoy"
                                    ? "Vence Hoy"
                                    : "A Pagar"}
                              </Badge>
                            </div>
                          </div>

                          {isSelected && formData.payment_type === "partial" && (
                            <div className="pl-6 space-y-2">
                              <Label htmlFor={`partial-${installment.id}`} className="text-sm">
                                Monto a pagar (máximo: {formatCurrency(installment.balance_due)})
                              </Label>
                              <Input
                                id={`partial-${installment.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                max={installment.balance_due}
                                value={selectedItem?.partial_payment || ""}
                                onChange={(e) => handlePartialPaymentChange(installment.id, e.target.value)}
                                className="w-48"
                                placeholder="0.00"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tipo de Pago */}
          {selectedInstallments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Tipo de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={formData.payment_type}
                  onValueChange={(value: "total" | "partial") =>
                    setFormData((prev) => ({ ...prev, payment_type: value }))
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="total" id="total" />
                    <Label htmlFor="total">Pago Total - Pagar el saldo completo de las cuotas seleccionadas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="partial" />
                    <Label htmlFor="partial">Pago Parcial - Especificar monto para cada cuota</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumen y Pago */}
        <div className="space-y-6">
          {/* Resumen del Pago */}
          {selectedInstallments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumen del Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cuotas seleccionadas:</span>
                    <span>{selectedInstallments.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tipo de pago:</span>
                    <span>{formData.payment_type === "total" ? "Total" : "Parcial"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total sugerido:</span>
                    <span className="text-green-600">{formatCurrency(totalSuggested)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cash">$ Efectivo</Label>
                    <Input
                      id="cash"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.cash_amount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cash_amount: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transfer">$ Transferencia</Label>
                    <Input
                      id="transfer"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.transfer_amount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, transfer_amount: e.target.value }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold">
                    <span>Total pagado:</span>
                    <span className={paymentTotal === totalSuggested ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(paymentTotal)}
                    </span>
                  </div>

                  {Math.abs(paymentTotal - totalSuggested) > 0.01 && (
                    <div className="text-sm text-red-600">
                      Diferencia: {formatCurrency(paymentTotal - totalSuggested)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea
                    id="observations"
                    placeholder="Notas adicionales sobre el pago..."
                    value={formData.observations}
                    onChange={(e) => setFormData((prev) => ({ ...prev, observations: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleCreateReceipt}
                  disabled={
                    isLoading || selectedInstallments.length === 0 || Math.abs(paymentTotal - totalSuggested) > 0.01
                  }
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando Recibo...
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-4 w-4" />
                      Crear Recibo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Cuotas Seleccionadas */}
          {selectedInstallments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cuotas Seleccionadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedInstallments.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>Cuota {item.installment_no}</span>
                      <span>
                        {formData.payment_type === "total"
                          ? formatCurrency(item.balance_due)
                          : formatCurrency(item.partial_payment || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
