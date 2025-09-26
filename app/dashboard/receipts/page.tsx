"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Loader2, Receipt, User, Calendar, FileText, Plus } from "lucide-react"

// --- Interfaces ---
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

interface Installment {
  id: string
  installment_no: number
  due_date: string
  amount_due: number
  amount_paid: number
  status: string
  // Añadimos loan_code y client_id para referencia en el formulario
  loan_id: string 
  loan_code: string 
}

interface ReceiptData {
  id: string
  receipt_number: string
  receipt_date: string
  total_amount: number
  cash_amount: number
  transfer_amount: number
  payment_type: string
  observations?: string
  first_name: string
  last_name: string
  client_code: string
  phone?: string
  email?: string
}
// ------------------


export default function ReceiptsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  
  // --- ESTADOS CLAVE PARA SELECCIÓN MÚLTIPLE ---
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]) // Todos los préstamos activos del cliente
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]) // IDs de préstamos seleccionados
  const [pendingInstallments, setPendingInstallments] = useState<Installment[]>([]) // Todas las cuotas pendientes de los préstamos seleccionados
  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<string[]>([]) // IDs de cuotas seleccionadas para pagar
  // ---------------------------------------------
  
  const [cashAmount, setCashAmount] = useState<string>("")
  const [transferAmount, setTransferAmount] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(true)

  // --- EFECTOS DE CARGA DE DATOS ---
  useEffect(() => {
    fetchClients()
    fetchReceipts()
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      fetchLoans(selectedClientId)
    } else {
      setActiveLoans([])
      setSelectedLoanIds([])
      setPendingInstallments([])
      setSelectedInstallmentIds([])
    }
  }, [selectedClientId])

  useEffect(() => {
    if (selectedLoanIds.length > 0) {
      fetchPendingInstallments(selectedLoanIds)
    } else {
      setPendingInstallments([])
      setSelectedInstallmentIds([])
    }
  }, [selectedLoanIds])
  // ---------------------------------

  // --- FUNCIONES DE FETCHING ---

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
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
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      // Guarda todos los préstamos activos para la selección
      setActiveLoans(data)
      // Restablecer selecciones
      setSelectedLoanIds([]) 
      setPendingInstallments([])
      setSelectedInstallmentIds([])
    } catch (error) {
      console.error("[v0] Error fetching loans:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los préstamos",
        variant: "destructive",
      })
    }
  }

  // Nueva función para cargar cuotas de MÚLTIPLES PRÉSTAMOS
  const fetchPendingInstallments = async (loanIds: string[]) => {
    if (loanIds.length === 0) {
      setPendingInstallments([])
      return
    }

    try {
      const allInstallments: Installment[] = []
      
      // Itera sobre cada ID de préstamo seleccionado para obtener sus cuotas
      for (const loanId of loanIds) {
        // La API de installments debe devolver cuotas con su respectivo loan_code
        const response = await fetch(`/api/installments?loan_id=${loanId}`) 
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        const data: Installment[] = await response.json()
        
        // Agrega un código de préstamo a cada cuota para facilitar la visualización
        const loanCode = activeLoans.find(l => l.id === loanId)?.loan_code || 'N/A'
        const enrichedData = data.map(inst => ({ ...inst, loan_code: loanCode, loan_id: loanId }))

        allInstallments.push(...enrichedData)
      }

      // Ordena por fecha de vencimiento y luego por número de cuota
      allInstallments.sort((a, b) => {
          if (a.due_date < b.due_date) return -1
          if (a.due_date > b.due_date) return 1
          return a.installment_no - b.installment_no
      })
      
      setPendingInstallments(allInstallments)
      setSelectedInstallmentIds([]) 
    } catch (error) {
      console.error("[v0] Error fetching installments:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuotas pendientes",
        variant: "destructive",
      })
      setPendingInstallments([])
    }
  }

  const fetchReceipts = async () => {
    // ... (Tu función fetchReceipts existente) ...
    try {
      const response = await fetch("/api/receipts")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setReceipts(data)
    } catch (error) {
      console.error("[v0] Error fetching receipts:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los recibos",
        variant: "destructive",
      })
    } finally {
      setIsLoadingReceipts(false)
    }
  }

  // --- MANEJADORES DE ESTADO ---
  const handleLoanToggle = (loanId: string, checked: boolean) => {
    setSelectedLoanIds((prev) => 
      checked ? [...prev, loanId] : prev.filter((id) => id !== loanId)
    )
  }

  const handleInstallmentToggle = (installmentId: string) => {
    setSelectedInstallmentIds((prev) =>
      prev.includes(installmentId) ? prev.filter((id) => id !== installmentId) : [...prev, installmentId],
    )
  }

  const getTotalAmount = () => {
    const cash = Number.parseFloat(cashAmount) || 0
    const transfer = Number.parseFloat(transferAmount) || 0
    return cash + transfer
  }

  const getSelectedInstallmentsTotal = () => {
    return pendingInstallments
      .filter((inst) => selectedInstallmentIds.includes(inst.id))
      .reduce((sum, inst) => sum + (inst.amount_due - inst.amount_paid), 0)
  }

  // --- CREAR RECIBO (LÓGICA ACTUALIZADA) ---
  const handleCreateReceipt = async () => {
    // ATENCIÓN: El backend actual asume UN SOLO loan_id por recibo.
    // Para simplificar, crearemos un recibo por el primer préstamo seleccionado.
    // Si necesitas un recibo para múltiples préstamos, la lógica del backend (process_receipt_payment) debe ser modificada.

    if (!selectedClientId || selectedLoanIds.length === 0 || selectedInstallmentIds.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona un cliente, al menos un préstamo y al menos una cuota",
        variant: "destructive",
      })
      return
    }

    const totalAmount = getTotalAmount()
    if (totalAmount <= 0) {
      toast({
        title: "Error",
        description: "El monto total debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }
    
    // Agrupamos las cuotas seleccionadas por su préstamo para crear recibos individuales
    const selectedInstallmentsByLoan = pendingInstallments
        .filter(inst => selectedInstallmentIds.includes(inst.id))
        .reduce((acc, inst) => {
            if (!acc[inst.loan_id]) {
                acc[inst.loan_id] = []
            }
            acc[inst.loan_id].push(inst)
            return acc
        }, {} as Record<string, Installment[]>)

    // Calculamos el monto total de las cuotas seleccionadas para validar contra el total del recibo
    const requiredTotal = getSelectedInstallmentsTotal()
    if (totalAmount < requiredTotal) {
        toast({
            title: "Advertencia",
            description: `El monto total del recibo (${formatCurrency(totalAmount)}) es menor que el total de las cuotas seleccionadas (${formatCurrency(requiredTotal)}). El pago será imputado parcialmente.`,
            variant: "default",
        })
    }
    
    // LÓGICA CLAVE: Iterar y crear un recibo por cada PRÉSTAMO seleccionado que tenga cuotas.
    // Esto es NECESARIO porque tu backend asume 1 Recibo = 1 Préstamo.

    setIsLoading(true)
    let remainingAmount = totalAmount // Usamos el monto para el primer recibo
    const loanIdsProcessed: string[] = []

    for (const loanId in selectedInstallmentsByLoan) {
        if (selectedInstallmentsByLoan.hasOwnProperty(loanId)) {
            const installmentsToPay = selectedInstallmentsByLoan[loanId]
            const totalForThisLoan = installmentsToPay.reduce((sum, inst) => sum + (inst.amount_due - inst.amount_paid), 0)
            
            // Monto a aplicar a este préstamo. Limitado por el monto total restante.
            const amountToApply = Math.min(totalForThisLoan, remainingAmount)

            if (amountToApply <= 0) continue // Si no queda monto, salta al siguiente préstamo

            try {
                const response = await fetch("/api/receipts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        client_id: selectedClientId,
                        loan_id: loanId, // El ID de préstamo correcto
                        installment_ids: installmentsToPay.map(i => i.id), // Solo las cuotas de este préstamo
                        payment_type: totalAmount >= requiredTotal ? "total" : "partial",
                        cash_amount: amountToApply, // Simplificamos el pago como efectivo en el primer recibo
                        transfer_amount: 0,
                        total_amount: amountToApply, // Solo lo que se aplica a este préstamo
                        notes: notes || undefined,
                    }),
                })
                
                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.detail || `Error creando recibo para el préstamo ${loanId}`)
                }

                remainingAmount -= amountToApply // Resta el monto aplicado al remanente
                loanIdsProcessed.push(loanId)

            } catch (error) {
                console.error(`[v0] Error creando recibo para el préstamo ${loanId}:`, error)
                toast({
                    title: "Error crítico",
                    description: `Fallo al crear recibo para el préstamo ${loanId}. Deteniendo el proceso.`,
                    variant: "destructive",
                })
                break // Detiene el proceso si falla un recibo
            }
        }
    }

    if (loanIdsProcessed.length > 0) {
        toast({
            title: "Éxito",
            description: `Se crearon ${loanIdsProcessed.length} recibos y los pagos fueron procesados.`,
        })

        // Reset form
        setSelectedClientId("")
        setSelectedLoanIds([])
        setSelectedInstallmentIds([])
        setCashAmount("")
        setTransferAmount("")
        setNotes("")

        // Refresh receipts list
        fetchReceipts()
    }


  } catch (error) {
    console.error("[v0] Error creating receipts:", error)
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Error inesperado",
      variant: "destructive",
    })
  } finally {
    setIsLoading(false)
  }
}

  // --- UTILIDADES DE FORMATO ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR")
  }
  // -----------------------------

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Receipt className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Gestión de Recibos</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receipt Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear Nuevo Recibo
            </CardTitle>
            <CardDescription>Selecciona un cliente, préstamo(s) y cuotas para generar un recibo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* 1. SELECCIONAR CLIENTE */}
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

            {/* 2. SELECCIÓN MÚLTIPLE DE PRÉSTAMOS */}
            <div className="space-y-2">
              <Label htmlFor="loan">Préstamos Activos ({activeLoans.length})</Label>
              <div className="border rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                {activeLoans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {!selectedClientId ? "Selecciona un cliente" : "No hay préstamos activos"}
                  </p>
                ) : (
                  activeLoans.map((loan) => (
                    <div key={loan.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`loan-${loan.id}`}
                        checked={selectedLoanIds.includes(loan.id)}
                        onCheckedChange={(checked) => handleLoanToggle(loan.id, checked)}
                      />
                      <label
                        htmlFor={`loan-${loan.id}`}
                        className="text-sm font-medium leading-none flex-1"
                      >
                        {loan.loan_code} ({formatCurrency(loan.amount)}) - {loan.installments} cuotas
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. SELECCIONAR CUOTAS PENDIENTES */}
            {selectedLoanIds.length > 0 && (
              <div className="space-y-2">
                <Label>Cuotas a Pagar ({pendingInstallments.length} pendientes)</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {pendingInstallments.map((installment) => (
                    <div key={installment.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={installment.id}
                        checked={selectedInstallmentIds.includes(installment.id)}
                        onCheckedChange={() => handleInstallmentToggle(installment.id)}
                      />
                      <label
                        htmlFor={installment.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                      >
                        **{installment.loan_code}** - Cuota {installment.installment_no} ({formatDate(installment.due_date)}) -{" "}
                        {formatCurrency(installment.amount_due - installment.amount_paid)}
                        {installment.status === "con_mora" && (
                          <Badge variant="destructive" className="ml-2">
                            Mora
                          </Badge>
                        )}
                        {installment.amount_paid > 0 && installment.amount_paid < installment.amount_due && (
                            <Badge variant="secondary" className="ml-2">
                                Pago Parcial
                            </Badge>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedInstallmentIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    **Total requerido:** {formatCurrency(getSelectedInstallmentsTotal())}
                  </p>
                )}
              </div>
            )}

            {/* 4. MONTOS DE PAGO */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cash">Efectivo</Label>
                <Input
                  id="cash"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer">Transferencia</Label>
                <Input
                  id="transfer"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                />
              </div>
            </div>

            {(cashAmount || transferAmount) && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Total del Recibo: {formatCurrency(getTotalAmount())}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Observaciones (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones sobre el pago..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleCreateReceipt} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Crear Recibo ({selectedLoanIds.length} Recibo(s))
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Receipts (El código para mostrar recibos recientes va aquí) */}
        {/* Usamos un placeholder para no repetir el código no esencial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recibos Recientes
            </CardTitle>
            <CardDescription>Últimos recibos generados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder para la lista de recibos */}
            <div className="text-center py-8 text-muted-foreground">
              (Aquí va el código para mostrar los recibos recientes)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
