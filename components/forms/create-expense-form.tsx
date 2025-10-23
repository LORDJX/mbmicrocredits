"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { ExpenseCategory, ExpenseFormData, ExpenseWithDetails } from "@/lib/types/expenses"
import {
  formatArgentinaDate,
  toArgentinaDateString,
  parseArgentinaDateString,
  getTodayArgentina,
} from "@/lib/utils/date-utils"

interface CreateExpenseFormProps {
  expense?: ExpenseWithDetails | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateExpenseForm({ expense, onSuccess, onCancel }: CreateExpenseFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [date, setDate] = useState<Date>(
    expense ? parseArgentinaDateString(expense.expense_date) : parseArgentinaDateString(getTodayArgentina()),
  )
  const [formData, setFormData] = useState<ExpenseFormData>({
    category_id: expense?.category_id || "",
    amount: expense?.amount || 0,
    expense_date: expense?.expense_date || getTodayArgentina(),
    payment_method: expense?.payment_method || "cash",
    description: expense?.description || "",
    notes: expense?.notes || "",
    receipt_number: expense?.receipt_number || "",
    vendor_name: expense?.vendor_name || "",
    vendor_phone: expense?.vendor_phone || "",
    vendor_email: expense?.vendor_email || "",
    status: expense?.status || "pending",
    audit_status: expense?.audit_status || "pendiente",
  })

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (expense) {
      setDate(parseArgentinaDateString(expense.expense_date))
      setFormData({
        category_id: expense.category_id || "",
        amount: expense.amount || 0,
        expense_date: expense.expense_date,
        payment_method: expense.payment_method,
        description: expense.description,
        notes: expense.notes || "",
        receipt_number: expense.receipt_number || "",
        vendor_name: expense.vendor_name || "",
        vendor_phone: expense.vendor_phone || "",
        vendor_email: expense.vendor_email || "",
        status: expense.status,
        audit_status: expense.audit_status,
      })
    }
  }, [expense])

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/expense-categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("[v0] Error loading categories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = expense ? `/api/expenses/${expense.id}` : "/api/expenses"
      const method = expense ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Error al ${expense ? "actualizar" : "crear"} el gasto`)
      }

      toast({
        title: expense ? "Gasto actualizado" : "Gasto creado",
        description: `El gasto se ha ${expense ? "actualizado" : "registrado"} correctamente`,
      })

      onSuccess?.()
    } catch (error) {
      console.error("[v0] Error saving expense:", error)
      toast({
        title: "Error",
        description: `No se pudo ${expense ? "actualizar" : "crear"} el gasto`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categoría */}
        <div className="space-y-2">
          <Label htmlFor="category">Categoría *</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Monto */}
        <div className="space-y-2">
          <Label htmlFor="amount">Monto *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount || ""}
            onChange={(e) => setFormData({ ...formData, amount: Number.parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            required
          />
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <Label>Fecha del Gasto *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? formatArgentinaDate(date, "PPP") : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate)
                    setFormData({ ...formData, expense_date: toArgentinaDateString(newDate) })
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Método de Pago */}
        <div className="space-y-2">
          <Label htmlFor="payment_method">Método de Pago *</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value: any) => setFormData({ ...formData, payment_method: value })}
            required
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
              <SelectItem value="card">Tarjeta</SelectItem>
              <SelectItem value="check">Cheque</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estado de Pago */}
        <div className="space-y-2">
          <Label htmlFor="status">Estado de Pago *</Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            required
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estado de Auditoría */}
        <div className="space-y-2">
          <Label htmlFor="audit_status">Estado de Auditoría *</Label>
          <Select
            value={formData.audit_status}
            onValueChange={(value: any) => setFormData({ ...formData, audit_status: value })}
            required
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Número de Recibo */}
        <div className="space-y-2">
          <Label htmlFor="receipt_number">Número de Recibo</Label>
          <Input
            id="receipt_number"
            value={formData.receipt_number}
            onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
            placeholder="Ej: 001-001-0001234"
          />
        </div>

        {/* Proveedor */}
        <div className="space-y-2">
          <Label htmlFor="vendor_name">Proveedor</Label>
          <Input
            id="vendor_name"
            value={formData.vendor_name}
            onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
            placeholder="Nombre del proveedor"
          />
        </div>

        {/* Teléfono del Proveedor */}
        <div className="space-y-2">
          <Label htmlFor="vendor_phone">Teléfono del Proveedor</Label>
          <Input
            id="vendor_phone"
            value={formData.vendor_phone}
            onChange={(e) => setFormData({ ...formData, vendor_phone: e.target.value })}
            placeholder="Ej: +54 9 11 1234-5678"
          />
        </div>

        {/* Email del Proveedor */}
        <div className="space-y-2">
          <Label htmlFor="vendor_email">Email del Proveedor</Label>
          <Input
            id="vendor_email"
            type="email"
            value={formData.vendor_email}
            onChange={(e) => setFormData({ ...formData, vendor_email: e.target.value })}
            placeholder="proveedor@ejemplo.com"
          />
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe el gasto..."
          rows={3}
          required
        />
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas Adicionales</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas opcionales..."
          rows={2}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {expense ? "Actualizar Gasto" : "Crear Gasto"}
        </Button>
      </div>
    </form>
  )
}
