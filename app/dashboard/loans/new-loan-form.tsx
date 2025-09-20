"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
}

interface NewLoanFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function NewLoanForm({ onSuccess, onCancel }: NewLoanFormProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    client_id: "",
    amount: "",
    installments: "",
    loan_type: "",
    interest_rate: "",
    delivery_mode: "",
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error("Error al cargar clientes")
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setLoadingClients(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: formData.client_id,
          amount: Number.parseFloat(formData.amount),
          installments: Number.parseInt(formData.installments),
          loan_type: formData.loan_type,
          interest_rate: Number.parseFloat(formData.interest_rate),
          delivery_mode: formData.delivery_mode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear el préstamo")
      }

      onSuccess()
    } catch (error: any) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el préstamo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_id" className="text-gray-200">
            Cliente
          </Label>
          <Select value={formData.client_id} onValueChange={(value) => handleInputChange("client_id", value)}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
              <SelectValue placeholder={loadingClients ? "Cargando..." : "Seleccionar cliente"} />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id} className="text-gray-100">
                  {client.first_name} {client.last_name} ({client.client_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-gray-200">
            Monto
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="Ej: 500000"
            value={formData.amount}
            onChange={(e) => handleInputChange("amount", e.target.value)}
            className="bg-gray-700 border-gray-600 text-gray-100"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="installments" className="text-gray-200">
            Número de Cuotas
          </Label>
          <Input
            id="installments"
            type="number"
            placeholder="Ej: 12"
            value={formData.installments}
            onChange={(e) => handleInputChange("installments", e.target.value)}
            className="bg-gray-700 border-gray-600 text-gray-100"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="loan_type" className="text-gray-200">
            Tipo de Préstamo
          </Label>
          <Select value={formData.loan_type} onValueChange={(value) => handleInputChange("loan_type", value)}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="Personal" className="text-gray-100">
                Personal
              </SelectItem>
              <SelectItem value="Comercial" className="text-gray-100">
                Comercial
              </SelectItem>
              <SelectItem value="Emergencia" className="text-gray-100">
                Emergencia
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interest_rate" className="text-gray-200">
            Tasa de Interés (%)
          </Label>
          <Input
            id="interest_rate"
            type="number"
            step="0.1"
            placeholder="Ej: 2.5"
            value={formData.interest_rate}
            onChange={(e) => handleInputChange("interest_rate", e.target.value)}
            className="bg-gray-700 border-gray-600 text-gray-100"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery_mode" className="text-gray-200">
            Modo de Entrega
          </Label>
          <Select value={formData.delivery_mode} onValueChange={(value) => handleInputChange("delivery_mode", value)}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
              <SelectValue placeholder="Seleccionar modo" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="Efectivo" className="text-gray-100">
                Efectivo
              </SelectItem>
              <SelectItem value="Transferencia" className="text-gray-100">
                Transferencia
              </SelectItem>
              <SelectItem value="Cheque" className="text-gray-100">
                Cheque
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear Préstamo"}
        </Button>
      </div>
    </form>
  )
}
