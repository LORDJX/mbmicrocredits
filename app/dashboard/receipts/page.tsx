"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Receipt, Plus, Search, MessageCircle, Printer } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
  phone: string
}

interface Loan {
  id: string
  loan_code: string
  amount: number
  status: string
}

interface Installment {
  id: string
  installment_no: number
  due_date: string
  amount_due: number
  amount_paid: number
  balance_due: number
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
  observations: string
  client_id: string
  clients: {
    first_name: string
    last_name: string
    phone: string
    client_code: string
  }
  selected_loans: any[]
  selected_installments: any[]
}

interface PaymentData {
  id: string
  paid_amount: number
  paid_at: string
  note: string
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

export default function ReceiptsPage() {
  const [showForm, setShowForm] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientLoans, setClientLoans] = useState<Loan[]>([])
  const [clientInstallments, setClientInstallments] = useState<Installment[]>([])
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  // Form state
  const [formData, setFormData] = useState({
    receipt_number: "",
    receipt_date: new Date().toISOString().split("T")[0],
    total_amount: 0,
    cash_amount: 0,
    transfer_amount: 0,
    payment_type: "efectivo",
    observations: "",
    selected_loans: [] as string[],
    selected_installments: [] as string[],
  })

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchClients()
    fetchReceipts()
    fetchPayments()
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, client_code, first_name, last_name, phone")
        .eq("status", "active")
        .order("first_name")

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    }
  }

  const fetchClientData = async (clientId: string) => {
    try {
      setLoading(true)

      // Fetch client loans
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("id, loan_code, amount, status")
        .eq("client_id", clientId)
        .eq("status", "active")

      if (loansError) throw loansError
      setClientLoans(loansData || [])

      // Fetch client installments
      const { data: installmentsData, error: installmentsError } = await supabase
        .from("installments_with_status")
        .select(`
          id, loan_id, installment_no, due_date, amount_due, 
          amount_paid, balance_due, status
        `)
        .in(
          "loan_id",
          (loansData || []).map((l) => l.id),
        )
        .gt("balance_due", 0)
        .order("due_date")

      if (installmentsError) throw installmentsError
      setClientInstallments(installmentsData || [])
    } catch (error) {
      console.error("Error fetching client data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del cliente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from("receipts")
        .select(`
          id, receipt_number, receipt_date, total_amount, cash_amount,
          transfer_amount, payment_type, observations, client_id,
          selected_loans, selected_installments,
          clients!inner(first_name, last_name, phone, client_code)
        `)
        .order("receipt_date", { ascending: false })

      if (error) throw error
      setReceipts(data || [])
    } catch (error) {
      console.error("Error fetching receipts:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los recibos",
        variant: "destructive",
      })
    }
  }

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments")
      if (!response.ok) throw new Error("Failed to fetch payments")

      const data = await response.json()
      setPayments(data || [])
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos",
        variant: "destructive",
      })
    }
  }

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    setSelectedClient(client || null)
    if (client) {
      fetchClientData(clientId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return

    try {
      setLoading(true)

      const receiptData = {
        receipt_number: formData.receipt_number,
        receipt_date: formData.receipt_date,
        total_amount: formData.total_amount,
        cash_amount: formData.cash_amount,
        transfer_amount: formData.transfer_amount,
        payment_type: formData.payment_type,
        observations: formData.observations,
        client_id: selectedClient.id,
        selected_loans: formData.selected_loans,
        selected_installments: formData.selected_installments,
      }

      const { data, error } = await supabase.from("receipts").insert([receiptData]).select()

      if (error) throw error

      if (formData.selected_installments.length > 0 && formData.total_amount > 0) {
        // Get the loan_id from the first selected installment
        const firstInstallment = clientInstallments.find((i) => formData.selected_installments.includes(i.id))

        if (firstInstallment) {
          const paymentResponse = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              loan_id: firstInstallment.loan_id,
              paid_amount: formData.total_amount,
              note: `Recibo #${formData.receipt_number} - ${formData.observations}`,
            }),
          })

          if (!paymentResponse.ok) {
            console.warn("Failed to create payment record")
          }
        }
      }

      toast({
        title: "Éxito",
        description: "Recibo creado correctamente",
      })

      // Reset form
      setFormData({
        receipt_number: "",
        receipt_date: new Date().toISOString().split("T")[0],
        total_amount: 0,
        cash_amount: 0,
        transfer_amount: 0,
        payment_type: "efectivo",
        observations: "",
        selected_loans: [],
        selected_installments: [],
      })
      setSelectedClient(null)
      setClientLoans([])
      setClientInstallments([])
      setShowForm(false)

      // Refresh data
      fetchReceipts()
      fetchPayments()
    } catch (error) {
      console.error("Error creating receipt:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el recibo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = (receipt: ReceiptData) => {
    if (!receipt.clients.phone) {
      toast({
        title: "Error",
        description: "El cliente no tiene número de teléfono registrado",
        variant: "destructive",
      })
      return
    }

    const message = `🧾 *RECIBO DE PAGO* 🧾

📋 *Recibo:* ${receipt.receipt_number}
📅 *Fecha:* ${format(new Date(receipt.receipt_date), "dd/MM/yyyy", { locale: es })}
👤 *Cliente:* ${receipt.clients.first_name} ${receipt.clients.last_name}

💰 *DETALLE DEL PAGO:*
• Total Recibido: $${receipt.total_amount.toLocaleString()}
${receipt.cash_amount > 0 ? `• Efectivo: $${receipt.cash_amount.toLocaleString()}` : ""}
${receipt.transfer_amount > 0 ? `• Transferencia: $${receipt.transfer_amount.toLocaleString()}` : ""}

${receipt.observations ? `📝 *Observaciones:* ${receipt.observations}` : ""}

✅ *Pago registrado exitosamente*
¡Gracias por su puntualidad! 🙏

_Microcréditos - Sistema de Gestión_`

    const phone = receipt.clients.phone.replace(/\D/g, "")
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${receipt.clients.first_name} ${receipt.clients.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.clients.client_code.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterType === "all" || receipt.payment_type === filterType

    return matchesSearch && matchesFilter
  })

  const totalReceived = receipts.reduce((sum, r) => sum + r.total_amount, 0)
  const todayReceipts = receipts.filter((r) => r.receipt_date === new Date().toISOString().split("T")[0])
  const todayTotal = todayReceipts.reduce((sum, r) => sum + r.total_amount, 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Recibos</h1>
          <p className="text-muted-foreground">Crear y administrar recibos de pago</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          {showForm ? "Cancelar" : "Nuevo Recibo"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recibos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recaudado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalReceived.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recibos Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayReceipts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recaudado Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${todayTotal.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Crear Nuevo Recibo
            </CardTitle>
            <CardDescription>Complete los datos del recibo de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="receipt_number">Número de Recibo</Label>
                  <Input
                    id="receipt_number"
                    value={formData.receipt_number}
                    onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                    placeholder="Ej: REC-001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="receipt_date">Fecha</Label>
                  <Input
                    id="receipt_date"
                    type="date"
                    value={formData.receipt_date}
                    onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="client">Cliente</Label>
                <Select onValueChange={handleClientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
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

              {selectedClient && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="total_amount">Monto Total</Label>
                      <Input
                        id="total_amount"
                        type="number"
                        step="0.01"
                        value={formData.total_amount}
                        onChange={(e) =>
                          setFormData({ ...formData, total_amount: Number.parseFloat(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cash_amount">Efectivo</Label>
                      <Input
                        id="cash_amount"
                        type="number"
                        step="0.01"
                        value={formData.cash_amount}
                        onChange={(e) =>
                          setFormData({ ...formData, cash_amount: Number.parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="transfer_amount">Transferencia</Label>
                      <Input
                        id="transfer_amount"
                        type="number"
                        step="0.01"
                        value={formData.transfer_amount}
                        onChange={(e) =>
                          setFormData({ ...formData, transfer_amount: Number.parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="payment_type">Tipo de Pago</Label>
                    <Select
                      value={formData.payment_type}
                      onValueChange={(value) => setFormData({ ...formData, payment_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="mixto">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {clientInstallments.length > 0 && (
                    <div>
                      <Label>Cuotas a Imputar (Opcional)</Label>
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                        {clientInstallments.map((installment) => (
                          <div key={installment.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`installment-${installment.id}`}
                              checked={formData.selected_installments.includes(installment.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    selected_installments: [...formData.selected_installments, installment.id],
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    selected_installments: formData.selected_installments.filter(
                                      (id) => id !== installment.id,
                                    ),
                                  })
                                }
                              }}
                            />
                            <label htmlFor={`installment-${installment.id}`} className="text-sm">
                              Cuota {installment.installment_no} - Vence:{" "}
                              {format(new Date(installment.due_date), "dd/MM/yyyy")} - Saldo: $
                              {installment.balance_due.toLocaleString()}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="observations">Observaciones</Label>
                    <Textarea
                      id="observations"
                      value={formData.observations}
                      onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading || !selectedClient}>
                  {loading ? "Creando..." : "Crear Recibo"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Recibos Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, cliente o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="mixto">Mixto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredReceipts.map((receipt) => (
              <Card key={receipt.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{receipt.receipt_number}</Badge>
                        <Badge
                          variant={
                            receipt.payment_type === "efectivo"
                              ? "default"
                              : receipt.payment_type === "transferencia"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {receipt.payment_type}
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {receipt.clients.first_name} {receipt.clients.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(receipt.receipt_date), "dd/MM/yyyy", { locale: es })} • Código:{" "}
                        {receipt.clients.client_code}
                      </p>
                      {receipt.observations && (
                        <p className="text-sm text-muted-foreground italic">{receipt.observations}</p>
                      )}
                    </div>
                    <div className="flex flex-col md:items-end gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">${receipt.total_amount.toLocaleString()}</p>
                        {receipt.cash_amount > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Efectivo: ${receipt.cash_amount.toLocaleString()}
                          </p>
                        )}
                        {receipt.transfer_amount > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Transferencia: ${receipt.transfer_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => window.print()}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleWhatsApp(receipt)}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredReceipts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron recibos que coincidan con los filtros
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
