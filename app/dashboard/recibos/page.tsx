"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, ReceiptIcon, Plus, Printer, MessageCircle, DollarSign, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
}

interface Loan {
  id: string
  loan_code: string
  status: string
  amount: number
  installments_total: number
}

interface Installment {
  id: string
  installment_no: number
  amount_due: number
  amount_paid: number
  balance_due: number
  due_date: string
  status: string
}

interface ReceiptData {
  id: string
  receipt_number: string
  client_name: string
  loan_code: string
  total_amount: number
  cash_amount: number
  transfer_amount: number
  payment_type: string
  notes: string
  created_at: string
}

export default function RecibosPage() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const { toast } = useToast()

  // Form state
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedLoan, setSelectedLoan] = useState("")
  const [selectedInstallments, setSelectedInstallments] = useState<string[]>([])
  const [paymentType, setPaymentType] = useState<"total" | "partial">("total")
  const [cashAmount, setCashAmount] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [nextReceiptNumber, setNextReceiptNumber] = useState("")

  useEffect(() => {
    fetchReceipts()
    fetchClients()
    fetchSummary()
    fetchNextReceiptNumber()
  }, [])

  const fetchReceipts = async () => {
    console.log("[v0] Fetching receipts...")
    try {
      const response = await fetch("/api/receipts")
      if (!response.ok) {
        if (response.headers.get("content-type")?.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Error al cargar recibos")
        } else {
          console.log("[v0] Non-JSON Response:", await response.text())
          throw new Error("API returned non-JSON response")
        }
      }
      const data = await response.json()
      console.log("[v0] Receipts fetched:", data.length)
      setReceipts(data)
    } catch (error) {
      console.error("[v0] Error fetching receipts:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los recibos",
        variant: "destructive",
      })
    }
  }

  const fetchClients = async () => {
    console.log("[v0] Fetching clients...")
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error("Error al cargar clientes")
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
      setLoading(false)
    }
  }

  const fetchLoansForClient = async (clientId: string) => {
    console.log("[v0] Fetching loans for client:", clientId)
    try {
      const response = await fetch(`/api/loans?client_id=${clientId}&status=active`)
      if (!response.ok) throw new Error("Error al cargar préstamos")
      const data = await response.json()
      console.log("[v0] Loans fetched:", data.length)
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

  const fetchInstallmentsForLoan = async (loanId: string) => {
    try {
      const response = await fetch(`/api/installments?loan_id=${loanId}&status=pending`)
      if (!response.ok) throw new Error("Error al cargar cuotas")
      const data = await response.json()
      setInstallments(data)
    } catch (error) {
      console.error("Error fetching installments:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuotas",
        variant: "destructive",
      })
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/receipts/summary")
      if (!response.ok) throw new Error("Error al cargar resumen")
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error("Error fetching summary:", error)
    }
  }

  const fetchNextReceiptNumber = async () => {
    try {
      const response = await fetch("/api/receipts/next-number")
      if (!response.ok) throw new Error("Error al obtener número de recibo")
      const data = await response.json()
      setNextReceiptNumber(data.next_number)
    } catch (error) {
      console.error("Error fetching next receipt number:", error)
    }
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId)
    setSelectedLoan("")
    setLoans([])
    setInstallments([])
    setSelectedInstallments([])
    if (clientId) {
      fetchLoansForClient(clientId)
    }
  }

  const handleLoanChange = (loanId: string) => {
    setSelectedLoan(loanId)
    setInstallments([])
    setSelectedInstallments([])
    if (loanId) {
      fetchInstallmentsForLoan(loanId)
    }
  }

  const calculateTotalAmount = () => {
    if (paymentType === "total") {
      return selectedInstallments.reduce((total, installmentId) => {
        const installment = installments.find((i) => i.id === installmentId)
        return total + (installment?.balance_due || 0)
      }, 0)
    } else {
      return Number.parseFloat(cashAmount || "0") + Number.parseFloat(transferAmount || "0")
    }
  }

  const handleCreateReceipt = async () => {
    try {
      const totalAmount = calculateTotalAmount()

      if (totalAmount <= 0) {
        toast({
          title: "Error",
          description: "El monto total debe ser mayor a 0",
          variant: "destructive",
        })
        return
      }

      const receiptData = {
        client_id: selectedClient,
        loan_id: selectedLoan,
        installment_ids: selectedInstallments,
        payment_type: paymentType,
        cash_amount: Number.parseFloat(cashAmount || "0"),
        transfer_amount: Number.parseFloat(transferAmount || "0"),
        total_amount: totalAmount,
        notes: notes.trim() || null,
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al crear recibo")
      }

      const newReceipt = await response.json()

      toast({
        title: "Éxito",
        description: `Recibo ${newReceipt.receipt_number} creado exitosamente`,
      })

      // Reset form
      setSelectedClient("")
      setSelectedLoan("")
      setSelectedInstallments([])
      setCashAmount("")
      setTransferAmount("")
      setNotes("")
      setIsCreateDialogOpen(false)

      // Refresh data
      fetchReceipts()
      fetchSummary()
      fetchNextReceiptNumber()
    } catch (error: any) {
      console.error("Error creating receipt:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleWhatsApp = (receipt: ReceiptData) => {
    const message = `🧾 RECIBO DE PAGO

📋 Recibo N°: ${receipt.receipt_number}
📅 Fecha: ${new Date(receipt.created_at).toLocaleDateString()}
👤 Cliente: ${receipt.client_name}
💰 Total Pagado: $${receipt.total_amount.toLocaleString()}
💵 Efectivo: $${receipt.cash_amount.toLocaleString()}
🏦 Transferencia: $${receipt.transfer_amount.toLocaleString()}
📝 Tipo: ${receipt.payment_type === "total" ? "Total" : "Parcial"}
📋 Observaciones: ${receipt.notes || "Sin observaciones"}

¡Gracias por su pago! 🙏
BM Microcréditos`

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank")
  }

  const handlePrint = (receipt: ReceiptData) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo ${receipt.receipt_number}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10px; font-size: 12px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 14px; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>BM MICROCRÉDITOS</h2>
            <p>RECIBO DE PAGO</p>
            <p>N° ${receipt.receipt_number}</p>
          </div>
          
          <div class="row">
            <span>Fecha:</span>
            <span>${new Date(receipt.created_at).toLocaleDateString()}</span>
          </div>
          
          <div class="row">
            <span>Cliente:</span>
            <span>${receipt.client_name}</span>
          </div>
          
          <div class="row">
            <span>Préstamo:</span>
            <span>${receipt.loan_code}</span>
          </div>
          
          <div class="row">
            <span>Tipo:</span>
            <span>${receipt.payment_type === "total" ? "Total" : "Parcial"}</span>
          </div>
          
          <div class="row">
            <span>Efectivo:</span>
            <span>$${receipt.cash_amount.toLocaleString()}</span>
          </div>
          
          <div class="row">
            <span>Transferencia:</span>
            <span>$${receipt.transfer_amount.toLocaleString()}</span>
          </div>
          
          <div class="row total">
            <span>TOTAL:</span>
            <span>$${receipt.total_amount.toLocaleString()}</span>
          </div>
          
          ${receipt.notes ? `<div style="margin-top: 10px;"><strong>Observaciones:</strong><br>${receipt.notes}</div>` : ""}
          
          <div class="footer">
            <p>¡Gracias por su pago!</p>
            <p>BM Microcréditos</p>
          </div>
          
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const filteredReceipts = receipts.filter(
    (receipt) =>
      receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.loan_code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <PageLayout title="Recibos de Pago">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando recibos...</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Recibos de Pago">
      <div className="space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recaudación Hoy</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">${summary.today_total?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">{summary.today_count || 0} recibos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recaudación Mensual</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${summary.month_total?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">{summary.month_count || 0} recibos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recibos</CardTitle>
                <ReceiptIcon className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">${summary.total_amount?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">{summary.total_count || 0} recibos</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gestión de Recibos</CardTitle>
                <CardDescription>Crear y administrar recibos de pago</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Recibo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Recibo</DialogTitle>
                    <DialogDescription>Próximo número: {nextReceiptNumber}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Client Selection */}
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

                    {/* Loan Selection */}
                    {selectedClient && (
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

                    {/* Payment Type */}
                    {selectedLoan && installments.length > 0 && (
                      <div className="space-y-4">
                        <Label>Tipo de Pago</Label>
                        <RadioGroup
                          value={paymentType}
                          onValueChange={(value: "total" | "partial") => setPaymentType(value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="total" id="total" />
                            <Label htmlFor="total">Pago Total (suma automática de cuotas seleccionadas)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="partial" id="partial" />
                            <Label htmlFor="partial">Pago Parcial (monto personalizado)</Label>
                          </div>
                        </RadioGroup>

                        {/* Installments Selection */}
                        <div className="space-y-2">
                          <Label>Cuotas Pendientes</Label>
                          <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                            {installments.map((installment) => (
                              <div key={installment.id} className="flex items-center space-x-2 py-2">
                                <Checkbox
                                  id={installment.id}
                                  checked={selectedInstallments.includes(installment.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedInstallments([...selectedInstallments, installment.id])
                                    } else {
                                      setSelectedInstallments(
                                        selectedInstallments.filter((id) => id !== installment.id),
                                      )
                                    }
                                  }}
                                />
                                <Label htmlFor={installment.id} className="flex-1">
                                  Cuota {installment.installment_no} - Vence:{" "}
                                  {new Date(installment.due_date).toLocaleDateString()} - Saldo: $
                                  {installment.balance_due.toLocaleString()}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Payment Amounts */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cash">Efectivo</Label>
                            <Input
                              id="cash"
                              type="number"
                              step="0.01"
                              value={cashAmount}
                              onChange={(e) => setCashAmount(e.target.value)}
                              placeholder="0.00"
                              disabled={paymentType === "total"}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="transfer">Transferencia</Label>
                            <Input
                              id="transfer"
                              type="number"
                              step="0.01"
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(e.target.value)}
                              placeholder="0.00"
                              disabled={paymentType === "total"}
                            />
                          </div>
                        </div>

                        {/* Total Amount Display */}
                        <div className="p-4 bg-muted rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total a Pagar:</span>
                            <span className="text-xl font-bold">${calculateTotalAmount().toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                          <Label htmlFor="notes">Observaciones (opcional)</Label>
                          <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Observaciones adicionales..."
                            rows={3}
                          />
                        </div>

                        {/* Create Button */}
                        <Button
                          onClick={handleCreateReceipt}
                          className="w-full"
                          disabled={
                            !selectedClient ||
                            !selectedLoan ||
                            selectedInstallments.length === 0 ||
                            calculateTotalAmount() <= 0
                          }
                        >
                          Crear Recibo
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número, cliente o préstamo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredReceipts.length} recibo{filteredReceipts.length !== 1 ? "s" : ""} encontrado
                {filteredReceipts.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Receipts Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Préstamo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                    <TableCell>{new Date(receipt.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{receipt.client_name}</TableCell>
                    <TableCell>{receipt.loan_code}</TableCell>
                    <TableCell>${receipt.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={receipt.payment_type === "total" ? "default" : "secondary"}>
                        {receipt.payment_type === "total" ? "Total" : "Parcial"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleWhatsApp(receipt)} className="gap-1">
                          <MessageCircle className="h-3 w-3" />
                          WhatsApp
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePrint(receipt)} className="gap-1">
                          <Printer className="h-3 w-3" />
                          Imprimir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
