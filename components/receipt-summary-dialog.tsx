"use client"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SummaryData {
  client: any
  loans: any[]
  totalLoans: number
  totalCuotas: number
  totalAmount: number
  cash: number
  transfer: number
  paymentType: string
  totalInstallments: number
}

interface ReceiptSummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  summaryData: SummaryData
}

export function ReceiptSummaryDialog({ open, onOpenChange, summaryData }: ReceiptSummaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resumen del Recibo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Cliente */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Cliente</div>
            {summaryData.client ? (
              <div>
                <div className="font-semibold text-sm">
                  {summaryData.client.first_name} {summaryData.client.last_name}
                </div>
                <div className="text-xs text-muted-foreground">{summaryData.client.client_code}</div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No seleccionado</div>
            )}
          </div>

          {/* Préstamos */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-2">Préstamos Seleccionados</div>
            {summaryData.totalLoans > 0 ? (
              <div className="space-y-1">
                {summaryData.loans.map((loan) => (
                  <div key={loan.id} className="text-sm font-medium text-primary">
                    {loan.loan_code}
                  </div>
                ))}
                <div className="text-xs text-muted-foreground mt-2">Total: {summaryData.totalLoans}</div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No seleccionado</div>
            )}
          </div>

          {/* Cuotas */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Cuotas Seleccionadas</div>
            <div className="font-bold text-xl text-primary">{summaryData.totalCuotas}</div>
            <div className="text-xs text-muted-foreground">de {summaryData.totalInstallments} pendientes</div>
          </div>

          {/* Desglose de pago */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="text-xs text-muted-foreground mb-2">Desglose</div>
            <div className="flex justify-between text-sm">
              <span>Efectivo:</span>
              <span className="font-semibold">${summaryData.cash.toLocaleString("es-AR")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Transferencia:</span>
              <span className="font-semibold">${summaryData.transfer.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Total a Pagar</div>
            <div className="text-3xl font-bold text-primary">${summaryData.totalAmount.toLocaleString("es-AR")}</div>
          </div>

          {/* Tipo de pago */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Tipo de Pago</div>
            <Badge variant={summaryData.paymentType === "total" ? "default" : "secondary"} className="text-xs">
              {summaryData.paymentType === "total" ? "TOTAL" : "PARCIAL"}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
