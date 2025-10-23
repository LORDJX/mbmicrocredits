// components/forms/create-loan-form.tsx

"use client"

import { useState, useEffect, type FormEvent } from "react" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CreditCard, DollarSign, Calendar, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from '@/lib/supabase/client' 

// Clases CSS para ocultar las flechas de input type="number"
const INPUT_NUMBER_NO_SPINNER = " [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

interface CreateLoanFormProps {
  onSuccess?: (loan: any) => void
  onCancel?: () => void
  preselectedClientId?: string
}

export function CreateLoanForm({ onSuccess, onCancel, preselectedClientId }: CreateLoanFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    client_id: preselectedClientId || "",
    amount: "", // Monto Principal
    installment_amount: "", // Monto de Cuota
    installments: "",
    interest_rate: "0", 
    start_date: "",
    loan_type: "personal",
    frequency: "monthly", 
    status: "active",
  })
  const { toast } = useToast()

  // Lógica para filtrar clientes
  const filteredClients = clients.filter(client => 
    client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      const data = await response.json()
      if (response.ok) {
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateEndDate = () => {
    if (formData.start_date && formData.installments) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + Number.parseInt(formData.installments)) 
      return endDate.toISOString().split("T")[0]
    }
    return ""
  }
  
  // Función de formato de moneda (ajustada para 1 decimal para interés, pero se usará para valores monetarios)
  const formatCurrency = (amount: number | string, decimals = 2) => {
    const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
    if (isNaN(num)) return '$0.00';
    return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };


  const calculateTotalRepayAmount = () => {
    if (formData.amount && formData.installments) {
      const principal = Number.parseFloat(formData.amount)
      const rate = Number.parseFloat(formData.interest_rate) / 100 || 0 
      const totalInstallments = Number.parseInt(formData.installments)
      
      if (formData.installment_amount) {
          const installmentAmount = Number.parseFloat(formData.installment_amount);
          return installmentAmount * totalInstallments;
      }
      
      return principal * (1 + rate * totalInstallments) 
    }
    return 0
  }
  
  const totalRepay = calculateTotalRepayAmount();
  const calculatedInstallmentAmount = totalRepay / Number.parseInt(formData.installments || "1");
  const calculatedInterest = totalRepay - Number.parseFloat(formData.amount || "0");


  const handleSubmit = async (e: FormEvent) => { 
    e.preventDefault()
    setIsLoading(true)

    // Validación extra
    if (!formData.client_id || !formData.amount || !formData.installments || !formData.start_date || !formData.frequency) {
         toast({ title: "Error", description: "Por favor, complete todos los campos requeridos.", variant: "destructive" });
         setIsLoading(false);
         return;
    }
    
    // Si el monto total a pagar es 0 o NaN
    if (isNaN(totalRepay) || totalRepay <= 0) {
        toast({ title: "Error", description: "El monto principal y/o la cuota son inválidos.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    

    // En el POST, enviamos el monto de cuota calculado o ingresado y la tasa de interés fija (0)
    const payload = {
        ...formData,
        amount: Number.parseFloat(formData.amount).toFixed(2),
        installment_amount: Number.isNaN(calculatedInstallmentAmount) ? '0' : calculatedInstallmentAmount.toFixed(2), 
        interest_rate: '0', // Se envía como 0 por requisito
    }
    
    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), 
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear préstamo")
      }

      toast({ title: "Préstamo creado", description: `Préstamo ${data.loan.loan_code} creado exitosamente` })

      onSuccess?.(data.loan)
    } catch (error) {
      console.error("Error creating loan:", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Error al crear préstamo", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Nuevo Préstamo
        </CardTitle>
        <CardDescription>Registra un nuevo préstamo en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </h3>
            <div className="space-y-2">
              <Label htmlFor="client_id">
                Cliente <span className="text-destructive">*</span>
              </Label>
              {/* Buscador de Cliente - Ajuste para ser más ancho */}
              <Input
                  placeholder="Buscar por Nombre, Apellido o Código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2 w-full"
              />
              {/* Desplegable de selección - Ahora sigue el ancho del Input de búsqueda */}
              <Select
                value={formData.client_id}
                onValueChange={(value) => handleInputChange("client_id", value)}
                disabled={loadingClients || !!preselectedClientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingClients ? "Cargando clientes..." : "Selecciona un cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} - {client.client_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Información del Préstamo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Detalles del Préstamo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monto Principal */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Monto Principal <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    placeholder="0.00"
                    className={`pl-6 ${INPUT_NUMBER_NO_SPINNER}`}
                    required
                  />
                </div>
              </div>
              {/* Monto de Cuota */}
              <div className="space-y-2">
                <Label htmlFor="installment_amount">
                  Monto de Cuota <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="installment_amount"
                    type="number"
                    step="0.01"
                    value={formData.installment_amount}
                    onChange={(e) => handleInputChange("installment_amount", e.target.value)}
                    placeholder="0.00"
                    className={`pl-6 ${INPUT_NUMBER_NO_SPINNER}`}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installments">
                  Número de Cuotas <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="installments"
                  type="number"
                  value={formData.installments}
                  onChange={(e) => handleInputChange("installments", e.target.value)}
                  placeholder="12"
                    className={INPUT_NUMBER_NO_SPINNER}
                  required
                />
              </div>
                {/* Selector de Frecuencia */}
                <div className="space-y-2">
                    <Label htmlFor="frequency">
                        Frecuencia de Pago <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.frequency} onValueChange={(value) => handleInputChange("frequency", value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona la frecuencia" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monthly">Mensual</SelectItem>
                            <SelectItem value="biweekly">Quincenal</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fechas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">
                  Fecha de 1° Cuota <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha de Fin (Calculada)</Label>
                <Input id="end_date" type="date" value={calculateEndDate()} disabled />
              </div>
            </div>
          </div>

          {/* Resumen */}
          {formData.amount && formData.installments && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Resumen del Préstamo</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Monto Principal (Préstamo):</span>
                  <div className="font-medium">{formatCurrency(formData.amount)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Monto Total a Pagar:</span>
                  <div className="font-medium">{formatCurrency(totalRepay)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Interés Estimado:</span>
                  <div className="font-medium">
                    {formatCurrency(calculatedInterest, 2)}
                  </div>
                </div>
                <div className="space-y-1">
                    <span className="text-muted-foreground">Cuota Estimada:</span>
                    <div className="font-medium text-primary text-lg">
                        {formatCurrency(calculatedInstallmentAmount)}
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Crear Préstamo
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
