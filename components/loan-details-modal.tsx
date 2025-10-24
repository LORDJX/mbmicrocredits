"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, AlertCircle } from "lucide-react"
import { formatArgentineDate } from "@/lib/utils/date-utils"

interface LoanDetailsModalProps {
  loanId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface LoanSummary {
  loan: any
  summary: {
    total_due: number
    total_paid: number
    balance: number
    has_overdue: boolean
    next_installments: any[]
    installments_count: number
    paid_count: number
  }
  installments: any[]
}

const STATUS_COLORS = {
  PAGADA_EN_FECHA: "bg-green-500",
  PAGADA_CON_MORA: "bg-yellow-500",
  PAGO_ANTICIPADO: "bg-blue-500",
  A_PAGAR: "bg-gray-400",
  A_PAGAR_HOY: "bg-orange-500",
  VENCIDA: "bg-red-500",
}

const STATUS_LABELS = {
  PAGADA_EN_FECHA: "Pagada en Fecha",
  PAGADA_CON_MORA: "Pagada con Mora",
  PAGO_ANTICIPADO: "Pago Anticipado",
  A_PAGAR: "A Pagar",
  A_PAGAR_HOY: "A Pagar Hoy",
  VENCIDA: "Vencida",
}

export function LoanDetailsModal({ loanId, open, onOpenChange }: LoanDetailsModalProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<LoanSummary | null>(null)
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
      if (!response.ok) throw new Error("Error al cargar detalles del préstamo")

      const result = await response.json()

      // Obtener todas las cuotas
      const installmentsResponse = await fetch(`/api/loans/${loanId}/schedule`)
      const installmentsData = await installmentsResponse.json()

      setData({
        ...result,
        installments: installmentsData.installments || [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resumen Completo del Préstamo</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive py-4">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Sección 1: Información del Préstamo */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Préstamo</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código del Préstamo</p>
                  <p className="font-semibold">{data.loan.loan_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-semibold">
                    {data.loan.clients?.first_name} {data.loan.clients?.last_name}
                    <span className="text-muted-foreground ml-2">({data.loan.clients?.client_code})</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monto Original Prestado</p>
                  <p className="font-semibold text-lg">{formatCurrency(Number(data.loan.amount))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Interés Aplicado</p>
                  <p className="font-semibold">{Number(data.loan.interest_rate)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monto Total a Devolver</p>
                  <p className="font-semibold text-lg text-primary">{formatCurrency(data.summary.total_due)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                  <p className="font-semibold">{formatArgentineDate(data.loan.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cantidad Total de Cuotas</p>
                  <p className="font-semibold">{data.summary.installments_count} cuotas</p>
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
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Pagado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.installments.map((installment: any) => (
                      <TableRow key={installment.id}>
                        <TableCell className="font-medium">
                          Cuota {installment.installment_no} de {installment.installments_total}
                        </TableCell>
                        <TableCell>{formatArgentineDate(installment.due_date)}</TableCell>
                        <TableCell>{formatCurrency(Number(installment.amount_due))}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[installment.status as keyof typeof STATUS_COLORS]}>
                            {STATUS_LABELS[installment.status as keyof typeof STATUS_LABELS]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {installment.amount_paid > 0 ? formatCurrency(Number(installment.amount_paid)) : "-"}
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
                  <p className="text-sm text-muted-foreground">Total Cobrado Hasta Ahora</p>
                  <p className="font-semibold text-lg text-green-600">{formatCurrency(data.summary.total_paid)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                  <p className="font-semibold text-lg text-orange-600">{formatCurrency(data.summary.balance)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cuotas Pagadas / Total</p>
                  <p className="font-semibold">
                    {data.summary.paid_count} / {data.summary.installments_count}
                  </p>
                </div>
                {data.summary.has_overdue && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cuotas Vencidas</p>
                    <p className="font-semibold text-red-600">
                      {data.installments.filter((i: any) => i.status === "VENCIDA").length}
                    </p>
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
