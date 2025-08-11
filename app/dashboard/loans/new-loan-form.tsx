"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface NewLoanFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
}

type LoanType = "Semanal" | "Quincenal" | "Mensual"

const initialFormData = {
  client_id: "",
  amount: 0,
  total_to_return: 0,
  installments: 1,
  loan_type: "Mensual" as LoanType, // frecuencia de pago
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  status: "activo",
}

interface FormErrors {
  client_id?: string
  amount?: string
  total_to_return?: string
  installments?: string
  start_date?: string
}

export function NewLoanForm({ onSuccess, onCancel }: NewLoanFormProps) {
  const [formData, setFormData] = useState(initialFormData)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [clientsLoading, setClientsLoading] = useState(true)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const { toast } = useToast()

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients")
        if (!response.ok) throw new Error("No se pudieron cargar los clientes.")
        const data: Client[] = await response.json()
        setClients(data)
      } catch (error: any) {
        toast({
          title: "Error",
          description: `No se pudieron cargar los clientes: ${error.message}`,
          variant: "destructive",
        })
      } finally {
        setClientsLoading(false)
      }
    }
    fetchClients()
  }, [toast])

  const computedRate = useMemo(() => {
    if (formData.amount > 0 && formData.total_to_return > 0) {
      const r = (formData.total_to_return / formData.amount - 1) * 100
      return isFinite(r) ? r : 0
    }
    return 0
  }, [formData.amount, formData.total_to_return])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.client_id) newErrors.client_id = "Debes seleccionar un cliente."
    if (formData.amount <= 0) newErrors.amount = "El monto debe ser mayor que cero."
    if (formData.total_to_return <= 0) newErrors.total_to_return = "El monto a devolver debe ser mayor que cero."
    if (formData.total_to_return > 0 && formData.amount > 0 && formData.total_to_return < formData.amount) {
      newErrors.total_to_return = "El monto a devolver no puede ser menor que el monto."
    }
    if (formData.installments <= 0 || !Number.isInteger(formData.installments)) {
      newErrors.installments = "El número de cuotas debe ser un entero positivo."
    }
    if (!formData.start_date) newErrors.start_date = "La fecha de inicio es obligatoria."
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number.parseFloat(value) || 0 : value,
    }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleClientSelect = (clientId: string) => {
    setFormData((prev) => ({ ...prev, client_id: clientId }))
    setOpenCombobox(false)
    if (errors.client_id) {
      setErrors((prev) => ({ ...prev, client_id: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: formData.client_id,
          amount: formData.amount,
          total_to_return: formData.total_to_return,
          installments: formData.installments,
          loan_type: formData.loan_type, // Semanal/Quincenal/Mensual
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "Error al crear el préstamo.")
      }

      toast({
        title: "Éxito",
        description: "Préstamo creado correctamente.",
      })
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-2">
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="client_id" className="text-right pt-2">
          Cliente
        </Label>
        <div className="col-span-3">
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between bg-transparent"
              >
                {formData.client_id
                  ? clients.find((c) => c.id === formData.client_id)?.first_name +
                    " " +
                    clients.find((c) => c.id === formData.client_id)?.last_name
                  : "Selecciona un cliente..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput placeholder="Buscar cliente..." />
                <CommandList>
                  <CommandEmpty>{clientsLoading ? "Cargando clientes..." : "Ningún cliente encontrado."}</CommandEmpty>
                  <CommandGroup>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={`${client.first_name} ${client.last_name} ${client.client_code}`}
                        onSelect={() => handleClientSelect(client.id)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", formData.client_id === client.id ? "opacity-100" : "opacity-0")}
                        />
                        {client.first_name} {client.last_name} ({client.client_code})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.client_id && <p className="text-red-600 text-xs mt-1">{errors.client_id}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="amount" className="text-right pt-2">
          Monto
        </Label>
        <div className="col-span-3">
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            required
          />
          {errors.amount && <p className="text-red-600 text-xs mt-1">{errors.amount}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="total_to_return" className="text-right pt-2">
          Monto a devolver
        </Label>
        <div className="col-span-3">
          <Input
            id="total_to_return"
            name="total_to_return"
            type="number"
            step="0.01"
            value={formData.total_to_return}
            onChange={handleChange}
            required
          />
          {errors.total_to_return && <p className="text-red-600 text-xs mt-1">{errors.total_to_return}</p>}
          <p className="mt-1 text-xs text-gray-500">
            Tasa estimada: {computedRate > 0 ? `${computedRate.toFixed(2)}%` : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="installments" className="text-right pt-2">
          Cuotas
        </Label>
        <div className="col-span-3">
          <Input
            id="installments"
            name="installments"
            type="number"
            step="1"
            value={formData.installments}
            onChange={handleChange}
            required
          />
          {errors.installments && <p className="text-red-600 text-xs mt-1">{errors.installments}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">Tipo de préstamo</Label>
        <div className="col-span-3">
          <Select
            value={formData.loan_type}
            onValueChange={(v: LoanType) => setFormData((prev) => ({ ...prev, loan_type: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una frecuencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semanal">Semanal</SelectItem>
              <SelectItem value="Quincenal">Quincenal</SelectItem>
              <SelectItem value="Mensual">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="start_date" className="text-right pt-2">
          Fecha Inicio
        </Label>
        <div className="col-span-3">
          <Input
            id="start_date"
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            required
          />
          {errors.start_date && <p className="text-red-600 text-xs mt-1">{errors.start_date}</p>}
        </div>
      </div>

      <DialogFooter className="mt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gray-700 hover:bg-gray-800 text-gray-50" disabled={loading}>
          {loading ? "Creando..." : "Crear Préstamo"}
        </Button>
      </DialogFooter>
    </form>
  )
}
