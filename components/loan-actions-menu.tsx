"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateLoanForm } from "@/components/forms/create-loan-form"
import { LoanDetailsModal } from "@/components/loan-details-modal"
import { LoanPrintView } from "@/components/loan-print-view"
import { Edit, MessageCircle, MoreHorizontal, Printer, Eye, Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { jsPDF } from "jspdf"

interface LoanActionsMenuProps {
  loan: any
  onSuccess?: () => void
}

export function LoanActionsMenu({ loan, onSuccess }: LoanActionsMenuProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const handleWhatsApp = () => {
    const phone = loan.active_clients?.phone?.replace(/\D/g, "")
    if (!phone) {
      alert("El cliente no tiene teléfono registrado")
      return
    }

    const cuotaAmount = Number(loan.amount) / loan.installments
    const frequencyMap: Record<string, string> = {
      monthly: "Mensual",
      biweekly: "Quincenal",
      weekly: "Semanal",
    }
    const frequency = frequencyMap[loan.frequency] || "Mensual"

    const message = `Hola ${loan.active_clients.first_name},

Te envío el resumen de tu préstamo:

📋 Código: ${loan.loan_code}
👤 Cliente: ${loan.active_clients.first_name} ${loan.active_clients.last_name}
📅 Fecha de inicio: ${new Date(loan.start_date).toLocaleDateString("es-AR")}
💰 Monto prestado: ${formatCurrency(loan.amount)}
📊 Cantidad de cuotas: ${loan.installments}
💵 Valor de la cuota: ${formatCurrency(cuotaAmount)}
📆 Tipo de préstamo: ${frequency}

Si tenés dudas, contactame.

Saludos!`

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleDownloadSchedule = async () => {
    try {
      const response = await fetch(`/api/loans/${loan.id}/summary`)
      if (!response.ok) throw new Error("Error al obtener datos")

      const { installments } = await response.json()

      const doc = new jsPDF({
        format: [80, 297],
      })

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("CRONOGRAMA DE CUOTAS", 40, 15, { align: "center" })

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text(`Prestamo: ${loan.loan_code}`, 40, 25, { align: "center" })
      doc.text(`Cliente: ${loan.active_clients.first_name} ${loan.active_clients.last_name}`, 40, 31, {
        align: "center",
      })
      doc.text(`${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR")}`, 40, 37, {
        align: "center",
      })

      doc.setLineWidth(0.5)
      doc.line(5, 42, 75, 42)

      let y = 50
      doc.setFontSize(8)

      installments?.forEach((inst: any) => {
        const statusMap: Record<string, string> = {
          PAGADA_EN_FECHA: "✓ Pagada",
          PAGADA_CON_MORA: "✓ Mora",
          PAGO_ANTICIPADO: "✓ Anticip",
          A_PAGAR: "○ Pend",
          A_PAGAR_HOY: "! Hoy",
          VENCIDA: "✗ Venc",
        }
        const status = statusMap[inst.status] || inst.status

        doc.setFont("helvetica", "bold")
        doc.text(`Cuota ${inst.installment_no}/${inst.installments_total}`, 8, y)

        doc.setFont("helvetica", "normal")
        doc.text(`${new Date(inst.due_date).toLocaleDateString("es-AR")}`, 8, y + 5)
        doc.text(`${formatCurrency(inst.amount_due)}`, 50, y + 5, { align: "right" })
        doc.text(status, 72, y + 5, { align: "right" })

        doc.setLineDash([1, 1])
        doc.line(8, y + 8, 72, y + 8)
        doc.setLineDash([])

        y += 13

        if (y > 280) {
          doc.addPage()
          y = 20
        }
      })

      doc.setLineWidth(0.5)
      doc.line(5, y + 2, 75, y + 2)
      doc.setFontSize(7)
      doc.text("Gracias por su confianza", 40, y + 8, { align: "center" })

      doc.save(`cronograma-${loan.loan_code}.pdf`)
    } catch (error) {
      console.error("Error downloading schedule:", error)
      alert("Error al descargar el cronograma")
    }
  }

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ffffff;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e0e0e0;
        }
      `}</style>

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
            Cronograma
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LoanDetailsModal loanId={loan.id} open={showDetails} onOpenChange={setShowDetails} />

      {showPrint && <LoanPrintView loanId={loan.id} onClose={() => setShowPrint(false)} />}

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="!max-w-none w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
          <div className="custom-scrollbar overflow-y-auto h-full p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>Editar Préstamo {loan.loan_code}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CreateLoanForm
                  initialData={loan}
                  onSuccess={() => {
                    setShowEdit(false)
                    onSuccess?.()
                  }}
                />
              </div>

              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Resumen Actual</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monto:</span>
                      <span className="font-semibold">{formatCurrency(loan.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cuotas:</span>
                      <span className="font-semibold">{loan.installments}</span>
                    </div>
                    <Separator />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="font-medium">
                      {loan.active_clients.first_name} {loan.active_clients.last_name}
                    </p>
                    <p className="text-muted-foreground">{loan.active_clients.client_code}</p>
                    {loan.active_clients.phone && <p className="text-muted-foreground">{loan.active_clients.phone}</p>}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
