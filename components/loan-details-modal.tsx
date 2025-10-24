"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, AlertCircle } from "lucide-react"
import { formatArgentinaDate } from "@/lib/utils/date-utils"

interface LoanDetailsModalProps {
  loanId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoanDetailsModal({ loanId, open, onOpenChange }: LoanDetailsModalProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && loanId) {
      fetchLoanDetails()
    }
  }, [open, loanId])

  const fetchLoanDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/loans/${loanId}/summary`)
      if (!response.ok) throw new Error("Error al cargar los detalles")
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      PAGADA_EN_FECHA: { label: "🟢 Pagada en Fecha", variant: "default" },
      PAGADA_CON_MORA: { label: "🟡 Pagada con Mora", variant: "secondary" },
      PAGO_ANTICIPADO: { label: "🔵 Pago Anticipado", variant: "outline" },
      A_PAGAR: { label: "⚪ A Pagar", variant: "outline" },
      A_PAGAR_HOY: { label: "🟠 A Pagar Hoy", variant: "secondary" },
      VENCIDA: { label: "🔴 Vencida", variant: "destructive" },
    }
    const config = statusConfig[status] || { label: status, variant: "outline" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Préstamo</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive py-4">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            {/* Sección 1: Información del Préstamo */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Préstamo</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Código del Préstamo</span>
                  <div className="font-medium">{data.loan.loan_code}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Cliente</span>
                  <div className="font-medium">
                    {data.loan.clients.first_name} {data.loan.clients.last_name} ({data.loan.clients.client_code})
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Monto Original Prestado</span>
                  <div className="font-medium text-lg">{formatCurrency(Number(data.loan.amount))}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Interés Aplicado</span>
                  <div className="font-medium">{data.loan.interest_rate}%</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Monto Total a Devolver</span>
                  <div className="font-medium text-lg text-primary">
                    {formatCurrency(Number(data.loan.amount_to_repay))}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Fecha de Inicio</span>
                  <div className="font-medium">{formatArgentinaDate(data.loan.start_date)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Cantidad Total de Cuotas</span>
                  <div className="font-medium">{data.loan.installments} cuotas</div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 2: Estado de Cuotas */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Cuotas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cuota</TableHead>
                      <TableHead>Fecha de Vencimiento</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Monto Pagado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.summary.next_installments.map((installment: any) => (
                      <TableRow key={installment.id}>
                        <TableCell>
                          Cuota {installment.installment_no} de {installment.installments_total}
                        </TableCell>
                        <TableCell>{formatArgentinaDate(installment.due_date)}</TableCell>
                        <TableCell>{formatCurrency(installment.amount_due)}</TableCell>
                        <TableCell>{getStatusBadge(installment.status)}</TableCell>
                        <TableCell>
                          {installment.amount_paid > 0 ? formatCurrency(installment.amount_paid) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Sección 3: Resumen Financiero */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Total Cobrado Hasta Ahora</span>
                  <div className="font-medium text-lg text-green-600">{formatCurrency(data.summary.total_paid)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Saldo Pendiente</span>
                  <div className="font-medium text-lg text-orange-600">{formatCurrency(data.summary.balance)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Cuotas Pagadas / Total</span>
                  <div className="font-medium">
                    {data.summary.paid_count} / {data.summary.installments_count}
                  </div>
                </div>
                {data.summary.has_overdue && (
                  <div>
                    <span className="text-sm text-muted-foreground">Cuotas Vencidas</span>
                    <div className="font-medium text-destructive">Sí</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
