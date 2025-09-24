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
import { toast } from "@/hooks/use-toast"
import { Loader2, Receipt, User, Calendar, FileText, Plus } from "lucide-react"

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
  installment_no: number
  due_date: string
  amount_due: number
  amount_paid: number
  status: string
}

interface ReceiptData {
  id: string
  receipt_number: string
  receipt_date: string
  total_amount: number
  cash_amount: number
  transfer_amount: number
  payment_type: string
  observations?: string
  first_name: string
  last_name: string
  client_code: string
  phone?: string
  email?: string
}

export default function ReceiptsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedLoanId, setSelectedLoanId] = useState<string>("")
  const [selectedInstallments, setSelectedInstallments] = useState<string[]>([])
  const [cashAmount, setCashAmount] = useState<string>("")
  const [transferAmount, setTransferAmount] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(true)

  useEffect(() => {
    fetchClients()
    fetchReceipts()
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      fetchLoans(selectedClientId)
    } else {
      setLoans([])
      setSelectedLoanId("")
      setInstallments([])
      setSelectedInstallments([])
    }
  }, [selectedClientId])

  useEffect(() => {
    if (selectedLoanId) {
      fetchInstallments(selectedLoanId)
    } else {
      setInstallments([])
      setSelectedInstallments([])
    }
  }, [selectedLoanId])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("[v0] Error fetching clients:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setIsLoadingClients(false)
    }
  }

  const fetchLoans = async (clientId: string) => {
    try {
      const response = await fetch(`/api/loans?client_id=${clientId}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setLoans(data)
    } catch (error) {
      console.error("[v0] Error fetching loans:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los préstamos",
        variant: "destructive",
      })
    }
  }

  const fetchInstallments = async (loanId: string) => {
    try {
      const response = await fetch(`/api/installments?loan_id=${loanId}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      // Filter only unpaid or partially paid installments
      const unpaidInstallments = data.filter((inst: Installment) => inst.amount_paid < inst.amount_due)
      setInstallments(unpaidInstallments)
    } catch (error) {
      console.error("[v0] Error fetching installments:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuotas",
        variant: "destructive",
      })
    }
  }

  const fetchReceipts = async () => {
    try {
      const response = await fetch("/api/receipts")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setReceipts(data)
    } catch (error) {
      console.error("[v0] Error fetching receipts:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los recibos",
        variant: "destructive",
      })
    } finally {
      setIsLoadingReceipts(false)
    }
  }

  const handleInstallmentToggle = (installmentId: string) => {
    setSelectedInstallments((prev) =>
      prev.includes(installmentId) ? prev.filter((id) => id !== installmentId) : [...prev, installmentId],
    )
  }

  const getTotalAmount = () => {
    const cash = Number.parseFloat(cashAmount) || 0
    const transfer = Number.parseFloat(transferAmount) || 0
    return cash + transfer
  }

  const getSelectedInstallmentsTotal = () => {
    return installments
      .filter((inst) => selectedInstallments.includes(inst.id))
      .reduce((sum, inst) => sum + (inst.amount_due - inst.amount_paid), 0)
  }

  const handleCreateReceipt = async () => {
    if (!selectedClientId || !selectedLoanId || selectedInstallments.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona un cliente, préstamo y al menos una cuota",
        variant: "destructive",
      })
      return
    }

    const totalAmount = getTotalAmount()
    if (totalAmount <= 0) {
      toast({
        title: "Error",
        description: "El monto total debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: selectedClientId,
          loan_id: selectedLoanId,
          installment_ids: selectedInstallments,
          payment_type: selectedInstallments.length === installments.length ? "total" : "partial",
          cash_amount: Number.parseFloat(cashAmount) || 0,
          transfer_amount: Number.parseFloat(transferAmount) || 0,
          total_amount: totalAmount,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error creating receipt")
      }

      const result = await response.json()
      toast({
        title: "Éxito",
        description: result.message,
      })

      // Reset form
      setSelectedClientId("")
      setSelectedLoanId("")
      setSelectedInstallments([])
      setCashAmount("")
      setTransferAmount("")
      setNotes("")

      // Refresh receipts list
      fetchReceipts()
    } catch (error) {
      console.error("[v0] Error creating receipt:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Receipt className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Gestión de Recibos</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receipt Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear Nuevo Recibo
            </CardTitle>
            <CardDescription>Selecciona un cliente, préstamo y cuotas para generar un recibo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={isLoadingClients}>
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

            <div className="space-y-2">
              <Label htmlFor="loan">Préstamo</Label>
              <Select
                value={selectedLoanId}
                onValueChange={setSelectedLoanId}
                disabled={!selectedClientId || loans.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedClientId
                        ? "Primero selecciona un cliente"
                        : loans.length === 0
                          ? "No hay préstamos disponibles"
                          : "Seleccionar préstamo"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {loans.map((loan) => (
                    <SelectItem key={loan.id} value={loan.id}>
                      {loan.loan_code} - {formatCurrency(loan.amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {installments.length > 0 && (
              <div className="space-y-2">
                <Label>Cuotas a Pagar</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {installments.map((installment) => (
                    <div key={installment.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={installment.id}
                        checked={selectedInstallments.includes(installment.id)}
                        onCheckedChange={() => handleInstallmentToggle(installment.id)}
                      />
                      <label
                        htmlFor={installment.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                      >
                        Cuota {installment.installment_no} - {formatDate(installment.due_date)} -{" "}
                        {formatCurrency(installment.amount_due - installment.amount_paid)}
                        {installment.status === "overdue" && (
                          <Badge variant="destructive" className="ml-2">
                            Vencida
                          </Badge>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedInstallments.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Total seleccionado: {formatCurrency(getSelectedInstallmentsTotal())}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cash">Efectivo</Label>
                <Input
                  id="cash"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer">Transferencia</Label>
                <Input
                  id="transfer"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                />
              </div>
            </div>

            {(cashAmount || transferAmount) && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Total del Recibo: {formatCurrency(getTotalAmount())}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Observaciones (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones sobre el pago..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleCreateReceipt} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
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

        {/* Recent Receipts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recibos Recientes
            </CardTitle>
            <CardDescription>Últimos recibos generados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReceipts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Cargando recibos...</span>
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay recibos registrados</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {receipts.slice(0, 10).map((receipt) => (
                  <div key={receipt.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          {receipt.first_name} {receipt.last_name}
                        </span>
                      </div>
                      <Badge variant="secondary">#{receipt.receipt_number}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(receipt.total_amount)}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(receipt.receipt_date)}
                      </div>
                    </div>

                    <div className="flex gap-2 text-sm">
                      {receipt.cash_amount > 0 && (
                        <Badge variant="outline">Efectivo: {formatCurrency(receipt.cash_amount)}</Badge>
                      )}
                      {receipt.transfer_amount > 0 && (
                        <Badge variant="outline">Transferencia: {formatCurrency(receipt.transfer_amount)}</Badge>
                      )}
                    </div>

                    {receipt.observations && <p className="text-sm text-muted-foreground">{receipt.observations}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
