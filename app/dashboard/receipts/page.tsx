"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Receipt, Plus, Search, DollarSign, CreditCard, Banknote } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreateReceiptForm } from "@/components/forms/create-receipt-form"
import { ReceiptActions } from "@/components/communication/receipt-actions"

interface ClientData {
  first_name: string
  last_name: string
  client_code: string
  phone: string
}

interface FullReceiptData {
  id: string
  receipt_date: string
  total_amount: number
  cash_amount: number
  transfer_amount: number
  payment_type: string
  receipt_number: string
  observations: string | null
  clients: ClientData
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 })
}

export default function ReceiptsPage() {
  const router = useRouter()
  const [receipts, setReceipts] = useState<FullReceiptData[]>([])
  const [stats, setStats] = useState({ totalRecibos: 0, totalAmount: 0, totalCash: 0, totalTransfer: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [summaryData, setSummaryData] = useState({
    client: null,
    loans: [],
    totalLoans: 0,
    totalCuotas: 0,
    totalAmount: 0,
    cash: 0,
    transfer: 0,
    paymentType: "total",
    totalInstallments: 0,
  })

  const loadReceipts = async () => {
    try {
      const response = await fetch("/api/receipts")
      const data = await response.json()

      if (data.receipts) {
        setReceipts(data.receipts)

        const totalAmount = data.receipts.reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0)
        const totalCash = data.receipts.reduce((sum: number, r: any) => sum + (Number(r.cash_amount) || 0), 0)
        const totalTransfer = data.receipts.reduce((sum: number, r: any) => sum + (Number(r.transfer_amount) || 0), 0)

        setStats({
          totalRecibos: data.receipts.length,
          totalAmount,
          totalCash,
          totalTransfer,
        })
      }
    } catch (error) {
      console.error("Error loading receipts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReceipts()
  }, [])

  const handleSummaryChange = (newSummary: any) => {
    setSummaryData(newSummary)
  }

  const handleReceiptSuccess = () => {
    setDialogOpen(false)
    loadReceipts()
    router.refresh()
  }

  return (
    <div className="space-y-6">
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

      <PageHeader title="Gestión de Recibos" description="Administra los recibos de pago y comprobantes">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Recibo
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-none w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
            <div className="flex h-full">
              <div className="w-[60%] h-full overflow-y-auto border-r p-6 custom-scrollbar">
                <DialogHeader className="mb-4">
                  <DialogTitle>Crear Nuevo Recibo</DialogTitle>
                </DialogHeader>
                <CreateReceiptForm onSuccess={handleReceiptSuccess} onSummaryChange={handleSummaryChange} />
              </div>

              <div className="w-[40%] h-full overflow-y-auto bg-muted/30 p-6 custom-scrollbar">
                <h3 className="text-lg font-semibold mb-4">Resumen del Recibo</h3>

                {/* Cliente */}
                {summaryData.client ? (
                  <Card className="mb-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {summaryData.client.first_name} {summaryData.client.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{summaryData.client.client_code}</p>
                        <p className="text-sm text-muted-foreground">{summaryData.client.phone}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="mb-4">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground text-center">Selecciona un cliente</p>
                    </CardContent>
                  </Card>
                )}

                {/* Préstamos */}
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Préstamos Seleccionados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summaryData.totalLoans > 0 ? (
                      <div className="space-y-2">
                        {summaryData.loans.map((loan: any) => (
                          <div key={loan.id} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{loan.loan_code}</span>
                            <span className="text-muted-foreground">${Number(loan.principal).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t">
                          <p className="text-sm font-semibold">Total: {summaryData.totalLoans} préstamo(s)</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">No hay préstamos seleccionados</p>
                    )}
                  </CardContent>
                </Card>

                {/* Cuotas */}
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Cuotas a Pagar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summaryData.totalCuotas > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Cuotas seleccionadas:</span>
                          <Badge variant="secondary">{summaryData.totalCuotas}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total disponibles:</span>
                          <span className="text-sm text-muted-foreground">{summaryData.totalInstallments}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">No hay cuotas seleccionadas</p>
                    )}
                  </CardContent>
                </Card>

                {/* Montos */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Detalle de Pago</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Efectivo:</span>
                        <span className="font-medium">
                          ${summaryData.cash.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Transferencia:</span>
                        <span className="font-medium">
                          ${summaryData.transfer.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="pt-3 border-t flex justify-between items-center">
                        <span className="font-semibold">Total:</span>
                        <span className="text-lg font-bold text-primary">
                          ${summaryData.totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="pt-2">
                        <Badge
                          variant={summaryData.paymentType === "total" ? "default" : "secondary"}
                          className="w-full justify-center"
                        >
                          Pago {summaryData.paymentType === "total" ? "Total" : "Parcial"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Total Recibos" value={stats.totalRecibos} description="Recibos emitidos" icon={Receipt} />
        <StatsCard
          title="Monto Total"
          value={formatCurrency(stats.totalAmount)}
          description="En recibos"
          icon={DollarSign}
        />
        <StatsCard
          title="Pagos Efectivo"
          value={formatCurrency(stats.totalCash)}
          description="En efectivo"
          icon={Banknote}
        />
        <StatsCard
          title="Transferencias"
          value={formatCurrency(stats.totalTransfer)}
          description="Por transferencia"
          icon={CreditCard}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Recibos</CardTitle>
          <CardDescription>Historial de recibos de pago emitidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar recibos..." className="pl-10" />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Recibo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo Pago</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay recibos registrados
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>
                      <div className="font-mono font-medium">{receipt.receipt_number}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {receipt.clients?.first_name} {receipt.clients?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">{receipt.clients?.client_code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(receipt.receipt_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={receipt.payment_type === "cash" ? "secondary" : "default"}>
                        {receipt.payment_type === "cash"
                          ? "Efectivo"
                          : receipt.payment_type === "transfer"
                            ? "Transferencia"
                            : "Mixto"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(Number(receipt.total_amount || 0))}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <ReceiptActions receipt={receipt} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
