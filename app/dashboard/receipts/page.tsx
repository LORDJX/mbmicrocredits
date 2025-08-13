"use client"

import type React from "react"

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
import { Plus, Eye } from "lucide-react"
import { AppHeader } from "@/components/app-header"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
}

interface Loan {
  id: string
  loan_code: string
  amount: number
  installments: number
  installment_amount: number
  status: string
}

interface Receipt {
  id: string
  date: string
  client_id: string
  client_name: string
  payment_type: string
  cash_amount: number
  transfer_amount: number
  total_amount: number
  observations: string
  receipt_file_url?: string
  created_at: string
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [newReceipt, setNewReceipt] = useState({
    date: new Date().toISOString().split("T")[0],
    client_id: "",
    selected_loans: [] as string[],
    payment_type: "",
    cash_amount: "",
    transfer_amount: "",
    observations: "",
  })

  // Load initial data
  useEffect(() => {
    fetchReceipts()
    fetchClients()
  }, [])

  // Load active loans when client is selected
  useEffect(() => {
    if (newReceipt.client_id) {
      fetchActiveLoans(newReceipt.client_id)
    } else {
      setActiveLoans([])
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

  const handleLoanSelection = (loanId: string, checked: boolean) => {
    setNewReceipt((prev) => ({
      ...prev,
      selected_loans: checked ? [...prev.selected_loans, loanId] : prev.selected_loans.filter((id) => id !== loanId),
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
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
      let receiptFileUrl = ""

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          receiptFileUrl = uploadData.url
        }
      }

      const receiptData = {
        date: newReceipt.date,
        client_id: newReceipt.client_id,
        selected_loans: newReceipt.selected_loans,
        payment_type: newReceipt.payment_type,
        cash_amount: cashAmount,
        transfer_amount: transferAmount,
        total_amount: cashAmount + transferAmount,
        observations: newReceipt.observations,
        receipt_file_url: receiptFileUrl,
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
          date: new Date().toISOString().split("T")[0],
          client_id: "",
          selected_loans: [],
          payment_type: "",
          cash_amount: "",
          transfer_amount: "",
          observations: "",
        })
        setSelectedFile(null)
        fetchReceipts()
      } else {
        toast.error("Error al crear el recibo")
      }
    } catch (error) {
      console.error("Error creating receipt:", error)
      toast.error("Error al crear el recibo")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === newReceipt.client_id)
  const totalAmount =
    (Number.parseFloat(newReceipt.cash_amount) || 0) + (Number.parseFloat(newReceipt.transfer_amount) || 0)

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
                  <Input
                    id="date"
                    type="date"
                    value={newReceipt.date}
                    onChange={(e) => setNewReceipt((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
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
              </div>

              {selectedClient && activeLoans.length > 0 && (
                <div className="space-y-2">
                  <Label>Préstamos Activos *</Label>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {activeLoans.map((loan) => (
                          <div key={loan.id} className="flex items-center space-x-3 p-2 border rounded">
                            <Checkbox
                              id={loan.id}
                              checked={newReceipt.selected_loans.includes(loan.id)}
                              onCheckedChange={(checked) => handleLoanSelection(loan.id, checked as boolean)}
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
                    <SelectItem value="total">Total</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>{new Date(receipt.date).toLocaleDateString()}</TableCell>
                  <TableCell>{receipt.client_name}</TableCell>
                  <TableCell>
                    <Badge variant={receipt.payment_type === "total" ? "default" : "secondary"}>
                      {receipt.payment_type === "total" ? "Total" : "Parcial"}
                    </Badge>
                  </TableCell>
                  <TableCell>${receipt.cash_amount.toFixed(2)}</TableCell>
                  <TableCell>${receipt.transfer_amount.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">${receipt.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {receipts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay recibos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
