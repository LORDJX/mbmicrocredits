"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Loader2, Receipt, DollarSign, User, Calendar, FileText } from "lucide-react"

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

interface Payment {
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

export default function PagosPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedLoanId, setSelectedLoanId] = useState<string>("")
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [paymentNote, setPaymentNote] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)

  useEffect(() => {
    fetchClients()
    fetchPayments()
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      fetchLoans(selectedClientId)
    } else {
      setLoans([])
      setSelectedLoanId("")
    }
  }, [selectedClientId])

  const fetchClients = async () => {
    try {
      console.log("[v0] Fetching clients...")
      const response = await fetch("/api/clients")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("[v0] Clients fetched:", data.length)
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
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

  const fetchPayments = async () => {
    try {
      console.log("[v0] Fetching payments...")
      const response = await fetch("/api/payments")

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.log("[v0] Non-JSON Response:", await response.text())
        throw new Error("API returned non-JSON response")
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Payments fetched:", data.length)
      setPayments(data)
    } catch (error) {
      console.error("[v0] Error fetching payments:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const handleCreatePayment = async () => {
    if (!selectedLoanId || !paymentAmount || Number.parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona un préstamo e ingresa un monto válido",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loan_id: selectedLoanId,
          paid_amount: Number.parseFloat(paymentAmount),
          note: paymentNote || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error creating payment")
      }

      const result = await response.json()
      toast({
        title: "Éxito",
        description: result.message,
      })

      // Reset form
      setSelectedClientId("")
      setSelectedLoanId("")
      setPaymentAmount("")
      setPaymentNote("")

      // Refresh payments list
      fetchPayments()
    } catch (error) {
      console.error("[v0] Error creating payment:", error)
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
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Receipt className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Registrar Nuevo Pago
            </CardTitle>
            <CardDescription>Selecciona un cliente y préstamo para registrar un pago</CardDescription>
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
                      {loan.loan_code} - {formatCurrency(loan.amount)} ({loan.installments} cuotas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto del Pago</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Nota (opcional)</Label>
              <Textarea
                id="note"
                placeholder="Observaciones sobre el pago..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleCreatePayment} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Registrar Pago
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pagos Recientes
            </CardTitle>
            <CardDescription>Últimos pagos registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPayments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Cargando pagos...</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay pagos registrados</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {payments.slice(0, 10).map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          {payment.loans.clients.first_name} {payment.loans.clients.last_name}
                        </span>
                      </div>
                      <Badge variant="secondary">{payment.loans.loan_code}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(payment.paid_amount)}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(payment.paid_at)}
                      </div>
                    </div>

                    {payment.note && <p className="text-sm text-muted-foreground">{payment.note}</p>}

                    {payment.payment_imputations.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Cuotas imputadas:</p>
                        <div className="flex flex-wrap gap-1">
                          {payment.payment_imputations.map((imputation) => (
                            <Badge key={imputation.id} variant="outline" className="text-xs">
                              Cuota {imputation.installments.installment_no}:{" "}
                              {formatCurrency(imputation.imputed_amount)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
