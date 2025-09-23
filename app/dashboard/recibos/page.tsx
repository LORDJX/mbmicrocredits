"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Receipt, Plus, MessageCircle, Printer, DollarSign, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
  phone: string
  email: string
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
  code: string
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
  client_id: string
  client_code: string
  first_name: string
  last_name: string
  phone: string
  total_amount: number
  cash_amount: number
  transfer_amount: number
  payment_type: string
  observations: string
  selected_installments: any[]
}

export default function RecibosPage() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [summary, setSummary] = useState({
    total_receipts: 0,
    today_collection: 0,
    month_collection: 0,
  })

  // Form state
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedLoan, setSelectedLoan] = useState("")
  const [selectedInstallments, setSelectedInstallments] = useState<string[]>([])
  const [paymentType, setPaymentType] = useState<"total" | "partial">("total")
  const [cashAmount, setCashAmount] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [observations, setObservations] = useState("")
  const [partialAmounts, setPartialAmounts] = useState<Record<string, number>>({})

  const { toast } = useToast()

  useEffect(() => {
    fetchReceipts()
    fetchClients()
    fetchSummary()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      fetchClientLoans(selectedClient)
    }
  }, [selectedClient])

  useEffect(() => {
    if (selectedLoan) {
      fetchLoanInstallments(selectedLoan)
    }
  }, [selectedLoan])

  const fetchReceipts = async () => {
    try {
      const response = await fetch("/api/receipts")
      if (!response.ok) throw new Error("Error al cargar recibos")
      const data = await response.json()
      setReceipts(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los recibos",
        variant: "destructive",
      })
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients?status=active")
      if (!response.ok) throw new Error("Error al cargar clientes")
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientLoans = async (clientId: string) => {
    try {
      const response = await fetch(`/api/loans?client_id=${clientId}&status=active`)
      if (!response.ok) throw new Error("Error al cargar préstamos")
      const data = await response.json()
      setLoans(data)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const fetchLoanInstallments = async (loanId: string) => {
    try {
      const response = await fetch(`/api/installments?loan_id=${loanId}&unpaid_only=true`)
      if (!response.ok) throw new Error("Error al cargar cuotas")
      const data = await response.json()
      setInstallments(data)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/receipts/summary")
      if (!response.ok) throw new Error("Error al cargar resumen")
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const generateReceiptNumber = async () => {
    try {
      const response = await fetch("/api/receipts/next-number")
      if (!response.ok) throw new Error("Error al generar número")
      const data = await response.json()
      return data.receipt_number
    } catch (error) {
      console.error("Error:", error)
      return "Rbo - 00000001"
    }
  }

  const calculateTotalAmount = () => {
    if (paymentType === "total") {
      return selectedInstallments.reduce((total, installmentId) => {
        const installment = installments.find((i) => i.id === installmentId)
        return total + (installment?.balance_due || 0)
      }, 0)
    } else {
      return Object.values(partialAmounts).reduce((total, amount) => total + amount, 0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClient || !selectedLoan || selectedInstallments.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar cliente, préstamo y al menos una cuota",
        variant: "destructive",
      })
      return
    }

    const totalAmount = calculateTotalAmount()
    const cash = Number.parseFloat(cashAmount) || 0
    const transfer = Number.parseFloat(transferAmount) || 0

    if (cash + transfer !== totalAmount) {
      toast({
        title: "Error",
        description: "La suma de efectivo y transferencia debe igual al total",
        variant: "destructive",
      })
      return
    }

    try {
      const receiptNumber = await generateReceiptNumber()

      const receiptData = {
        receipt_number: receiptNumber,
        client_id: selectedClient,
        selected_loans: [selectedLoan],
        selected_installments: selectedInstallments.map((id) => {
          const installment = installments.find((i) => i.id === id)
          return {
            installment_id: id,
            amount: paymentType === "total" ? installment?.balance_due : partialAmounts[id],
          }
        }),
        total_amount: totalAmount,
        cash_amount: cash,
        transfer_amount: transfer,
        payment_type: paymentType,
        observations,
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData),
      })

      if (!response.ok) throw new Error("Error al crear recibo")

      toast({
        title: "Éxito",
        description: `Recibo ${receiptNumber} creado exitosamente`,
      })

      // Reset form
      setSelectedClient("")
      setSelectedLoan("")
      setSelectedInstallments([])
      setPaymentType("total")
      setCashAmount("")
      setTransferAmount("")
      setObservations("")
      setPartialAmounts({})
      setIsDialogOpen(false)

      // Refresh data
      fetchReceipts()
      fetchSummary()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el recibo",
        variant: "destructive",
      })
    }
  }

  const handleWhatsApp = (receipt: ReceiptData) => {
    const message = `🧾 RECIBO DE PAGO

📋 Recibo N°: ${receipt.receipt_number}
📅 Fecha: ${new Date(receipt.receipt_date).toLocaleDateString()}
👤 Cliente: ${receipt.first_name} ${receipt.last_name}
💰 Total Pagado: $${receipt.total_amount.toLocaleString()}
💵 Efectivo: $${receipt.cash_amount.toLocaleString()}
🏦 Transferencia: $${receipt.transfer_amount.toLocaleString()}
📝 Tipo: ${receipt.payment_type === "total" ? "Total" : "Parcial"}
📋 Observaciones: ${receipt.observations || "Sin observaciones"}

¡Gracias por su pago! 🙏
BM Microcréditos`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${receipt.phone?.replace(/\D/g, "")}?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
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
            .total { font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>BM MICROCRÉDITOS</h2>
            <p>RECIBO DE PAGO</p>
            <p>N°: ${receipt.receipt_number}</p>
          </div>
          
          <div class="row">
            <span>Fecha:</span>
            <span>${new Date(receipt.receipt_date).toLocaleDateString()}</span>
          </div>
          
          <div class="row">
            <span>Cliente:</span>
            <span>${receipt.first_name} ${receipt.last_name}</span>
          </div>
          
          <div class="row">
            <span>Código:</span>
            <span>${receipt.client_code}</span>
          </div>
          
          <div class="row">
            <span>Teléfono:</span>
            <span>${receipt.phone}</span>
          </div>
          
          <div class="total">
            <div class="row">
              <span>Total Pagado:</span>
              <span>$${receipt.total_amount.toLocaleString()}</span>
            </div>
            
            <div class="row">
              <span>Efectivo:</span>
              <span>$${receipt.cash_amount.toLocaleString()}</span>
            </div>
            
            <div class="row">
              <span>Transferencia:</span>
              <span>$${receipt.transfer_amount.toLocaleString()}</span>
            </div>
            
            <div class="row">
              <span>Tipo:</span>
              <span>${receipt.payment_type === "total" ? "Total" : "Parcial"}</span>
            </div>
          </div>
          
          ${
            receipt.observations
              ? `
          <div style="margin-top: 10px;">
            <strong>Observaciones:</strong><br>
            ${receipt.observations}
          </div>
          `
              : ""
          }
          
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
      `${receipt.first_name} ${receipt.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.client_code.toLowerCase().includes(searchTerm.toLowerCase()),
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
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recibos</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_receipts}</div>
              <p className="text-xs text-muted-foreground">Recibos emitidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recaudación Hoy</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${summary.today_collection.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Cobrado hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recaudación Mes</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${summary.month_collection.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Cobrado este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Recibos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Recibos</CardTitle>
                <CardDescription>Gestión de recibos de pago emitidos</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Recibo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Recibo</DialogTitle>
                    <DialogDescription>Complete los datos para generar un nuevo recibo de pago</DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Selección de Cliente */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client">Cliente</Label>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
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

                      <div className="space-y-2">
                        <Label htmlFor="loan">Préstamo</Label>
                        <Select value={selectedLoan} onValueChange={setSelectedLoan} disabled={!selectedClient}>
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
                    </div>

                    {/* Cuotas Disponibles */}
                    {installments.length > 0 && (
                      <div className="space-y-4">
                        <Label>Cuotas Pendientes</Label>
                        <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                          {installments.map((installment) => (
                            <div key={installment.id} className="flex items-center space-x-3 py-2">
                              <Checkbox
                                id={installment.id}
                                checked={selectedInstallments.includes(installment.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedInstallments([...selectedInstallments, installment.id])
                                  } else {
                                    setSelectedInstallments(selectedInstallments.filter((id) => id !== installment.id))
                                  }
                                }}
                              />
                              <Label htmlFor={installment.id} className="flex-1 cursor-pointer">
                                <div className="flex justify-between items-center">
                                  <span>
                                    Cuota {installment.installment_no} - {installment.code}
                                  </span>
                                  <div className="text-right">
                                    <div className="font-medium">${installment.balance_due.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Vence: {new Date(installment.due_date).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tipo de Pago */}
                    {selectedInstallments.length > 0 && (
                      <div className="space-y-4">
                        <Label>Tipo de Pago</Label>
                        <RadioGroup
                          value={paymentType}
                          onValueChange={(value: "total" | "partial") => setPaymentType(value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="total" id="total" />
                            <Label htmlFor="total">Pago Total (${calculateTotalAmount().toLocaleString()})</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="partial" id="partial" />
                            <Label htmlFor="partial">Pago Parcial</Label>
                          </div>
                        </RadioGroup>

                        {paymentType === "partial" && (
                          <div className="space-y-2">
                            <Label>Montos Parciales</Label>
                            {selectedInstallments.map((installmentId) => {
                              const installment = installments.find((i) => i.id === installmentId)
                              if (!installment) return null

                              return (
                                <div key={installmentId} className="flex items-center space-x-2">
                                  <Label className="w-40 text-sm">Cuota {installment.installment_no}:</Label>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={partialAmounts[installmentId] || ""}
                                    onChange={(e) =>
                                      setPartialAmounts({
                                        ...partialAmounts,
                                        [installmentId]: Number.parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    max={installment.balance_due}
                                    step="0.01"
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    / ${installment.balance_due.toLocaleString()}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Formas de Pago */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cash">Efectivo</Label>
                        <Input
                          id="cash"
                          type="number"
                          placeholder="0.00"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="transfer">Transferencia</Label>
                        <Input
                          id="transfer"
                          type="number"
                          placeholder="0.00"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Observaciones */}
                    <div className="space-y-2">
                      <Label htmlFor="observations">Observaciones</Label>
                      <Textarea
                        id="observations"
                        placeholder="Observaciones adicionales..."
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Crear Recibo</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número, cliente o código..."
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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                    <TableCell>{new Date(receipt.receipt_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {receipt.first_name} {receipt.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">{receipt.client_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>${receipt.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={receipt.payment_type === "total" ? "default" : "secondary"}>
                        {receipt.payment_type === "total" ? "Total" : "Parcial"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
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
