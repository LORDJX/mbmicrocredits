"use client"

import type React from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Eye, Edit, Share2, Search } from "lucide-react"
import { AppHeader } from "@/components/app-header"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
}

interface Installment {
  number: number
  due_date: string
  amount: number
  status: "pending" | "paid" | "overdue"
}

interface Loan {
  id: string
  loan_code: string
  amount: number
  installments: number
  installment_amount: number
  status: string
  client_id: string
  start_date: string
  loan_type: string
}

interface Receipt {
  id: string
  receipt_number: string
  receipt_date: string
  client_id: string
  client_name: string
  payment_type: string
  cash_amount: number
  transfer_amount: number
  total_amount: number
  observations: string
  attachment_url?: string
  created_at: string
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState("")

  const [selectedLoanId, setSelectedLoanId] = useState<string>("")
  const [loanInstallments, setLoanInstallments] = useState<Installment[]>([])
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([])

  const [newReceipt, setNewReceipt] = useState({
    date: new Date(),
    client_id: "",
    selected_loans: [] as string[],
    selected_installments: [] as number[],
    payment_type: "",
    cash_amount: "",
    transfer_amount: "",
    observations: "",
  })

  const [editReceipt, setEditReceipt] = useState({
    id: "",
    date: new Date(),
    client_id: "",
    selected_loans: [] as string[],
    selected_installments: [] as number[],
    payment_type: "",
    cash_amount: "",
    transfer_amount: "",
    observations: "",
  })

  useEffect(() => {
    fetchReceipts()
    fetchClients()
  }, [])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredReceipts(receipts)
    } else {
      const filtered = receipts.filter((receipt) => {
        const client = clients.find((c) => c.id === receipt.client_id)
        if (!client) return false

        const searchLower = searchTerm.toLowerCase()
        return (
          client.first_name.toLowerCase().includes(searchLower) ||
          client.last_name.toLowerCase().includes(searchLower) ||
          client.client_code.toLowerCase().includes(searchLower) ||
          receipt.receipt_number.toLowerCase().includes(searchLower)
        )
      })
      setFilteredReceipts(filtered)
    }
  }, [searchTerm, receipts, clients])

  useEffect(() => {
    if (newReceipt.client_id) {
      fetchActiveLoans(newReceipt.client_id)
    } else {
      setActiveLoans([])
    }
  }, [newReceipt.client_id])

  useEffect(() => {
    if (selectedLoanId) {
      calculateLoanInstallments(selectedLoanId)
    } else {
      setLoanInstallments([])
      setSelectedInstallments([])
    }
  }, [selectedLoanId])

  const fetchReceipts = async () => {
    try {
      const response = await fetch("/api/receipts")
      if (response.ok) {
        const data = await response.json()
        setReceipts(data)
        setFilteredReceipts(data)
      }
    } catch (error) {
      console.error("Error fetching receipts:", error)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const fetchActiveLoans = async (clientId: string) => {
    try {
      const response = await fetch(`/api/loans?client_id=${clientId}&status=active`)
      if (response.ok) {
        const data = await response.json()
        setActiveLoans(data)
      }
    } catch (error) {
      console.error("Error fetching active loans:", error)
      setActiveLoans([])
    }
  }

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "")
    const parts = numericValue.split(".")
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("")
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + "." + parts[1].substring(0, 2)
    }
    return numericValue
  }

  const handleCashAmountChange = (value: string) => {
    const formatted = formatCurrency(value)
    setNewReceipt((prev) => ({ ...prev, cash_amount: formatted }))
  }

  const handleTransferAmountChange = (value: string) => {
    const formatted = formatCurrency(value)
    setNewReceipt((prev) => ({ ...prev, transfer_amount: formatted }))
  }

  const handleSingleLoanSelection = (loanId: string) => {
    setSelectedLoanId(loanId)
    setNewReceipt((prev) => ({
      ...prev,
      selected_loans: [loanId],
      selected_installments: [],
    }))
    setSelectedInstallments([])
  }

  const handleInstallmentSelection = (installmentNumber: number, checked: boolean) => {
    const newSelected = checked
      ? [...selectedInstallments, installmentNumber]
      : selectedInstallments.filter((num) => num !== installmentNumber)

    setSelectedInstallments(newSelected)
    setNewReceipt((prev) => ({
      ...prev,
      selected_installments: newSelected,
    }))
  }

  const calculateLoanInstallments = (loanId: string) => {
    const loan = activeLoans.find((l) => l.id === loanId)
    if (!loan) return

    const installments: Installment[] = []
    const startDate = new Date(loan.start_date)

    let intervalDays = 30 // Default monthly
    if (loan.loan_type === "Semanal") intervalDays = 7
    else if (loan.loan_type === "Quincenal") intervalDays = 15

    for (let i = 1; i <= loan.installments; i++) {
      const dueDate = new Date(startDate)
      dueDate.setDate(startDate.getDate() + intervalDays * i)

      const today = new Date()
      let status: "pending" | "paid" | "overdue" = "pending"

      if (dueDate < today) {
        status = "overdue"
      }

      installments.push({
        number: i,
        due_date: dueDate.toISOString().split("T")[0],
        amount: loan.installment_amount || 0,
        status,
      })
    }

    setLoanInstallments(installments)
  }

  const handleCreateReceipt = async () => {
    const currentDate = newReceipt.date || new Date()

    if (
      !currentDate ||
      !newReceipt.client_id ||
      !newReceipt.payment_type ||
      newReceipt.selected_loans.length === 0 ||
      selectedInstallments.length === 0
    ) {
      toast.error("Por favor complete todos los campos obligatorios y seleccione al menos una cuota")
      return
    }

    const cashAmount = Number.parseFloat(newReceipt.cash_amount) || 0
    const transferAmount = Number.parseFloat(newReceipt.transfer_amount) || 0

    if (cashAmount === 0 && transferAmount === 0) {
      toast.error("Debe ingresar al menos un importe")
      return
    }

    setIsLoading(true)

    try {
      let attachmentUrl = ""

      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          attachmentUrl = uploadData.url
        }
      }

      const receiptData = {
        receipt_date: currentDate.toISOString().split("T")[0],
        client_id: newReceipt.client_id,
        selected_loans: newReceipt.selected_loans,
        selected_installments: selectedInstallments,
        payment_type: newReceipt.payment_type,
        cash_amount: cashAmount,
        transfer_amount: transferAmount,
        total_amount: cashAmount + transferAmount,
        observations: newReceipt.observations,
        attachment_url: attachmentUrl,
      }

      console.log("Sending receipt data:", receiptData) // Agregando log para debugging

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptData),
      })

      if (response.ok) {
        toast.success("Recibo creado exitosamente")
        setIsCreateDialogOpen(false)
        setNewReceipt({
          date: new Date(),
          client_id: "",
          selected_loans: [],
          selected_installments: [],
          payment_type: "",
          cash_amount: "",
          transfer_amount: "",
          observations: "",
        })
        setSelectedFile(null)
        setSelectedLoanId("")
        setSelectedInstallments([])
        setLoanInstallments([])
        fetchReceipts()
      } else {
        const errorData = await response.json()
        console.error("Error creating receipt:", errorData) // Agregando log de error
        toast.error(errorData.error || "Error al crear el recibo")
      }
    } catch (error) {
      console.error("Error creating receipt:", error)
      toast.error("Error al crear el recibo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditReceipt = (receipt: Receipt) => {
    setEditReceipt({
      id: receipt.id,
      date: new Date(receipt.receipt_date),
      client_id: receipt.client_id,
      selected_loans: [],
      selected_installments: [],
      payment_type: receipt.payment_type,
      cash_amount: receipt.cash_amount.toString(),
      transfer_amount: receipt.transfer_amount.toString(),
      observations: receipt.observations || "",
    })
    setSelectedReceipt(receipt)
    setIsEditDialogOpen(true)
  }

  const handleUpdateReceipt = async () => {
    if (!editReceipt.id) return

    const cashAmount = Number.parseFloat(editReceipt.cash_amount) || 0
    const transferAmount = Number.parseFloat(editReceipt.transfer_amount) || 0

    if (cashAmount === 0 && transferAmount === 0) {
      toast.error("Debe ingresar al menos un importe")
      return
    }

    setIsLoading(true)

    try {
      const receiptData = {
        receipt_date: editReceipt.date.toISOString().split("T")[0],
        payment_type: editReceipt.payment_type,
        cash_amount: cashAmount,
        transfer_amount: transferAmount,
        total_amount: cashAmount + transferAmount,
        observations: editReceipt.observations,
      }

      const response = await fetch(`/api/receipts/${editReceipt.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptData),
      })

      if (response.ok) {
        toast.success("Recibo actualizado exitosamente")
        setIsEditDialogOpen(false)
        fetchReceipts()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al actualizar el recibo")
      }
    } catch (error) {
      console.error("Error updating receipt:", error)
      toast.error("Error al actualizar el recibo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetail = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setIsDetailDialogOpen(true)
  }

  const shareReceiptViaWhatsApp = (receipt: Receipt) => {
    const client = clients.find((c) => c.id === receipt.client_id)
    const clientName = client ? `${client.first_name} ${client.last_name}` : receipt.client_name

    const message = `🧾 *RECIBO DE PAGO*
    
📋 *Recibo N°:* ${receipt.receipt_number}
📅 *Fecha:* ${new Date(receipt.receipt_date).toLocaleDateString("es-ES")}
👤 *Cliente:* ${clientName}
💰 *Total Pagado:* $${receipt.total_amount.toFixed(2)}

💵 *Efectivo:* $${receipt.cash_amount.toFixed(2)}
🏦 *Transferencia:* $${receipt.transfer_amount.toFixed(2)}
📝 *Tipo:* ${receipt.payment_type}

${receipt.observations ? `📋 *Observaciones:* ${receipt.observations}` : ""}

¡Gracias por su pago! 🙏

*BM Microcréditos*`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
  }

  const handlePrintReceipt = (receipt: Receipt) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${receipt.receipt_number}</title>
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            
            @page {
              size: 80mm 200mm; /* Ticket size */
              margin: 5mm; /* Minimal margins */
            }
            
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 11px;
              line-height: 1.2;
              color: #000;
              background: white;
              width: 100%;
              height: 100%;
            }
            
            .receipt-container {
              width: 100%;
              max-width: 70mm;
              margin: 0 auto;
              padding: 2mm;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 8px;
              border-bottom: 1px dashed #000;
              padding-bottom: 6px;
            }
            
            .logo { 
              width: 25mm; 
              height: 25mm; 
              margin: 0 auto 4px;
              border-radius: 50%;
            }
            
            .company-name { 
              font-size: 14px; 
              font-weight: bold; 
              margin-bottom: 2px;
            }
            
            .document-title { 
              font-size: 10px; 
              color: #666; 
            }
            
            .section { 
              margin-bottom: 8px; 
            }
            
            .section-title { 
              font-size: 10px; 
              font-weight: bold; 
              text-transform: uppercase;
              margin-bottom: 4px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 1px;
            }
            
            .field { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 2px;
              font-size: 10px;
            }
            
            .field-label { 
              font-weight: bold; 
              flex: 1;
            }
            
            .field-value { 
              text-align: right;
              flex: 1;
            }
            
            .total-section { 
              background: #f0f0f0; 
              padding: 4px; 
              margin: 8px 0;
              border: 1px solid #000;
              text-align: center;
            }
            
            .total-amount { 
              font-size: 16px; 
              font-weight: bold; 
            }
            
            .observations {
              font-size: 9px;
              margin: 6px 0;
              padding: 3px;
              border: 1px solid #ccc;
              background: #f9f9f9;
            }
            
            .footer { 
              text-align: center; 
              font-size: 8px; 
              color: #666; 
              margin-top: 10px;
              border-top: 1px dashed #000;
              padding-top: 4px;
            }
            
            .separator {
              text-align: center;
              margin: 6px 0;
              font-size: 12px;
            }
            
            @media print {
              body { 
                margin: 0 !important; 
                padding: 0 !important;
              }
              .no-print { 
                display: none !important; 
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <img src="/images/logo-bm-circular.jpg" alt="BM" class="logo">
              <div class="company-name">BM MICROCRÉDITOS</div>
              <div class="document-title">RECIBO DE PAGO</div>
            </div>
            
            <div class="section">
              <div class="field">
                <span class="field-label">N° Recibo:</span>
                <span class="field-value">${receipt.receipt_number}</span>
              </div>
              <div class="field">
                <span class="field-label">Fecha:</span>
                <span class="field-value">${new Date(receipt.receipt_date).toLocaleDateString("es-ES")}</span>
              </div>
              <div class="field">
                <span class="field-label">Cliente:</span>
                <span class="field-value">${receipt.client_name}</span>
              </div>
              <div class="field">
                <span class="field-label">Tipo:</span>
                <span class="field-value">${receipt.payment_type}</span>
              </div>
            </div>

            <div class="separator">• • • • • • • • • • • • • • • •</div>

            <div class="section">
              <div class="section-title">Detalle de Pagos</div>
              <div class="field">
                <span class="field-label">Efectivo:</span>
                <span class="field-value">$${receipt.cash_amount.toFixed(2)}</span>
              </div>
              <div class="field">
                <span class="field-label">Transferencia:</span>
                <span class="field-value">$${receipt.transfer_amount.toFixed(2)}</span>
              </div>
            </div>

            ${
              receipt.observations
                ? `
            <div class="observations">
              <strong>Observaciones:</strong><br>
              ${receipt.observations}
            </div>
            `
                : ""
            }

            <div class="total-section">
              <div style="font-size: 12px; margin-bottom: 2px;">TOTAL PAGADO</div>
              <div class="total-amount">$${receipt.total_amount.toFixed(2)}</div>
            </div>

            <div class="separator">• • • • • • • • • • • • • • • •</div>

            <div class="footer">
              <div>¡Gracias por su pago!</div>
              <div style="margin-top: 2px;">
                ${new Date().toLocaleDateString("es-ES")} - ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const selectedClient = clients.find((c) => c.id === newReceipt.client_id)
  const totalAmount =
    (Number.parseFloat(newReceipt.cash_amount) || 0) + (Number.parseFloat(newReceipt.transfer_amount) || 0)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
  }

  return (
    <div className="space-y-6">
      <AppHeader title="Gestión de Recibos" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recibos</h1>
          <p className="text-muted-foreground">Gestiona los recibos de pagos de préstamos</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Recibo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Recibo</DialogTitle>
              <DialogDescription>Complete la información del recibo de pago</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newReceipt.date ? format(newReceipt.date, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newReceipt.date}
                        onSelect={(date) => {
                          const selectedDate = date || new Date()
                          setNewReceipt((prev) => ({ ...prev, date: selectedDate }))
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select
                    value={newReceipt.client_id}
                    onValueChange={(value) => {
                      setNewReceipt((prev) => ({
                        ...prev,
                        client_id: value,
                        selected_loans: [],
                        selected_installments: [],
                      }))
                      setSelectedLoanId("")
                      setSelectedInstallments([])
                      setLoanInstallments([])
                    }}
                  >
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
              </div>

              {selectedClient && (
                <div className="space-y-2">
                  <Label>Préstamos Activos *</Label>
                  {activeLoans.length > 0 ? (
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {activeLoans.map((loan) => (
                            <div key={loan.id} className="flex items-center space-x-3 p-2 border rounded">
                              <input
                                type="radio"
                                id={loan.id}
                                name="selected_loan"
                                checked={selectedLoanId === loan.id}
                                onChange={() => handleSingleLoanSelection(loan.id)}
                                className="h-4 w-4"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{loan.loan_code}</div>
                                <div className="text-sm text-muted-foreground">
                                  {loan.installments} cuotas de ${loan.installment_amount?.toFixed(2) || "0.00"}
                                </div>
                              </div>
                              <Badge variant="outline">${loan.amount.toFixed(2)}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-4 text-center text-muted-foreground">
                        No hay préstamos activos para este cliente
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {selectedLoanId && loanInstallments.length > 0 && (
                <div className="space-y-2">
                  <Label>Cuotas Pendientes *</Label>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Seleccione las cuotas a las que imputar el pago</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {loanInstallments
                          .filter((installment) => installment.status !== "paid")
                          .map((installment) => (
                            <div key={installment.number} className="flex items-center space-x-3 p-2 border rounded">
                              <Checkbox
                                id={`installment-${installment.number}`}
                                checked={selectedInstallments.includes(installment.number)}
                                onCheckedChange={(checked) =>
                                  handleInstallmentSelection(installment.number, checked as boolean)
                                }
                              />
                              <div className="flex-1">
                                <div className="font-medium">Cuota #{installment.number}</div>
                                <div className="text-sm text-muted-foreground">
                                  Vencimiento: {new Date(installment.due_date).toLocaleDateString("es-ES")}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">${installment.amount.toFixed(2)}</div>
                                <Badge
                                  variant={installment.status === "overdue" ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {installment.status === "overdue" ? "Vencida" : "Pendiente"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                      {selectedInstallments.length > 0 && (
                        <div className="mt-3 p-2 bg-muted rounded">
                          <div className="text-sm font-medium">Cuotas seleccionadas: {selectedInstallments.length}</div>
                          <div className="text-sm text-muted-foreground">
                            Total a imputar: $
                            {(selectedInstallments.length * (loanInstallments[0]?.amount || 0)).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="payment_type">Tipo de Pago *</Label>
                <Select
                  value={newReceipt.payment_type}
                  onValueChange={(value) => setNewReceipt((prev) => ({ ...prev, payment_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Total">Total</SelectItem>
                    <SelectItem value="Parcial">Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cash_amount">Importe en Efectivo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="cash_amount"
                      type="text"
                      placeholder="Ej: 15000.50"
                      value={newReceipt.cash_amount}
                      onChange={(e) => handleCashAmountChange(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Formato: 15000.50 (con hasta 2 decimales)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer_amount">Importe en Transferencia</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="transfer_amount"
                      type="text"
                      placeholder="Ej: 5000.00"
                      value={newReceipt.transfer_amount}
                      onChange={(e) => handleTransferAmountChange(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Formato: 5000.00 (con hasta 2 decimales)</p>
                </div>
              </div>

              {totalAmount > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium">Total: ${totalAmount.toFixed(2)}</div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="file">Adjuntar Archivo</Label>
                <Input id="file" type="file" accept="image/*,.pdf" onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground">Adjunte comprobante de pago (imagen o PDF)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  id="observations"
                  placeholder="Ingrese observaciones adicionales..."
                  value={newReceipt.observations}
                  onChange={(e) => setNewReceipt((prev) => ({ ...prev, observations: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateReceipt} disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Recibo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Recibos</CardTitle>
          <CardDescription>Historial de recibos de pagos registrados</CardDescription>
          <div className="flex items-center space-x-2 mt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, DNI o número de recibo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Recibo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo de Pago</TableHead>
                <TableHead>Efectivo</TableHead>
                <TableHead>Transferencia</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                  <TableCell>
                    {receipt.receipt_date
                      ? new Date(receipt.receipt_date).toLocaleDateString("es-ES")
                      : "Fecha no disponible"}
                  </TableCell>
                  <TableCell>{receipt.client_name}</TableCell>
                  <TableCell>
                    <Badge variant={receipt.payment_type === "Total" ? "default" : "secondary"}>
                      {receipt.payment_type}
                    </Badge>
                  </TableCell>
                  <TableCell>${receipt.cash_amount.toFixed(2)}</TableCell>
                  <TableCell>${receipt.transfer_amount.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">${receipt.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetail(receipt)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditReceipt(receipt)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => shareReceiptViaWhatsApp(receipt)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredReceipts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {searchTerm
                      ? "No se encontraron recibos que coincidan con la búsqueda"
                      : "No hay recibos registrados"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Recibo</DialogTitle>
            <DialogDescription>Modifique la información del recibo de pago</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Fecha *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editReceipt.date ? format(editReceipt.date, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editReceipt.date}
                      onSelect={(date) => {
                        const selectedDate = date || new Date()
                        setEditReceipt((prev) => ({ ...prev, date: selectedDate }))
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-payment-type">Tipo de Pago *</Label>
                <Select
                  value={editReceipt.payment_type}
                  onValueChange={(value) => setEditReceipt((prev) => ({ ...prev, payment_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Total">Total</SelectItem>
                    <SelectItem value="Parcial">Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cash-amount">Importe en Efectivo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="edit-cash-amount"
                    type="text"
                    placeholder="Ej: 15000.50"
                    value={editReceipt.cash_amount}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      setEditReceipt((prev) => ({ ...prev, cash_amount: formatted }))
                    }}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-transfer-amount">Importe en Transferencia</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="edit-transfer-amount"
                    type="text"
                    placeholder="Ej: 5000.00"
                    value={editReceipt.transfer_amount}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      setEditReceipt((prev) => ({ ...prev, transfer_amount: formatted }))
                    }}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {(Number.parseFloat(editReceipt.cash_amount) || 0) + (Number.parseFloat(editReceipt.transfer_amount) || 0) >
              0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">
                  Total: $
                  {(
                    (Number.parseFloat(editReceipt.cash_amount) || 0) +
                    (Number.parseFloat(editReceipt.transfer_amount) || 0)
                  ).toFixed(2)}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-observations">Observaciones</Label>
              <Textarea
                id="edit-observations"
                placeholder="Ingrese observaciones adicionales..."
                value={editReceipt.observations}
                onChange={(e) => setEditReceipt((prev) => ({ ...prev, observations: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateReceipt} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar Recibo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Recibo</DialogTitle>
            <DialogDescription>Información completa del recibo de pago</DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">N° Recibo</Label>
                  <p className="text-sm font-medium">{selectedReceipt.receipt_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha</Label>
                  <p className="text-sm">
                    {selectedReceipt.receipt_date
                      ? new Date(selectedReceipt.receipt_date).toLocaleDateString("es-ES")
                      : "No disponible"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                  <p className="text-sm">{selectedReceipt.client_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo</Label>
                  <Badge variant={selectedReceipt.payment_type === "Total" ? "default" : "secondary"}>
                    {selectedReceipt.payment_type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Efectivo</Label>
                  <p className="text-sm font-medium">${selectedReceipt.cash_amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Transferencia</Label>
                  <p className="text-sm font-medium">${selectedReceipt.transfer_amount.toFixed(2)}</p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Pagado:</span>
                  <span className="text-lg font-bold text-primary">${selectedReceipt.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {selectedReceipt.observations && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Observaciones</Label>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">{selectedReceipt.observations}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => handlePrintReceipt(selectedReceipt)}>Imprimir Detalle</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
