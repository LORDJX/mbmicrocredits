"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Receipt, Search, Plus, Calendar, DollarSign } from "lucide-react"
import { toast } from "sonner"

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
}

interface Installment {
  id: string
  code: string
  installment_no: number
  due_date: string
  amount_due: number
  amount_paid: number
  balance_due: number
  status: string
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [selectedInstallments, setSelectedInstallments] = useState<string[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNote, setPaymentNote] = useState("")

  // Fetch clients
  useEffect(() => {
    fetchClients()
    fetchPayments()
  }, [])

  const fetchClients = async () => {
    try {
      console.log("[v0] Fetching clients...")
      const response = await fetch("/api/clients")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.log("[v0] Non-JSON Response:", text.substring(0, 500) + "...")
        throw new Error("API returned non-JSON response")
      }

      const data = await response.json()
      console.log("[v0] Clients fetched:", data.length)
      setClients(data)
    } catch (error) {
      console.error("[v0] Error fetching clients:", error)
      toast.error("Error al cargar clientes")
    }
  }

  const fetchPayments = async () => {
    try {
      console.log("[v0] Fetching payments...")
      const response = await fetch("/api/payments")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.log("[v0] Non-JSON Response:", text.substring(0, 500) + "...")
        throw new Error("API returned non-JSON response")
      }

      const data = await response.json()
      console.log("[v0] Payments fetched:", data.length)
      setPayments(data)
    } catch (error) {
      console.error("[v0] Error fetching payments:", error)
      toast.error("Error al cargar pagos")
    }
  }

  const fetchLoans = async (clientId: string) => {
    try {
      const response = await fetch(`/api/loans?client_id=${clientId}`)
      if (!response.ok) throw new Error("Error fetching loans")

      const data = await response.json()
      console.log("[v0] Loans fetched:", data.length)
      setLoans(data)
    } catch (error) {
      console.error("Error fetching loans:", error)
      toast.error("Error al cargar préstamos")
    }
  }

  const fetchInstallments = async (loanId: string) => {
    try {
      const response = await fetch(`/api/installments?loan_id=${loanId}`)
      if (!response.ok) throw new Error("Error fetching installments")

      const data = await response.json()
      console.log("[v0] Installments fetched:", data.length)
      setInstallments(data)
    } catch (error) {
      console.error("Error fetching installments:", error)
      toast.error("Error al cargar cuotas")
    }
  }

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    setSelectedClient(client || null)
    setSelectedLoan(null)
    setLoans([])
    setInstallments([])
    setSelectedInstallments([])

    if (client) {
      fetchLoans(clientId)
    }
  }

  const handleLoanSelect = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId)
    setSelectedLoan(loan || null)
    setInstallments([])
    setSelectedInstallments([])

    if (loan) {
      fetchInstallments(loanId)
    }
  }

  const handleCreatePayment = async () => {
    if (!selectedLoan || !paymentAmount || Number.parseFloat(paymentAmount) <= 0) {
      toast.error("Seleccione un préstamo y ingrese un monto válido")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loan_id: selectedLoan.id,
          paid_amount: Number.parseFloat(paymentAmount),
          note: paymentNote || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error creating payment")
      }

      const result = await response.json()
      toast.success(result.message)

      // Reset form
      setPaymentAmount("")
      setPaymentNote("")

      // Refresh data
      fetchPayments()
      if (selectedLoan) {
        fetchInstallments(selectedLoan.id)
      }
    } catch (error: any) {
      console.error("Error creating payment:", error)
      toast.error(error.message || "Error al crear el pago")
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Pagos</h1>
          <p className="text-muted-foreground">Registre y gestione los pagos de préstamos</p>
        </div>
        <Receipt className="h-8 w-8 text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Pago
            </CardTitle>
            <CardDescription>Registre un nuevo pago para un préstamo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client-search">Buscar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client-search"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchTerm && (
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        handleClientSelect(client.id)
                        setSearchTerm(`${client.first_name} ${client.last_name}`)
                      }}
                    >
                      <div className="font-medium">
                        {client.first_name} {client.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{client.client_code}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Loan Selection */}
            {selectedClient && (
              <div className="space-y-2">
                <Label>Préstamo</Label>
                <Select onValueChange={handleLoanSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar préstamo" />
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
            )}

            {/* Payment Amount */}
            {selectedLoan && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto del Pago</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Observaciones (Opcional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Notas adicionales sobre el pago..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </div>

                <Button onClick={handleCreatePayment} disabled={loading || !paymentAmount} className="w-full">
                  {loading ? "Procesando..." : "Registrar Pago"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Installments Preview */}
        {selectedLoan && installments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cuotas del Préstamo
              </CardTitle>
              <CardDescription>
                {selectedLoan.loan_code} - {selectedClient?.first_name} {selectedClient?.last_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {installments.map((installment) => (
                  <div key={installment.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">Cuota {installment.installment_no}</div>
                      <div className="text-sm text-muted-foreground">Vence: {formatDate(installment.due_date)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(installment.balance_due)}</div>
                      <Badge variant={installment.status === "paid" ? "default" : "secondary"}>
                        {installment.status === "paid" ? "Pagada" : "Pendiente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pagos Recientes
          </CardTitle>
          <CardDescription>Últimos pagos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">
                    {payment.loans.clients.first_name} {payment.loans.clients.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {payment.loans.loan_code} • {formatDate(payment.paid_at)}
                  </div>
                  {payment.note && <div className="text-sm text-muted-foreground italic">{payment.note}</div>}
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{formatCurrency(payment.paid_amount)}</div>
                  <div className="text-sm text-muted-foreground">{payment.payment_imputations.length} cuota(s)</div>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No hay pagos registrados</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
