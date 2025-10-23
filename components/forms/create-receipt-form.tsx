"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, Receipt, DollarSign, User, Zap, Check, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getClientActiveLoans, getLoansPendingInstallments, distributePayment } from "@/lib/actions/receipt-actions"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface CreateReceiptFormProps {
  onSuccess?: (receipt: any) => void
  onCancel?: () => void
  onSummaryChange?: (summary: any) => void
}

interface Loan {
  id: string
  loan_code: string
  principal: number
  installments_total: number
  status: string
}

interface Installment {
  id: string
  loan_id: string
  installment_no: number
  code: string
  due_date: string
  amount_due: number
  amount_paid: number
  balance_due: number
  loans?: { loan_code: string }
}

interface Imputation {
  installment_id: string
  imputed_amount: number
}

export function CreateReceiptForm({ onSuccess, onCancel, onSummaryChange }: CreateReceiptFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingLoans, setLoadingLoans] = useState(false)
  const [loadingInstallments, setLoadingInstallments] = useState(false)

  const [formData, setFormData] = useState({
    client_id: "",
    payment_type: "total",
    cash_amount: "",
    transfer_amount: "",
    receipt_date: new Date().toISOString().split("T")[0],
    observations: "",
  })

  const [selectedLoans, setSelectedLoans] = useState<Set<string>>(new Set())
  const [selectedInstallments, setSelectedInstallments] = useState<Imputation[]>([])
  const [autoDistributed, setAutoDistributed] = useState(false)
  const [openClientPopover, setOpenClientPopover] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients")
        const data = await response.json()
        setClients(data.clients || [])
      } catch (error) {
        console.error("Error fetching clients:", error)
        toast({ title: "Error", description: "No se pudieron cargar los clientes", variant: "destructive" })
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [toast])

  useEffect(() => {
    if (!formData.client_id) {
      setLoans([])
      setSelectedLoans(new Set())
      setInstallments([])
      setSelectedInstallments([])
      return
    }

    const fetchLoans = async () => {
      setLoadingLoans(true)
      const { loans: data, error } = await getClientActiveLoans(formData.client_id)
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" })
      } else {
        setLoans(data)
      }
      setLoadingLoans(false)
    }

    fetchLoans()
  }, [formData.client_id, toast])

  useEffect(() => {
    if (selectedLoans.size === 0) {
      setInstallments([])
      setSelectedInstallments([])
      return
    }

    const fetchInstallments = async () => {
      setLoadingInstallments(true)
      const { installments: data, error } = await getLoansPendingInstallments(Array.from(selectedLoans))
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" })
      } else {
        setInstallments(data)
        setSelectedInstallments([])
        setAutoDistributed(false)
      }
      setLoadingInstallments(false)
    }

    fetchInstallments()
  }, [selectedLoans, toast])

  const totalAmount = useMemo(() => {
    const cash = Number.parseFloat(formData.cash_amount) || 0
    const transfer = Number.parseFloat(formData.transfer_amount) || 0
    return cash + transfer
  }, [formData.cash_amount, formData.transfer_amount])

  const totalImputations = useMemo(() => {
    return selectedInstallments.reduce((sum, imp) => sum + Number(imp.imputed_amount), 0)
  }, [selectedInstallments])

  const summaryData = useMemo(() => {
    const selectedClient = clients.find((c) => c.id === formData.client_id)
    const selectedLoansList = loans.filter((l) => selectedLoans.has(l.id))
    const totalCuotas = selectedInstallments.length
    const totalLoans = selectedLoansList.length

    return {
      client: selectedClient,
      loans: selectedLoansList,
      totalLoans,
      totalCuotas,
      totalAmount,
      cash: Number.parseFloat(formData.cash_amount) || 0,
      transfer: Number.parseFloat(formData.transfer_amount) || 0,
      paymentType: formData.payment_type,
      totalInstallments: installments.length,
    }
  }, [
    clients,
    formData.client_id,
    loans,
    selectedLoans,
    selectedInstallments,
    totalAmount,
    formData.cash_amount,
    formData.transfer_amount,
    formData.payment_type,
    installments.length,
  ])

  useEffect(() => {
    onSummaryChange?.(summaryData)
  }, [summaryData, onSummaryChange])

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const toggleLoan = useCallback((loanId: string) => {
    setSelectedLoans((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(loanId)) {
        newSelected.delete(loanId)
      } else {
        newSelected.add(loanId)
      }
      return newSelected
    })
  }, [])

  const handleAutoDistribute = useCallback(() => {
    if (totalAmount <= 0) {
      toast({ title: "Error", description: "Ingresa un monto válido", variant: "destructive" })
      return
    }

    const { imputations, remaining } = distributePayment(installments, totalAmount)
    setSelectedInstallments(imputations)
    setAutoDistributed(true)

    if (remaining > 0) {
      toast({
        title: "Distribución parcial",
        description: `${remaining.toLocaleString("es-AR", { style: "currency", currency: "ARS" })} no se pudo imputar`,
        variant: "destructive",
      })
    }
  }, [totalAmount, installments, toast])

  const handleInstallmentChange = useCallback(
    (installmentId: string, amount: string) => {
      const numAmount = Number.parseFloat(amount) || 0
      const inst = installments.find((i) => i.id === installmentId)

      if (!inst || numAmount < 0 || numAmount > inst.balance_due) {
        return
      }

      setSelectedInstallments((prev) => {
        const existing = prev.find((imp) => imp.installment_id === installmentId)
        if (existing) {
          return prev.map((imp) => (imp.installment_id === installmentId ? { ...imp, imputed_amount: numAmount } : imp))
        } else if (numAmount > 0) {
          return [...prev, { installment_id: installmentId, imputed_amount: numAmount }]
        }
        return prev
      })

      setAutoDistributed(false)
    },
    [installments],
  )

  const removeInstallment = useCallback((installmentId: string) => {
    setSelectedInstallments((prev) => prev.filter((imp) => imp.installment_id !== installmentId))
    setAutoDistributed(false)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)

      try {
        if (totalAmount <= 0) {
          throw new Error("Ingresa un monto válido")
        }

        if (selectedInstallments.length === 0) {
          throw new Error("Selecciona al menos una cuota")
        }

        if (Math.abs(totalAmount - totalImputations) > 0.01) {
          throw new Error("El monto debe coincidir exactamente con las cuotas seleccionadas")
        }

        const response = await fetch("/api/receipts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            selected_installments: selectedInstallments,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Error al crear recibo")
        }

        toast({
          title: "Recibo creado",
          description: `Recibo ${data.receipt.receipt_number} creado exitosamente`,
        })

        onSuccess?.(data.receipt)
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al crear recibo",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [totalAmount, totalImputations, selectedInstallments, formData, onSuccess, toast],
  )

  const getInstallmentStatus = useCallback(
    (inst: Installment) => {
      const today = new Date(formData.receipt_date)
      const dueDate = new Date(inst.due_date)
      if (today < dueDate) return { label: "Próxima", variant: "outline" as const }
      if (today.toDateString() === dueDate.toDateString()) return { label: "Vence Hoy", variant: "secondary" as const }
      return { label: "Vencida", variant: "destructive" as const }
    },
    [formData.receipt_date],
  )

  const selectedClient = clients.find((c) => c.id === formData.client_id)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Receipt className="h-6 w-6" />
          Nuevo Recibo
        </CardTitle>
        <CardDescription className="text-base">Registra pago con distribución automática de cuotas</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. CLIENTE */}
          <div className="space-y-3 pb-4 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Seleccionar Cliente
            </h3>
            <Popover open={openClientPopover} onOpenChange={setOpenClientPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between text-base h-11",
                    !formData.client_id && "text-muted-foreground",
                  )}
                  disabled={loadingClients}
                >
                  {selectedClient
                    ? `${selectedClient.first_name} ${selectedClient.last_name} (${selectedClient.client_code})`
                    : loadingClients
                      ? "Cargando clientes..."
                      : "Busca un cliente..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={true}>
                  <CommandInput placeholder="Busca por nombre, apellido o código..." className="text-base h-11" />
                  <CommandEmpty className="text-base p-4">No se encontraron clientes.</CommandEmpty>
                  <CommandList className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white scrollbar-track-gray-700 scrollbar-thumb-2">
                    <CommandGroup>
                      {clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={`${client.first_name} ${client.last_name} ${client.client_code}`}
                          onSelect={() => {
                            handleInputChange("client_id", client.id)
                            setOpenClientPopover(false)
                          }}
                          className="text-base py-2 px-3 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.client_id === client.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div>
                            <div className="font-medium">
                              {client.first_name} {client.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{client.client_code}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* 2. PRÉSTAMOS ACTIVOS */}
          {formData.client_id && (
            <div className="space-y-3 pb-4 border-b">
              <h3 className="text-lg font-semibold">Préstamos Activos</h3>
              {loadingLoans ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Cargando préstamos...
                </div>
              ) : loans.length === 0 ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    No hay préstamos activos para este cliente
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {loans.map((loan) => (
                    <div key={loan.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                      <Checkbox checked={selectedLoans.has(loan.id)} onCheckedChange={() => toggleLoan(loan.id)} />
                      <div className="flex-1">
                        <div className="font-semibold text-base">{loan.loan_code}</div>
                        <div className="text-sm text-muted-foreground">
                          ${Number(loan.principal).toLocaleString()} • {loan.installments_total} cuotas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. CUOTAS PENDIENTES */}
          {selectedLoans.size > 0 && (
            <div className="space-y-3 pb-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Cuotas Pendientes a Pagar</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoDistribute}
                  disabled={totalAmount <= 0 || loadingInstallments}
                  className="gap-2 bg-transparent"
                >
                  <Zap className="h-4 w-4" />
                  Distribuir Automático
                </Button>
              </div>

              {loadingInstallments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Cargando cuotas...
                </div>
              ) : installments.length === 0 ? (
                <p className="text-muted-foreground text-base">No hay cuotas pendientes</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white scrollbar-track-gray-700 scrollbar-thumb-2 pr-2">
                  {installments.map((inst) => {
                    const status = getInstallmentStatus(inst)
                    const selected = selectedInstallments.find((imp) => imp.installment_id === inst.id)

                    return (
                      <div
                        key={inst.id}
                        className="flex items-center justify-between p-3 border rounded bg-card/50 text-base"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold truncate">
                              {inst.loans?.loan_code} - Cuota {inst.installment_no}
                            </span>
                            <Badge variant={status.variant} className="text-xs flex-shrink-0">
                              {status.label}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Vence: {new Date(inst.due_date).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="ml-3 text-right flex-shrink-0">
                          {selected ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                className="w-28 px-2 py-1 border rounded text-sm bg-white text-right [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={selected.imputed_amount}
                                onChange={(e) => handleInstallmentChange(inst.id, e.target.value)}
                                max={inst.balance_due}
                                style={{
                                  WebkitAppearance: "none",
                                  MozAppearance: "textfield",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeInstallment(inst.id)}
                                className="text-destructive hover:bg-destructive/10 px-2 py-1 rounded text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-base">
                                ${Number(inst.balance_due).toLocaleString("es-AR")}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleInstallmentChange(inst.id, String(inst.balance_due))}
                                className="text-primary hover:bg-primary/10 px-2 py-1 rounded text-xs font-medium"
                              >
                                Agregar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. MONTO DEL PAGO */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monto del Pago
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-base">Tipo de Pago</Label>
                <Select
                  value={formData.payment_type}
                  onValueChange={(value) => handleInputChange("payment_type", value)}
                >
                  <SelectTrigger className="h-10 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">Total</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cash_amount" className="text-base">
                  Efectivo
                </Label>
                <Input
                  id="cash_amount"
                  type="number"
                  step="0.01"
                  value={formData.cash_amount}
                  onChange={(e) => handleInputChange("cash_amount", e.target.value)}
                  placeholder="0.00"
                  className="h-10 text-base [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "textfield",
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer_amount" className="text-base">
                  Transferencia
                </Label>
                <Input
                  id="transfer_amount"
                  type="number"
                  step="0.01"
                  value={formData.transfer_amount}
                  onChange={(e) => handleInputChange("transfer_amount", e.target.value)}
                  placeholder="0.00"
                  className="h-10 text-base [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "textfield",
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt_date" className="text-base">
                Fecha del Recibo
              </Label>
              <Input
                id="receipt_date"
                type="date"
                value={formData.receipt_date}
                onChange={(e) => handleInputChange("receipt_date", e.target.value)}
                className="h-10 text-base"
              />
            </div>
          </div>

          {/* 5. OBSERVACIONES */}
          <div className="space-y-2">
            <Label htmlFor="observations" className="text-base">
              Observaciones
            </Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => handleInputChange("observations", e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
              className="text-base"
            />
          </div>

          {/* 6. BOTONES */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.client_id ||
                totalAmount <= 0 ||
                selectedInstallments.length === 0 ||
                Math.abs(totalAmount - totalImputations) > 0.01
              }
              className="flex-1 h-11 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Crear Recibo
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="h-11 bg-transparent"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
