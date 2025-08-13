"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, FileText } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { toast } from "sonner"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
}

interface Loan {
  id: string
  loan_code: string
  installments: number
  installment_amount: number
  amount: number
}

interface Receipt {
  id: string
  receipt_date: string
  client_id: string
  client_name: string
  payment_type: string
  cash_amount: number
  transfer_amount: number
  total_amount: number
  observations: string
  attachment_url?: string
  selected_loans: string[]
  created_at: string
}

export default function RecibosPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [newReceipt, setNewReceipt] = useState({
    receipt_date: new Date().toISOString().split("T")[0],
    client_id: "",
    payment_type: "",
    cash_amount: "",
    transfer_amount: "",
    observations: "",
    selected_loans: [] as string[],
  })

  // Cargar datos iniciales
  useEffect(() => {
    fetchReceipts()
    fetchClients()
  }, [])

  // Cargar préstamos activos cuando se selecciona un cliente
  useEffect(() => {
    if (newReceipt.client_id) {
      fetchActiveLoans(newReceipt.client_id)
    } else {
      setActiveLoans([])
      setNewReceipt((prev) => ({ ...prev, selected_loans: [] }))
    }
  }, [newReceipt.client_id])

  const fetchReceipts = async () => {
    try {
      const response = await fetch("/api/receipts")
      if (response.ok) {
        const data = await response.json()
        setReceipts(data)
      }
    } catch (error) {
      console.error("Error al cargar recibos:", error)
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
      console.error("Error al cargar clientes:", error)
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
      console.error("Error al cargar préstamos activos:", error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data.url
      }
    } catch (error) {
      console.error("Error al subir archivo:", error)
    }
    return null
  }

  const handleLoanSelection = (loanId: string, checked: boolean) => {
    setNewReceipt((prev) => ({
      ...prev,
      selected_loans: checked ? [...prev.selected_loans, loanId] : prev.selected_loans.filter((id) => id !== loanId),
    }))
  }

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, "")
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

  const handleCreateReceipt = async () => {
    if (!newReceipt.client_id || !newReceipt.payment_type || newReceipt.selected_loans.length === 0) {
      toast.error("Por favor complete todos los campos obligatorios")
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
      let attachmentUrl = null
      if (selectedFile) {
        attachmentUrl = await uploadFile(selectedFile)
      }

      const receiptData = {
        receipt_date: newReceipt.receipt_date,
        client_id: newReceipt.client_id,
        payment_type: newReceipt.payment_type,
        cash_amount: cashAmount,
        transfer_amount: transferAmount,
        total_amount: cashAmount + transferAmount,
        observations: newReceipt.observations,
        attachment_url: attachmentUrl,
        selected_loans: newReceipt.selected_loans,
      }

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
          receipt_date: new Date().toISOString().split("T")[0],
          client_id: "",
          payment_type: "",
          cash_amount: "",
          transfer_amount: "",
          observations: "",
          selected_loans: [],
        })
        setSelectedFile(null)
        fetchReceipts()
      } else {
        toast.error("Error al crear el recibo")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al crear el recibo")
    } finally {
      setIsLoading(false)
    }
  }

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client ? `${client.first_name} ${client.last_name}` : "Cliente no encontrado"
  }

  const getTotalSelectedAmount = () => {
    return activeLoans
      .filter((loan) => newReceipt.selected_loans.includes(loan.id))
      .reduce((total, loan) => total + (loan.installment_amount || 0), 0)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Gestión de Recibos" />

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recibos</h1>
            <p className="text-muted-foreground">Gestiona los recibos de pagos de préstamos</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Recibo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Recibo</DialogTitle>
                <DialogDescription>Complete la información del recibo de pago</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt_date">Fecha *</Label>
                  <Input
                    id="receipt_date"
                    type="date"
                    value={newReceipt.receipt_date}
                    onChange={(e) => setNewReceipt((prev) => ({ ...prev, receipt_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente *</Label>
                  <Select
                    value={newReceipt.client_id}
                    onValueChange={(value) => setNewReceipt((prev) => ({ ...prev, client_id: value }))}
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

                <div className="space-y-2">
                  <Label htmlFor="cash_amount">Importe en Efectivo</Label>
                  <Input
                    id="cash_amount"
                    type="text"
                    placeholder="Ej: 15000.50"
                    value={newReceipt.cash_amount}
                    onChange={(e) => handleCashAmountChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Formato: números con hasta 2 decimales</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer_amount">Importe en Transferencia</Label>
                  <Input
                    id="transfer_amount"
                    type="text"
                    placeholder="Ej: 25000.00"
                    value={newReceipt.transfer_amount}
                    onChange={(e) => handleTransferAmountChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Formato: números con hasta 2 decimales</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachment">Adjuntar Archivo</Label>
                  <Input id="attachment" type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">Archivo seleccionado: {selectedFile.name}</p>
                  )}
                </div>
              </div>

              {newReceipt.client_id && activeLoans.length > 0 && (
                <div className="space-y-2">
                  <Label>Préstamos Activos *</Label>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Seleccionar Préstamos</CardTitle>
                      <CardDescription>Total seleccionado: ${getTotalSelectedAmount().toFixed(2)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {activeLoans.map((loan) => (
                          <div key={loan.id} className="flex items-center space-x-2 p-2 border rounded">
                            <Checkbox
                              id={loan.id}
                              checked={newReceipt.selected_loans.includes(loan.id)}
                              onCheckedChange={(checked) => handleLoanSelection(loan.id, checked as boolean)}
                            />
                            <Label htmlFor={loan.id} className="flex-1 cursor-pointer">
                              <div className="flex justify-between">
                                <span>{loan.loan_code}</span>
                                <span className="text-sm text-muted-foreground">
                                  {loan.installments} cuotas - ${(loan.installment_amount || 0).toFixed(2)} c/u
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  id="observations"
                  rows={3}
                  placeholder="Observaciones adicionales..."
                  value={newReceipt.observations}
                  onChange={(e) => setNewReceipt((prev) => ({ ...prev, observations: e.target.value }))}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateReceipt} disabled={isLoading}>
                  {isLoading ? "Creando..." : "Crear Recibo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Recibos</CardTitle>
            <CardDescription>Historial de recibos generados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo de Pago</TableHead>
                    <TableHead>Efectivo</TableHead>
                    <TableHead>Transferencia</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Préstamos</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No hay recibos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    receipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell>{new Date(receipt.receipt_date).toLocaleDateString()}</TableCell>
                        <TableCell>{receipt.client_name}</TableCell>
                        <TableCell>{receipt.payment_type}</TableCell>
                        <TableCell>${receipt.cash_amount.toFixed(2)}</TableCell>
                        <TableCell>${receipt.transfer_amount.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">${receipt.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{receipt.selected_loans.length} préstamo(s)</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
