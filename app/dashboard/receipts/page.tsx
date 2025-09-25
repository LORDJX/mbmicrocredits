"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ReceiptIcon, SearchIcon, PlusIcon } from "lucide-react"
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
  amount_due: number
  balance_due: number
  due_date: string
  status: string
}

interface ReceiptData {
  id: string
  receipt_number: string
  amount: number
  payment_date: string
  notes: string
  loans: {
    loan_code: string
    clients: {
      first_name: string
      last_name: string
    }
  }
}

export default function ReceiptsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedLoan, setSelectedLoan] = useState("")
  const [selectedInstallments, setSelectedInstallments] = useState<string[]>([])
  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [notes, setNotes] = useState("")

  // Search state
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchClients()
    fetchReceipts()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients?status=ACTIVO")
      if (!response.ok) throw new Error("Failed to fetch clients")
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("[v0] Error fetching clients:", error)
    }
  }

  const fetchLoans = async (clientId: string) => {
    try {
      const response = await fetch(`/api/loans?client_id=${clientId}&status=ACTIVO`)
      if (!response.ok) throw new Error("Failed to fetch loans")
      const data = await response.json()
      setLoans(data)
    } catch (error) {
      console.error("[v0] Error fetching loans:", error)
    }
  }

  const fetchInstallments = async (loanId: string) => {
    try {
      console.log("[v0] Fetching installments for loan:", loanId)
      const response = await fetch(`/api/installments?loan_id=${loanId}&status=PENDIENTE,VENCIDA`)
      if (!response.ok) {
        const text = await response.text()
        console.error("[v0] Response not OK:", response.status, text)
        throw new Error("Failed to fetch installments")
      }
      const data = await response.json()
      console.log("[v0] Installments fetched:", data)
      setInstallments(data)
    } catch (error) {
      console.error("[v0] Error fetching installments:", error)
    }
  }

  const fetchReceipts = async () => {
    try {
      const url = searchTerm ? `/api/receipts?search=${encodeURIComponent(searchTerm)}` : "/api/receipts"

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch receipts")
      const data = await response.json()
      setReceipts(data)
    } catch (error) {
      console.error("[v0] Error fetching receipts:", error)
    }
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId)
    setSelectedLoan("")
    setInstallments([])
    setSelectedInstallments([])
    if (clientId) {
      fetchLoans(clientId)
    } else {
      setLoans([])
    }
  }

  const handleLoanChange = (loanId: string) => {
    setSelectedLoan(loanId)
    setSelectedInstallments([])
    if (loanId) {
      fetchInstallments(loanId)
    } else {
      setInstallments([])
    }
  }

  const handleInstallmentToggle = (installmentId: string) => {
    setSelectedInstallments((prev) =>
      prev.includes(installmentId) ? prev.filter((id) => id !== installmentId) : [...prev, installmentId],
    )
  }

  const calculateTotalAmount = () => {
    return installments
      .filter((inst) => selectedInstallments.includes(inst.id))
      .reduce((sum, inst) => sum + inst.balance_due, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLoan || !amount) return

    setCreating(true)
    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: selectedLoan,
          amount: Number.parseFloat(amount),
          payment_date: paymentDate,
          notes: notes.trim() || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error creating receipt")
      }

      // Reset form
      setSelectedClient("")
      setSelectedLoan("")
      setSelectedInstallments([])
      setAmount("")
      setNotes("")
      setLoans([])
      setInstallments([])

      // Refresh receipts
      fetchReceipts()

      console.log("[v0] Receipt created successfully")
    } catch (error) {
      console.error("[v0] Error creating receipt:", error)
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    const total = calculateTotalAmount()
    if (total > 0) {
      setAmount(total.toString())
    }
  }, [selectedInstallments])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recibos de Pago</h1>
          <p className="text-muted-foreground">Gestiona los recibos de pago de los préstamos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crear Recibo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Crear Recibo
            </CardTitle>
            <CardDescription>Registra un nuevo pago de cuotas</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select value={selectedClient} onValueChange={handleClientChange}>
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

              {loans.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="loan">Préstamo</Label>
                  <Select value={selectedLoan} onValueChange={handleLoanChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar préstamo" />
                    </SelectTrigger>
                    <SelectContent>
                      {loans.map((loan) => (
                        <SelectItem key={loan.id} value={loan.id}>
                          {loan.loan_code} - ${loan.amount.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {installments.length > 0 && (
                <div className="space-y-2">
                  <Label>Cuotas a Pagar</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {installments.map((installment) => (
                      <div
                        key={installment.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedInstallments.includes(installment.id)
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => handleInstallmentToggle(installment.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">Cuota #{installment.installment_no}</span>
                            <Badge
                              variant={installment.status === "VENCIDA" ? "destructive" : "secondary"}
                              className="ml-2"
                            >
                              {installment.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${installment.balance_due.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">
                              Vence: {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: es })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Fecha de Pago</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={creating || !selectedLoan || !amount}>
                {creating ? "Creando..." : "Crear Recibo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Recibos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5" />
              Recibos Recientes
            </CardTitle>
            <CardDescription>Historial de recibos emitidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por número de recibo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={fetchReceipts} variant="outline">
                  Buscar
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{receipt.receipt_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {receipt.loans.clients.first_name} {receipt.loans.clients.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">Préstamo: {receipt.loans.loan_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${receipt.amount.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(receipt.payment_date), "dd/MM/yyyy", { locale: es })}
                        </div>
                      </div>
                    </div>
                    {receipt.notes && <div className="mt-2 text-sm text-muted-foreground">{receipt.notes}</div>}
                  </div>
                ))}
                {receipts.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">No se encontraron recibos</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
