"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
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

interface FormData {
  client_id: string
  amount: number
  installments: number
  installment_amount: number
  loan_type: string
  delivery_mode: string
  start_date: string
  observations: string
}

interface FormErrors {
  client_id?: string
  amount?: string
  installments?: string
  installment_amount?: string
  start_date?: string
}

const initialFormData: FormData = {
  client_id: "",
  amount: 0,
  installments: 1,
  installment_amount: 0,
  loan_type: "Semanal",
  delivery_mode: "Efectivo",
  start_date: new Date().toISOString().split("T")[0],
  observations: "",
}

const formatCurrency = (value: string): string => {
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

const parseCurrency = (value: string): number => {
  const numericValue = value.replace(/[^0-9.]/g, "")
  return Number.parseFloat(numericValue) || 0
}

export function NewLoanForm({ onSuccess, onCancel }: NewLoanFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [clientsLoading, setClientsLoading] = useState(true)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [displayAmount, setDisplayAmount] = useState("")
  const [displayInstallmentAmount, setDisplayInstallmentAmount] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients")
        if (!response.ok) {
          throw new Error("Error al cargar clientes")
        }
        const data: Client[] = await response.json()
        setClients(data)
      } catch (error: any) {
        console.error("Error cargando clientes:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes",
          variant: "destructive",
        })
      } finally {
        setClientsLoading(false)
      }
    }
    fetchClients()
  }, [toast])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.client_id) {
      newErrors.client_id = "Debes seleccionar un cliente"
    }
    if (formData.amount <= 0) {
      newErrors.amount = "El monto debe ser mayor que cero"
    }
    if (formData.installments <= 0 || !Number.isInteger(formData.installments)) {
      newErrors.installments = "El número de cuotas debe ser un entero positivo"
    }
    if (formData.installment_amount <= 0) {
      newErrors.installment_amount = "El monto de cuota debe ser mayor que cero"
    }
    if (!formData.start_date) {
      newErrors.start_date = "La fecha de inicio es obligatoria"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCurrency(e.target.value)
    const numericValue = parseCurrency(formattedValue)

    setDisplayAmount(formattedValue)
    setFormData((prev) => ({ ...prev, amount: numericValue }))

    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }))
    }
  }

  const handleInstallmentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCurrency(e.target.value)
    const numericValue = parseCurrency(formattedValue)

    setDisplayInstallmentAmount(formattedValue)
    setFormData((prev) => ({ ...prev, installment_amount: numericValue }))

    if (errors.installment_amount) {
      setErrors((prev) => ({ ...prev, installment_amount: undefined }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number.parseFloat(value) || 0 : value,
    }))

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleClientSelect = (clientId: string) => {
    setFormData((prev) => ({ ...prev, client_id: clientId }))
    setOpenCombobox(false)
    if (errors.client_id) {
      setErrors((prev) => ({ ...prev, client_id: undefined }))
    }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setDisplayAmount("")
    setDisplayInstallmentAmount("")
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const totalAmount = formData.installment_amount * formData.installments
      const interestRate = formData.amount > 0 ? (totalAmount / formData.amount - 1) * 100 : 0

      const formatDateForDatabase = (dateString: string) => {
        if (!dateString) return null
        // Crear fecha local sin conversión de zona horaria usando los componentes de fecha directamente
        const [year, month, day] = dateString.split("-")
        const localDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
        return localDate.toISOString().split("T")[0] + "T00:00:00.000Z"
      }

      const submitData = {
        client_id: formData.client_id,
        amount: formData.amount,
        installments: formData.installments,
        installment_amount: formData.installment_amount,
        loan_type: formData.loan_type,
        delivery_mode: formData.delivery_mode,
        start_date: formatDateForDatabase(formData.start_date),
        observations: formData.observations,
        interest_rate: interestRate,
        amount_to_repay: totalAmount,
        status: "activo",
      }

      console.log("[v0] Enviando datos del nuevo préstamo:", submitData)
      console.log("[v0] Fecha original del formulario:", formData.start_date)
      console.log("[v0] Fecha formateada para base de datos:", submitData.start_date)

      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      const responseData = await response.json()
      console.log("[v0] Respuesta del servidor:", responseData)

      if (!response.ok) {
        throw new Error(responseData.detail || "Error al crear el préstamo")
      }

      toast({
        title: "Éxito",
        description: "Préstamo creado correctamente",
      })

      resetForm()
      onSuccess()
    } catch (error: any) {
      console.error("Error al crear préstamo:", error)
      toast({
        title: "Error",
        description: error.message || "Error al crear el préstamo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="client_id" className="text-right text-gray-300 pt-2">
          Cliente
        </Label>
        <div className="col-span-3">
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
              >
                {formData.client_id
                  ? clients.find((client) => client.id === formData.client_id)?.first_name +
                    " " +
                    clients.find((client) => client.id === formData.client_id)?.last_name
                  : "Selecciona un cliente..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-gray-800 border-gray-700 text-gray-100">
              <Command>
                <CommandInput placeholder="Buscar cliente..." className="text-gray-100 placeholder:text-gray-400" />
                <CommandList>
                  <CommandEmpty>{clientsLoading ? "Cargando clientes..." : "Ningún cliente encontrado"}</CommandEmpty>
                  <CommandGroup>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={`${client.first_name} ${client.last_name} ${client.client_code}`}
                        onSelect={() => handleClientSelect(client.id)}
                        className="hover:bg-gray-700 cursor-pointer"
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
          {errors.client_id && <p className="text-red-500 text-xs mt-1">{errors.client_id}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="amount" className="text-right text-gray-300 pt-2">
          Monto
        </Label>
        <div className="col-span-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
            <Input
              id="amount"
              name="amount"
              type="text"
              value={displayAmount}
              onChange={handleAmountChange}
              className="bg-gray-700 border-gray-600 text-gray-100 pl-8"
              placeholder="15000.00"
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Ejemplo: $15000.00 (sin puntos de miles)</p>
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="installments" className="text-right text-gray-300 pt-2">
          Cuotas
        </Label>
        <div className="col-span-3">
          <Input
            id="installments"
            name="installments"
            type="number"
            step="1"
            min="1"
            value={formData.installments}
            onChange={handleChange}
            className="bg-gray-700 border-gray-600 text-gray-100"
            required
          />
          {errors.installments && <p className="text-red-500 text-xs mt-1">{errors.installments}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="installment_amount" className="text-right text-gray-300 pt-2">
          Monto de cuota
        </Label>
        <div className="col-span-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
            <Input
              id="installment_amount"
              name="installment_amount"
              type="text"
              value={displayInstallmentAmount}
              onChange={handleInstallmentAmountChange}
              className="bg-gray-700 border-gray-600 text-gray-100 pl-8"
              placeholder="1875.00"
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Ejemplo: $1875.00 - Monto que pagará el cliente por cada cuota</p>
          {errors.installment_amount && <p className="text-red-500 text-xs mt-1">{errors.installment_amount}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="loan_type" className="text-right text-gray-300 pt-2">
          Tipo de préstamo
        </Label>
        <div className="col-span-3">
          <Select value={formData.loan_type} onValueChange={(value) => handleSelectChange("loan_type", value)}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
              <SelectValue placeholder="Selecciona el tipo" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
              <SelectItem value="Semanal">Semanal</SelectItem>
              <SelectItem value="Quincenal">Quincenal</SelectItem>
              <SelectItem value="Mensual">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="delivery_mode" className="text-right text-gray-300 pt-2">
          Modo de entrega
        </Label>
        <div className="col-span-3">
          <Select value={formData.delivery_mode} onValueChange={(value) => handleSelectChange("delivery_mode", value)}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
              <SelectValue placeholder="Selecciona el modo" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
              <SelectItem value="Efectivo">Efectivo</SelectItem>
              <SelectItem value="Transferencia">Transferencia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="start_date" className="text-right text-gray-300 pt-2">
          Fecha Inicio
        </Label>
        <div className="col-span-3">
          <Input
            id="start_date"
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            className="bg-gray-700 border-gray-600 text-gray-100"
            required
          />
          {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="observations" className="text-right text-gray-300 pt-2">
          Observaciones
        </Label>
        <div className="col-span-3">
          <Textarea
            id="observations"
            name="observations"
            value={formData.observations}
            onChange={handleChange}
            rows={3}
            className="bg-gray-700 border-gray-600 text-gray-100 resize-none"
            placeholder="Ingrese observaciones adicionales sobre el préstamo..."
          />
          <p className="text-xs text-gray-400 mt-1">Campo opcional para notas adicionales</p>
        </div>
      </div>

      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
        >
          Cancelar
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={loading}>
          {loading ? "Creando..." : "Crear Préstamo"}
        </Button>
      </DialogFooter>
    </form>
  )
}
