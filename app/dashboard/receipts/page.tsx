"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Receipt, Search, Filter, Printer, MessageCircle, Plus, DollarSign, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
}

interface Loan {
  id: string
  loan_code: string
  client_id: string
}

interface Installment {
  id: string
  loan_id: string
  installment_no: number
  amount_due: number
  amount_paid: number
  balance_due: number
  due_date: string
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

interface ReceiptFormData {
  client_id: string
  loan_id: string
  installment_ids: string[]
  payment_type: "efectivo" | "transferencia" | "cheque"
  total_amount: number
  note: string
}

export default function ReceiptsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<ReceiptFormData>({
    client_id: "",
    loan_id: "",
    installment_ids: [],
    payment_type: "efectivo",
    total_amount: 0,
    note: "",
  })

  // Fetch payments (receipts)
  const fetchPayments = async () => {
    try {
      console.log("[v0] Fetching payments...")
      const response = await fetch("/api/payments")

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("[v0] Non-JSON Response:", responseText)
        throw new Error("API returned non-JSON response")
      }

      const data = await response.json()
      console.log("[v0] Payments fetched successfully:", data.length)
      setPayments(data)
    } catch (err) {
      console.error("[v0] Error fetching payments:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  // Fetch clients
  const fetchClients = async () => {
    try {
      console.log("[v0] Fetching clients...")
      const response = await fetch("/api/loans?clients_only=true")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Clients fetched:", data.length)
      setClients(data)
    } catch (err) {
      console.error("[v0] Error fetching clients:", err)
    }
  }

  // Fetch loans for selected client
  const fetchLoansForClient = async (clientId: string) => {
    try {
      console.log("[v0] Fetching loans for client:", clientId)
      const response = await fetch(`/api/loans?client_id=${clientId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Loans fetched:", data.length)
      setLoans(data)
    } catch (err) {
      console.error("[v0] Error fetching loans:", err)
    }
  }

  // Fetch installments for selected loan
  const fetchInstallmentsForLoan = async (loanId: string) => {
    try {
      console.log("[v0] Fetching installments for loan:", loanId)
      const response = await fetch(`/api/installments?loan_id=${loanId}&status=pending`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Installments fetched:", data.length)
      setInstallments(data)
    } catch (err) {
      console.error("[v0] Error fetching installments:", err)
    }
  }

  // Create receipt
  const createReceipt = async () => {
    try {
      console.log("[v0] Creating receipt:", formData)
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loan_id: formData.loan_id,
          paid_amount: formData.total_amount,
          note: `${formData.payment_type.toUpperCase()} - ${formData.note}`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error creating receipt")
      }

      const result = await response.json()
      console.log("[v0] Receipt created successfully:", result)

      // Reset form and refresh data
      setFormData({
        client_id: "",
        loan_id: "",
        installment_ids: [],
        payment_type: "efectivo",
        total_amount: 0,
        note: "",
      })
      setShowForm(false)
      await fetchPayments()
    } catch (err) {
      console.error("[v0] Error creating receipt:", err)
      setError(err instanceof Error ? err.message : "Error creating receipt")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        await Promise.all([fetchPayments(), fetchClients()])
      } catch (err) {
        console.error("[v0] Error loading data:", err)
        setError("Error cargando datos")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    setFormData((prev) => ({ ...prev, client_id: clientId, loan_id: "", installment_ids: [] }))
    setLoans([])
    setInstallments([])
    if (clientId) {
      fetchLoansForClient(clientId)
    }
  }

  // Handle loan selection
  const handleLoanChange = (loanId: string) => {
    setFormData((prev) => ({ ...prev, loan_id: loanId, installment_ids: [] }))
    setInstallments([])
    if (loanId) {
      fetchInstallmentsForLoan(loanId)
    }
  }

  // Handle installment selection
  const handleInstallmentToggle = (installmentId: string, amount: number) => {
    setFormData((prev) => {
      const isSelected = prev.installment_ids.includes(installmentId)
      const newIds = isSelected
        ? prev.installment_ids.filter((id) => id !== installmentId)
        : [...prev.installment_ids, installmentId]

      const newAmount = isSelected ? prev.total_amount - amount : prev.total_amount + amount

      return {
        ...prev,
        installment_ids: newIds,
        total_amount: newAmount,
      }
    })
  }

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      searchTerm === "" ||
      payment.loans.clients.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.loans.clients.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.loans.loan_code.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterType === "all" || (payment.note && payment.note.toLowerCase().includes(filterType.toLowerCase()))

    return matchesSearch && matchesFilter
  })

  // Calculate summary stats
  const todayPayments = payments.filter(
    (p) => format(new Date(p.paid_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
  )
  const monthlyPayments = payments.filter(
    (p) => format(new Date(p.paid_at), "yyyy-MM") === format(new Date(), "yyyy-MM"),
  )

  const todayTotal = todayPayments.reduce((sum, p) => sum + p.paid_amount, 0)
  const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + p.paid_amount, 0)

  // WhatsApp and Print functions
  const sendWhatsApp = (payment: Payment) => {
    const client = payment.loans.clients
    const message = `Hola ${client.first_name}! Te confirmamos el pago de $${payment.paid_amount} para el préstamo ${payment.loans.loan_code}. Fecha: ${format(new Date(payment.paid_at), "dd/MM/yyyy HH:mm", { locale: es })}. ¡Gracias!`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const printReceipt = (payment: Payment) => {
    const client = payment.loans.clients
    const printContent = `
      RECIBO DE PAGO
      
      Cliente: ${client.first_name} ${client.last_name}
      Código: ${client.client_code}
      Préstamo: ${payment.loans.loan_code}
      
      Monto: $${payment.paid_amount}
      Fecha: ${format(new Date(payment.paid_at), "dd/MM/yyyy HH:mm", { locale: es })}
      
      ${payment.note ? `Nota: ${payment.note}` : ""}
      
      Cuotas imputadas:
      ${payment.payment_imputations
        .map((imp) => `- Cuota ${imp.installments.installment_no}: $${imp.imputed_amount}`)
        .join("\n")}
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`<pre>${printContent}</pre>`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando recibos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recibos</h1>
          <p className="text-muted-foreground">Gestiona los recibos de pago de tus clientes</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Recibo
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error: {error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setError(null)
                fetchPayments()
              }}
              className="mt-2"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibos Totales</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">Total de recibos emitidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recaudación Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${todayTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{todayPayments.length} recibos hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recaudación Mensual</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{monthlyPayments.length} recibos este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* New Receipt Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Recibo</CardTitle>
            <CardDescription>Crea un nuevo recibo de pago</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select value={formData.client_id} onValueChange={handleClientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} ({client.client_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loan">Préstamo</Label>
                <Select value={formData.loan_id} onValueChange={handleLoanChange} disabled={!formData.client_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar préstamo" />
                  </SelectTrigger>
                  <SelectContent>
                    {loans.map((loan) => (
                      <SelectItem key={loan.id} value={loan.id}>
                        {loan.loan_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_type">Tipo de Pago</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(value: any) => setFormData((prev) => ({ ...prev, payment_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Installments Selection */}
            {installments.length > 0 && (
              <div className="space-y-2">
                <Label>Cuotas a Imputar</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                  {installments.map((installment) => (
                    <div key={installment.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={installment.id}
                        checked={formData.installment_ids.includes(installment.id)}
                        onChange={() => handleInstallmentToggle(installment.id, installment.balance_due)}
                        className="rounded"
                      />
                      <label htmlFor={installment.id} className="text-sm flex-1">
                        Cuota {installment.installment_no} - ${installment.balance_due}
                        <span className="text-muted-foreground ml-2">
                          (Vence: {format(new Date(installment.due_date), "dd/MM/yyyy")})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="total_amount">Monto Total</Label>
              <Input
                id="total_amount"
                type="number"
                value={formData.total_amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, total_amount: Number.parseFloat(e.target.value) || 0 }))
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Nota (Opcional)</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Observaciones adicionales..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createReceipt}
                disabled={!formData.client_id || !formData.loan_id || formData.total_amount <= 0}
              >
                Crear Recibo
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente o préstamo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Receipts List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron recibos</p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {payment.loans.clients.first_name} {payment.loans.clients.last_name}
                      </h3>
                      <Badge variant="outline">{payment.loans.clients.client_code}</Badge>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Préstamo: {payment.loans.loan_code}</p>
                      <p>Fecha: {format(new Date(payment.paid_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                      {payment.note && <p>Nota: {payment.note}</p>}
                    </div>

                    {payment.payment_imputations.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Cuotas imputadas:</p>
                        <div className="space-y-1">
                          {payment.payment_imputations.map((imp) => (
                            <div key={imp.id} className="text-xs text-muted-foreground">
                              Cuota {imp.installments.installment_no}: ${imp.imputed_amount}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-green-600">${payment.paid_amount.toLocaleString()}</div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => printReceipt(payment)} className="gap-1">
                        <Printer className="h-3 w-3" />
                        Imprimir
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => sendWhatsApp(payment)} className="gap-1">
                        <MessageCircle className="h-3 w-3" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
