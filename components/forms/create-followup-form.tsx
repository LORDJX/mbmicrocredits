"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FollowUp, CreateFollowUpData, UpdateFollowUpData } from "@/lib/types/followups"
import {
  formatArgentinaDate,
  toArgentinaDateString,
  parseArgentinaDateString,
  getTodayArgentina,
} from "@/lib/utils/date-utils"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
}

interface CreateFollowUpFormProps {
  followup?: FollowUp
  onSuccess: () => void
  onCancel: () => void
}

export function CreateFollowUpForm({ followup, onSuccess, onCancel }: CreateFollowUpFormProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  const [formData, setFormData] = useState({
    client_id: followup?.client_id || "",
    date: followup?.date ? parseArgentinaDateString(followup.date) : parseArgentinaDateString(getTodayArgentina()),
    reminder_date: followup?.reminder_date ? parseArgentinaDateString(followup.reminder_date) : (null as Date | null),
    notes: followup?.notes || "",
  })

  const isEditing = !!followup

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error("Error al cargar clientes")
      const data = await response.json()
      setClients(Array.isArray(data.clients) ? data.clients : [])
    } catch (error) {
      console.error("[v0] Error fetching clients:", error)
      setClients([])
    } finally {
      setLoadingClients(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: CreateFollowUpData | UpdateFollowUpData = {
        client_id: formData.client_id,
        date: toArgentinaDateString(formData.date),
        reminder_date: formData.reminder_date ? toArgentinaDateString(formData.reminder_date) : null,
        notes: formData.notes || null,
      }

      const url = isEditing ? `/api/followups/${followup.id}` : "/api/followups"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar seguimiento")
      }

      onSuccess()
    } catch (error) {
      console.error("[v0] Error saving follow-up:", error)
      alert(error instanceof Error ? error.message : "Error al guardar seguimiento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="client_id">Cliente *</Label>
        <Select
          value={formData.client_id}
          onValueChange={(value) => setFormData({ ...formData, client_id: value })}
          disabled={loadingClients}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingClients ? "Cargando clientes..." : "Seleccionar cliente"} />
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
        <Label>Fecha de Seguimiento *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.date ? formatArgentinaDate(formData.date, "PPP") : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.date}
              onSelect={(date) => date && setFormData({ ...formData, date })}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Fecha de Recordatorio</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.reminder_date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.reminder_date
                ? formatArgentinaDate(formData.reminder_date, "PPP")
                : "Seleccionar fecha (opcional)"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.reminder_date || undefined}
              onSelect={(date) => setFormData({ ...formData, reminder_date: date || null })}
            />
          </PopoverContent>
        </Popover>
        {formData.reminder_date && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFormData({ ...formData, reminder_date: null })}
          >
            Limpiar fecha
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Agregar notas sobre el seguimiento..."
          rows={4}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !formData.client_id}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Actualizar" : "Crear"} Seguimiento
        </Button>
      </div>
    </form>
  )
}
