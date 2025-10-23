"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LoanStatusSelectorProps {
  loanId: string
  currentStatus: string
  onStatusChange?: () => void
}

export function LoanStatusSelector({ loanId, currentStatus, onStatusChange }: LoanStatusSelectorProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/loans/${loanId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Error al actualizar estado")

      setStatus(newStatus)
      if (onStatusChange) onStatusChange()
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Error al actualizar estado")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Activo</SelectItem>
        <SelectItem value="cancelled">Cancelado</SelectItem>
        <SelectItem value="completed">Completado</SelectItem>
      </SelectContent>
    </Select>
  )
}
