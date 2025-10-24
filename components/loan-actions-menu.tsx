"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateLoanForm } from "@/components/forms/create-loan-form"
import { LoanDetailsModal } from "@/components/loan-details-modal"
import { LoanPrintView } from "@/components/loan-print-view"
import { Edit, MessageCircle, MoreHorizontal, Printer, Eye, Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

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

    const installmentAmount = loan.amount / loan.installments
    const frequencyMap: Record<string, string> = {
      monthly: "Mensual",
      biweekly: "Quincenal",
      weekly: "Semanal",
    }

    const message = `Hola ${loan.active_clients.first_name},

Te envío el resumen de tu préstamo ${loan.loan_code}:

💰 Monto prestado: ${formatCurrency(loan.amount)}
📅 Inicio: ${new Date(loan.start_date).toLocaleDateString("es-AR")}
📋 Cuotas: ${loan.installments} cuotas de ${formatCurrency(installmentAmount)}
📆 Frecuencia: ${frequencyMap[loan.frequency] || "Mensual"}

Si tenés dudas, contactame.

Saludos!`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const handleDownloadSchedule = async () => {
    try {
      const response = await fetch(`/api/loans/${loan.id}/summary`)
      if (!response.ok) throw new Error("Error al obtener datos")

      const data = await response.json()
      const installments = data.installments || []

      let content = `CRONOGRAMA DE CUOTAS\n`
      content += `Préstamo: ${loan.loan_code}\n`
      content += `Cliente: ${loan.active_clients?.first_name} ${loan.active_clients?.last_name}\n`
      content += `Generado: ${new Date().toLocaleDateString("es-AR")}\n\n`
      content += `-----------------------------------\n`

      installments.forEach((inst: any) => {
        content += `Cuota ${inst.installment_no} - Vence: ${new Date(inst.due_date).toLocaleDateString("es-AR")} - ${formatCurrency(inst.amount_due)}\n`
      })

      content += `-----------------------------------\n\n`
      content += `Total: ${formatCurrency(data.summary.total_due)} en ${installments.length} cuotas\n`

      const blob = new Blob([content], { type: "text/plain" })
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
            Ver
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
      {showPrint && <LoanPrintView loanId={loan.id} onClose={() => setShowPrint(false)} />}

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
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
