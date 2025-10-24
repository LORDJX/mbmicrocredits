"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, DollarSign, Calendar, CreditCard, CheckCircle2, AlertCircle, Printer } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface LoanDetailsModalProps {
  loanId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoanDetailsModal({ loanId, open, onOpenChange }: LoanDetailsModalProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (open && loanId) {
      fetchLoanDetails()
    }
  }, [open, loanId])

  const fetchLoanDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/loans/${loanId}/summary`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("Error fetching loan details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById("modal-print-content")
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Detalle del Préstamo</title>
          <style>
            @page { margin: 2cm; }
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            h1, h2 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .badge-default { background-color: #22c55e; color: white; }
            .badge-secondary { background-color: #f59e0b; color: white; }
            .badge-destructive { background-color: #ef4444; color: white; }
            .section { margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      PAGADA_EN_FECHA: { label: "Pagada en Fecha", variant: "default" },
      PAGADA_CON_MORA: { label: "Pagada con Mora", variant: "secondary" },
      PAGO_ANTICIPADO: { label: "Pago Anticipado", variant: "outline" },
      A_PAGAR: { label: "A Pagar", variant: "secondary" },
      A_PAGAR_HOY: { label: "A Pagar Hoy", variant: "secondary" },
      VENCIDA: { label: "Vencida", variant: "destructive" },
    }
    const config = statusConfig[status] || { label: status, variant: "outline" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!data) return null

  const { loan, summary } = data
  const installments = data.installments || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalle del Préstamo</DialogTitle>
        </DialogHeader>

        <div id="modal-print-content" className="space-y-6">
          {/* Sección 1: Información del Préstamo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Información del Préstamo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Código del Préstamo</p>
                <p className="font-semibold">{loan.loan_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-semibold">
                  {loan.clients?.first_name} {loan.clients?.last_name} ({loan.clients?.client_code})
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monto Original</p>
                <p className="font-semibold text-lg">{formatCurrency(loan.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interés Aplicado</p>
                <p className="font-semibold">{loan.interest_rate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monto Total a Devolver</p>
                <p className="font-semibold text-lg text-primary">{formatCurrency(summary.total_due)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                <p className="font-semibold">{new Date(loan.start_date).toLocaleDateString("es-AR")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cantidad de Cuotas</p>
                <p className="font-semibold">{summary.installments_count} cuotas</p>
              </div>
            </CardContent>
          </Card>

          {/* Sección 2: Estado de Cuotas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Estado de Cuotas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuota</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pagado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((inst: any) => (
                    <TableRow key={inst.id}>
                      <TableCell className="font-medium">
                        Cuota {inst.installment_no} de {inst.installments_total}
                      </TableCell>
                      <TableCell>{new Date(inst.due_date).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell>{formatCurrency(inst.amount_due)}</TableCell>
                      <TableCell>{getStatusBadge(inst.status)}</TableCell>
                      <TableCell>{inst.amount_paid > 0 ? formatCurrency(inst.amount_paid) : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Sección 3: Resumen Financiero */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumen Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Cobrado</p>
                  <p className="font-semibold text-lg text-green-600">{formatCurrency(summary.total_paid)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                  <p className="font-semibold text-lg text-orange-600">{formatCurrency(summary.balance)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cuotas Pagadas</p>
                <p className="font-semibold">
                  {summary.paid_count} / {summary.installments_count}
                </p>
              </div>
              {summary.has_overdue && (
                <div>
                  <p className="text-sm text-muted-foreground">Cuotas Vencidas</p>
                  <p className="font-semibold text-destructive">
                    {installments.filter((i: any) => i.status === "VENCIDA").length}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
