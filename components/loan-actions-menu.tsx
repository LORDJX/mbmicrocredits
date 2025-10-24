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
    const phone = loan.active_clients?.phone?.replace(/\D/g, "") // Solo números
    if (!phone) {
      alert("El cliente no tiene teléfono registrado")
      return
    }

    const cuotaAmount = (Number(loan.amount_to_repay) / loan.installments).toFixed(2)
    const frequencyMap: Record<string, string> = {
      monthly: "Mensual",
      biweekly: "Quincenal",
      weekly: "Semanal",
    }
    const frequency = frequencyMap[loan.frequency] || "Mensual"

    const message = `Hola ${loan.active_clients.first_name},

Te envío el resumen de tu préstamo ${loan.loan_code}:

💰 Monto prestado: ${formatCurrency(loan.amount)}
📅 Inicio: ${new Date(loan.start_date).toLocaleDateString("es-AR")}
📋 Cuotas: ${loan.installments} cuotas de ${formatCurrency(cuotaAmount)}
📆 Frecuencia: ${frequency}
💵 Total a devolver: ${formatCurrency(loan.amount_to_repay)}
${loan.balance > 0 ? `⚠️ Saldo pendiente: ${formatCurrency(loan.balance)}` : "✅ Préstamo completado"}

Si tenés dudas, contactame.

Saludos!`

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleDownloadSchedule = async () => {
    try {
      const response = await fetch(`/api/loans/${loan.id}/summary`)
      if (!response.ok) throw new Error("Error al obtener datos")

      const { summary, installments } = await response.json()

      const doc = new jsPDF()

      // Header
      doc.setFontSize(18)
      doc.text("CRONOGRAMA DE CUOTAS", 105, 20, { align: "center" })

      doc.setFontSize(12)
      doc.text(`Préstamo: ${loan.loan_code}`, 20, 35)
      doc.text(`Cliente: ${loan.active_clients.first_name} ${loan.active_clients.last_name}`, 20, 42)
      doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 20, 49)

      // Línea separadora
      doc.line(20, 55, 190, 55)

      // Cuotas
      let y = 65
      doc.setFontSize(10)

      installments?.forEach((inst: any, index: number) => {
        const statusMap: Record<string, string> = {
          PAGADA_EN_FECHA: "Pagada",
          PAGADA_CON_MORA: "Pagada con mora",
          PAGO_ANTICIPADO: "Pago anticipado",
          A_PAGAR: "Pendiente",
          A_PAGAR_HOY: "Vence hoy",
          VENCIDA: "Vencida",
        }
        const status = statusMap[inst.status] || inst.status

        const text = `Cuota ${inst.installment_no}/${inst.installments_total} - Vence: ${new Date(inst.due_date).toLocaleDateString("es-AR")} - ${formatCurrency(inst.amount_due)} - ${status}`
        doc.text(text, 20, y)
        y += 7

        // Nueva página si es necesario
        if (y > 280) {
          doc.addPage()
          y = 20
        }
      })

      // Footer
      doc.line(20, y + 5, 190, y + 5)
      doc.setFontSize(12)
      doc.text(`Total: ${formatCurrency(summary.total_due)} en ${loan.installments} cuotas`, 20, y + 15)
      doc.text(`Pagado: ${formatCurrency(summary.total_paid)}`, 20, y + 22)
      doc.text(`Saldo: ${formatCurrency(summary.balance)}`, 20, y + 29)

      // Descargar
      doc.save(`cronograma-${loan.loan_code}.pdf`)
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

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Préstamo {loan.loan_code}</DialogTitle>
          </DialogHeader>

          {/* Layout de 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Formulario (2/3) */}
            <div className="lg:col-span-2">
              <CreateLoanForm
                initialData={loan}
                onSuccess={() => {
                  setShowEdit(false)
                  onSuccess?.()
                }}
              />
            </div>

            {/* Columna derecha: Resumen (1/3) */}
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interés:</span>
                    <span className="font-semibold">{loan.interest_rate}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total a devolver:</span>
                    <span className="font-semibold text-primary">{formatCurrency(loan.amount_to_repay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo pendiente:</span>
                    <span className={`font-semibold ${loan.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(loan.balance)}
                    </span>
                  </div>
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
        </DialogContent>
      </Dialog>
    </>
  )
}
