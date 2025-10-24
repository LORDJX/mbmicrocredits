"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateLoanForm } from "@/components/forms/create-loan-form"
import { LoanDetailsModal } from "@/components/loan-details-modal"
import { LoanPrintView } from "@/components/loan-print-view"
import { Download, Edit, Eye, MessageCircle, MoreHorizontal, Printer } from "lucide-react"
import { formatArgentinaDate } from "@/lib/utils/date-utils"

interface LoanActionsMenuProps {
  loan: any
  onSuccess?: () => void
}

export function LoanActionsMenu({ loan, onSuccess }: LoanActionsMenuProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const handleWhatsApp = () => {
    const phone = loan.active_clients?.phone
    if (!phone) {
      alert("El cliente no tiene teléfono registrado")
      return
    }

    const installmentAmount = Number(loan.amount_to_repay) / Number(loan.installments)
    const frequencyLabel =
      loan.frequency === "monthly" ? "Mensual" : loan.frequency === "biweekly" ? "Quincenal" : "Semanal"

    const message = `Hola ${loan.active_clients.first_name},

Te envío el resumen de tu préstamo ${loan.loan_code}:

💰 Monto prestado: $${Number(loan.amount).toLocaleString("es-AR")}
📅 Inicio: ${formatArgentinaDate(loan.start_date)}
📋 Cuotas: ${loan.installments} cuotas de $${installmentAmount.toLocaleString("es-AR")}
📆 Frecuencia: ${frequencyLabel}

Si tenés dudas, contactame.

Saludos!`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const handleDownloadSchedule = async () => {
    try {
      const response = await fetch(`/api/loans/${loan.id}/summary`)
      const data = await response.json()

      const installmentAmount = Number(loan.amount_to_repay) / Number(loan.installments)
      const frequencyLabel =
        loan.frequency === "monthly" ? "Mensual" : loan.frequency === "biweekly" ? "Quincenal" : "Semanal"

      let content = `CRONOGRAMA DE CUOTAS\n`
      content += `Préstamo: ${loan.loan_code}\n`
      content += `Cliente: ${loan.active_clients.first_name} ${loan.active_clients.last_name}\n`
      content += `Generado: ${formatArgentinaDate(new Date().toISOString())}\n\n`
      content += `-----------------------------------\n`

      // Generar todas las cuotas
      const startDate = new Date(loan.start_date)
      for (let i = 1; i <= loan.installments; i++) {
        const dueDate = new Date(startDate)
        if (loan.frequency === "monthly") {
          dueDate.setMonth(dueDate.getMonth() + (i - 1))
        } else if (loan.frequency === "biweekly") {
          dueDate.setDate(dueDate.getDate() + (i - 1) * 15)
        } else {
          dueDate.setDate(dueDate.getDate() + (i - 1) * 7)
        }
        content += `Cuota ${i} - Vence: ${formatArgentinaDate(dueDate.toISOString())} - $${installmentAmount.toLocaleString("es-AR")}\n`
      }

      content += `-----------------------------------\n\n`
      content += `Total: $${Number(loan.amount_to_repay).toLocaleString("es-AR")} en ${loan.installments} cuotas\n`
      content += `Frecuencia: ${frequencyLabel}\n`

      // Crear y descargar archivo
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cronograma_${loan.loan_code}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading schedule:", error)
      alert("Error al descargar el cronograma")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowDetails(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPrint(true)}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleWhatsApp}>
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadSchedule}>
            <Download className="h-4 w-4 mr-2" />
            Descargar Cronograma
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de Detalles */}
      <LoanDetailsModal loanId={loan.id} open={showDetails} onOpenChange={setShowDetails} />

      {/* Vista de Impresión */}
      {showPrint && <LoanPrintView loan={loan} onClose={() => setShowPrint(false)} />}

      {/* Modal de Edición */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Préstamo</DialogTitle>
          </DialogHeader>
          <CreateLoanForm
            initialData={loan}
            onSuccess={() => {
              setShowEdit(false)
              onSuccess?.()
            }}
            onCancel={() => setShowEdit(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
